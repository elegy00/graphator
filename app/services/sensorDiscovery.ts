import type { Sensor, HomeAssistantState } from '~/types/sensor';
import type { HomeAssistantClient } from './api/homeAssistantClient';

export class SensorDiscoveryService {
  private client: HomeAssistantClient;

  constructor(client: HomeAssistantClient) {
    this.client = client;
  }
  private getSensorType(state: HomeAssistantState): Sensor['type'] | null {
    const deviceClass = state.attributes.device_class;
    const unit = state.attributes.unit_of_measurement;

    if (deviceClass === 'temperature' || unit?.includes('°')) {
      return 'temperature';
    }
    if (deviceClass === 'humidity' || unit === '%') {
      return 'humidity';
    }
    return null;
  }

  private mapStateToSensor(state: HomeAssistantState): Sensor | null {
    const type = this.getSensorType(state);
    if (!type) return null;

    return {
      id: state.entity_id.replace('sensor.', ''),
      entityId: state.entity_id,
      friendlyName: state.attributes.friendly_name || state.entity_id,
      type,
      unit: state.attributes.unit_of_measurement || '',
      lastSeen: new Date(state.last_updated),
      status: 'online',
    };
  }

  async discoverSensors(): Promise<Sensor[]> {
    try {
      const states = await this.client.getAllStates();

      const sensors = states
        .filter(state => state.entity_id.startsWith('sensor.'))
        .map(state => this.mapStateToSensor(state))
        .filter((sensor): sensor is Sensor => sensor !== null);

      return sensors;
    } catch (error) {
      console.error('Failed to discover sensors:', error);
      throw error;
    }
  }
}
