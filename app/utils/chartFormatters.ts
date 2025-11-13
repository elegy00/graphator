import type { SensorReading } from '~/types/sensor';

export interface ChartDataPoint {
  timestamp: number;
  time: string;
  temperature?: number;
  humidity?: number;
}

export function formatReadingsForChart(
  readings: SensorReading[]
): ChartDataPoint[] {
  return readings.map(reading => ({
    timestamp: reading.timestamp.getTime(),
    time: reading.timestamp.toLocaleTimeString(),
    temperature: reading.temperature,
    humidity: reading.humidity,
  }));
}

export function formatXAxisTick(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
  });
}
