// ABOUTME: Tests for sensor grouping utility
// ABOUTME: Validates grouping sensors by location and aggregating readings

import { describe, it, expect } from 'vitest';
import { groupSensorsByLocation } from './sensorGrouping';
import type { Sensor, SensorReading } from '~/types/sensor';

describe('groupSensorsByLocation', () => {
  it('groups sensors by location extracting from friendly name', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'buero_hum',
        entityId: 'sensor.buero_humidity',
        friendlyName: 'Büro Humidity',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'buero_bat',
        entityId: 'sensor.buero_battery',
        friendlyName: 'Büro Battery',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T08:00:00Z'),
        status: 'online',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {
      buero_temp: {
        sensorId: 'buero_temp',
        timestamp: new Date('2025-12-04T22:00:00Z'),
        temperature: 22.0,
      },
      buero_hum: {
        sensorId: 'buero_hum',
        timestamp: new Date('2025-12-04T22:00:00Z'),
        humidity: 52.6,
      },
      buero_bat: {
        sensorId: 'buero_bat',
        timestamp: new Date('2025-12-04T08:00:00Z'),
        humidity: 16.0,
      },
    };

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      location: 'Büro',
      sensorIds: ['buero_temp', 'buero_hum', 'buero_bat'],
      temperature: 22.0,
      humidity: 52.6,
      battery: 16.0,
      lastSeen: new Date('2025-12-04T22:00:00Z'),
      status: 'online',
    });
  });

  it('handles multiple locations', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'schlafzimmer_hum',
        entityId: 'sensor.schlafzimmer_humidity',
        friendlyName: 'Schlafzimmer humidity',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T22:08:35Z'),
        status: 'online',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {
      buero_temp: {
        sensorId: 'buero_temp',
        timestamp: new Date('2025-12-04T22:00:00Z'),
        temperature: 22.0,
      },
      schlafzimmer_hum: {
        sensorId: 'schlafzimmer_hum',
        timestamp: new Date('2025-12-04T22:08:35Z'),
        humidity: 57.6,
      },
    };

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result).toHaveLength(2);
    expect(result.find(g => g.location === 'Büro')).toBeDefined();
    expect(result.find(g => g.location === 'Schlafzimmer')).toBeDefined();
  });

  it('handles sensors without readings', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {};

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      location: 'Büro',
      sensorIds: ['buero_temp'],
      temperature: undefined,
      humidity: undefined,
      battery: undefined,
      lastSeen: new Date('2025-12-04T22:00:00Z'),
      status: 'online',
    });
  });

  it('uses most recent lastSeen across all sensors in group', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'buero_bat',
        entityId: 'sensor.buero_battery',
        friendlyName: 'Büro Battery',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T08:00:00Z'),
        status: 'online',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {};

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result[0].lastSeen).toEqual(new Date('2025-12-04T22:00:00Z'));
  });

  it('marks group as error if any sensor has error status', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'buero_bat',
        entityId: 'sensor.buero_battery',
        friendlyName: 'Büro Battery',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T08:00:00Z'),
        status: 'error',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {};

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result[0].status).toBe('error');
  });

  it('marks group as offline if any sensor is offline but none have errors', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'buero_bat',
        entityId: 'sensor.buero_battery',
        friendlyName: 'Büro Battery',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T08:00:00Z'),
        status: 'offline',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {};

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result[0].status).toBe('offline');
  });

  it('filters out device names like IKEA products', () => {
    const sensors: Sensor[] = [
      {
        id: 'buero_temp',
        entityId: 'sensor.buero_temperature',
        friendlyName: 'Büro Temperature',
        type: 'temperature',
        unit: '°C',
        lastSeen: new Date('2025-12-04T22:00:00Z'),
        status: 'online',
      },
      {
        id: 'ikea_dimmer',
        entityId: 'sensor.ikea_dimmer_battery',
        friendlyName: 'IKEA of Sweden RODRET Dimmer Battery',
        type: 'humidity',
        unit: '%',
        lastSeen: new Date('2025-12-04T08:00:00Z'),
        status: 'online',
      },
    ];

    const latestReadings: Record<string, SensorReading> = {};

    const result = groupSensorsByLocation(sensors, latestReadings);

    expect(result).toHaveLength(1);
    expect(result[0].location).toBe('Büro');
    expect(result.find(g => g.location.includes('IKEA'))).toBeUndefined();
  });
});
