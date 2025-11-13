import { useState } from 'react';
import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import { HomeAssistantClient } from "~/services/api/homeAssistantClient";
import { SensorDiscoveryService } from "~/services/sensorDiscovery";
import { getAuthToken, getHomeAssistantUrl } from "~/config/auth";
import type { Sensor } from "~/types/sensor";
import { SensorList } from '~/components/SensorList';
import { SensorChart } from '~/components/SensorChart';
import { getBackgroundCollectionService } from '~/services/backgroundDataCollection.server';
import { serverDataStore } from '~/services/storage/serverDataStore.server';

export async function loader() {
  try {
    const client = new HomeAssistantClient(getHomeAssistantUrl(), getAuthToken());
    const discoveryService = new SensorDiscoveryService(client);
    const sensors = await discoveryService.discoverSensors();
    
    // Start background data collection if not already running
    const collectionService = getBackgroundCollectionService(client);
    if (!collectionService.isCollecting()) {
      await collectionService.start(sensors, 60000); // Collect every 60 seconds
    } else {
      // Update sensors in case they changed
      await collectionService.updateSensors(sensors);
    }

    // Get latest readings from server store
    const latestReadings = serverDataStore.getAllLatest();
    const stats = serverDataStore.getStats();
    
    return { 
      sensors, 
      error: null,
      latestReadings,
      stats,
    };
  } catch (error) {
    console.error('Failed to discover sensors:', error);
    return {
      sensors: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      latestReadings: {},
      stats: { totalPoints: 0, sensors: 0 },
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
  const { sensors, error, latestReadings, stats } = useLoaderData<typeof loader>();
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);

  // Data collection happens server-side in the loader
  // No client-side hooks needed!

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="font-semibold mb-2">Error loading sensors</p>
          <p className="text-sm">{error}</p>
        </div>
      </main>
    );
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sensor Monitor</h1>
        <p className="text-gray-600">
          {sensors.length} sensor{sensors.length !== 1 ? 's' : ''} active
        </p>
      </header>

      {selectedSensor ? (
        <div>
          <button
            onClick={() => setSelectedSensor(null)}
            className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            ← Back to sensor list
          </button>
          <SensorChart sensor={selectedSensor} />
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">
            📊 {stats.totalPoints} data points collected from {stats.sensors} sensors
          </div>
          <SensorList sensors={sensors} onSensorSelect={setSelectedSensor} latestReadings={latestReadings} />
        </>
      )}
    </main>
  );
}
