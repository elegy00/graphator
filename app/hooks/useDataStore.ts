import { useState, useEffect } from 'react';
import type { SensorReading } from '~/types/sensor';
import { dataStore } from '~/services/storage/inMemoryStore';

export function useDataStore(sensorId: string, startDate?: Date, endDate?: Date) {
  const [data, setData] = useState<SensorReading[]>([]);

  useEffect(() => {
    const fetchData = () => {
      if (startDate && endDate) {
        setData(dataStore.getByTimeRange(sensorId, startDate, endDate));
      } else {
        setData(dataStore.getAll(sensorId));
      }
    };

    fetchData();

    // Poll for updates every 10 seconds
    const intervalId = setInterval(fetchData, 10000);

    return () => clearInterval(intervalId);
  }, [sensorId, startDate, endDate]);

  return data;
}
