# Chart Library Evaluation

## Overview
This document evaluates npm-based chart libraries suitable for the Graphator real-time sensor data visualization application.

## Key Requirements Summary
- Real-time time-series data visualization
- React compatibility (React Router v7)
- TypeScript support
- Responsive design
- Interactive tooltips
- Smooth animations
- Performance with large datasets (up to 10,000 points)
- Line chart for temperature over time
- Multiple time range views (1d, 5d, 30d)

---

## Library Comparison

### 1. Recharts
**Package**: `recharts`  
**Version**: ~2.10.x  
**Bundle Size**: ~440 KB (minified)  
**TypeScript**: Built-in types  
**License**: MIT

#### Pros
- **React-first design**: Built specifically for React with declarative API
- **Excellent TypeScript support**: Comprehensive type definitions
- **Composable components**: Easy to customize with React components
- **Good documentation**: Extensive examples and API docs
- **Responsive out of the box**: Built-in ResponsiveContainer component
- **Smooth animations**: CSS-based animations that perform well
- **Active maintenance**: Regular updates and bug fixes
- **Tooltips & interactions**: Rich interaction features built-in

#### Cons
- **Larger bundle size**: ~440 KB can impact initial load
- **Performance with massive datasets**: Can struggle with >5,000 points without optimization
- **Less control over rendering**: Abstraction can limit fine-tuned control

#### Best For
- React-heavy applications
- Projects prioritizing developer experience
- Applications needing quick implementation

#### Code Example
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={400}>
  <LineChart data={sensorData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
  </LineChart>
</ResponsiveContainer>
```

---

### 2. Chart.js with react-chartjs-2
**Packages**: `chart.js` + `react-chartjs-2`  
**Version**: Chart.js ~4.4.x, react-chartjs-2 ~5.2.x  
**Bundle Size**: ~200 KB (with tree-shaking)  
**TypeScript**: Excellent types via @types/chart.js  
**License**: MIT

#### Pros
- **Smaller bundle size**: Tree-shakeable, only import what you need
- **Excellent performance**: Canvas-based rendering handles large datasets well
- **Highly customizable**: Extensive plugin system
- **Industry standard**: Widely used, large community
- **Great animations**: Smooth, configurable animations
- **Mobile-friendly**: Touch interactions work well
- **Time-series support**: Excellent time-scale features with date adapters

#### Cons
- **More imperative**: react-chartjs-2 wrapper feels less "React-like"
- **Configuration heavy**: More verbose setup compared to Recharts
- **Canvas limitations**: Harder to integrate with React event system
- **Learning curve**: More complex API for advanced features

#### Best For
- Performance-critical applications
- Large datasets
- Projects needing fine-grained control

#### Code Example
```tsx
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const data = {
  labels: timestamps,
  datasets: [{
    label: 'Temperature',
    data: temperatureValues,
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }]
};

<Line data={data} options={options} />
```

---

### 3. Visx (from Airbnb)
**Package**: `@visx/visx` (or individual packages)  
**Version**: ~3.x  
**Bundle Size**: ~150-300 KB (depends on packages used)  
**TypeScript**: Excellent built-in types  
**License**: MIT

#### Pros
- **Highly modular**: Import only what you need
- **Full control**: Low-level primitives for custom charts
- **SVG-based**: Easy to style and animate with CSS
- **React-native**: Great for React patterns and hooks
- **Production-tested**: Used by Airbnb in production
- **TypeScript-first**: Written in TypeScript
- **Responsive utilities**: Built-in responsive hooks

#### Cons
- **More code required**: Lower-level means more boilerplate
- **Steeper learning curve**: Need to understand D3 concepts
- **Less out-of-the-box**: No pre-built chart components
- **Documentation**: Can be sparse for complex use cases

#### Best For
- Custom chart designs
- Projects needing maximum flexibility
- Teams comfortable with D3 concepts

#### Code Example
```tsx
import { LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';

const xScale = scaleTime({ domain: [minDate, maxDate], range: [0, width] });
const yScale = scaleLinear({ domain: [minTemp, maxTemp], range: [height, 0] });

<svg width={width} height={height}>
  <LinePath
    data={data}
    x={d => xScale(d.timestamp)}
    y={d => yScale(d.temperature)}
    stroke="#8884d8"
  />
  <AxisLeft scale={yScale} />
  <AxisBottom scale={xScale} />
</svg>
```

---

### 4. Victory
**Package**: `victory`  
**Version**: ~36.x  
**Bundle Size**: ~500 KB  
**TypeScript**: Good support via @types/victory  
**License**: MIT

#### Pros
- **React-first**: Built for React with component-based API
- **Feature-rich**: Lots of built-in chart types
- **Good animations**: Smooth transitions
- **Accessibility**: Better a11y support than competitors
- **Consistent API**: All charts follow same patterns
- **React Native support**: Works on mobile

#### Cons
- **Large bundle**: ~500 KB is significant
- **Performance issues**: Can be slow with large datasets
- **Less popular**: Smaller community than Chart.js or Recharts
- **Verbose syntax**: More code needed for simple charts

#### Best For
- Cross-platform apps (web + React Native)
- Projects prioritizing accessibility
- Consistent multi-chart dashboards

---

### 5. Apache ECharts with echarts-for-react
**Packages**: `echarts` + `echarts-for-react`  
**Version**: ECharts ~5.4.x  
**Bundle Size**: ~300-900 KB (highly tree-shakeable)  
**TypeScript**: Good types  
**License**: Apache 2.0

#### Pros
- **Extremely powerful**: Handles millions of data points
- **Rich features**: Advanced zoom, data zoom, brushing
- **Beautiful defaults**: Professional-looking charts out of the box
- **Canvas + SVG**: Choose rendering method
- **Time-series expertise**: Excellent date handling
- **Large community**: Popular in enterprise applications

#### Cons
- **Large bundle**: Can be 900 KB if not carefully tree-shaken
- **Chinese-first docs**: Some documentation translation issues
- **Less React-like**: Configuration object approach
- **Overkill**: May be too complex for simple use cases

#### Best For
- Complex enterprise dashboards
- Very large datasets (>50,000 points)
- Advanced interactivity requirements

---

## Recommendation Matrix

| Library | React Integration | Performance | Bundle Size | TypeScript | Learning Curve | Best Match for Graphator |
|---------|------------------|-------------|-------------|------------|----------------|-------------------------|
| **Recharts** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **⭐⭐⭐⭐⭐** |
| **Chart.js** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **⭐⭐⭐⭐⭐** |
| **Visx** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | **⭐⭐⭐** |
| **Victory** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **⭐⭐⭐** |
| **ECharts** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **⭐⭐⭐** |

---

## Final Recommendations

### Primary Recommendation: **Recharts**

**Why Recharts?**
1. **Perfect React fit**: Declarative component API matches React Router v7 architecture
2. **Fast implementation**: Can build the required chart in <100 lines of code
3. **Excellent TypeScript**: Full type safety out of the box
4. **Handles requirements**: Performance adequate for 10,000 points with memo optimization
5. **Responsive built-in**: ResponsiveContainer handles all screen sizes
6. **Developer experience**: Fastest path to working solution
7. **Maintainability**: Easy for team members to understand and modify

**Installation**:
```bash
npm install recharts
```

**Trade-offs**:
- Slightly larger bundle (~440 KB) - acceptable for this application
- May need data downsampling for optimal performance with 10,000+ points

---

### Alternative Recommendation: **Chart.js + react-chartjs-2**

**When to choose Chart.js instead?**
- Performance is critical concern
- Need to regularly handle >10,000 data points without downsampling
- Bundle size is a hard constraint
- Team has existing Chart.js experience

**Installation**:
```bash
npm install chart.js react-chartjs-2
```

**Trade-offs**:
- More configuration code required
- Less intuitive React integration
- Better raw performance

---

## Implementation Strategy

### Recommended Approach with Recharts

1. **Install dependencies**:
   ```bash
   npm install recharts
   npm install --save-dev @types/recharts
   ```

2. **Create base chart component**:
   - Use `LineChart` for temperature visualization
   - Wrap with `ResponsiveContainer` for responsiveness
   - Add `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`
   - Use `Line` with `type="monotone"` for smooth curves

3. **Optimize for performance**:
   - Use `React.memo` on chart component
   - Implement data downsampling utility for 30d view
   - Use `isAnimationActive={false}` for real-time updates
   - Debounce rapid data updates

4. **Time formatting**:
   - Use `tickFormatter` on XAxis for time range formatting
   - 1d view: Hour format (HH:mm)
   - 5d view: Day/hour format (MM/DD HH:mm)
   - 30d view: Date format (MM/DD)

5. **Styling with Tailwind**:
   - Wrap chart in Tailwind-styled container
   - Use CSS variables for theme colors
   - Apply dark mode support

### Example Integration

```tsx
// app/components/SensorChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { SensorReading } from '../types/sensor';

interface SensorChartProps {
  data: SensorReading[];
  timeRange: '1d' | '5d' | '30d';
}

export const SensorChart = React.memo<SensorChartProps>(({ data, timeRange }) => {
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1d') return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (timeRange === '5d') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={formatXAxis}
          className="text-gray-600 dark:text-gray-400"
        />
        <YAxis 
          label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
          className="text-gray-600 dark:text-gray-400"
        />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}
          labelFormatter={(label) => new Date(label).toLocaleString()}
        />
        <Line 
          type="monotone" 
          dataKey="temperature" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

SensorChart.displayName = 'SensorChart';
```

---

## Conclusion

**Recharts** is the recommended choice for Graphator because it provides the best balance of:
- Developer experience and implementation speed
- React ecosystem integration
- TypeScript support
- Performance adequate for requirements
- Maintainability and code readability

This choice aligns with the project's goals of building a maintainable, type-safe React application while meeting all functional requirements for sensor data visualization.
