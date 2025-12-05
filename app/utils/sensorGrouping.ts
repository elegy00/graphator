// ABOUTME: Utility for grouping sensors by physical location
// ABOUTME: Aggregates temperature, humidity, and battery sensors into location groups

import type { Sensor, SensorReading } from '~/types/sensor';

export interface SensorGroup {
  location: string;
  sensorIds: string[];
  temperature?: number;
  humidity?: number;
  battery?: number;
  lastSeen: Date;
  status: 'online' | 'offline' | 'error';
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extract location from sensor friendly name
 * Examples: "Büro Temperature" -> "Büro", "Schlafzimmer humidity" -> "Schlafzimmer"
 */
function extractLocation(friendlyName: string): string {
  const suffixes = ['Temperature', 'temperature', 'Humidity', 'humidity', 'Battery', 'battery', 'power'];

  for (const suffix of suffixes) {
    const index = friendlyName.lastIndexOf(` ${suffix}`);
    if (index !== -1) {
      return friendlyName.substring(0, index).trim();
    }
  }

  return friendlyName.trim();
}

/**
 * Check if extracted location looks like a device name rather than a room location
 * Device names typically have multiple words or include manufacturer/model info
 */
function isDeviceName(location: string): boolean {
  const devicePatterns = [
    /^IKEA/i,
    /dimmer/i,
    /sensor/i,
    /\bof\b.*\b(sweden|china|germany)\b/i, // "of Sweden", "of China", etc.
  ];

  return devicePatterns.some(pattern => pattern.test(location));
}

/**
 * Determine sensor data type from friendly name
 */
export function getSensorDataType(friendlyName: string): 'temperature' | 'humidity' | 'battery' | null {
  const lower = friendlyName.toLowerCase();

  if (lower.includes('temperature')) return 'temperature';
  if (lower.includes('humidity')) return 'humidity';
  if (lower.includes('battery') || lower.includes('power')) return 'battery';

  return null;
}

/**
 * Group sensors by location and aggregate their readings
 */
export function groupSensorsByLocation(
  sensors: Sensor[],
  latestReadings: Record<string, SensorReading>
): SensorGroup[] {
  const groups = new Map<string, SensorGroup>();

  for (const sensor of sensors) {
    const location = extractLocation(sensor.friendlyName);

    // Skip device names that aren't room locations
    if (isDeviceName(location)) {
      continue;
    }

    const dataType = getSensorDataType(sensor.friendlyName);

    let group = groups.get(location);

    if (!group) {
      group = {
        location,
        sensorIds: [],
        temperature: undefined,
        humidity: undefined,
        battery: undefined,
        lastSeen: sensor.lastSeen,
        status: sensor.status,
      };
      groups.set(location, group);
    }

    group.sensorIds.push(sensor.id);

    // Update lastSeen to most recent
    if (sensor.lastSeen > group.lastSeen) {
      group.lastSeen = sensor.lastSeen;
    }

    // Update status (error > offline > online)
    if (sensor.status === 'error') {
      group.status = 'error';
    } else if (sensor.status === 'offline' && group.status !== 'error') {
      group.status = 'offline';
    }

    // Get reading for this sensor
    const reading = latestReadings[sensor.id];
    if (reading && dataType) {
      if (dataType === 'temperature') {
        group.temperature = reading.temperature;
      } else if (dataType === 'humidity') {
        group.humidity = reading.humidity;
      } else if (dataType === 'battery') {
        group.battery = reading.humidity; // Battery values come through as humidity
      }
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.location.localeCompare(b.location)
  );
}
