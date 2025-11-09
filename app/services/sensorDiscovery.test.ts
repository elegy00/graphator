import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SensorDiscoveryService } from './sensorDiscovery';
import { HomeAssistantClient } from './api/homeAssistantClient';
import type { HomeAssistantState } from '~/types/sensor';

describe('SensorDiscoveryService', () => {
  let mockClient: HomeAssistantClient;

  beforeEach(() => {
    mockClient = {
      getAllStates: vi.fn(),
      getSensorState: vi.fn(),
    } as any;
  });

  it('should discover temperature sensors', async () => {
    const mockStates: HomeAssistantState[] = [
      {
        entity_id: 'sensor.living_room_temp',
        state: '20.5',
        attributes: {
          friendly_name: 'Living Room Temperature',
          unit_of_measurement: '°C',
          device_class: 'temperature',
        },
        last_changed: '2025-11-09T10:00:00Z',
        last_updated: '2025-11-09T10:00:00Z',
      },
    ];

    (mockClient.getAllStates as any).mockResolvedValue(mockStates);

    const service = new SensorDiscoveryService(mockClient);
    const sensors = await service.discoverSensors();

    expect(sensors).toHaveLength(1);
    expect(sensors[0]).toMatchObject({
      entityId: 'sensor.living_room_temp',
      friendlyName: 'Living Room Temperature',
      type: 'temperature',
      unit: '°C',
    });
  });

  it('should discover humidity sensors', async () => {
    const mockStates: HomeAssistantState[] = [
      {
        entity_id: 'sensor.bathroom_humidity',
        state: '65',
        attributes: {
          friendly_name: 'Bathroom Humidity',
          unit_of_measurement: '%',
          device_class: 'humidity',
        },
        last_changed: '2025-11-09T10:00:00Z',
        last_updated: '2025-11-09T10:00:00Z',
      },
    ];

    (mockClient.getAllStates as any).mockResolvedValue(mockStates);

    const service = new SensorDiscoveryService(mockClient);
    const sensors = await service.discoverSensors();

    expect(sensors).toHaveLength(1);
    expect(sensors[0].type).toBe('humidity');
  });

  it('should filter out non-sensor entities', async () => {
    const mockStates: HomeAssistantState[] = [
      {
        entity_id: 'light.living_room',
        state: 'on',
        attributes: {},
        last_changed: '2025-11-09T10:00:00Z',
        last_updated: '2025-11-09T10:00:00Z',
      },
    ];

    (mockClient.getAllStates as any).mockResolvedValue(mockStates);

    const service = new SensorDiscoveryService(mockClient);
    const sensors = await service.discoverSensors();

    expect(sensors).toHaveLength(0);
  });

  it('should filter out sensors without temperature or humidity', async () => {
    const mockStates: HomeAssistantState[] = [
      {
        entity_id: 'sensor.motion_sensor',
        state: 'on',
        attributes: {
          friendly_name: 'Motion Sensor',
          device_class: 'motion',
        },
        last_changed: '2025-11-09T10:00:00Z',
        last_updated: '2025-11-09T10:00:00Z',
      },
    ];

    (mockClient.getAllStates as any).mockResolvedValue(mockStates);

    const service = new SensorDiscoveryService(mockClient);
    const sensors = await service.discoverSensors();

    expect(sensors).toHaveLength(0);
  });

  it('should use entity_id as friendly name if not provided', async () => {
    const mockStates: HomeAssistantState[] = [
      {
        entity_id: 'sensor.temp_01',
        state: '20',
        attributes: {
          unit_of_measurement: '°C',
          device_class: 'temperature',
        },
        last_changed: '2025-11-09T10:00:00Z',
        last_updated: '2025-11-09T10:00:00Z',
      },
    ];

    (mockClient.getAllStates as any).mockResolvedValue(mockStates);

    const service = new SensorDiscoveryService(mockClient);
    const sensors = await service.discoverSensors();

    expect(sensors[0].friendlyName).toBe('sensor.temp_01');
  });
});
