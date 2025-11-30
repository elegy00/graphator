import { readingRepository, sensorRepository } from "~/services/database";

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

  try {
    // Verify sensor exists
    const sensors = await sensorRepository.getAllSensors();
    const sensor = sensors.find(s => s.id === sensorId);
    
    if (!sensor) {
      return Response.json({ error: "Sensor not found" }, { status: 404 });
    }

    // Get readings for last 30 days (configurable retention period)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const readings = await readingRepository.getReadingsByTimeRange(
      sensorId,
      thirtyDaysAgo,
      new Date()
    );
    
    console.log(`[API] Request for sensor: ${sensorId}`);
    console.log(`[API] Found ${readings.length} readings`);

    return Response.json({
      sensorId,
      readings: readings.map(r => ({
        ...r,
        timestamp: r.timestamp.toISOString(), // Serialize dates
      })),
      count: readings.length,
    });
  } catch (error) {
    console.error('[API] Error fetching sensor data:', error);
    return Response.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    );
  }
}
