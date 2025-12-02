// ABOUTME: Repository for sensor reading operations
// ABOUTME: Handles database queries for the sensor_readings table

import { getPool } from './postgresClient';
import type { SensorReading } from '~/types/sensor';

/**
 * Insert a single sensor reading
 */
export async function insertReading(reading: SensorReading): Promise<void> {
  const pool = getPool();

  const query = `
    INSERT INTO sensor_readings (sensor_id, timestamp, temperature, humidity)
    VALUES ($1, $2, $3, $4)
  `;

  const values = [
    reading.sensorId,
    reading.timestamp,
    reading.temperature ?? null,
    reading.humidity ?? null,
  ];

  await pool.query(query, values);
}

/**
 * Insert multiple readings in a batch
 * More efficient than inserting one at a time
 */
export async function insertReadingsBatch(readings: SensorReading[]): Promise<void> {
  if (readings.length === 0) {
    return;
  }

  const pool = getPool();

  // Build multi-row insert query
  const values: any[] = [];
  const placeholders = readings.map((reading, index) => {
    const baseIndex = index * 4;
    values.push(
      reading.sensorId,
      reading.timestamp,
      reading.temperature ?? null,
      reading.humidity ?? null
    );
    return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
  }).join(', ');

  const query = `
    INSERT INTO sensor_readings (sensor_id, timestamp, temperature, humidity)
    VALUES ${placeholders}
  `;

  await pool.query(query, values);
}

/**
 * Get readings for a sensor within a time range
 */
export async function getReadingsByTimeRange(
  sensorId: string,
  startDate: Date,
  endDate: Date
): Promise<SensorReading[]> {
  const pool = getPool();

  const query = `
    SELECT sensor_id, timestamp, temperature, humidity
    FROM sensor_readings
    WHERE sensor_id = $1
      AND timestamp >= $2
      AND timestamp <= $3
    ORDER BY timestamp ASC
  `;

  const result = await pool.query(query, [sensorId, startDate, endDate]);

  return result.rows.map(row => ({
    sensorId: row.sensor_id,
    timestamp: new Date(row.timestamp),
    temperature: row.temperature,
    humidity: row.humidity,
  }));
}

/**
 * Get the latest reading for a sensor
 */
export async function getLatestReading(sensorId: string): Promise<SensorReading | null> {
  const pool = getPool();

  const query = `
    SELECT sensor_id, timestamp, temperature, humidity
    FROM sensor_readings
    WHERE sensor_id = $1
    ORDER BY timestamp DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [sensorId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    sensorId: row.sensor_id,
    timestamp: new Date(row.timestamp),
    temperature: row.temperature,
    humidity: row.humidity,
  };
}

/**
 * Get latest readings for all sensors
 * Returns a map of sensorId -> latest reading
 */
export async function getAllLatestReadings(): Promise<Record<string, SensorReading>> {
  const pool = getPool();

  // Use DISTINCT ON to get latest reading per sensor
  const query = `
    SELECT DISTINCT ON (sensor_id)
      sensor_id, timestamp, temperature, humidity
    FROM sensor_readings
    ORDER BY sensor_id, timestamp DESC
  `;

  const result = await pool.query(query);

  const readings: Record<string, SensorReading> = {};

  for (const row of result.rows) {
    readings[row.sensor_id] = {
      sensorId: row.sensor_id,
      timestamp: new Date(row.timestamp),
      temperature: row.temperature,
      humidity: row.humidity,
    };
  }

  return readings;
}

/**
 * Delete readings older than a cutoff date
 * Returns the number of rows deleted
 */
export async function deleteOldReadings(cutoffDate: Date): Promise<number> {
  const pool = getPool();

  const query = `
    DELETE FROM sensor_readings
    WHERE timestamp < $1
  `;

  const result = await pool.query(query, [cutoffDate]);

  return result.rowCount ?? 0;
}

/**
 * Get count of readings for a sensor
 */
export async function getReadingCount(sensorId: string): Promise<number> {
  const pool = getPool();

  const query = `
    SELECT COUNT(*) as count
    FROM sensor_readings
    WHERE sensor_id = $1
  `;

  const result = await pool.query(query, [sensorId]);

  return parseInt(result.rows[0].count, 10);
}
