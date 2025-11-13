import type { Sensor, SensorReading, HomeAssistantState } from '~/types/sensor';
import type { HomeAssistantClient } from './api/homeAssistantClient';
import { serverDataStore } from './storage/serverDataStore.server';

/**
 * Server-side background data collection service
 * Runs independently of browser sessions
 */
export class BackgroundDataCollectionService {
  private intervalId: NodeJS.Timeout | null = null;
  private evictionIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private client: HomeAssistantClient;
  private sensors: Sensor[] = [];

  constructor(client: HomeAssistantClient) {
    this.client = client;
  }

  private async fetchSensorData(sensor: Sensor): Promise<SensorReading | null> {
    try {
      const state: HomeAssistantState = await this.client.getSensorState(sensor.entityId);
      const value = parseFloat(state.state);

      if (isNaN(value)) {
        console.warn(`[DataCollection] Invalid value for sensor ${sensor.entityId}: ${state.state}`);
        return null;
      }

      const reading: SensorReading = {
        sensorId: sensor.id,
        timestamp: new Date(state.last_updated),
      };

      if (sensor.type === 'temperature' || sensor.type === 'both') {
        reading.temperature = value;
      }
      if (sensor.type === 'humidity' || sensor.type === 'both') {
        reading.humidity = value;
      }

      return reading;
    } catch (error) {
      console.error(`[DataCollection] Failed to fetch data for sensor ${sensor.entityId}:`, error);
      return null;
    }
  }

  private async collectData(): Promise<void> {
    if (this.sensors.length === 0) {
      console.log('[DataCollection] No sensors to collect from');
      return;
    }

    console.log(`[DataCollection] Collecting data from ${this.sensors.length} sensors...`);
    
    const readings = await Promise.all(
      this.sensors.map(sensor => this.fetchSensorData(sensor))
    );

    let successCount = 0;
    readings.forEach(reading => {
      if (reading) {
        console.log(`[DataCollection] Adding reading for sensor: ${reading.sensorId}`);
        serverDataStore.add(reading);
        successCount++;
      }
    });

    const stats = serverDataStore.getStats();
    const storedSensorIds = serverDataStore.getSensorIds();
    console.log(`[DataCollection] Collected ${successCount}/${this.sensors.length} readings. Total stored: ${stats.totalPoints} points from ${stats.sensors} sensors`);
    console.log(`[DataCollection] Stored sensor IDs: ${storedSensorIds.join(', ')}`);
  }

  async updateSensors(sensors: Sensor[]): Promise<void> {
    this.sensors = sensors;
    console.log(`[DataCollection] Updated sensor list: ${sensors.length} sensors`);
  }

  async start(sensors: Sensor[], intervalMs: number = 60000): Promise<void> {
    if (this.isRunning) {
      console.warn('[DataCollection] Service already running');
      return;
    }

    this.sensors = sensors;
    this.isRunning = true;

    console.log(`[DataCollection] Starting background data collection (interval: ${intervalMs}ms, sensors: ${sensors.length})`);

    // Collect immediately
    await this.collectData();

    // Then collect at interval
    this.intervalId = setInterval(async () => {
      await this.collectData();
    }, intervalMs);

    // Start eviction service (runs every hour)
    this.evictionIntervalId = setInterval(() => {
      const evictedCount = serverDataStore.evictOldData();
      if (evictedCount > 0) {
        console.log(`[DataCollection] Evicted ${evictedCount} old data points`);
      }
    }, 60 * 60 * 1000);

    console.log('[DataCollection] Background service started successfully');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.evictionIntervalId) {
      clearInterval(this.evictionIntervalId);
      this.evictionIntervalId = null;
    }
    this.isRunning = false;
    console.log('[DataCollection] Background service stopped');
  }

  isCollecting(): boolean {
    return this.isRunning;
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      sensorCount: this.sensors.length,
      ...serverDataStore.getStats(),
    };
  }
}

// Server-side singleton instance
let backgroundCollectionService: BackgroundDataCollectionService | null = null;

export function getBackgroundCollectionService(client: HomeAssistantClient): BackgroundDataCollectionService {
  if (!backgroundCollectionService) {
    backgroundCollectionService = new BackgroundDataCollectionService(client);
  }
  return backgroundCollectionService;
}
