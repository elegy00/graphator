# Graphator - Sensor Monitoring Application Requirements

## Project Overview
A real-time multi-sensor data visualization application that dynamically discovers sensors from Home Assistant, collects temperature and humidity data, and displays interactive time-series charts for monitoring and analysis.

## Functional Requirements

### FR-1: Dynamic Sensor Discovery
**Priority**: High  
**Description**: Automatically discover and register all available sensors from Home Assistant

- **FR-1.1**: Fetch all sensor IDs from the Home Assistant root API endpoint
  - Query the `/api/states` endpoint to discover all available sensors
  - Filter for sensors that provide temperature and/or humidity data
  - No hardcoded sensor IDs in the application
  
- **FR-1.2**: Extract and store sensor metadata
  - Sensor ID (unique identifier)
  - Friendly name (human-readable display name)
  - Sensor type (temperature, humidity, or both)
  - Unit of measurement
  
- **FR-1.3**: Handle sensor registration dynamically
  - Support addition of new sensors without code changes
  - Support removal of sensors that are no longer available
  - Re-discover sensors on application restart or manual refresh

### FR-2: Periodic Data Collection
**Priority**: High  
**Description**: Collect sensor readings at regular intervals

- **FR-2.1**: Fetch data every 1 minute for all registered sensors
  - Use separate API calls per sensor to the Home Assistant API
  - Endpoint pattern: `/api/states/sensor.<sensor_id>`
  - Bearer token authentication
  
- **FR-2.2**: Collect multiple data points per sensor
  - Temperature readings (when available)
  - Humidity readings (when available)
  - Timestamp of reading (ISO 8601 format)
  - Last updated timestamp from API
  
- **FR-2.3**: Handle data collection failures gracefully
  - Retry logic for failed requests (max 3 retries with exponential backoff)
  - Continue collecting from other sensors if one fails
  - Log errors without disrupting the collection cycle

### FR-3: In-Memory Data Storage
**Priority**: High  
**Description**: Store sensor data in memory with automatic retention management

- **FR-3.1**: Implement in-memory time-series database
  - Store readings per sensor with timestamp
  - Data structure: `{ sensorId, timestamp, temperature?, humidity? }`
  - Efficient retrieval by sensor ID and time range
  
- **FR-3.2**: Automatic data retention policy
  - Retain data for exactly 1 month (30 days)
  - Automatically evict data older than 1 month
  - Run eviction check periodically (e.g., every hour)
  
- **FR-3.3**: Data encapsulation
  - Expose clean API for adding, querying, and clearing data
  - Hide internal storage implementation
  - Support queries by sensor ID and date range
  
- **FR-3.4**: Memory management
  - Monitor memory usage
  - Limit maximum data points per sensor (configurable, suggested: 50,000 points)
  - Implement data downsampling for older data if needed

### FR-4: Data Visualization
**Priority**: High  
**Description**: Display interactive charts for each sensor

- **FR-4.1**: Individual sensor charts
  - One chart per registered sensor
  - Display both temperature and humidity on the same chart (dual Y-axis if both available)
  - Line chart visualization with smooth curves
  - X-axis: Time with appropriate granularity
  - Y-axis: Temperature (°C/°F) and Humidity (%)
  
- **FR-4.2**: Default view: 3-day time horizon
  - Show last 72 hours of data by default
  - Display all data points within this range
  - X-axis granularity: 6-hour intervals
  
- **FR-4.3**: Chart interactivity
  - Tooltips showing exact values on hover
  - Legend indicating temperature and humidity series
  - Display sensor friendly name as chart title
  - Smooth animations for data updates
  
- **FR-4.4**: Real-time updates
  - Charts automatically update when new data arrives
  - Smooth transitions without jarring redraws
  - Visual indication of last update time

### FR-5: Sensor List and Navigation
**Priority**: Medium  
**Description**: Provide overview and navigation for all sensors

- **FR-5.1**: Sensor list view
  - Display all registered sensors with friendly names
  - Show current temperature and humidity values
  - Indicate last update time for each sensor
  - Visual status indicator (online/offline/error)
  
- **FR-5.2**: Navigation
  - Click on sensor to view detailed chart
  - Quick access to all sensor charts
  - Return to overview/list view

## Future Features (Planned)

### FF-1: Flexible Time Range Selection
**Priority**: Medium (planned)  
**Description**: Allow users to select custom time horizons for charts

- Support predefined ranges: 1 hour, 6 hours, 12 hours, 1 day, 3 days, 1 week, 2 weeks, 1 month
- Custom date range picker (start date/time to end date/time)
- Remember user's preferred time range per session
- Persist time range preference across sessions (localStorage)

### FF-2: Aggregated Multi-Sensor Charts
**Priority**: Medium (planned)  
**Description**: Compare multiple sensors in a single view

- Select multiple sensors to display on one chart
- Color-coded lines for each sensor
- Synchronized X-axis across all selected sensors
- Legend with sensor friendly names
- Support for averaging multiple sensors
- Min/max/average calculations across selected sensors

### FF-3: Theme Support
**Priority**: Low (planned)  
**Description**: Support light and dark modes

- Light mode theme with bright, readable colors
- Dark mode theme with reduced eye strain
- Automatic detection of system preference
- Manual toggle override
- Persist theme preference
- Ensure charts are readable in both themes

## Non-Functional Requirements

### NFR-1: Responsive Design
**Priority**: High  
**Description**: Application must be fully usable on all device sizes

- **NFR-1.1**: Mobile-first approach
  - Optimized for smartphones (320px - 480px width)
  - Touch-friendly controls (minimum 44x44px tap targets)
  - Charts must be readable and interactive on small screens
  - Stacked layout for sensor list and charts
  
- **NFR-1.2**: Tablet support
  - Optimized for tablet displays (768px - 1024px width)
  - Utilize additional screen space effectively
  - Two-column layout where appropriate
  
- **NFR-1.3**: Desktop support
  - Full utilization of desktop screen space (1024px+)
  - Multi-column grid layout for sensor charts
  - Hover interactions for additional details

### NFR-2: Performance
**Priority**: High  
**Description**: Application must remain responsive under normal load

- **NFR-2.1**: Initial load time
  - Application should be interactive within 2 seconds on broadband
  - Progressive loading of sensor data
  
- **NFR-2.2**: Chart rendering
  - Charts should render within 500ms for 3-day view
  - Smooth scrolling and interactions (60fps target)
  - Efficient re-renders using React memoization
  
- **NFR-2.3**: Data collection
  - Background data fetching should not block UI
  - Memory usage should remain stable over 24+ hours
  - Efficient eviction of old data

### NFR-3: Reliability
**Priority**: High  
**Description**: Application should handle errors gracefully

- **NFR-3.1**: Network resilience
  - Continue operation when Home Assistant API is temporarily unavailable
  - Automatic reconnection when connectivity is restored
  - Display appropriate error messages to users
  
- **NFR-3.2**: Data integrity
  - No data loss due to collection errors
  - Accurate timestamps for all readings
  - Handle malformed API responses without crashing

### NFR-4: Usability
**Priority**: High  
**Description**: Application should be intuitive and easy to use

- **NFR-4.1**: Clear visual hierarchy
  - Important information (current values) prominently displayed
  - Consistent layout and navigation patterns
  - Accessible color schemes (WCAG AA contrast ratios)
  
- **NFR-4.2**: Error messaging
  - User-friendly error messages (avoid technical jargon)
  - Actionable guidance when errors occur
  - Clear indication of system status
  
- **NFR-4.3**: Loading states
  - Visual feedback during data loading
  - Skeleton screens or spinners
  - Never show blank screens without explanation

### NFR-5: Maintainability
**Priority**: Medium  
**Description**: Code should be easy to understand and modify

- **NFR-5.1**: Code quality
  - TypeScript for all code (strict mode)
  - Consistent code style (Prettier/ESLint)
  - Meaningful variable and function names
  
- **NFR-5.2**: Documentation
  - Inline comments for complex logic
  - README with setup instructions
  - Architecture documentation
  
- **NFR-5.3**: Testability
  - Modular, loosely coupled components
  - Pure functions where possible
  - Mockable external dependencies

## Technical Specifications

### Technology Stack
- **Framework**: React Router v7
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS
- **Charting**: Recharts (or similar React-compatible library)
- **State Management**: React Context or Zustand
- **API Client**: Fetch API with custom wrapper
- **Build Tool**: Vite

### Component Architecture
```
app/
  ├── components/
  │   ├── SensorChart.tsx           # Individual sensor chart
  │   ├── SensorCard.tsx            # Sensor overview card
  │   ├── SensorList.tsx            # List of all sensors
  │   └── ErrorBoundary.tsx         # Error handling
  ├── hooks/
  │   ├── useSensorDiscovery.tsx    # Fetch sensor list from API
  │   ├── useSensorData.tsx         # Periodic data collection
  │   └── useDataStore.tsx          # In-memory data store
  ├── services/
  │   ├── homeAssistantApi.ts       # API client wrapper
  │   └── dataRetention.ts          # Data eviction logic
  ├── utils/
  │   ├── timeUtils.ts              # Time range calculations
  │   └── chartFormatters.ts        # Chart data formatting
  └── types/
      └── sensor.ts                 # TypeScript interfaces
```

### Data Models

```typescript
interface Sensor {
  id: string;                    // e.g., "sensor.living_room_temp"
  friendlyName: string;          // e.g., "Living Room Temperature"
  type: 'temperature' | 'humidity' | 'both';
  unit: string;                  // e.g., "°C", "%"
  lastSeen: Date;
  status: 'online' | 'offline' | 'error';
}

interface SensorReading {
  sensorId: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
}

interface TimeSeriesData {
  [sensorId: string]: SensorReading[];
}
```

### API Endpoints
- **Sensor Discovery**: `GET /api/states`
- **Sensor Data**: `GET /api/states/sensor.<sensor_id>`
- **Authentication**: Bearer token in Authorization header

## Acceptance Criteria

- [ ] Application fetches all sensors from Home Assistant API dynamically
- [ ] Sensor friendly names are displayed throughout the UI
- [ ] Data is collected every 1 minute for all sensors
- [ ] Temperature and humidity data are stored in memory
- [ ] Data older than 1 month is automatically evicted
- [ ] Each sensor displays a chart with 3-day default view
- [ ] Charts show both temperature and humidity (when available)
- [ ] Charts update automatically as new data arrives
- [ ] Application is fully responsive and usable on mobile phones
- [ ] Error states are handled gracefully with user-friendly messages
- [ ] Application remains performant with multiple sensors over 24+ hours
- [ ] Code follows TypeScript best practices with strict typing

## Out of Scope
- Historical data persistence (no database)
- User authentication/authorization
- Sensor configuration or management
- Data export functionality
- Real-time push notifications
- Statistical analysis features
- Sensor alerting/threshold monitoring
