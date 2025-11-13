import type { Sensor, SensorReading } from '~/types/sensor';
import { SensorCard } from './SensorCard';
import { useRevalidator } from 'react-router';
import { useEffect } from 'react';

interface SensorListProps {
  sensors: Sensor[];
  onSensorSelect: (sensor: Sensor) => void;
  latestReadings: Record<string, SensorReading>;
}

export function SensorList({ sensors, onSensorSelect, latestReadings }: SensorListProps) {
  const revalidator = useRevalidator();

  // Revalidate every 10 seconds to get fresh data from server
  useEffect(() => {
    const intervalId = setInterval(() => {
      revalidator.revalidate();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [revalidator]);

  if (sensors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No sensors found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sensors.map(sensor => {
        const reading = latestReadings[sensor.id];
        return (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            currentTemp={reading?.temperature}
            currentHumidity={reading?.humidity}
            onSelect={onSensorSelect}
          />
        );
      })}
    </div>
  );
}
