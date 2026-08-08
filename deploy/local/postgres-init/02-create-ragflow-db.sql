-- Create rag_flow database if it doesn't exist
SELECT 'CREATE DATABASE rag_flow'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'rag_flow'
)\gexec

