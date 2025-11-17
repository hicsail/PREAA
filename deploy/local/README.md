
## Manual Steps

### Environment Variables

Each component has its own env file to make it easier to identify where to put certain settings.
Copy each sample to remove the `.sample` extension (ie `config/.env.clickhouse.sample` -> `config/.env.clickhouse`)
then follow the instructions below to find each secret that needs to be added in.

#### config/.env.clickhouse

* `CLICKHOUSE_PASSWORD`: any generated string

#### config/.env.minio

* `MINIO_ROOT_PASSWORD`: any generated string

#### config/.env.redis

* `REDIS_PASSWORD`: any generated string

#### config/.env.psql

* `POSTGRES_PASSWORD`: any generated string

#### config/.env.langfuse

* `ENCRYPTION_KEY`: openssl rand -hex 32
* `SALT`: any generated string
* `CLICKHOUSE_PASSWORD`: matching `CLICKHOUSE_PASSWORD` from `.env.clickhouse`
* `LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY`: matching `MINIO_ROOT_PASSWORD` from `.env.minio`
* `LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY`: matching `MINIO_ROOT_PASSWORD` from `.env.minio`
* `REDIS_AUTH`: matching `REDIS_PASSWORD` from `.env.redis`
* `DATABASE_URL`: updated to match from `.env.psql`

#### config/.env.librechat

* `LITELLM_API_KEY`: matching `LITELLM_MASTER_KEY` from `.env.litellm`
* `CREDS_KEY`: see [LibreChat provided generator](https://www.librechat.ai/toolkit/creds_generator)
* `CREDS_IV`: see [LibreChat provided generator](https://www.librechat.ai/toolkit/creds_generator)
* `JWT_SECRET`: see [LibreChat provided generator](https://www.librechat.ai/toolkit/creds_generator)
* `JWT_REFRESH_SECRET`: see [LibreChat provided generator](https://www.librechat.ai/toolkit/creds_generator)

#### config/.env.litellm 

* `LITELLM_MASTER_KEY`: any generated string
* `DATABASE_URL`: updated to match from `.env.psql`

#### config/.env.ragflow

**Required:**
* `ELASTIC_PASSWORD`: secure password for the dedicated Elasticsearch cluster
* `POSTGRES_PASSWORD`: reuse the value from `config/.env.psql` (must match the value set in `config/.env.psql`)
* `POSTGRES_USER`: reuse the value from `config/.env.psql` (must match `POSTGRES_USER`, typically `psql`)
* `MINIO_USER` / `MINIO_PASSWORD`: set these to the values of `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` from `config/.env.minio`
* `REDIS_PASSWORD`: reuse the value from `config/.env.redis`

**Optional Service Control:**
* `ENABLE_WEBSERVER`: enable web server (nginx + API), default `1` (enabled)
* `ENABLE_TASKEXECUTOR`: enable background task workers, default `1` (enabled). Set to `0` to disable for memory optimization
* `ENABLE_DATASYNC`: enable data source sync workers, default `0` (disabled)
* `ENABLE_MCP_SERVER`: enable MCP server, default `0` (disabled)
* `ENABLE_ADMIN_SERVER`: enable admin server, default `0` (disabled)
* `WORKERS`: number of task executor workers, default `1`

**Optional Configuration:**
* Update `MINIO_HOST` / `REDIS_HOST` / `POSTGRES_HOST` only if you change the shared service names
* `USE_DOCLING`: enable docling document processing, default `false`
* `USE_MINERU`: enable mineru PDF extraction, default `false`
* **Embedding Models**: By default, RagFlow will use external embedding providers (OpenAI, Azure, etc.) configured in the UI. If you prefer self-hosted embeddings, uncomment the TEI variables in `.env.ragflow` and add the `ragflow-tei` service to docker-compose.yml

### RagFlow Setup

1. Ensure the host satisfies the RagFlow prerequisites (Docker ≥ 24, Docker Compose ≥ 2.26.1, 4 CPU cores, 16 GB RAM, 50 GB disk).
2. Set `vm.max_map_count` to at least `262144` before starting Elasticsearch. On macOS with Docker Desktop, run:
   ```bash
   docker run --rm --privileged --pid=host alpine sysctl -w vm.max_map_count=262144
   ```
   Repeat after reboot or automate it per the RagFlow docs.
3. Copy `config/.env.ragflow.sample` to `config/.env.ragflow` and align the Postgres, MinIO, and Redis entries with the existing shared services.
4. (Optional) If you plan to use a private Hugging Face mirror, set `HF_ENDPOINT` in `config/.env.ragflow`.
5. Launch the stack with `npm run dev:https` or `docker compose -f deploy/local/docker-compose.yml up -d`.
6. The `rag_flow` database will be automatically created in Postgres by the shared Postgres service's custom entrypoint.
7. Access the RagFlow UI at http://localhost:7080 once migrations finish. The admin endpoint is proxied on port `9381`.

### LangFuse + LiteLLM Setup

1. Create a new account on LangFuse at http://localhost:3000/
2. Go through the steps to make a new organization and project
3. Create a new set of API keys for the project making sure to copy the public and private keys
4. Navigate to LiteLLM at http://localhost:4000/ui
5. Signin using user name `admin` and the password being the `LITELLM_MASTER_KEY`
6. Under "Logging & Alerts" select "Add Callback"
7. Select Langfuse and enter the private/public keys collected previously
8. After creating the callback, edit the callback and add the host http://langfuse-web:3000/
9. Press "Test Callback" and verify the request is visible in LangFuse
