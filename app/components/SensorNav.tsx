// ABOUTME: Side navigation component for quick sensor switching
// ABOUTME: Displays list of all available sensor locations with active state

import { Link } from 'react-router';

interface SensorNavProps {
  currentLocation: string;
  allLocations: string[];
}

export function SensorNav({ currentLocation, allLocations }: SensorNavProps) {
  return (
    <nav className="w-64 bg-slate-900 border-r border-slate-700 min-h-screen p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-lg mb-2 text-gray-100">Sensors</h2>
        <p className="text-xs text-gray-400">{allLocations.length} locations</p>
      </div>
      <ul className="space-y-1">
        {allLocations.map(location => {
          const isActive = location === currentLocation;
          return (
            <li key={location}>
              <Link
                to={`/sensor/${encodeURIComponent(location)}`}
                className={`block px-3 py-2 rounded transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                {location}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
