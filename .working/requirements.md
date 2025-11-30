# Migration Requirements: Database-Backed 3-Container Architecture

## Overview

Migrate Graphator from in-memory storage to a PostgreSQL-backed 3-container architecture that separates concerns between web serving, data collection, and data persistence.

## Current State

**What's Working**:
- Sensor discovery from Home Assistant API (`SensorDiscoveryService`)
- Background data collection service (`BackgroundDataCollectionService`)
- In-memory data storage (`serverDataStore.server.ts`)
- Web UI with React Router v7, SSR, and Recharts
- Home Assistant API client (`HomeAssistantClient`)

**What Needs to Change**:
- Replace in-memory storage with PostgreSQL database
- Split monolithic application into 3 separate containers
- Persist data across restarts using Docker volumes

## Architecture Requirements

### Container 1: Web Server (`graphator-web`)

**Purpose**: Serve UI and API endpoints for users

**Responsibilities**:
- Serve React Router v7 SSR application
- Provide API routes for fetching sensor data
- Query PostgreSQL for sensor metadata and readings
- Render charts with Recharts
- NO data collection logic (read-only database access)

**Technology**:
- React Router v7 with SSR enabled
- TypeScript, TailwindCSS v3, Recharts
- node-postgres (pg) for database queries
- Port: 3000

**Database Access**:
- Read-only queries to `sensors` and `sensor_readings` tables
- Use repository pattern for database operations
- Connection pooling via `postgresClient.ts`

### Container 2: Background Worker (`graphator-worker`)

**Purpose**: Continuously collect sensor data from Home Assistant

**Responsibilities**:
- Discover sensors using existing `SensorDiscoveryService` logic
- Collect temperature/humidity data every 60 seconds
- Write sensor metadata to `sensors` table
- Insert readings into `sensor_readings` table
- Re-discover sensors every 5 minutes (detect new/removed sensors)
- Run data cleanup job hourly (delete data older than 30 days)
- NO web server (standalone Node.js process)

**Technology**:
- Node.js 20 with TypeScript
- Existing `HomeAssistantClient` and `SensorDiscoveryService`
- node-postgres (pg) for database writes
- Logging with `[Worker]`, `[DataCollection]`, `[SensorDiscovery]` prefixes

**Database Access**:
- Write access to `sensors` and `sensor_readings` tables
- UPSERT sensor metadata (update if exists, insert if new)
- Batch inserts for readings (performance optimization)

### Container 3: Database (`graphator-db`)

**Purpose**: Persist all sensor data

**Technology**:
- **PostgreSQL 15** (standard, NO TimescaleDB)
- Alpine Linux base image for smaller footprint
- Platform: `linux/arm/v7` for Raspberry Pi 3

**Persistence**:
- Docker volume mounted to `/var/lib/postgresql/data`
- Data survives container restarts
- Can be backed up independently

**Configuration**:
- Optimized for 1GB RAM environment (see `docs/TARGET_ENVIRONMENT.md`)
- `shared_buffers = 128MB`
- `max_connections = 20`
- `work_mem = 4MB`

## Database Schema Requirements

### Table: `sensors`

Stores metadata about discovered sensors.

**Columns**:
- `id` VARCHAR(255) PRIMARY KEY - Internal sensor ID (e.g., "living_room_temp")
- `entity_id` VARCHAR(255) UNIQUE NOT NULL - Home Assistant entity ID (e.g., "sensor.living_room_temp")
- `friendly_name` VARCHAR(255) NOT NULL - Human-readable name from HA
- `type` VARCHAR(20) NOT NULL - One of: 'temperature', 'humidity', 'both'
- `unit` VARCHAR(20) NOT NULL - Unit of measurement (e.g., "°C", "%")
- `last_seen` TIMESTAMP WITH TIME ZONE - Last time sensor was discovered
- `status` VARCHAR(20) NOT NULL - One of: 'online', 'offline', 'error'
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- `updated_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Indexes**:
- Primary key on `id`
- Unique index on `entity_id`
- Index on `status` for filtering active sensors

### Table: `sensor_readings`

Stores time-series sensor readings.

**Columns**:
- `id` SERIAL PRIMARY KEY
- `sensor_id` VARCHAR(255) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE
- `timestamp` TIMESTAMP WITH TIME ZONE NOT NULL
- `temperature` DOUBLE PRECISION - Temperature value (NULL if not applicable)
- `humidity` DOUBLE PRECISION - Humidity value (NULL if not applicable)
- `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()

**Indexes**:
- Primary key on `id`
- Composite index on `(sensor_id, timestamp DESC)` for efficient time-range queries
- Index on `timestamp` for cleanup queries

**Constraints**:
- At least one of `temperature` or `humidity` must be non-NULL
- Foreign key to `sensors` table with CASCADE delete

## Data Retention Requirements

**Retention Policy**: 30 days

**Implementation**:
- Worker runs cleanup job every hour
- Query: `DELETE FROM sensor_readings WHERE timestamp < NOW() - INTERVAL '30 days'`
- Log number of rows deleted
- Use `VACUUM` periodically to reclaim disk space

**No TimescaleDB**:
- Keep solution simple with standard PostgreSQL
- Manual retention logic in worker is sufficient
- Avoid additional dependency complexity

## Reuse Existing Code

**DO NOT rewrite these working components**:

1. **Sensor Discovery**: `app/services/sensorDiscovery.ts`
   - `SensorDiscoveryService` class
   - Logic for filtering temperature/humidity sensors
   - Already tested and working

2. **Home Assistant API Client**: `app/services/api/homeAssistantClient.ts`
   - `HomeAssistantClient` class
   - Authentication, error handling
   - Already tested and working

3. **Background Collection Logic**: `app/services/backgroundDataCollection.server.ts`
   - Collection intervals, retry logic
   - Can be adapted to use database instead of in-memory store

4. **React Components**: `app/components/`
   - `SensorChart.tsx`, `SensorList.tsx`, `SensorCard.tsx`
   - May need minor adjustments for data shape from DB

## New Code Requirements

### 1. Database Layer (`app/services/database/`)

**`postgresClient.ts`**:
- Create PostgreSQL connection pool
- Configuration from `DATABASE_URL` environment variable
- Export singleton pool instance
- Handle connection errors gracefully
- Retry logic for transient failures

**`sensorRepository.ts`**:
- `upsertSensor(sensor: Sensor): Promise<void>` - Insert or update sensor
- `getSensorById(id: string): Promise<Sensor | null>` - Get single sensor
- `getAllSensors(): Promise<Sensor[]>` - Get all sensors
- `updateSensorStatus(id: string, status: string): Promise<void>` - Update status
- Use parameterized queries to prevent SQL injection

**`readingRepository.ts`**:
- `insertReading(reading: SensorReading): Promise<void>` - Insert single reading
- `insertReadingsBatch(readings: SensorReading[]): Promise<void>` - Batch insert
- `getReadingsByTimeRange(sensorId: string, start: Date, end: Date): Promise<SensorReading[]>`
- `getLatestReading(sensorId: string): Promise<SensorReading | null>`
- `getAllLatestReadings(): Promise<Record<string, SensorReading>>`
- `deleteOldReadings(cutoffDate: Date): Promise<number>` - Returns count deleted

### 2. Worker Entry Point (`app/worker/index.ts`)

**Responsibilities**:
- Initialize database connection
- Start sensor discovery
- Start background data collection
- Set up periodic re-discovery (5 minutes)
- Set up cleanup job (1 hour)
- Graceful shutdown on SIGTERM/SIGINT
- Console logging with `[Worker]` prefix

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `HOME_ASSISTANT_URL` - HA API URL
- `HOME_ASSISTANT_TOKEN` - HA auth token
- `COLLECTION_INTERVAL_MS` - Default: 60000 (60 seconds)
- `DISCOVERY_INTERVAL_MS` - Default: 300000 (5 minutes)
- `CLEANUP_INTERVAL_MS` - Default: 3600000 (1 hour)

### 3. Update Web Routes

**`app/routes/home.tsx`**:
- Remove `serverDataStore` imports
- Use `sensorRepository.getAllSensors()` in loader
- Use `readingRepository.getAllLatestReadings()` in loader
- No changes to component logic (data shape remains same)

**`app/routes/api.sensordata.$sensorId.ts`**:
- Remove `serverDataStore` imports
- Use `readingRepository.getReadingsByTimeRange()` in loader
- Support query parameters: `?start=ISO_DATE&end=ISO_DATE`
- Default to last 3 days if no range specified

### 4. Database Migration Script

**`app/services/database/migrations/001_initial_schema.sql`**:
- CREATE TABLE statements for `sensors` and `sensor_readings`
- CREATE INDEX statements
- Can be run manually or via migration tool

**`app/services/database/migrate.ts`**:
- Simple script to run SQL migration files
- Check if tables exist before creating
- Log migration status

## Docker Configuration Requirements

### docker-compose.yml

**Services**:
```yaml
services:
  graphator-db:
    image: postgres:15-alpine
    platform: linux/arm/v7
    environment:
      POSTGRES_USER: graphator
      POSTGRES_PASSWORD: [secure password]
      POSTGRES_DB: graphator
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    mem_limit: 384m
    mem_reservation: 256m

  graphator-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    platform: linux/arm/v7
    depends_on:
      - graphator-db
    environment:
      DATABASE_URL: postgresql://graphator:password@graphator-db:5432/graphator
      HOME_ASSISTANT_URL: ${HOME_ASSISTANT_URL}
      HOME_ASSISTANT_TOKEN: ${HOME_ASSISTANT_TOKEN}
    mem_limit: 256m
    mem_reservation: 128m
    restart: unless-stopped

  graphator-web:
    build:
      context: .
      dockerfile: Dockerfile.web
    platform: linux/arm/v7
    depends_on:
      - graphator-db
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://graphator:password@graphator-db:5432/graphator
    mem_limit: 256m
    mem_reservation: 128m
    restart: unless-stopped

volumes:
  postgres_data:
```

### Dockerfile.worker

**Requirements**:
- Node.js 20 Alpine base
- Install dependencies
- Build TypeScript for worker
- No Vite, no React build tools needed
- Entry point: `node app/worker/index.js`

### Dockerfile.web

**Requirements**:
- Node.js 20 Alpine base
- Install dependencies
- Build React Router application with Vite
- Entry point: React Router serve

## Migration Steps (Implementation Order)

1. **Database Layer** (Phase 1)
   - Create `postgresClient.ts`
   - Create `sensorRepository.ts`
   - Create `readingRepository.ts`
   - Write tests for repositories

2. **Database Schema** (Phase 2)
   - Create migration SQL file
   - Create migration runner script
   - Test locally with Docker PostgreSQL

3. **Worker** (Phase 3)
   - Create `app/worker/index.ts`
   - Adapt existing `BackgroundDataCollectionService` to use repositories
   - Add cleanup job
   - Test worker standalone

4. **Web Updates** (Phase 4)
   - Update `home.tsx` loader
   - Update `api.sensordata.$sensorId.ts` loader
   - Test web server with seeded database

5. **Docker** (Phase 5)
   - Create `Dockerfile.worker`
   - Create `Dockerfile.web`
   - Create `docker-compose.yml`
   - Create PostgreSQL config file
   - Test full 3-container stack locally

6. **Cleanup** (Phase 6)
   - Mark `serverDataStore.server.ts` as DEPRECATED
   - Remove `server.init.ts` (no longer needed)
   - Update documentation

## Testing Requirements

**Repository Tests** (`*.test.ts`):
- Unit tests for each repository method
- Use test database or mocks
- Verify parameterized queries
- Test error handling

**Integration Tests**:
- Worker can connect to database and write data
- Web can connect to database and read data
- Cleanup job deletes old data correctly

**Manual Testing**:
- Start docker-compose stack
- Verify worker discovers sensors
- Verify worker collects data every 60s
- Verify web displays sensors and charts
- Verify data persists after container restart

## Environment Variables

**Web Container**:
- `DATABASE_URL` - Required
- `NODE_ENV` - Optional (default: production)
- `PORT` - Optional (default: 3000)

**Worker Container**:
- `DATABASE_URL` - Required
- `HOME_ASSISTANT_URL` - Required
- `HOME_ASSISTANT_TOKEN` - Required
- `COLLECTION_INTERVAL_MS` - Optional (default: 60000)
- `DISCOVERY_INTERVAL_MS` - Optional (default: 300000)
- `CLEANUP_INTERVAL_MS` - Optional (default: 3600000)

**Database Container**:
- `POSTGRES_USER` - Required
- `POSTGRES_PASSWORD` - Required
- `POSTGRES_DB` - Required

## Success Criteria

- [ ] Worker discovers sensors from Home Assistant
- [ ] Worker writes sensor metadata to `sensors` table
- [ ] Worker collects readings every 60s and writes to `sensor_readings` table
- [ ] Worker re-discovers sensors every 5 minutes
- [ ] Worker deletes data older than 30 days every hour
- [ ] Web server displays all sensors
- [ ] Web server displays charts with 3-day default view
- [ ] Charts show real-time updates (data from last collection)
- [ ] Data persists after `docker compose restart`
- [ ] All containers respect memory limits (Pi 3 compatible)
- [ ] Worker logs clearly show collection progress
- [ ] No TimescaleDB dependency
- [ ] Existing sensor discovery logic reused (not rewritten)

## Out of Scope

- TimescaleDB or other time-series extensions
- Data downsampling (can be added later if needed)
- Connection pooling layer like PgBouncer
- Database replication or clustering
- User authentication
- Sensor configuration UI
- Alert/notification system
