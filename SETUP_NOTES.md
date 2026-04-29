# PREAA Local Development Notes

**Author:** Ariel Diaz
**Created:** February 17, 2026
**Last Updated:** February 25, 2026

> Personal setup notes and troubleshooting reference. Not for production use.

---

## Changelog
- **Apr 29, 2026** — Added health check dashboard to admin app, moved Keycloak into docker-compose with realm auto-import, removed unused admin-v2 and standalone health packages
- **Feb 25, 2026** — Added Keycloak authentication to embedded app, fixed realm-wide logout flow
- **Feb 17, 2026** — Initial setup, LangFlow DB fix, Groq integration, LangFuse + LiteLLM integration

---

## Environment Variables
- All passwords generated with: `openssl rand -hex 32`
- LangFuse keys stored in `.env.litellm`
- LiteLLM master key: [stored securely]
- Keycloak client secret stored in `packages/admin/.env`

---

## Ports Reference
| Service | URL |
|---------|-----|
| Admin App | http://localhost:3001 |
| Embedded App | http://localhost:5173 |
| Keycloak | http://localhost:8080 |
| LiteLLM | http://localhost:4000 |
| LibreChat | http://localhost:3080 |
| LangFuse | http://localhost:3000 |
| LangFlow | http://localhost:7860 |
| n8n | http://localhost:5678 |
| Grafana | http://localhost:3002 |

---

## Commands

### Full Stack
```bash
# Start
docker compose up -d

# Stop
docker compose down

# Force reload environment variables
docker compose up -d --force-recreate
```

### Keycloak
> **Note (Apr 29, 2026):** Keycloak is now managed via docker-compose with realm auto-import (`deploy/local/config/keycloak-realm.json`). Run `docker compose up -d keycloak` instead. The `docker run` command below is kept for reference only.

```bash
# Start (legacy — use docker compose up -d keycloak instead)
docker run --name keycloak-dev \
  -p 127.0.0.1:8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -v keycloak_data:/opt/keycloak/data \
  quay.io/keycloak/keycloak:26.5.4 start-dev --http-enabled=true

# Remove container (if name conflict)
docker rm keycloak-dev

# Reset all Keycloak data
docker volume rm keycloak_data
```

### Admin App
```bash
cd packages/admin
npm install
npm run dev        # http://localhost:3001
```

### Embedded App
```bash
cd packages/embedded-chat
npm install
npm run dev        # http://localhost:5173
```

---

## Keycloak Configuration

### Realm
- Name: `myrealm`

### Clients
| Client ID | Type | Redirect URI | Web Origin |
|-----------|------|-------------|------------|
| `admin-client` | Confidential (Client auth ON) | `http://localhost:3001/*` | `http://localhost:3001` |
| `embedded-client` | Public (Client auth OFF) | `http://localhost:5173/*` | `http://localhost:5173` |

> Copy `admin-client` secret from Credentials tab → paste into `packages/admin/.env`

### Users
- Create at least one user
- Credentials tab → set password → Temporary: OFF

---

## Step by Step Guides

### Setting Up Keycloak from Scratch
1. Remove old container if exists: `docker rm keycloak-dev`
2. Start Keycloak with volume (see command above)
3. Go to `http://localhost:8080/admin` → log in with `admin/admin`
4. Top left dropdown → Create Realm → name it `myrealm`
5. Clients → Create client → `admin-client`
   - Client authentication: ON
   - Redirect URI: `http://localhost:3001/*`
   - Web origins: `http://localhost:3001`
   - Save → Credentials tab → copy secret → paste into `packages/admin/.env`
6. Clients → Create client → `embedded-client`
   - Client authentication: OFF
   - Redirect URI: `http://localhost:5173/*`
   - Web origins: `http://localhost:5173`
7. Users → Create user → set username and email
   - Credentials tab → set password → Temporary: OFF

### Resetting Keycloak Entirely
1. `docker rm keycloak-dev`
2. `docker volume rm keycloak_data`
3. Follow setup guide above from scratch

---

## Issues Encountered

| # | Issue | Resolution |
|---|-------|------------|
| 1 | LangFlow database conflict | Used separate DB (`langflow_app`) |
| 2 | Docker env variables not reloading | Used `--force-recreate` flag |
| 3 | Embedded app publicly accessible | Added `keycloak-js` auth in `main.tsx` |
| 4 | Logout not invalidating Keycloak session | Updated admin logout to call Keycloak `end_session` endpoint |
| 5 | Keycloak Docker invalid reference format | Backslash line continuations breaking — run as single line |
| 6 | Keycloak 403 on login iframe | Disabled with `checkLoginIframe: false` in `keycloak.init()` |
| 7 | Embedded client 401 Unauthorized | Client was confidential — switched to public client |
| 8 | PostgreSQL port 5432 conflict with system postgres | Changed docker-compose port mapping to `5433:5432` |
| 9 | `CREATE DATABASE` failing in init scripts | `DO $$ BEGIN ... $$` blocks can't run DDL — replaced with `\gexec` pattern |
| 10 | postmaster.pid conflict on postgres start | Custom `entrypoint.sh` was re-running init scripts — removed entrypoint from docker-compose |
| 11 | Keycloak not in docker-compose | Added Keycloak service with realm auto-import via `deploy/local/config/keycloak-realm.json` |