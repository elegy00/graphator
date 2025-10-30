# Graphator Application Requirements

## Project Overview
A real-time sensor data visualization application that fetches temperature data from Home Assistant and displays it in interactive time-series charts.

## Current Implementation
- **Sensor Data Source**: Home Assistant API
- **Current Endpoint**: `/api/states/sensor.lumi_lumi_weather_c3336a05_temperature`
- **Authentication**: Bearer token authentication
- **Current Display**: JSON string output in `app/routes/home.tsx`

## Core Requirements

### 1. Data Fetching
- **Periodic Fetching**: Implement automatic periodic fetching of sensor data
  - Fetch interval: Configurable (suggested default: 30 seconds to 1 minute)
  - Use the existing Home Assistant endpoint pattern
  - Handle network errors gracefully with retry logic
  - Display loading states during fetch operations

### 2. Data Storage
- **Local Memory Storage**: Implement encapsulated in-memory data store
  - Store historical sensor readings with timestamps
  - Data structure should include:
    - Timestamp (ISO 8601 format)
    - Temperature value
    - Sensor state metadata (if applicable)
  - Implement data retention policies:
    - Keep at least 30 days of data
    - Optional: Implement data aggregation for older data points
  - Encapsulation requirements:
    - Use a dedicated state management solution (e.g., React Context, Zustand, or custom hook)
    - Expose only necessary methods (add, get, clear)
    - Hide internal storage implementation details
  - Persistence consideration: Data resets on page reload (in-memory only)

### 3. Data Visualization
- **Chart Component**: Implement interactive time-series chart
  - Library suggestion: Recharts, Chart.js, or similar React-compatible charting library
  - Chart features:
    - Line chart showing temperature over time
    - X-axis: Time (formatted appropriately for time range)
    - Y-axis: Temperature (with appropriate scale and units)
    - Tooltips showing exact values on hover
    - Responsive design (adapts to screen size)
    - Smooth animations for data updates

### 4. Time Range Selection
- **Three View Options**:
  - **1 Day (1d)**: Show last 24 hours of data
    - X-axis granularity: Hourly intervals
    - Show all raw data points
  - **5 Days (5d)**: Show last 5 days of data
    - X-axis granularity: Daily or 6-hour intervals
    - May aggregate data points (e.g., average per hour)
  - **30 Days (30d)**: Show last 30 days of data
    - X-axis granularity: Daily intervals
    - Aggregate data points (e.g., daily min/max/average)
  
- **UI Controls**:
  - Toggle buttons or tabs for switching between time ranges
  - Clear visual indication of selected range
  - Smooth transitions when switching ranges

## Technical Specifications

### Architecture
- **Framework**: React Router v7 (current setup)
- **Styling**: TailwindCSS (already configured)
- **Type Safety**: TypeScript (maintain strict typing)

### Component Structure
```
app/
  ├── components/
  │   ├── SensorChart.tsx          # Main chart component
  │   ├── TimeRangeSelector.tsx    # 1d/5d/30d toggle
  │   └── SensorDataDisplay.tsx    # Container component
  ├── hooks/
  │   ├── useSensorData.tsx        # Data fetching logic
  │   └── useDataStore.tsx         # Encapsulated data storage
  ├── utils/
  │   ├── dataAggregation.ts       # Data processing utilities
  │   └── chartHelpers.ts          # Chart formatting utilities
  └── types/
      └── sensor.ts                # TypeScript interfaces
```

### Data Flow
1. Timer triggers periodic fetch via `useSensorData` hook
2. Fetched data is added to encapsulated store via `useDataStore`
3. Chart component subscribes to store updates
4. User selects time range (1d/5d/30d)
5. Chart filters and displays relevant data subset

### Error Handling
- Network errors: Display user-friendly error message, continue retry attempts
- Invalid data: Log error, skip invalid data points
- API authentication errors: Clear error message with instructions

### Performance Considerations
- Limit in-memory data points (e.g., max 10,000 points)
- Implement data point downsampling for large datasets
- Debounce chart re-renders on rapid data updates
- Use React.memo for chart components to prevent unnecessary re-renders

## Non-Functional Requirements

### Usability
- Chart should be readable on both desktop and mobile devices
- Loading states should be clear and non-intrusive
- Error messages should be actionable

### Maintainability
- Code should be well-typed with TypeScript
- Components should be modular and reusable
- Data store should be easily testable
- Configuration values (fetch interval, retention) should be externalized

### Scalability
- Design should allow for multiple sensors in the future
- Chart implementation should handle varying data densities
- Time range options should be easily extensible

## Future Enhancements (Out of Scope for Initial Implementation)
- Multiple sensor support
- Data persistence (localStorage/IndexedDB)
- Export data functionality (CSV, JSON)
- Custom date range selection
- Statistical overlays (moving averages, trend lines)
- Alert thresholds and notifications
- Real-time updates via WebSocket

## Acceptance Criteria
- [ ] Sensor data is fetched automatically at regular intervals
- [ ] Data is stored in memory with proper encapsulation
- [ ] Chart displays temperature data clearly
- [ ] Users can switch between 1d, 5d, and 30d views
- [ ] Chart updates smoothly when new data arrives
- [ ] Error states are handled gracefully
- [ ] Application is responsive on mobile and desktop
- [ ] Code follows TypeScript best practices
- [ ] All components are properly typed

## Development Notes
- Start with basic line chart implementation
- Implement data store first, then fetching, then visualization
- Test with different data volumes to ensure performance
- Consider using React Query or SWR for data fetching logic
- Ensure chart library is tree-shakeable to minimize bundle size
