// ABOUTME: Worker entry point for background data collection
// ABOUTME: Discovers sensors, collects readings, and writes to PostgreSQL database

// Load environment variables from .env.worker
import { config } from 'dotenv';
config({ path: '.env.worker' });

import { HomeAssistantClient } from '../services/api/homeAssistantClient';
import { SensorDiscoveryService } from '../services/sensorDiscovery';
import {
  sensorRepository,
  readingRepository,
  closePool,
  runMigrations,
  checkTablesExist,
} from '../services/database';
import type { Sensor, SensorReading, HomeAssistantState } from '../types/sensor';

// Configuration from environment variables
const HA_URL = process.env.HOME_ASSISTANT_URL;
const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN || process.env.HA_AUTH_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const COLLECTION_INTERVAL_MS = parseInt(process.env.COLLECTION_INTERVAL_MS || '60000', 10); // 60 seconds
const REDISCOVERY_INTERVAL_MS = parseInt(process.env.REDISCOVERY_INTERVAL_MS || '300000', 10); // 5 minutes
const CLEANUP_INTERVAL_MS = parseInt(process.env.CLEANUP_INTERVAL_MS || '3600000', 10); // 1 hour
const RETENTION_DAYS = parseInt(process.env.RETENTION_DAYS || '30', 10);

// Interval IDs for cleanup
let collectionIntervalId: NodeJS.Timeout | null = null;
let rediscoveryIntervalId: NodeJS.Timeout | null = null;
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Current sensors list
let currentSensors: Sensor[] = [];

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const missing: string[] = [];

  if (!HA_URL) missing.push('HOME_ASSISTANT_URL');
  if (!HA_TOKEN) missing.push('HOME_ASSISTANT_TOKEN or HA_AUTH_TOKEN');
  if (!DATABASE_URL) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    console.error('[Worker] Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  console.log('[Worker] Environment validation passed');
  console.log('[Worker] Configuration:');
  console.log(`  - Home Assistant URL: ${HA_URL}`);
  console.log(`  - Collection interval: ${COLLECTION_INTERVAL_MS}ms (${COLLECTION_INTERVAL_MS / 1000}s)`);
  console.log(`  - Rediscovery interval: ${REDISCOVERY_INTERVAL_MS}ms (${REDISCOVERY_INTERVAL_MS / 1000}s)`);
  console.log(`  - Cleanup interval: ${CLEANUP_INTERVAL_MS}ms (${CLEANUP_INTERVAL_MS / 1000 / 60}min)`);
  console.log(`  - Data retention: ${RETENTION_DAYS} days`);
}

/**
 * Initialize database schema
 */
async function initializeDatabase(): Promise<void> {
  console.log('[Worker] Checking database schema...');

  try {
    const tablesExist = await checkTablesExist();

    if (!tablesExist) {
      console.log('[Worker] Database tables not found, running migrations...');
      await runMigrations();
      console.log('[Worker] ✓ Database migrations completed');
    } else {
      console.log('[Worker] ✓ Database tables already exist');
    }
  } catch (error) {
    console.error('[Worker] ✗ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Discover sensors and upsert to database
 */
async function discoverAndStoreSensors(
  discoveryService: SensorDiscoveryService
): Promise<Sensor[]> {
  console.log('[Worker] Discovering sensors from Home Assistant...');

  try {
    const sensors = await discoveryService.discoverSensors();
    console.log(`[Worker] Found ${sensors.length} sensors`);

    // Upsert all sensors to database
    for (const sensor of sensors) {
      await sensorRepository.upsertSensor(sensor);
      console.log(`[Worker]   ✓ Upserted sensor: ${sensor.friendlyName} (${sensor.entityId})`);
    }

    console.log(`[Worker] ✓ Stored ${sensors.length} sensors to database`);
    return sensors;
  } catch (error) {
    console.error('[Worker] ✗ Sensor discovery failed:', error);
    throw error;
  }
}

/**
 * Fetch and store a single sensor reading
 */
async function fetchAndStoreSensorData(
  client: HomeAssistantClient,
  sensor: Sensor
): Promise<boolean> {
  try {
    const state: HomeAssistantState = await client.getSensorState(sensor.entityId);
    const value = parseFloat(state.state);

    if (isNaN(value)) {
      console.warn(`[Worker] Invalid value for sensor ${sensor.entityId}: ${state.state}`);
      return false;
    }

    const reading: SensorReading = {
      sensorId: sensor.id,
      timestamp: new Date(state.last_updated),
    };

    // Assign value based on sensor type
    if (sensor.type === 'temperature' || sensor.type === 'both') {
      reading.temperature = value;
    }
    if (sensor.type === 'humidity' || sensor.type === 'both') {
      reading.humidity = value;
    }

    // Insert reading to database
    await readingRepository.insertReading(reading);

    return true;
  } catch (error) {
    console.error(`[Worker] Failed to fetch/store data for sensor ${sensor.entityId}:`, error);
    return false;
  }
}

/**
 * Collect data from all sensors
 */
async function collectData(client: HomeAssistantClient): Promise<void> {
  if (currentSensors.length === 0) {
    console.log('[Worker] No sensors to collect from');
    return;
  }

  console.log(`[Worker] Collecting data from ${currentSensors.length} sensors...`);

  const results = await Promise.all(
    currentSensors.map(sensor => fetchAndStoreSensorData(client, sensor))
  );

  const successCount = results.filter(r => r).length;
  console.log(`[Worker] ✓ Collected ${successCount}/${currentSensors.length} readings`);

  // Get total reading count
  try {
    const counts = await readingRepository.getReadingCount();
    const totalReadings = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`[Worker] Database: ${totalReadings} total readings across ${Object.keys(counts).length} sensors`);
  } catch (error) {
    console.error('[Worker] Failed to get reading count:', error);
  }
}

/**
 * Delete old data beyond retention period
 */
async function cleanupOldData(): Promise<void> {
  console.log(`[Worker] Running cleanup job (retention: ${RETENTION_DAYS} days)...`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    const deletedCount = await readingRepository.deleteOldReadings(cutoffDate);

    if (deletedCount > 0) {
      console.log(`[Worker] ✓ Deleted ${deletedCount} old readings (before ${cutoffDate.toISOString()})`);
    } else {
      console.log(`[Worker] ✓ No old readings to delete`);
    }
  } catch (error) {
    console.error('[Worker] ✗ Cleanup failed:', error);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);

  // Clear all intervals
  if (collectionIntervalId) clearInterval(collectionIntervalId);
  if (rediscoveryIntervalId) clearInterval(rediscoveryIntervalId);
  if (cleanupIntervalId) clearInterval(cleanupIntervalId);

  // Close database connection
  await closePool();

  console.log('[Worker] Shutdown complete');
  process.exit(0);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('[Worker] Starting Graphator Worker...');
  console.log('[Worker] Version: 1.0.0');
  console.log('[Worker] Node version:', process.version);

  // Validate environment
  validateEnvironment();

  // Initialize database
  await initializeDatabase();

  // Initialize Home Assistant client
  const client = new HomeAssistantClient(HA_URL!, HA_TOKEN!);
  const discoveryService = new SensorDiscoveryService(client);

  // Initial sensor discovery
  currentSensors = await discoverAndStoreSensors(discoveryService);

  if (currentSensors.length === 0) {
    console.warn('[Worker] No sensors discovered, but continuing to run...');
  }

  // Start data collection immediately
  await collectData(client);

  // Schedule periodic data collection
  console.log(`[Worker] Starting data collection (every ${COLLECTION_INTERVAL_MS / 1000}s)...`);
  collectionIntervalId = setInterval(async () => {
    await collectData(client);
  }, COLLECTION_INTERVAL_MS);

  // Schedule periodic sensor rediscovery
  console.log(`[Worker] Starting sensor rediscovery (every ${REDISCOVERY_INTERVAL_MS / 1000}s)...`);
  rediscoveryIntervalId = setInterval(async () => {
    console.log('[Worker] Running scheduled sensor rediscovery...');
    currentSensors = await discoverAndStoreSensors(discoveryService);
  }, REDISCOVERY_INTERVAL_MS);

  // Schedule periodic cleanup
  console.log(`[Worker] Starting cleanup job (every ${CLEANUP_INTERVAL_MS / 1000 / 60}min)...`);
  cleanupIntervalId = setInterval(async () => {
    await cleanupOldData();
  }, CLEANUP_INTERVAL_MS);

  // Setup graceful shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log('[Worker] ✓ Worker started successfully');
  console.log('[Worker] Press Ctrl+C to stop');
}

// Start the worker
main().catch(async (error) => {
  console.error('[Worker] Fatal error during startup:', error);
  await closePool();
  process.exit(1);
});
