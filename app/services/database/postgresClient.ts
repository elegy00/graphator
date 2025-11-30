// ABOUTME: PostgreSQL connection pool management for database operations
// ABOUTME: Provides singleton pool instance for all database queries

// Load environment variables (for dev server)
import 'dotenv/config';

import { Pool } from 'pg';
import type { PoolConfig } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create the PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const config: PoolConfig = {
      connectionString: databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error if connection takes longer than 10 seconds
    };

    pool = new Pool(config);

    // Log connection errors
    pool.on('error', (err) => {
      console.error('[Database] Unexpected error on idle client', err);
    });

    // Log when pool is created
    console.log('[Database] Connection pool created');
  }

  return pool;
}

/**
 * Close the connection pool
 * Call this during graceful shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Database] Connection pool closed');
  }
}

/**
 * Test the database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const testPool = getPool();
    const result = await testPool.query('SELECT NOW()');
    console.log('[Database] Connection test successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('[Database] Connection test failed:', error);
    return false;
  }
}

// Export the pool for direct access if needed
export const db = {
  get pool() {
    return getPool();
  },
  close: closePool,
  test: testConnection,
};
