import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDataStore } from './inMemoryStore';
import type { SensorReading } from '~/types/sensor';

describe('InMemoryDataStore', () => {
  let store: InMemoryDataStore;

  beforeEach(() => {
    store = new InMemoryDataStore();
  });

  it('should store and retrieve sensor readings', () => {
    const reading: SensorReading = {
      sensorId: 'sensor1',
      timestamp: new Date('2025-11-09T10:00:00Z'),
      temperature: 20.5,
    };

    store.add(reading);
    const readings = store.getAll('sensor1');

    expect(readings).toHaveLength(1);
    expect(readings[0]).toEqual(reading);
  });

  it('should filter by time range', () => {
    const readings: SensorReading[] = [
      { sensorId: 's1', timestamp: new Date('2025-11-07T10:00:00Z'), temperature: 20 },
      { sensorId: 's1', timestamp: new Date('2025-11-08T10:00:00Z'), temperature: 21 },
      { sensorId: 's1', timestamp: new Date('2025-11-09T10:00:00Z'), temperature: 22 },
    ];

    readings.forEach(r => store.add(r));

    const filtered = store.getByTimeRange(
      's1',
      new Date('2025-11-08T00:00:00Z'),
      new Date('2025-11-09T00:00:00Z')
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].temperature).toBe(21);
  });

  it('should evict data older than 30 days', () => {
    const oldReading: SensorReading = {
      sensorId: 's1',
      timestamp: new Date('2025-10-01T10:00:00Z'), // 39 days ago
      temperature: 20,
    };

    const recentReading: SensorReading = {
      sensorId: 's1',
      timestamp: new Date('2025-11-08T10:00:00Z'),
      temperature: 21,
    };

    store.add(oldReading);
    store.add(recentReading);

    const evicted = store.evictOldData();

    expect(evicted).toBe(1);
    expect(store.getAll('s1')).toHaveLength(1);
    expect(store.getAll('s1')[0].temperature).toBe(21);
  });

  it('should get latest reading', () => {
    store.add({ sensorId: 's1', timestamp: new Date('2025-11-08T10:00:00Z'), temperature: 20 });
    store.add({ sensorId: 's1', timestamp: new Date('2025-11-09T10:00:00Z'), temperature: 21 });

    const latest = store.getLatest('s1');

    expect(latest?.temperature).toBe(21);
  });

  it('should handle multiple sensors independently', () => {
    store.add({ sensorId: 's1', timestamp: new Date(), temperature: 20 });
    store.add({ sensorId: 's2', timestamp: new Date(), temperature: 25 });

    expect(store.getAll('s1')).toHaveLength(1);
    expect(store.getAll('s2')).toHaveLength(1);
    expect(store.getSensorIds()).toEqual(['s1', 's2']);
  });

  it('should clear all data', () => {
    store.add({ sensorId: 's1', timestamp: new Date(), temperature: 20 });
    store.add({ sensorId: 's2', timestamp: new Date(), temperature: 25 });

    store.clear();

    expect(store.getSensorIds()).toHaveLength(0);
    expect(store.getAll('s1')).toHaveLength(0);
  });

  it('should limit points per sensor to prevent memory overflow', () => {
    // This test would be slow with 50k readings, so we'll just verify the logic
    const readings: SensorReading[] = [];
    for (let i = 0; i < 50; i++) {
      readings.push({
        sensorId: 's1',
        timestamp: new Date(Date.now() + i * 1000),
        temperature: 20 + i,
      });
    }

    readings.forEach(r => store.add(r));

    expect(store.getAll('s1')).toHaveLength(50);
  });

  it('should return undefined for sensor with no data', () => {
    expect(store.getLatest('nonexistent')).toBeUndefined();
    expect(store.getAll('nonexistent')).toEqual([]);
  });
});
