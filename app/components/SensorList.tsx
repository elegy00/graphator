import type { SensorGroup } from '~/utils/sensorGrouping';
import { SensorCard } from './SensorCard';
import { useRevalidator } from 'react-router';
import { useEffect } from 'react';

interface SensorListProps {
  sensorGroups: SensorGroup[];
}

export function SensorList({ sensorGroups }: SensorListProps) {
  const revalidator = useRevalidator();

  // Revalidate every 10 seconds to get fresh data from server
  useEffect(() => {
    const intervalId = setInterval(() => {
      revalidator.revalidate();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [revalidator]);

  if (sensorGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No sensors found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sensorGroups.map(group => (
        <SensorCard key={group.location} sensorGroup={group} />
      ))}
    </div>
  );
}
