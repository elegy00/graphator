import { useEffect } from 'react';
import type { Sensor } from '~/types/sensor';
import { DataCollectionService } from '~/services/dataCollection';
import { HomeAssistantClient } from '~/services/api/homeAssistantClient';

const COLLECTION_INTERVAL_MS = 60 * 1000; // 1 minute

export function useDataCollection(
  sensors: Sensor[],
  apiUrl: string,
  apiToken: string
) {
  useEffect(() => {
    if (sensors.length === 0 || !apiUrl || !apiToken) return;

    const client = new HomeAssistantClient(apiUrl, apiToken);
    const dataCollection = new DataCollectionService(client);

    dataCollection.start(sensors, COLLECTION_INTERVAL_MS);

    return () => {
      dataCollection.stop();
    };
  }, [sensors, apiUrl, apiToken]);
}
