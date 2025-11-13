import type { SensorReading } from '~/types/sensor';

const MAX_RETENTION_DAYS = 30;
const MAX_POINTS_PER_SENSOR = 50000;

/**
 * Server-side singleton data store
 * This runs in Node.js/server context only and persists across all requests
 */
class ServerDataStore {
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

  getAllLatest(): Record<string, SensorReading> {
    const latest: Record<string, SensorReading> = {};
    for (const [sensorId, readings] of this.data.entries()) {
      if (readings.length > 0) {
        latest[sensorId] = readings[readings.length - 1];
      }
    }
    return latest;
  }

  getStats(): { totalPoints: number; sensors: number } {
    let totalPoints = 0;
    for (const readings of this.data.values()) {
      totalPoints += readings.length;
    }
    return {
      totalPoints,
      sensors: this.data.size,
    };
  }
}

// Server-side singleton instance - this persists across all requests
export const serverDataStore = new ServerDataStore();
