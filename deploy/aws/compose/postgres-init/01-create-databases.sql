-- Create the per-service databases the PREAA stack needs (idempotent).
-- The shared Postgres user (POSTGRES_USER, default psql) owns them all.
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'litellm')  THEN CREATE DATABASE litellm;  END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'langfuse') THEN CREATE DATABASE langfuse; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'langflow') THEN CREATE DATABASE langflow; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')      THEN CREATE DATABASE n8n;      END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rag_flow') THEN CREATE DATABASE rag_flow; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'admin')    THEN CREATE DATABASE admin;    END IF; END $$;
