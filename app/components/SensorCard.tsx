import type { Sensor } from '~/types/sensor';

interface SensorCardProps {
  sensor: Sensor;
  currentTemp?: number;
  currentHumidity?: number;
}

export function SensorCard({
  sensor,
  currentTemp,
  currentHumidity,
}: SensorCardProps) {
  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    error: 'bg-red-500',
  }[sensor.status];

  return (
    <div className="border rounded-lg p-4 shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{sensor.friendlyName}</h3>
        <span className={`w-3 h-3 rounded-full ${statusColor}`} />
      </div>

      <div className="space-y-1 text-sm">
        {currentTemp !== undefined && currentTemp !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Temperature:</span>
            <span className="font-medium">{currentTemp.toFixed(1)} {sensor.unit}</span>
          </div>
        )}
        {currentHumidity !== undefined && currentHumidity !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Humidity:</span>
            <span className="font-medium">{currentHumidity.toFixed(1)}%</span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Last seen: {sensor.lastSeen.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
