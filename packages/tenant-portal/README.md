# tenant-portal

Merged replacement for `packages/admin` and `packages/embedded-chat`. Lets a
platform admin grant access to tenants, which provisions accounts in
**Langflow**, **Langfuse**, and **LiteLLM** plus a flow cloned from the
`ECE Chat` template. Tenants self-serve their embedded-chat configuration
via the same UI.

See [DESIGN.md](./DESIGN.md) for the architecture, decisions log, and
incremental commit plan.

## Status

Under active development. Current scope this branch ships:

- [x] Design doc + flow template seed
- [x] Package scaffold — builds and runs
- [x] Auth wiring (Keycloak + roles + route guards)
- [ ] Tenant model + CRUD
- [ ] Integration clients (Langflow / Langfuse / Keycloak admin / LiteLLM)
- [ ] Provisioning saga
- [ ] Admin UI
- [ ] Tenant dashboard
- [ ] Widget port + embed loader
- [ ] Compose + deploy
- [ ] Deprecate old `admin` and `embedded-chat` packages

## Local dev

```sh
npm install
cp .env.local.example .env.local   # then fill in NEXTAUTH_SECRET + KEYCLOAK_CLIENT_SECRET
npm run dev
```

Opens on `http://localhost:3000`. Without `.env.local` filled in, the
home page still renders but sign-in fails (Keycloak will reject an empty
client_secret).

Required Keycloak client config (for the `preaa-staging` client):

- Add `http://localhost:3000/api/auth/callback/keycloak` to **Valid
  Redirect URIs** for local dev (production URL for staging/prod).
- Confirm the client has a **realm roles** mapper (Client → Client
  Scopes → roles), so `realm_access.roles` is in the access token —
  otherwise the role-gated routes always 403.
- Create realm roles `embedded-chat-admin` and `embedded-chat-tenant`
  if they don't exist; assign at least one to a user you can test
  with.

## Required env (once auth + integrations are wired)

See `DESIGN.md` § Deployment for the full list. Notable new vars:

- `TENANT_PORTAL_ENCRYPTION_KEY` (32 bytes hex) — encrypts tenant secrets
  stored in Mongo.
- `TENANT_PORTAL_MONGO_URI` — Mongo connection string.
- `LANGFLOW_ADMIN_API_KEY` — long-lived Langflow admin token for
  provisioning.
- `LANGFUSE_ADMIN_API_KEY` — for creating projects.
- `KEYCLOAK_ADMIN_CLIENT_ID` + `KEYCLOAK_ADMIN_CLIENT_SECRET` — for
  Keycloak admin REST API (separate from the user-auth client).

Reuses existing stack env vars: `LITELLM_MASTER_KEY`, `KEYCLOAK_URL`,
`KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`,
`NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
