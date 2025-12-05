// ABOUTME: Component displaying historical sensor readings
// ABOUTME: Shows temperature, humidity, and battery data over time

interface AggregatedReading {
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  battery?: number;
}

interface SensorHistoryProps {
  readings: AggregatedReading[];
}

export function SensorHistory({ readings }: SensorHistoryProps) {
  if (readings.length === 0) {
    return (
      <div className="border border-slate-600 rounded-lg p-8 text-center text-gray-400 bg-slate-800">
        No historical data available
      </div>
    );
  }

  // Check what data types we have
  const hasTemperature = readings.some(r => r.temperature !== undefined && r.temperature !== null);
  const hasHumidity = readings.some(r => r.humidity !== undefined && r.humidity !== null);
  const hasBattery = readings.some(r => r.battery !== undefined && r.battery !== null);

  const temperatureReadings = readings.filter(r => r.temperature !== undefined && r.temperature !== null);
  const humidityReadings = readings.filter(r => r.humidity !== undefined && r.humidity !== null);
  const batteryReadings = readings.filter(r => r.battery !== undefined && r.battery !== null);

  return (
    <div className="space-y-6">
      <div className="border border-slate-600 rounded-lg p-6 bg-slate-800">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Historical Data</h2>
        <div className="text-sm text-gray-400 mb-4">
          Showing {readings.length} readings from the last 7 days
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                {hasTemperature && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Temperature (°C)
                  </th>
                )}
                {hasHumidity && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Humidity (%)
                  </th>
                )}
                {hasBattery && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Battery (%)
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {readings.slice(-100).reverse().map((reading, index) => (
                <tr key={`${reading.timestamp.toISOString()}-${index}`} className="hover:bg-slate-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                    {reading.timestamp.toLocaleString()}
                  </td>
                  {hasTemperature && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                      {reading.temperature !== undefined && reading.temperature !== null
                        ? reading.temperature.toFixed(1)
                        : '-'}
                    </td>
                  )}
                  {hasHumidity && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                      {reading.humidity !== undefined && reading.humidity !== null
                        ? reading.humidity.toFixed(1)
                        : '-'}
                    </td>
                  )}
                  {hasBattery && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                      {reading.battery !== undefined && reading.battery !== null
                        ? reading.battery.toFixed(1)
                        : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {readings.length > 100 && (
          <div className="mt-4 text-sm text-gray-400 text-center">
            Showing most recent 100 of {readings.length} readings
          </div>
        )}
      </div>

      {temperatureReadings.length > 0 && (
        <div className="border border-slate-600 rounded-lg p-6 bg-slate-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-100">Temperature Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Min:</span>
              <span className="ml-2 font-medium text-gray-200">
                {Math.min(...temperatureReadings.map(r => r.temperature!)).toFixed(1)} °C
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max:</span>
              <span className="ml-2 font-medium text-gray-200">
                {Math.max(...temperatureReadings.map(r => r.temperature!)).toFixed(1)} °C
              </span>
            </div>
            <div>
              <span className="text-gray-400">Avg:</span>
              <span className="ml-2 font-medium text-gray-200">
                {(temperatureReadings.reduce((sum, r) => sum + r.temperature!, 0) / temperatureReadings.length).toFixed(1)} °C
              </span>
            </div>
          </div>
        </div>
      )}

      {humidityReadings.length > 0 && (
        <div className="border border-slate-600 rounded-lg p-6 bg-slate-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-100">Humidity Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Min:</span>
              <span className="ml-2 font-medium text-gray-200">
                {Math.min(...humidityReadings.map(r => r.humidity!)).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max:</span>
              <span className="ml-2 font-medium text-gray-200">
                {Math.max(...humidityReadings.map(r => r.humidity!)).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Avg:</span>
              <span className="ml-2 font-medium text-gray-200">
                {(humidityReadings.reduce((sum, r) => sum + r.humidity!, 0) / humidityReadings.length).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {batteryReadings.length > 0 && (
        <div className="border border-slate-600 rounded-lg p-6 bg-slate-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-100">Battery Statistics</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Min:</span>
              <span className="ml-2 font-medium text-gray-200">
                {Math.min(...batteryReadings.map(r => r.battery!)).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max:</span>
              <span className="ml-2 font-medium text-gray-200">
                {Math.max(...batteryReadings.map(r => r.battery!)).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">Avg:</span>
              <span className="ml-2 font-medium text-gray-200">
                {(batteryReadings.reduce((sum, r) => sum + r.battery!, 0) / batteryReadings.length).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
