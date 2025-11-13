import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Sensor, SensorReading } from '~/types/sensor';
import { formatReadingsForChart, formatXAxisTick } from '~/utils/chartFormatters';
import { getLast3Days } from '~/utils/timeUtils';

interface SensorChartProps {
  sensor: Sensor;
}

export function SensorChart({ sensor }: SensorChartProps) {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`[SensorChart] Fetching data for sensor: ${sensor.id}`);
        const response = await fetch(`/api/sensordata/${sensor.id}`);
        
        if (!response.ok) {
          console.error(`[SensorChart] HTTP error! status: ${response.status}`);
          const text = await response.text();
          console.error(`[SensorChart] Response body:`, text);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        console.log(`[SensorChart] Received ${data.readings?.length || 0} readings for ${sensor.id}`);
        
        // Convert ISO strings back to Date objects
        const parsedReadings = data.readings.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));

        // Filter to last 3 days
        const { start } = getLast3Days();
        const filtered = parsedReadings.filter((r: SensorReading) => r.timestamp >= start);
        
        console.log(`[SensorChart] After filtering to last 3 days: ${filtered.length} readings`);
        
        setReadings(filtered);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every 10 seconds
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [sensor.id]);

  const chartData = useMemo(
    () => formatReadingsForChart(readings),
    [readings]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
        <p className="text-xs text-gray-400 mt-2">Sensor ID: {sensor.id}</p>
        <p className="text-xs text-gray-400">Readings fetched: {readings.length}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">{sensor.friendlyName}</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxisTick}
            scale="time"
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis yAxisId="left" />
          {sensor.type === 'both' && <YAxis yAxisId="right" orientation="right" />}
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleString()}
          />
          <Legend />

          {(sensor.type === 'temperature' || sensor.type === 'both') && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              name={`Temperature (${sensor.unit})`}
              dot={false}
              strokeWidth={2}
            />
          )}

          {(sensor.type === 'humidity' || sensor.type === 'both') && (
            <Line
              yAxisId={sensor.type === 'both' ? 'right' : 'left'}
              type="monotone"
              dataKey="humidity"
              stroke="#3b82f6"
              name="Humidity (%)"
              dot={false}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 text-sm text-gray-600 text-center">
        Showing last 3 days • {chartData.length} data points
      </div>
    </div>
  );
}
