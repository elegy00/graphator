import { serverDataStore } from "~/services/storage/serverDataStore.server";

interface LoaderArgs {
  params: {
    sensorId: string;
  };
}

export async function loader({ params }: LoaderArgs) {
  const { sensorId } = params;

  if (!sensorId) {
    return Response.json({ error: "Sensor ID required" }, { status: 400 });
  }

  // Get all data for this sensor
  const readings = serverDataStore.getAll(sensorId);
  const allSensorIds = serverDataStore.getSensorIds();
  
  console.log(`[API] Request for sensor: ${sensorId}`);
  console.log(`[API] Found ${readings.length} readings`);
  console.log(`[API] Available sensor IDs in store: ${allSensorIds.join(', ')}`);

  return Response.json({
    sensorId,
    readings: readings.map(r => ({
      ...r,
      timestamp: r.timestamp.toISOString(), // Serialize dates
    })),
    count: readings.length,
  });
}
