import type { SensorReading } from '~/types/sensor';

const MAX_RETENTION_DAYS = 30;
const MAX_POINTS_PER_SENSOR = 50000;

export class InMemoryDataStore {
  private data: Map<string, SensorReading[]> = new Map();

  add(reading: SensorReading): void {
    const sensorId = reading.sensorId;

    if (!this.data.has(sensorId)) {
      this.data.set(sensorId, []);
    }

    const readings = this.data.get(sensorId)!;
    readings.push(reading);

    // Prevent memory overflow
    if (readings.length > MAX_POINTS_PER_SENSOR) {
      readings.shift();
    }
  }

  getByTimeRange(
    sensorId: string,
    startDate: Date,
    endDate: Date
  ): SensorReading[] {
    const readings = this.data.get(sensorId) || [];

    return readings.filter(
      reading =>
        reading.timestamp >= startDate && reading.timestamp <= endDate
    );
  }

  getAll(sensorId: string): SensorReading[] {
    return this.data.get(sensorId) || [];
  }

  evictOldData(): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);

    let evictedCount = 0;

    for (const [sensorId, readings] of this.data.entries()) {
      const originalLength = readings.length;
      const filtered = readings.filter(
        reading => reading.timestamp >= cutoffDate
      );

      evictedCount += originalLength - filtered.length;
      this.data.set(sensorId, filtered);
    }

    return evictedCount;
  }

  clear(): void {
    this.data.clear();
  }

  getSensorIds(): string[] {
    return Array.from(this.data.keys());
  }

  getLatest(sensorId: string): SensorReading | undefined {
    const readings = this.data.get(sensorId);
    return readings?.[readings.length - 1];
  }
}

export const dataStore = new InMemoryDataStore();
