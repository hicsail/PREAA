-- Fixed: CREATE DATABASE cannot run inside a DO $$ block in PostgreSQL.
-- Original used DO $$ BEGIN IF NOT EXISTS ... CREATE DATABASE n8n END $$
-- Replaced with \gexec which conditionally runs the CREATE DATABASE outside a function.
SELECT 'CREATE DATABASE n8n' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec
