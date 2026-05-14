import { Pool, PoolConfig } from 'pg';

/**
 * Singleton Pg connection pool with HMR-safe caching, plus ensureSchema()
 * which idempotently creates the tenants table + trigger on first use.
 *
 * The Pool lives on globalThis so Next.js dev-mode hot reload doesn't open
 * a new pool every time a file changes.
 */

declare global {
  // eslint-disable-next-line no-var
  var _tenantPortalPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _tenantPortalSchemaEnsured: boolean | undefined;
}

function buildPool(): Pool {
  const url = process.env.TENANT_PORTAL_DATABASE_URL;
  if (!url) {
    throw new Error(
      'TENANT_PORTAL_DATABASE_URL is not set. ' +
        'For local dev: postgres://psql:<pw>@localhost:5432/tenant_portal. ' +
        'For staging/prod: set in the Portainer stack env.',
    );
  }
  const config: PoolConfig = {
    connectionString: url,
    max: 10, // generous for an admin tool that serves <1 rps
    idleTimeoutMillis: 30_000,
  };
  return new Pool(config);
}

export function getPool(): Pool {
  if (!global._tenantPortalPgPool) {
    global._tenantPortalPgPool = buildPool();
  }
  return global._tenantPortalPgPool;
}

/**
 * The schema as a single idempotent SQL block. Kept in-source so it ships
 * with the bundle (Next.js doesn't load .sql files at runtime by default).
 * The exact same SQL is also at src/app/lib/db/migrations/0001_init.sql,
 * which is the canonical reference for manual psql runs.
 *
 * CRITICAL: when changing this string, keep it byte-equivalent to the .sql
 * file. The file is the source of truth; this string is the bundled copy.
 */
const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_user_id  text        NOT NULL UNIQUE,
    email             text        NOT NULL,
    display_name      text        NOT NULL,
    status            text        NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'failed', 'suspended')),
    provisioning      jsonb,
    langflow          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    langfuse          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    litellm           jsonb       NOT NULL DEFAULT '{}'::jsonb,
    embedded_chat     jsonb       NOT NULL DEFAULT '{}'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    created_by        text        NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_email  ON tenants (email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);

CREATE OR REPLACE FUNCTION tenant_portal_set_updated_at()
RETURNS trigger AS $func$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON tenants;
CREATE TRIGGER tenants_set_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION tenant_portal_set_updated_at();
`;

/**
 * Runs the migration SQL exactly once per process. Idempotent (every
 * statement is CREATE ... IF NOT EXISTS / CREATE OR REPLACE / DROP IF
 * EXISTS), so accidentally calling it twice is fine -- but we still gate
 * with a global flag to avoid the round trip on every query.
 */
export async function ensureSchema(): Promise<void> {
  if (global._tenantPortalSchemaEnsured) return;
  await getPool().query(SCHEMA_SQL);
  global._tenantPortalSchemaEnsured = true;
}
