-- Fixed: CREATE DATABASE cannot run inside a DO $$ block in PostgreSQL.
-- Original used DO $$ BEGIN IF NOT EXISTS ... CREATE DATABASE rag_flow END $$
-- Replaced with \gexec which conditionally runs the CREATE DATABASE outside a function.
SELECT 'CREATE DATABASE rag_flow' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rag_flow')\gexec
