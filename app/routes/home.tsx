import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import { SensorList } from '~/components/SensorList';
import { sensorRepository, readingRepository } from '~/services/database';
import { groupSensorsByLocation } from '~/utils/sensorGrouping';

export async function loader() {
  try {
    // Get all sensors from database (populated by worker)
    const sensors = await sensorRepository.getAllSensors();

    // Get latest readings from database (returns Record<string, SensorReading>)
    const latestReadings = await readingRepository.getAllLatestReadings();

    // Group sensors by location
    const sensorGroups = groupSensorsByLocation(sensors, latestReadings);

    // Get total reading count (approximate from all sensors)
    let totalPoints = 0;
    for (const sensor of sensors) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const readings = await readingRepository.getReadingsByTimeRange(
        sensor.id,
        thirtyDaysAgo,
        new Date()
      );
      totalPoints += readings.length;
    }

    return {
      sensorGroups,
      error: null,
      stats: {
        totalPoints,
        locations: sensorGroups.length,
      },
    };
  } catch (error) {
    console.error('Failed to load sensor data:', error);
    return {
      sensorGroups: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: { totalPoints: 0, locations: 0 },
    };
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Graphator - Sensor Monitor" },
    { name: "description", content: "Real-time sensor monitoring" },
  ];
}

export default function Home() {
  const { sensorGroups, error, stats } = useLoaderData<typeof loader>();

  // Data collection happens server-side in the loader
  // No client-side hooks needed!

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center text-red-400">
          <p className="font-semibold mb-2">Error loading sensors</p>
          <p className="text-sm">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen bg-slate-950">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-100">Sensor Monitor</h1>
        <p className="text-gray-400">
          {stats.locations} location{stats.locations !== 1 ? 's' : ''} monitored
        </p>
      </header>

      <div className="mb-4 text-sm text-gray-400">
        📊 {stats.totalPoints} data points collected from {stats.locations} locations
      </div>
      <SensorList sensorGroups={sensorGroups} />
    </main>
  );
}
