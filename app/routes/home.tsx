import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import { HomeAssistantClient } from "~/services/api/homeAssistantClient";
import { SensorDiscoveryService } from "~/services/sensorDiscovery";
import { getAuthToken, getHomeAssistantUrl } from "~/config/auth";
import type { Sensor } from "~/types/sensor";

export async function loader() {
  try {
    const client = new HomeAssistantClient(getHomeAssistantUrl(), getAuthToken());
    const discoveryService = new SensorDiscoveryService(client);
    const sensors = await discoveryService.discoverSensors();
    
    return { sensors, error: null };
  } catch (error) {
    console.error('Failed to discover sensors:', error);
    return {
      sensors: [],
      error: error instanceof Error ? error.message : 'Unknown error',
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
  const { sensors, error } = useLoaderData<typeof loader>();

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
          {sensors.length} sensor{sensors.length !== 1 ? 's' : ''} discovered
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map(sensor => (
          <div key={sensor.id} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{sensor.friendlyName}</h3>
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Type: {sensor.type}</div>
              <div>Unit: {sensor.unit}</div>
              <div className="text-xs text-gray-400 mt-2">ID: {sensor.entityId}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
