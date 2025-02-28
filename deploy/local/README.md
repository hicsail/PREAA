
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

* `POSTRES_PASSWORD`: any generated string

#### config/.env.langfuse

* `ENCRYPTION_KEY`: openssl rand -hex 32
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
