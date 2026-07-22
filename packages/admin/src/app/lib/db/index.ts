import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Shared Postgres connection + Drizzle instance for the admin app (replaces the
 * previous Mongoose/MongoDB connection). The app reuses the stack's existing
 * Postgres service; boot-time provisioning lives in src/instrumentation.ts.
 *
 * `db` is lazily initialized: the pool is created on first query, not at import
 * time. This keeps `next build` page-data collection (which imports route
 * modules without a DATABASE_URL) from failing, while still surfacing a clear
 * error the moment a query is actually attempted without configuration.
 */
type AdminDb = NodePgDatabase<typeof schema>;

declare global {
  var __adminPgPool: Pool | undefined;
  var __adminDb: AdminDb | undefined;
}

function init(): AdminDb {
  if (!global.__adminDb) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }
    global.__adminPgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    global.__adminDb = drizzle(global.__adminPgPool, { schema });
  }
  return global.__adminDb;
}

export const db = new Proxy({} as AdminDb, {
  get(_target, prop, receiver) {
    const real = init();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === 'function' ? value.bind(real) : value;
  }
});

export { schema };
