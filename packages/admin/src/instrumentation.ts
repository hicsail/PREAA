/**
 * Boot-time provisioning for the admin app's Postgres storage.
 *
 * Replaces the previous Mongoose connection. Self-contained and idempotent so
 * it works uniformly across local/portainer/portainer-prod and managed
 * Postgres, with no reliance on postgres-init scripts:
 *   1. ensure the target database exists (create it via the maintenance
 *      `postgres` database if missing)
 *   2. ensure the `deepchat_proxies` table exists
 */
export async function register() {
  // Only run in the Node.js server runtime (not edge).
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { Pool } = await import('pg');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  await ensureDatabaseExists(Pool, databaseUrl);

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deepchat_proxies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        model_name text NOT NULL,
        api_key text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  } finally {
    await pool.end();
  }
}

/**
 * Create the database named in DATABASE_URL if it does not already exist, by
 * connecting to the maintenance `postgres` database. No-op if it exists.
 */
async function ensureDatabaseExists(Pool: typeof import('pg').Pool, databaseUrl: string) {
  const url = new URL(databaseUrl);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!dbName || dbName === 'postgres') {
    return; // using the maintenance DB directly; nothing to create
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const pool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const { rowCount } = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (!rowCount) {
      // Database names can't be parameterized; dbName comes from our own config.
      await pool.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    }
  } catch (error: any) {
    // 42P04 = duplicate_database (created concurrently) — safe to ignore.
    if (error?.code !== '42P04') {
      throw error;
    }
  } finally {
    await pool.end();
  }
}
