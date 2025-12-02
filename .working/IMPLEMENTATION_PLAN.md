# Implementation Plan: 3-Container PostgreSQL Architecture

## Overview

This plan breaks the migration into 5 major phases, each producing a verifiable checkpoint. Each phase can be tested independently before moving to the next.

**Total Estimated Time**: 8-12 hours of development work

---

## Phase 1: Database Foundation ⏱️ 2-3 hours

**Goal**: Create and test the database layer without touching existing application code.

### Deliverables

1. **PostgreSQL Schema** (`app/services/database/migrations/001_initial_schema.sql`)
   - CREATE TABLE statements for `sensors` and `sensor_readings`
   - Indexes for performance
   - Constraints and foreign keys

2. **Database Client** (`app/services/database/postgresClient.ts`)
   - Connection pool setup using node-postgres
   - Environment variable configuration
   - Connection error handling
   - Export singleton pool instance

3. **Sensor Repository** (`app/services/database/sensorRepository.ts`)
   - `upsertSensor(sensor: Sensor): Promise<void>`
   - `getSensorById(id: string): Promise<Sensor | null>`
   - `getAllSensors(): Promise<Sensor[]>`
   - `updateSensorStatus(id: string, status: string): Promise<void>`

4. **Reading Repository** (`app/services/database/readingRepository.ts`)
   - `insertReading(reading: SensorReading): Promise<void>`
   - `insertReadingsBatch(readings: SensorReading[]): Promise<void>`
   - `getReadingsByTimeRange(sensorId, start, end): Promise<SensorReading[]>`
   - `getLatestReading(sensorId: string): Promise<SensorReading | null>`
   - `getAllLatestReadings(): Promise<Record<string, SensorReading>>`
   - `deleteOldReadings(cutoffDate: Date): Promise<number>`

5. **Migration Runner** (`app/services/database/migrate.ts`)
   - Simple script to run SQL migrations
   - Check if tables exist
   - Log migration status

6. **Tests** (`app/services/database/*.test.ts`)
   - Unit tests for each repository method
   - Use test database or mocks
   - Verify parameterized queries

### Package Dependencies to Add

```bash
npm install pg
npm install -D @types/pg
```

### Verification Steps

**How to Test Phase 1**:

1. **Start local PostgreSQL**:
   ```bash
   docker run --name graphator-test-db \
     -e POSTGRES_USER=graphator \
     -e POSTGRES_PASSWORD=test123 \
     -e POSTGRES_DB=graphator \
     -p 5432:5432 \
     -d postgres:15-alpine
   ```

2. **Run migration**:
   ```bash
   DATABASE_URL="postgresql://graphator:test123@localhost:5432/graphator" \
     node app/services/database/migrate.js
   ```

3. **Verify tables created**:
   ```bash
   docker exec -it graphator-test-db \
     psql -U graphator -d graphator -c "\dt"
   ```
   Should show `sensors` and `sensor_readings` tables.

4. **Run repository tests**:
   ```bash
   npm test -- app/services/database
   ```
   All tests should pass.

5. **Manual repository test** (create simple script):
   ```typescript
   // test-repos.ts
   import { sensorRepository, readingRepository } from './services/database';

   const testSensor = {
     id: 'test_sensor',
     entityId: 'sensor.test',
     friendlyName: 'Test Sensor',
     type: 'temperature',
     unit: '°C',
     lastSeen: new Date(),
     status: 'online'
   };

   await sensorRepository.upsertSensor(testSensor);
   const sensors = await sensorRepository.getAllSensors();
   console.log('Sensors:', sensors);

   await readingRepository.insertReading({
     sensorId: 'test_sensor',
     timestamp: new Date(),
     temperature: 22.5
   });
   const latest = await readingRepository.getLatestReading('test_sensor');
   console.log('Latest reading:', latest);
   ```

**Exit Criteria**:
- [ ] PostgreSQL schema created successfully
- [ ] All repository methods work with test database
- [ ] All unit tests pass
- [ ] Can insert and query data via repositories
- [ ] No existing application code modified yet

---

## Phase 2: Worker Container (Standalone) ⏱️ 2-3 hours

**Goal**: Create standalone worker that collects data and writes to database.

### Deliverables

1. **Worker Entry Point** (`app/worker/index.ts`)
   - Initialize database connection
   - Start sensor discovery using existing `SensorDiscoveryService`
   - Start background data collection
   - Set up periodic re-discovery (5 minutes)
   - Set up cleanup job (1 hour)
   - Graceful shutdown handlers
   - Console logging with `[Worker]` prefix

2. **Adapt Background Collection Service** (`app/services/backgroundDataCollection.server.ts`)
   - Create new version or modify to use repositories instead of `serverDataStore`
   - Keep existing retry logic and intervals
   - Write to database instead of memory

3. **Worker Package Build** (`package.json`)
   - Add script: `"worker": "tsx app/worker/index.ts"`
   - Ensure tsx or ts-node available for development

4. **Environment Configuration** (`.env.worker.example`)
   - Document required environment variables
   - Provide example values

### Package Dependencies

No new packages needed (pg already added in Phase 1).

### Verification Steps

**How to Test Phase 2**:

1. **Ensure PostgreSQL running** (from Phase 1):
   ```bash
   docker ps | grep graphator-test-db
   ```

2. **Create worker environment file** (`.env.worker`):
   ```env
   DATABASE_URL=postgresql://graphator:test123@localhost:5432/graphator
   HOME_ASSISTANT_URL=http://your-ha-instance:8123
   HOME_ASSISTANT_TOKEN=your_token_here
   COLLECTION_INTERVAL_MS=60000
   DISCOVERY_INTERVAL_MS=300000
   CLEANUP_INTERVAL_MS=3600000
   ```

3. **Run worker standalone**:
   ```bash
   # Load env vars and run
   export $(cat .env.worker | xargs)
   npm run worker
   ```

4. **Verify worker output**:
   - Should see `[Worker] Starting...`
   - Should see `[SensorDiscovery] Found X sensors`
   - Should see `[DataCollection] Collecting data from X sensors...`
   - Should see `[DataCollection] Collected Y/X readings`

5. **Verify database has data**:
   ```bash
   # Check sensors table
   docker exec -it graphator-test-db \
     psql -U graphator -d graphator \
     -c "SELECT id, friendly_name, status FROM sensors;"

   # Check readings table
   docker exec -it graphator-test-db \
     psql -U graphator -d graphator \
     -c "SELECT sensor_id, timestamp, temperature, humidity FROM sensor_readings ORDER BY timestamp DESC LIMIT 10;"
   ```

6. **Wait 60 seconds, verify new readings**:
   ```bash
   # Count should increase
   docker exec -it graphator-test-db \
     psql -U graphator -d graphator \
     -c "SELECT COUNT(*) FROM sensor_readings;"
   ```

7. **Test cleanup job** (modify interval to 10s for testing):
   ```bash
   # Insert old data
   docker exec -it graphator-test-db \
     psql -U graphator -d graphator \
     -c "INSERT INTO sensor_readings (sensor_id, timestamp, temperature) VALUES ('test_sensor', NOW() - INTERVAL '31 days', 20.0);"

   # Wait for cleanup job to run
   # Check logs for "[DataCollection] Evicted X old data points"
   ```

8. **Test graceful shutdown**:
   ```bash
   # Ctrl+C the worker
   # Should see cleanup logs
   ```

**Exit Criteria**:
- [ ] Worker runs standalone without errors
- [ ] Worker discovers sensors from Home Assistant
- [ ] Worker writes sensor metadata to `sensors` table
- [ ] Worker collects and writes readings to `sensor_readings` table
- [ ] New readings appear every 60 seconds
- [ ] Cleanup job deletes old data
- [ ] Worker shuts down gracefully on SIGTERM
- [ ] Existing web application still works (unchanged)

---

## Phase 3: Web Container (Read from DB) ⏱️ 1.5-2 hours

**Goal**: Update web application to read from database instead of in-memory store.

### Deliverables

1. **Update Home Route** (`app/routes/home.tsx`)
   - Replace `serverDataStore` imports with repository imports
   - Use `sensorRepository.getAllSensors()` in loader
   - Use `readingRepository.getAllLatestReadings()` in loader
   - Remove background collection service initialization (worker does this now)
   - Keep same component logic (data shape unchanged)

2. **Update Sensor Data API** (`app/routes/api.sensordata.$sensorId.ts`)
   - Replace `serverDataStore` with `readingRepository`
   - Support query params: `?start=ISO_DATE&end=ISO_DATE`
   - Default to last 3 days if no range provided
   - Return same JSON format as before

3. **Environment Configuration** (`.env.web.example`)
   - Document web container environment variables
   - DATABASE_URL is main addition

4. **Mark Deprecated** (`app/services/storage/serverDataStore.server.ts`)
   - Add comment: `// DEPRECATED: This file is no longer used. Data now comes from PostgreSQL.`
   - Do NOT delete yet (Phase 5)

### Verification Steps

**How to Test Phase 3**:

1. **Ensure worker is running** (from Phase 2):
   ```bash
   # In one terminal
   npm run worker
   ```

2. **Create web environment file** (`.env.web`):
   ```env
   DATABASE_URL=postgresql://graphator:test123@localhost:5432/graphator
   PORT=3000
   NODE_ENV=development
   ```

3. **Start web server** (in another terminal):
   ```bash
   export $(cat .env.web | xargs)
   npm run dev
   ```

4. **Open browser to http://localhost:5173**:
   - Should see sensor list
   - Should see current temperature/humidity values
   - Values should match what's in database

5. **Verify auto-refresh**:
   - Wait 10 seconds
   - Page should revalidate and show updated "last seen" times

6. **Check API endpoint**:
   ```bash
   curl http://localhost:5173/api/sensordata/SENSOR_ID | jq
   ```
   Should return readings from database.

7. **Verify no errors in console**:
   - Web server logs should be clean
   - Browser console should be clean
   - No database connection errors

8. **Test with worker stopped**:
   - Stop worker (Ctrl+C)
   - Web should still display data (reading from DB)
   - No new data will appear, but existing data shows

9. **Test with worker restarted**:
   - Restart worker
   - Wait 60 seconds
   - New readings should appear in web UI

**Exit Criteria**:
- [ ] Web displays sensors from database
- [ ] Web shows latest readings from database
- [ ] Auto-refresh works (every 10s)
- [ ] API endpoints return database data
- [ ] Web works even when worker is stopped (shows stale data)
- [ ] New data appears when worker is running
- [ ] No in-memory store used
- [ ] No TypeScript errors

---

## Phase 4: Docker Integration ⏱️ 2-3 hours

**Goal**: Containerize everything and make it work with docker-compose.

### Deliverables

1. **Dockerfile.worker**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   CMD ["node", "build/worker/index.js"]
   ```

2. **Dockerfile.web**
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   CMD ["npm", "run", "start"]
   ```

3. **docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     graphator-db:
       image: postgres:15-alpine
       platform: linux/arm/v7
       environment:
         POSTGRES_USER: graphator
         POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
         POSTGRES_DB: graphator
       volumes:
         - postgres_data:/var/lib/postgresql/data
         - ./docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
       command: postgres -c config_file=/etc/postgresql/postgresql.conf
       mem_limit: 384m
       mem_reservation: 256m
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U graphator"]
         interval: 10s
         timeout: 5s
         retries: 5

     graphator-worker:
       build:
         context: .
         dockerfile: Dockerfile.worker
       platform: linux/arm/v7
       depends_on:
         graphator-db:
           condition: service_healthy
       environment:
         DATABASE_URL: postgresql://graphator:${DB_PASSWORD:-changeme}@graphator-db:5432/graphator
         HOME_ASSISTANT_URL: ${HOME_ASSISTANT_URL}
         HOME_ASSISTANT_TOKEN: ${HOME_ASSISTANT_TOKEN}
         COLLECTION_INTERVAL_MS: ${COLLECTION_INTERVAL_MS:-60000}
         DISCOVERY_INTERVAL_MS: ${DISCOVERY_INTERVAL_MS:-300000}
         CLEANUP_INTERVAL_MS: ${CLEANUP_INTERVAL_MS:-3600000}
       mem_limit: 256m
       mem_reservation: 128m
       restart: unless-stopped

     graphator-web:
       build:
         context: .
         dockerfile: Dockerfile.web
       platform: linux/arm/v7
       depends_on:
         graphator-db:
           condition: service_healthy
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: postgresql://graphator:${DB_PASSWORD:-changeme}@graphator-db:5432/graphator
         NODE_ENV: production
         PORT: 3000
       mem_limit: 256m
       mem_reservation: 128m
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

4. **PostgreSQL Configuration** (`docker/postgres/postgresql.conf`)
   - Optimized for Pi 3 (1GB RAM)
   - See `docs/TARGET_ENVIRONMENT.md` for settings

5. **Environment Template** (`.env.example`)
   ```env
   # Database
   DB_PASSWORD=changeme

   # Home Assistant
   HOME_ASSISTANT_URL=http://homeassistant:8123
   HOME_ASSISTANT_TOKEN=your_token_here

   # Worker intervals (optional, defaults shown)
   COLLECTION_INTERVAL_MS=60000
   DISCOVERY_INTERVAL_MS=300000
   CLEANUP_INTERVAL_MS=3600000
   ```

6. **.dockerignore**
   ```
   node_modules
   .git
   .env
   .env.*
   *.log
   build
   .react-router
   ```

7. **Database Initialization** (`docker/init-db.sh`)
   - Script to run migrations on first start
   - Mount as volume in postgres container

### Verification Steps

**How to Test Phase 4**:

1. **Create .env file**:
   ```bash
   cp .env.example .env
   # Edit with your Home Assistant credentials
   ```

2. **Build containers**:
   ```bash
   docker compose build
   ```
   Should build successfully for all 3 services.

3. **Start stack**:
   ```bash
   docker compose up -d
   ```

4. **Check all containers running**:
   ```bash
   docker compose ps
   ```
   All 3 should be "Up" and healthy.

5. **Check logs**:
   ```bash
   # Database
   docker compose logs graphator-db
   # Should see "database system is ready to accept connections"

   # Worker
   docker compose logs graphator-worker
   # Should see discovery and collection logs

   # Web
   docker compose logs graphator-web
   # Should see server started on port 3000
   ```

6. **Verify database migration ran**:
   ```bash
   docker compose exec graphator-db \
     psql -U graphator -d graphator -c "\dt"
   ```
   Should show tables.

7. **Wait 60 seconds, check data collection**:
   ```bash
   docker compose logs graphator-worker | grep "Collected"
   # Should see collection logs

   docker compose exec graphator-db \
     psql -U graphator -d graphator \
     -c "SELECT COUNT(*) FROM sensor_readings;"
   # Should have data
   ```

8. **Test web access**:
   ```bash
   curl http://localhost:3000
   # Should return HTML

   # Or open in browser
   open http://localhost:3000
   ```

9. **Test data persistence**:
   ```bash
   # Stop containers
   docker compose down

   # Start again
   docker compose up -d

   # Check data still exists
   docker compose exec graphator-db \
     psql -U graphator -d graphator \
     -c "SELECT COUNT(*) FROM sensor_readings;"
   ```
   Data should persist (volume works).

10. **Test memory limits**:
    ```bash
    docker stats
    ```
    Verify containers stay within limits:
    - DB: ~256-384MB
    - Worker: ~128-256MB
    - Web: ~128-256MB

11. **Test on Raspberry Pi 3** (if available):
    ```bash
    # Copy to Pi
    scp -r . pi@raspberrypi:/home/pi/graphator

    # SSH to Pi
    ssh pi@raspberrypi

    # Build and run
    cd graphator
    docker compose up -d

    # Monitor
    docker stats
    ```

**Exit Criteria**:
- [ ] All 3 containers build successfully
- [ ] docker-compose stack starts without errors
- [ ] Database migrations run automatically
- [ ] Worker discovers sensors and collects data
- [ ] Web serves sensor data from database
- [ ] Data persists across container restarts
- [ ] Memory limits respected
- [ ] Health checks pass
- [ ] Stack works on Raspberry Pi 3 (if tested)

---

## Phase 5: Cleanup & Documentation ⏱️ 1-2 hours

**Goal**: Remove deprecated code, update documentation, final testing.

### Deliverables

1. **Remove Deprecated Files**
   - Delete `app/services/storage/serverDataStore.server.ts`
   - Delete `app/services/storage/inMemoryStore.ts`
   - Delete `app/server.init.ts` (no longer needed)
   - Delete old data collection service if replaced

2. **Update CLAUDE.md**
   - Update architecture section to reflect 3-container setup
   - Update database schema documentation
   - Update environment variables section
   - Add docker-compose commands
   - Remove references to in-memory storage

3. **Update README.md**
   - Mark migration as complete
   - Update quick start with docker-compose
   - Update environment setup
   - Mark completed features

4. **Update docs/TARGET_ENVIRONMENT.md**
   - Add PostgreSQL configuration details
   - Add memory recommendations for 3 containers
   - Add deployment checklist

5. **Create Production Deployment Guide** (`docs/DEPLOYMENT.md`)
   - Pre-deployment checklist
   - Initial setup steps
   - Backup procedures
   - Monitoring recommendations
   - Troubleshooting common issues

6. **Update .gitignore**
   ```
   .env
   .env.local
   .env.*.local
   postgres_data/
   ```

7. **Final Testing Checklist** (`.working/TESTING_CHECKLIST.md`)
   - Comprehensive test scenarios
   - Edge cases
   - Performance tests

### Verification Steps

**How to Test Phase 5**:

1. **Clean install test**:
   ```bash
   # Fresh clone
   git clone <repo> graphator-test
   cd graphator-test

   # Setup
   cp .env.example .env
   # Edit .env with real credentials

   # Run
   docker compose up -d

   # Verify everything works from scratch
   ```

2. **Verify no deprecated code used**:
   ```bash
   # Search for old imports
   grep -r "serverDataStore" app/
   grep -r "server.init" app/
   # Should return nothing
   ```

3. **Documentation review**:
   - Read through CLAUDE.md - should be accurate
   - Read through README.md - should match current state
   - Read through DEPLOYMENT.md - should be complete

4. **Run full test suite**:
   ```bash
   npm test
   ```
   All tests should pass.

5. **Type checking**:
   ```bash
   npm run typecheck
   ```
   No errors.

6. **End-to-end test**:
   - Start fresh stack
   - Verify sensors discovered
   - Verify data collection
   - Verify web display
   - Wait for cleanup job (or manually trigger)
   - Verify old data deleted
   - Stop and restart - data persists

7. **Performance test** (on Pi 3 if available):
   - Run for 24 hours
   - Monitor memory usage
   - Verify no memory leaks
   - Check database size growth
   - Verify cleanup runs

**Exit Criteria**:
- [ ] No deprecated code in codebase
- [ ] All documentation updated and accurate
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Fresh install works from README instructions
- [ ] System runs stable for 24+ hours
- [ ] Performance meets expectations
- [ ] Deployment guide is complete
- [ ] All success criteria from requirements.md met

---

## Success Criteria (from requirements.md)

Final checklist to verify all requirements met:

- [ ] Worker discovers sensors from Home Assistant
- [ ] Worker writes sensor metadata to `sensors` table
- [ ] Worker collects readings every 60s and writes to `sensor_readings` table
- [ ] Worker re-discovers sensors every 5 minutes
- [ ] Worker deletes data older than 30 days every hour
- [ ] Web server displays all sensors in card grid
- [ ] Sensor cards show current temperature and humidity values
- [ ] Sensor cards auto-refresh every 10 seconds
- [ ] Data persists after `docker compose restart`
- [ ] All containers respect memory limits (Pi 3 compatible)
- [ ] Worker logs clearly show collection progress
- [ ] No TimescaleDB dependency
- [ ] Existing sensor discovery logic reused (not rewritten)

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Database Foundation | 2-3 hours | 2-3 hours |
| Phase 2: Worker Container | 2-3 hours | 4-6 hours |
| Phase 3: Web Container | 1.5-2 hours | 5.5-8 hours |
| Phase 4: Docker Integration | 2-3 hours | 7.5-11 hours |
| Phase 5: Cleanup & Docs | 1-2 hours | 8.5-13 hours |

**Total**: 8-13 hours of focused development work

---

## Dependencies Between Phases

```
Phase 1 (Database Foundation)
    ↓
Phase 2 (Worker Container) ← Can develop in parallel with Phase 3
    ↓
Phase 3 (Web Container)
    ↓
Phase 4 (Docker Integration)
    ↓
Phase 5 (Cleanup & Docs)
```

**Note**: Phases 2 and 3 can be developed in parallel if desired, as they don't depend on each other (both depend only on Phase 1).

---

## Rollback Plan

Each phase is reversible:

- **After Phase 1**: Just drop test database
- **After Phase 2**: Stop worker, no web changes yet
- **After Phase 3**: Can revert route changes, switch back to in-memory
- **After Phase 4**: `docker compose down`, remove containers
- **After Phase 5**: Git revert if needed

---

## Next Steps

1. Review this plan
2. Get approval to proceed
3. Start with Phase 1
4. Checkpoint after each phase
5. Address any issues before moving to next phase
