// ABOUTME: Repository for sensor metadata CRUD operations
// ABOUTME: Handles database queries for the sensors table

import { getPool } from './postgresClient';
import type { Sensor } from '~/types/sensor';

/**
 * Insert or update a sensor
 * Uses UPSERT (INSERT ... ON CONFLICT) to handle both cases
 */
export async function upsertSensor(sensor: Sensor): Promise<void> {
  const pool = getPool();

  const query = `
    INSERT INTO sensors (id, entity_id, friendly_name, type, unit, last_seen, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id)
    DO UPDATE SET
      entity_id = EXCLUDED.entity_id,
      friendly_name = EXCLUDED.friendly_name,
      type = EXCLUDED.type,
      unit = EXCLUDED.unit,
      last_seen = EXCLUDED.last_seen,
      status = EXCLUDED.status,
      updated_at = NOW()
  `;

  const values = [
    sensor.id,
    sensor.entityId,
    sensor.friendlyName,
    sensor.type,
    sensor.unit,
    sensor.lastSeen,
    sensor.status,
  ];

  await pool.query(query, values);
}

/**
 * Get a sensor by ID
 */
export async function getSensorById(id: string): Promise<Sensor | null> {
  const pool = getPool();

  const query = `
    SELECT id, entity_id, friendly_name, type, unit, last_seen, status, created_at, updated_at
    FROM sensors
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    entityId: row.entity_id,
    friendlyName: row.friendly_name,
    type: row.type,
    unit: row.unit,
    lastSeen: new Date(row.last_seen),
    status: row.status,
  };
}

/**
 * Get all sensors
 */
export async function getAllSensors(): Promise<Sensor[]> {
  const pool = getPool();

  const query = `
    SELECT id, entity_id, friendly_name, type, unit, last_seen, status
    FROM sensors
    ORDER BY friendly_name
  `;

  const result = await pool.query(query);

  return result.rows.map(row => ({
    id: row.id,
    entityId: row.entity_id,
    friendlyName: row.friendly_name,
    type: row.type,
    unit: row.unit,
    lastSeen: new Date(row.last_seen),
    status: row.status,
  }));
}

/**
 * Update sensor status
 */
export async function updateSensorStatus(id: string, status: 'online' | 'offline' | 'error'): Promise<void> {
  const pool = getPool();

  const query = `
    UPDATE sensors
    SET status = $1, updated_at = NOW()
    WHERE id = $2
  `;

  await pool.query(query, [status, id]);
}

/**
 * Delete a sensor (cascade deletes readings)
 */
export async function deleteSensor(id: string): Promise<void> {
  const pool = getPool();

  const query = `
    DELETE FROM sensors
    WHERE id = $1
  `;

  await pool.query(query, [id]);
}
