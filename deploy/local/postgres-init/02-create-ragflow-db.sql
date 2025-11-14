-- Create rag_flow database if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rag_flow') THEN
        CREATE DATABASE rag_flow;
    END IF;
END
$$;

