# PREAA - Providing Reusable Equitable AI Access in Academia

PREAA (Providing Reusable Equitable AI Access in Academia) is a comprehensive open-source platform designed to democratize AI access within academic institutions. Our carefully curated stack of open-source technologies has been researched and selected to provide the most effective, scalable, and equitable AI solutions for educational environments.

## 🎯 Mission

Academic institutions face significant barriers when implementing AI technologies - from cost constraints to technical complexity. PREAA addresses these challenges by providing a battle-tested, open-source technology stack that enables institutions to deploy enterprise-grade AI capabilities without the typical financial and technical overhead.

## 🏗️ System Architecture

PREAA integrates several best-in-class open-source technologies to create a comprehensive AI platform:

### Core Components

- **LibreChat**: A ChatGPT-like all-in-one interface providing authentication, conversation history, and multi-model support
- **Open WebUI**: A Preplexity-like all-in-one chat frontend that allows for custom backends in python, modular user access managment, and text streaming
- **LiteLLM**: Unified proxy for LLM requests with rate limiting and standardized OpenAI-compatible interface
- **LangFlow**: Visual LLM workflow builder supporting multiple AI providers, agentic tools, RAG components, and custom integrations
- **LangFuse**: Comprehensive LLM analytics platform for token usage tracking, completion costs, and performance metrics

### Frontend Components

- **Embedded Chat Widget**: Lightweight, embeddable chat interface for seamless integration into existing web applications
- **Standalone Chat Client**: Full-featured React-based chat application with modern UI/UX
- **Admin Dashboard**: Next.js-based administrative interface for system management and configuration

### Backend Services

- **Helper Backend**: NestJS-based service providing request proxying capabilities and administrative functions
- **Custom Integrations**: 
  - LangFlow custom components for enhanced chat completion interfaces
  - LiteLLM custom providers for workflow integration

### Supporting Infrastructure

- **PostgreSQL**: Primary database for user data, conversation history, and analytics
- **MongoDB**: Document storage for LibreChat data
- **Redis**: Caching and session management
- **ClickHouse**: High-performance analytics database for LangFuse metrics
- **MinIO**: S3-compatible object storage
- **Prometheus & Grafana**: Monitoring and visualization stack

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Git
- OpenSSL (for key generation)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd PREAA
   ```

2. **Navigate to the deployment directory:**
   ```bash
   cd deploy/local
   ```

3. **Set up environment variables:**
   
   Copy the sample environment files and configure them:
   ```bash
   # Copy all sample environment files
   cp config/.env.clickhouse.sample config/.env.clickhouse
   cp config/.env.minio.sample config/.env.minio
   cp config/.env.redis.sample config/.env.redis
   cp config/.env.psql.sample config/.env.psql
   cp config/.env.langfuse.sample config/.env.langfuse
   cp config/.env.librechat.sample config/.env.librechat
   cp config/.env.litellm.sample config/.env.litellm
   cp config/.env.open-webui.sample config/.env.open-webui
   cp config/.env.librechat-metrics.sample config/.env.librechat-metrics
   cp config/.env.langflow.sample config/.env.langflow
   cp config/.env.ragflow.sample config/.env.ragflow
   cp config/.env.n8n.sample config/.env.n8n
   ```

   When filling in `config/.env.ragflow`, reuse the credentials you already set in `config/.env.minio` and `config/.env.redis` so RagFlow shares the existing MinIO and Redis instances.
4. **Configure required secrets:**

   **Database passwords** (generate secure passwords for each):
   - `config/.env.clickhouse`: Set `CLICKHOUSE_PASSWORD`
   - `config/.env.minio`: Set `MINIO_ROOT_PASSWORD`
   - `config/.env.redis`: Set `REDIS_PASSWORD`
   - `config/.env.psql`: Set `POSTGRES_PASSWORD`

   **LangFuse configuration** (`config/.env.langfuse`):
   ```bash
   # Generate encryption key
   ENCRYPTION_KEY=$(openssl rand -hex 32)
   
   # Set the following variables:
   # SALT=<any secure string>
   # CLICKHOUSE_PASSWORD=<matching value from .env.clickhouse>
   # LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=<matching MINIO_ROOT_PASSWORD>
   # LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=<matching MINIO_ROOT_PASSWORD>
   # REDIS_AUTH=<matching REDIS_PASSWORD>
   # DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@postgres:5432/postgres
   ```

   **LibreChat configuration** (`config/.env.librechat`):
   ```bash
   # Generate LibreChat secrets using their generator: https://www.librechat.ai/toolkit/creds_generator
   # Set: CREDS_KEY, CREDS_IV, JWT_SECRET, JWT_REFRESH_SECRET
   # Set: LITELLM_API_KEY=<matching LITELLM_MASTER_KEY from .env.litellm>
   ```

   **LiteLLM configuration** (`config/.env.litellm`):
   ```bash
   # Set: LITELLM_MASTER_KEY=<any secure string>
   # Set: DATABASE_URL=postgresql://postgres:<POSTGRES_PASSWORD>@postgres:5432/postgres
   ```

5. **Start the platform:**
   ```bash
   docker-compose up -d
   ```

6. **Access the services:**
   - LibreChat (Chat Interface): http://localhost:3080
   - Open WebUI (Chat Interface): http://localhost:7600
   - LangFuse (Analytics): http://localhost:3000
   - LiteLLM (Proxy Management): http://localhost:4000
   - LangFlow (Workflow Builder): http://localhost:7860
   - n8n (Workflow Builder): http://localhost:5678
   - Grafana (Monitoring): http://localhost:3002
   - Admin Dashboard: *Configure separately in packages/admin*

### Post-Installation Configuration

#### LangFuse + LiteLLM Integration

1. Create a LangFuse account at http://localhost:3000
2. Set up a new organization and project
3. Generate API keys (public and private)
4. Access LiteLLM at http://localhost:4000/ui
5. Login with username `admin` and your `LITELLM_MASTER_KEY` as password
6. Under "Logging & Alerts", add a LangFuse callback
7. Enter your LangFuse API keys and set host to `http://langfuse-web:3000`
8. Test the integration

### Open WebUI + Custom Provider Integrations

1. Create an Open WebUI account at http://localhost:7600 (Your first registered account is always an admin).
2. Navigate to the **Admin Panel** in the bottom left corner after clicking on your username.
   - Here, you can manage users, create groups, and customize settings for your specific use case.
3. Open the **Functions** tab and click either **New Function** or **Import**.
   - Functions can serve as custom models, enabling integration with proxies like LiteLLM and flow-builders like n8n and Langflow.
   - Clicking **New Function** allows you to use functions hosted online or create your own.
   - One function provided by default integrates with streaming from n8n. Import it from the relative path `packages/open-webui/function-n8n_streaming.json`.
4. Activate any desired functions and configure them with the appropriate values.

*For more information on developing functions, visit the official documentation at [Open WebUI](https://docs.openwebui.com/features/plugin/functions/pipe).*

## 🔧 Development

### Frontend Development

Each frontend package can be developed independently:

```bash
# Embedded Chat Widget
cd packages/embedded-chat
npm install
npm run dev

# Admin Dashboard
cd packages/admin
npm install
npm run dev:https  # Note: Uses HTTPS for functionality

# Chat Client
cd packages/chat-client
npm install
npm run dev
```

### Backend Development

```bash
# Helper Backend (NestJS)
cd packages/helper-backend
npm install
npm run start:dev
```

### Custom Components

**LangFlow Components:**
```bash
cd packages/langflow
pip install -r requirements.txt
# Restart LangFlow container to see changes
```

**LiteLLM Custom Providers:**
```bash
cd packages/litellm
pip install -r requirements.txt
# Restart LiteLLM container to see changes
```

## 📊 Monitoring and Analytics

The platform includes comprehensive monitoring capabilities:

- **LangFuse**: Track LLM usage, costs, and performance metrics
- **Prometheus**: System metrics collection
- **Grafana**: Visualization and dashboards
- **LibreChat Metrics**: Specialized metrics exporter for LibreChat

## 🔐 Security Considerations

- All services run in isolated Docker containers
- Environment variables store sensitive configuration
- Database connections use authentication
- API keys provide service-to-service authentication
- HTTPS support available for production deployments

## 🤝 Contributing

We welcome contributions from the academic community! Please see our contribution guidelines and feel free to:

- Report issues or bugs
- Suggest new features
- Submit pull requests
- Share your deployment experiences

## 📄 License

This project is licensed under the [LICENSE](LICENSE) file in the repository.

## 🆘 Support

For support, please:
1. Check the individual component documentation in each package
2. Review the deployment configuration files
3. Open an issue in the repository
4. Consult the upstream documentation for each integrated technology

---

**PREAA** - Empowering academic institutions with accessible, equitable AI technology.
