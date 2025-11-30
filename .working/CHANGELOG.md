# Changelog: Recharts Removal

## Date: 2025-11-30

## Summary

Removed all charting functionality from the application to simplify the UI and reduce dependencies. The application now displays sensor data in a simple card-based layout showing current values only.

## Changes Made

### Removed Files
- ❌ `app/components/SensorChart.tsx` - Chart component using Recharts
- ❌ `app/utils/chartFormatters.ts` - Chart data formatting utilities

### Modified Files

#### Dependencies
- `package.json`: Removed `recharts: ^3.3.0` dependency
- Ran `npm install` to update `package-lock.json`

#### Application Code
- `app/routes/home.tsx`:
  - Removed `SensorChart` import
  - Removed `useState` for sensor selection
  - Removed conditional rendering for selected sensor view
  - Simplified to display only sensor list

- `app/components/SensorList.tsx`:
  - Removed `onSensorSelect` prop from interface
  - Removed prop from component parameters
  - Removed `onSelect` prop passed to `SensorCard`

- `app/components/SensorCard.tsx`:
  - Removed `onSelect` prop from interface
  - Removed `onClick` handler
  - Changed styling from `cursor-pointer hover:shadow-lg` to static `shadow-md`
  - Cards are now display-only, not interactive

#### Documentation
- `CLAUDE.md`:
  - Removed Recharts from technology stack
  - Changed "Charts" section to "Data Display"
  - Updated project description from "charts" to "current sensor values"
  - Removed `.ai/charts.md` reference from documentation index
  - Updated database to "PostgreSQL 15 (standard, no TimescaleDB)"

- `docs/TARGET_ENVIRONMENT.md`:
  - Removed Recharts from compatible packages list

- `docs/README.md`:
  - Removed `.ai/charts.md` reference

- `README.md`:
  - Marked "Interactive time-series charts" as removed (strikethrough)
  - Changed "Charts: Recharts (planned)" to "UI: Simple card-based display (no charting)"

- `.working/requirements.md`:
  - Removed Recharts from web container technology stack
  - Updated web container responsibilities to specify "NO charting"
  - Updated success criteria to remove chart-related items
  - Changed from "displays charts" to "displays all sensors in card grid"

## UI Changes

### Before
- Click on sensor card → Opens chart view with 3-day history
- Chart shows temperature/humidity over time
- Interactive tooltips, legends, dual Y-axis
- Auto-refresh every 10 seconds

### After
- Sensor cards display current values only
- No interaction (cards are display-only)
- Grid layout showing all sensors at once
- Auto-refresh every 10 seconds (via loader revalidation)

## User Experience Impact

**Removed**:
- Historical data visualization
- Time-series charts
- Interactive chart exploration
- Sensor selection workflow

**Retained**:
- Real-time current values display
- Sensor status indicators (online/offline/error)
- Auto-refresh functionality
- Responsive grid layout
- Last seen timestamps

## Rationale

1. **Simplicity**: Reduces application complexity and dependency footprint
2. **Performance**: Smaller bundle size without Recharts (~440KB reduction)
3. **Future Architecture**: Aligns with upcoming 3-container architecture where web only displays current values
4. **Historical Data**: Will be handled differently in database-backed architecture (queries, not real-time charts)

## Files Preserved

- `app/utils/timeUtils.ts` - General time utilities, not chart-specific
- `.ai/charts.md` - Kept as historical reference for library evaluation

## Verification

- ✅ TypeScript compilation: PASSED
- ✅ No chart references in application code
- ✅ Documentation updated consistently
- ✅ Package dependencies cleaned up

## Next Steps

1. Test the application to ensure it works correctly without charts
2. Consider what historical data display (if any) will be added in future
3. Proceed with database migration as planned in `.working/requirements.md`
