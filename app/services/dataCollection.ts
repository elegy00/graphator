import type { Sensor, SensorReading, HomeAssistantState } from '~/types/sensor';
import type { HomeAssistantClient } from './api/homeAssistantClient';
import { dataStore } from './storage/inMemoryStore';

export class DataCollectionService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private client: HomeAssistantClient;

  constructor(client: HomeAssistantClient) {
    this.client = client;
  }

  private async fetchSensorData(sensor: Sensor): Promise<SensorReading | null> {
    try {
      const state: HomeAssistantState = await this.client.getSensorState(sensor.entityId);
      const value = parseFloat(state.state);

      if (isNaN(value)) {
        console.warn(`Invalid value for sensor ${sensor.entityId}: ${state.state}`);
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
      console.error(`Failed to fetch data for sensor ${sensor.entityId}:`, error);
      return null;
    }
  }

  async collectData(sensors: Sensor[]): Promise<void> {
    const readings = await Promise.all(
      sensors.map(sensor => this.fetchSensorData(sensor))
    );

    readings.forEach(reading => {
      if (reading) {
        dataStore.add(reading);
      }
    });
  }

  start(sensors: Sensor[], intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.warn('Data collection already running');
      return;
    }

    this.isRunning = true;

    // Collect immediately
    this.collectData(sensors);

    // Then collect at interval
    this.intervalId = setInterval(() => {
      this.collectData(sensors);
    }, intervalMs);

    console.log(`Data collection started (interval: ${intervalMs}ms)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Data collection stopped');
  }

  isCollecting(): boolean {
    return this.isRunning;
  }
}
