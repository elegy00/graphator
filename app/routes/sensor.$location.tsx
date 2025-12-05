// ABOUTME: Detail page route for individual sensor location
// ABOUTME: Shows historical temperature and humidity data for a specific location

import { useLoaderData, useNavigate } from "react-router";
import { sensorRepository, readingRepository } from '~/services/database';
import { groupSensorsByLocation, getSensorDataType } from '~/utils/sensorGrouping';
import { SensorHistory } from '~/components/SensorHistory';
import { SensorNav } from '~/components/SensorNav';

interface AggregatedReading {
  timestamp: Date;
  temperature?: number;
  humidity?: number;
  battery?: number;
}

interface LoaderArgs {
  params: {
    location: string;
  };
}

export async function loader({ params }: LoaderArgs) {
  const location = decodeURIComponent(params.location);

  try {
    // Get all sensors to build navigation and find sensors for this location
    const allSensors = await sensorRepository.getAllSensors();
    const latestReadings = await readingRepository.getAllLatestReadings();
    const allGroups = groupSensorsByLocation(allSensors, latestReadings);

    // Find the specific group for this location
    const currentGroup = allGroups.find(g => g.location === location);

    if (!currentGroup) {
      throw new Response("Sensor not found", { status: 404 });
    }

    // Get historical data for all sensors in this location (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const historicalReadings = [];
    for (const sensorId of currentGroup.sensorIds) {
      const readings = await readingRepository.getReadingsByTimeRange(
        sensorId,
        sevenDaysAgo,
        now
      );
      historicalReadings.push(...readings);
    }

    // Build sensor type map
    const sensorTypeMap = new Map<string, 'temperature' | 'humidity' | 'battery' | null>();
    for (const sensorId of currentGroup.sensorIds) {
      const sensor = allSensors.find(s => s.id === sensorId);
      if (sensor) {
        sensorTypeMap.set(sensorId, getSensorDataType(sensor.friendlyName));
      }
    }

    // Group readings by timestamp (rounded to nearest second) and aggregate
    const groupedByTimestamp = new Map<string, AggregatedReading>();
    for (const reading of historicalReadings) {
      // Round timestamp to nearest second to group readings from same collection cycle
      const roundedTimestamp = new Date(Math.floor(reading.timestamp.getTime() / 1000) * 1000);
      const timestampKey = roundedTimestamp.toISOString();
      const sensorType = sensorTypeMap.get(reading.sensorId);

      let aggregated = groupedByTimestamp.get(timestampKey);
      if (!aggregated) {
        aggregated = {
          timestamp: roundedTimestamp,
          temperature: undefined,
          humidity: undefined,
          battery: undefined,
        };
        groupedByTimestamp.set(timestampKey, aggregated);
      }

      if (sensorType === 'temperature' && reading.temperature !== null && reading.temperature !== undefined) {
        aggregated.temperature = reading.temperature;
      } else if (sensorType === 'humidity' && reading.humidity !== null && reading.humidity !== undefined) {
        aggregated.humidity = reading.humidity;
      } else if (sensorType === 'battery' && reading.humidity !== null && reading.humidity !== undefined) {
        aggregated.battery = reading.humidity;
      }
    }

    // Convert to array and sort by timestamp
    const aggregatedReadings = Array.from(groupedByTimestamp.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      location,
      currentGroup,
      allLocations: allGroups.map(g => g.location),
      historicalReadings: aggregatedReadings,
      error: null,
    };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error('Failed to load sensor detail:', error);
    return {
      location,
      currentGroup: null,
      allLocations: [],
      historicalReadings: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

interface MetaArgs {
  params: {
    location: string;
  };
}

export function meta({ params }: MetaArgs) {
  const location = decodeURIComponent(params.location);
  return [
    { title: `${location} - Sensor Detail` },
    { name: "description", content: `Historical data for ${location} sensor` },
  ];
}

export default function SensorDetail() {
  const { location, currentGroup, allLocations, historicalReadings, error } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center text-red-400">
          <p className="font-semibold mb-2">Error loading sensor data</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-slate-700 text-gray-100 rounded hover:bg-slate-600 border border-slate-600"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  if (!currentGroup) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center text-gray-200">
          <p className="font-semibold mb-2">Sensor not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-slate-700 text-gray-100 rounded hover:bg-slate-600 border border-slate-600"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <SensorNav
        currentLocation={location}
        allLocations={allLocations}
      />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/')}
              className="text-blue-400 hover:text-blue-300 mb-4"
            >
              ← Back to all sensors
            </button>
            <h1 className="text-3xl font-bold mb-2 text-gray-100">{location}</h1>
            <div className="flex gap-4 text-sm">
              {currentGroup.temperature !== undefined && (
                <div>
                  <span className="text-gray-400">Current Temperature: </span>
                  <span className="font-medium text-gray-200">{currentGroup.temperature.toFixed(1)} °C</span>
                </div>
              )}
              {currentGroup.humidity !== undefined && (
                <div>
                  <span className="text-gray-400">Current Humidity: </span>
                  <span className="font-medium text-gray-200">{currentGroup.humidity.toFixed(1)}%</span>
                </div>
              )}
              {currentGroup.battery !== undefined && (
                <div>
                  <span className="text-gray-400">Battery: </span>
                  <span className="font-medium text-gray-200">{currentGroup.battery.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <SensorHistory readings={historicalReadings} />
        </div>
      </main>
    </div>
  );
}
