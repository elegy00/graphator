# Development Guidelines

## Core Principles

### 1. Simplicity Over Complexity
**Prefer writing less code over more code**

- Start with the simplest solution that works
- Avoid premature optimization and abstraction
- Add complexity only when there's a clear, demonstrated need
- Question every layer of indirection - does it provide real value?
- Delete code that isn't being used
- Favor composition over inheritance
- Use standard library features before adding dependencies

**Examples:**
```typescript
// ❌ Over-engineered
class SensorDataRepositoryFactory {
  createRepository(type: string): ISensorDataRepository {
    // ... complex factory logic
  }
}

// ✅ Simple and direct
const sensorData = new Map<string, SensorReading[]>();
```

### 2. Test-Driven Development
**Write tests for all code**

- Write tests before or alongside implementation
- Aim for high test coverage (>80% for critical paths)
- Tests should be simple, readable, and maintainable
- Test behavior, not implementation details
- Use descriptive test names that explain what's being tested

**Test Types:**
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between modules
- **End-to-End Tests**: Test complete user workflows (where appropriate)

**Testing Guidelines:**
```typescript
// ✅ Good test structure
describe('useSensorData', () => {
  it('should fetch sensor data every minute', async () => {
    // Arrange: Set up test data and mocks
    const mockFetch = vi.fn().mockResolvedValue(mockSensorData);
    
    // Act: Perform the action
    const { result } = renderHook(() => useSensorData('sensor.temp'));
    
    // Assert: Verify the outcome
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
```

### 3. Clean Code Principles
**Write code that is easy to read and understand**

#### Naming Conventions
- **Variables & Functions**: Use camelCase, descriptive names
  - `fetchSensorData()` not `getData()`
  - `sensorReadings` not `data` or `arr`
  - Boolean variables should read like questions: `isLoading`, `hasError`, `canSubmit`

- **Components**: Use PascalCase, noun-based names
  - `SensorChart.tsx` not `Chart.tsx`
  - `SensorList.tsx` not `List.tsx`

- **Constants**: Use UPPER_SNAKE_CASE for true constants
  - `const MAX_RETENTION_DAYS = 30;`
  - `const API_BASE_URL = '...';`

- **Types/Interfaces**: Use PascalCase, descriptive names
  - `interface SensorReading { ... }` not `interface Reading { ... }`
  - Avoid prefixes like `I` or `T` unless necessary for disambiguation

#### Function Guidelines
- **Single Responsibility**: Each function should do one thing well
- **Small Functions**: Aim for functions under 20 lines
- **Few Parameters**: Limit to 3-4 parameters; use objects for more
- **Pure Functions**: Prefer pure functions (no side effects) where possible
- **Early Returns**: Use guard clauses to reduce nesting

```typescript
// ✅ Clean function
function filterSensorsByTimeRange(
  sensors: SensorReading[],
  startDate: Date,
  endDate: Date
): SensorReading[] {
  if (sensors.length === 0) return [];
  
  return sensors.filter(
    sensor => sensor.timestamp >= startDate && sensor.timestamp <= endDate
  );
}

// ❌ Avoid deeply nested logic
function processData(data: any) {
  if (data) {
    if (data.sensors) {
      if (data.sensors.length > 0) {
        // ... deep nesting
      }
    }
  }
}
```

#### Code Organization
- **DRY (Don't Repeat Yourself)**: Extract repeated logic into functions/components
- **YAGNI (You Aren't Gonna Need It)**: Don't build features you don't need now
- **Keep Related Code Together**: Co-locate components, hooks, and utilities
- **Consistent Formatting**: Use Prettier/ESLint for automatic formatting

### 4. Clean Architecture Principles
**Organize code into layers with clear dependencies**

#### Dependency Rule
Dependencies should point inward. Outer layers can depend on inner layers, but not vice versa.

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │  ← React Components, Hooks
│   - Components, Routes              │
├─────────────────────────────────────┤
│   Application Layer (Use Cases)     │  ← Business Logic
│   - Hooks, Services                 │
├─────────────────────────────────────┤
│   Domain Layer (Entities)           │  ← Core Models, Interfaces
│   - Types, Interfaces               │
├─────────────────────────────────────┤
│   Infrastructure Layer (External)   │  ← API Clients, Storage
│   - API Clients, Storage Services   │
└─────────────────────────────────────┘
```

#### Layer Responsibilities

**Domain Layer** (`app/types/`, `app/models/`)
- Core business entities and interfaces
- No dependencies on frameworks or external libraries
- Pure TypeScript types and interfaces
```typescript
// app/types/sensor.ts
export interface Sensor {
  id: string;
  friendlyName: string;
  type: 'temperature' | 'humidity' | 'both';
}
```

**Application Layer** (`app/hooks/`, `app/services/`)
- Use cases and business logic
- Orchestrates data flow
- Independent of UI framework details
```typescript
// app/hooks/useSensorData.ts
export function useSensorData(sensorId: string) {
  // Business logic for fetching and managing sensor data
}
```

**Infrastructure Layer** (`app/services/api/`, `app/services/storage/`)
- External integrations (APIs, storage)
- Implementation details hidden behind interfaces
```typescript
// app/services/api/homeAssistantClient.ts
export const homeAssistantApi = {
  fetchSensors: () => fetch('/api/states'),
  fetchSensorData: (id: string) => fetch(`/api/states/${id}`),
};
```

**Presentation Layer** (`app/components/`, `app/routes/`)
- React components and UI logic
- Delegates business logic to hooks/services
- Focuses on presentation and user interaction
```typescript
// app/components/SensorChart.tsx
export function SensorChart({ sensorId }: Props) {
  const { data, isLoading } = useSensorData(sensorId);
  return <Chart data={data} />;
}
```

#### Key Architectural Patterns

**1. Dependency Inversion**
Depend on abstractions (interfaces), not concrete implementations
```typescript
// ✅ Good: Depend on interface
interface SensorRepository {
  save(reading: SensorReading): void;
  getByTimeRange(start: Date, end: Date): SensorReading[];
}

function useSensorStore(repo: SensorRepository) {
  // Use the interface, not a specific implementation
}

// ❌ Avoid: Direct dependency on implementation
function useSensorStore(mapStore: Map<string, SensorReading[]>) {
  // Tightly coupled to Map implementation
}
```

**2. Separation of Concerns**
Keep different concerns in different modules
- UI rendering logic separate from data fetching
- Data fetching separate from data transformation
- Business rules separate from framework code

**3. Single Responsibility Principle**
Each module should have one reason to change
```typescript
// ✅ Good: Each hook has one responsibility
const sensors = useSensorDiscovery();       // Discovery
const data = useSensorDataCollection();     // Collection
const filtered = useTimeRangeFilter(data);  // Filtering

// ❌ Avoid: One hook doing everything
const everything = useSensorEverything(); // God object anti-pattern
```

#### File Organization
```
app/
├── components/           # Presentation layer
│   ├── SensorChart.tsx
│   └── SensorList.tsx
├── hooks/               # Application layer (use cases)
│   ├── useSensorData.ts
│   └── useDataStore.ts
├── services/            # Infrastructure layer
│   ├── api/
│   │   └── homeAssistantClient.ts
│   └── storage/
│       └── inMemoryStore.ts
├── types/               # Domain layer
│   └── sensor.ts
└── utils/               # Shared utilities
    └── timeUtils.ts
```

## Additional Best Practices

### TypeScript
- Enable `strict` mode in `tsconfig.json`
- Avoid `any` type - use `unknown` if type is truly unknown
- Use discriminated unions for variant data
- Leverage type inference - don't over-annotate

### React
- Use functional components with hooks
- Memoize expensive calculations with `useMemo`
- Memoize callback functions with `useCallback`
- Use `React.memo()` for components that re-render often
- Keep component props interfaces simple
- Prefer composition over prop drilling (use Context when needed)

### Error Handling
- Handle errors explicitly - no silent failures
- Provide meaningful error messages to users
- Log errors for debugging (with context)
- Use error boundaries for React component errors
- Fail fast - validate inputs early

### Performance
- Measure before optimizing
- Start simple, optimize only when necessary
- Profile with browser dev tools
- Lazy load routes/components when beneficial
- Debounce/throttle expensive operations

### Git Workflow
- Write clear, descriptive commit messages
- Keep commits small and focused
- Use feature branches
- Run tests before pushing
- Review your own code before requesting review

## Code Review Checklist

Before submitting code for review, ensure:

- [ ] Code is simple and easy to understand
- [ ] Tests are written and passing
- [ ] Functions and variables have descriptive names
- [ ] No unnecessary complexity or abstraction
- [ ] Follows clean architecture principles
- [ ] No linting errors
- [ ] TypeScript strict mode compliance
- [ ] Error cases are handled
- [ ] No console.log() statements left in code
- [ ] Comments explain "why", not "what"

## Summary

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand." - Martin Fowler

The goal is to write code that is:
1. **Simple**: Easy to understand at a glance
2. **Tested**: Reliable and verified to work
3. **Clean**: Well-named and well-organized
4. **Maintainable**: Easy to modify and extend

When in doubt, choose the simpler solution.
