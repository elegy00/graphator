import { Link } from 'react-router';
import type { SensorGroup } from '~/utils/sensorGrouping';
import { capitalize } from '~/utils/sensorGrouping';

interface SensorCardProps {
  sensorGroup: SensorGroup;
}

export function SensorCard({ sensorGroup }: SensorCardProps) {
  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    error: 'bg-red-500',
  }[sensorGroup.status];

  return (
    <Link
      to={`/sensor/${encodeURIComponent(sensorGroup.location)}`}
      className="border border-slate-600 rounded-lg p-4 bg-slate-800 hover:bg-slate-700 transition-colors block"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg text-gray-100">{capitalize(sensorGroup.location)}</h3>
        <span className={`w-3 h-3 rounded-full ${statusColor}`} />
      </div>

      <div className="space-y-1 text-sm">
        {sensorGroup.temperature !== undefined && sensorGroup.temperature !== null && (
          <div className="flex justify-between">
            <span className="text-gray-400">Temperature:</span>
            <span className="font-medium text-gray-200">{sensorGroup.temperature.toFixed(1)} °C</span>
          </div>
        )}
        {sensorGroup.humidity !== undefined && sensorGroup.humidity !== null && (
          <div className="flex justify-between">
            <span className="text-gray-400">Humidity:</span>
            <span className="font-medium text-gray-200">{sensorGroup.humidity.toFixed(1)}%</span>
          </div>
        )}
        {sensorGroup.battery !== undefined && sensorGroup.battery !== null && (
          <div className="flex justify-between">
            <span className="text-gray-400">Battery:</span>
            <span className="font-medium text-gray-200">{sensorGroup.battery.toFixed(1)}%</span>
          </div>
        )}
        <div className="text-xs text-gray-500 mt-2">
          Last seen: {sensorGroup.lastSeen.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}
