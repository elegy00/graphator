// ABOUTME: Database migration runner for applying schema changes
// ABOUTME: Executes SQL migration files to set up database schema

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './postgresClient';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run all migrations
 */
export async function runMigrations(): Promise<void> {
  const pool = getPool();

  console.log('[Migration] Starting database migrations...');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('[Migration] Running 001_initial_schema.sql...');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('[Migration] ✓ Migration completed successfully');
  } catch (error) {
    console.error('[Migration] ✗ Migration failed:', error);
    throw error;
  }
}

/**
 * Check if tables exist
 */
export async function checkTablesExist(): Promise<boolean> {
  const pool = getPool();

  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'sensors'
    ) as sensors_exists,
    EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'sensor_readings'
    ) as readings_exists
  `;

  const result = await pool.query(query);
  const { sensors_exists, readings_exists } = result.rows[0];

  return sensors_exists && readings_exists;
}

// If running directly, execute migrations
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const tablesExist = await checkTablesExist();

      if (tablesExist) {
        console.log('[Migration] Tables already exist, skipping migration');
      } else {
        await runMigrations();
      }

      await closePool();
      process.exit(0);
    } catch (error) {
      console.error('[Migration] Fatal error:', error);
      await closePool();
      process.exit(1);
    }
  })();
}
