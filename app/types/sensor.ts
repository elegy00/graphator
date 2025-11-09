export interface Sensor {
  id: string;
  friendlyName: string;
  entityId: string;
  type: 'temperature' | 'humidity' | 'both';
  unit: string;
  lastSeen: Date;
  status: 'online' | 'offline' | 'error';
}

export interface SensorReading {
  sensorId: string;
  timestamp: Date;
  temperature?: number;
  humidity?: number;
}

export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    unit_of_measurement?: string;
    device_class?: string;
    [key: string]: any;
  };
  last_changed: string;
  last_updated: string;
}
