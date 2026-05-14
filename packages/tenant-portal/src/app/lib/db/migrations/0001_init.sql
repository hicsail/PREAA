-- Initial schema for tenant-portal.
--
-- Idempotent (uses CREATE ... IF NOT EXISTS) so it's safe to apply on every
-- boot via ensureSchema() in pg.ts. Run by hand if you'd rather:
--   psql "$TENANT_PORTAL_DATABASE_URL" -f 0001_init.sql

-- Required for gen_random_uuid() on older Postgres (pg13+ has it built-in
-- via pgcrypto; pg17+ has it native). Cheap no-op if already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tenants (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_user_id  text        NOT NULL UNIQUE,
    email             text        NOT NULL,
    display_name      text        NOT NULL,

    status            text        NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'failed', 'suspended')),

    -- Last failed provisioning step, if any. NULL on success.
    -- Shape: {"step": "...", "error": "...", "at": "ISO timestamp"}
    provisioning      jsonb,

    -- Integration ids + encrypted secrets, per-system. Encrypted blobs
    -- live as nested {ciphertext, iv, tag} subobjects inside these
    -- columns; see src/app/lib/services/crypto.service.ts.
    langflow          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    langfuse          jsonb       NOT NULL DEFAULT '{}'::jsonb,
    litellm           jsonb       NOT NULL DEFAULT '{}'::jsonb,

    -- Tenant-editable widget config (theme, welcome message, allowed
    -- origins, etc.). See EmbeddedChatFields in db/types.ts.
    embedded_chat     jsonb       NOT NULL DEFAULT '{}'::jsonb,

    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    created_by        text        NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tenants_email  ON tenants (email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants (status);

-- Auto-update updated_at on every UPDATE. Simpler than threading it
-- through every SQL statement in the app.
CREATE OR REPLACE FUNCTION tenant_portal_set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON tenants;
CREATE TRIGGER tenants_set_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION tenant_portal_set_updated_at();
