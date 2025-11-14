-- Create n8n database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n') THEN
        CREATE DATABASE n8n;
    END IF;
END
$$;

