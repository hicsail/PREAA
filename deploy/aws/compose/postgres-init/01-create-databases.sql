-- Per-service databases the PREAA stack needs.
-- Run once by the official postgres image on first init (empty data dir), where
-- none exist yet. NOTE: CREATE DATABASE cannot run inside a DO/PL-pgSQL block
-- or a transaction, so these are plain top-level statements.
CREATE DATABASE litellm;
CREATE DATABASE langfuse;
CREATE DATABASE langflow;
CREATE DATABASE n8n;
CREATE DATABASE rag_flow;
CREATE DATABASE admin;
