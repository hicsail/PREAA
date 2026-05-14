# tenant-portal — Design

> A merged replacement for `packages/admin` and `packages/embedded-chat`. Lets
> a platform admin provision "embedded chat tenants" — each gets their own
> Langflow flow, Langfuse project, LiteLLM virtual key, and a configurable
> deep-chat widget they can drop into their site.

## Goals

1. **Admin** can grant access to a new tenant in one action and the system
   creates accounts in Langflow, Langfuse, LiteLLM and provisions a flow
   from the `ECE Chat` template.
2. **Tenant** can log in via Keycloak SSO and configure their own embedded
   chat (theme, welcome message, allowed origins, daily message cap), see
   their usage and traces, and copy an embed snippet.
3. **End users on a tenant's site** load the widget; it calls our backend
   for per-tenant config, then chats via LiteLLM → Langflow → LLM.

## Non-goals (out of scope for this package)

- Rewriting Langflow / LiteLLM / Langfuse functionality.
- Replacing the existing `chat-client` package (different use case — full
  LibreChat-like client; this widget is the small embeddable one).
- Custom billing or invoicing on top of LiteLLM's budgets (we'll just
  surface LiteLLM's existing budget/spend data).

## Architecture at a glance

```
                  ┌────────────────────────────────────────────────┐
                  │  Keycloak (preaa realm)                        │
                  │  realm-roles: admin, tenant                    │
                  └──────────────┬─────────────────────────────────┘
                                 │ OIDC
                                 ▼
        ┌─────────────────────────────────────────────────────────┐
        │  tenant-portal (Next.js, port 3018)               │
        │  ┌────────────────┐  ┌──────────────────────────────┐   │
        │  │ /admin/...     │  │ /dashboard/...               │   │
        │  │ (role: admin)  │  │ (role: tenant)               │   │
        │  └────────┬───────┘  └─────────────┬────────────────┘   │
        │           │                        │                    │
        │  ┌────────▼────────────────────────▼─────────────────┐  │
        │  │ ProvisioningService                              │  │
        │  └────────┬─────────┬──────────┬──────────┬─────────┘  │
        └───────────┼─────────┼──────────┼──────────┼────────────┘
                    │         │          │          │
                    ▼         ▼          ▼          ▼
                Keycloak   Langflow   Langfuse   LiteLLM
                (Admin     (/api/v1/  (/api/     (/key/
                 REST API)  users,     public/    generate)
                            flows)     projects)
                                                  │
                            ┌─────────────────────┘
                            │
                            ▼
                     MongoDB (Tenant model)
                     persisted IDs + config
```

## Tech stack — same as existing `admin/`

- **Next.js 15** (App Router) + **React 19**, single deployable.
- **TypeScript**, ESLint, Prettier.
- **next-auth** with `KeycloakProvider` — already proven in `packages/admin`.
- **MongoDB** via **Mongoose** for tenant state.
- **MUI v7** for components (matches `embedded-chat`'s design system, avoids
  pulling in `react-admin` which is overkill for what we need).
- **deep-chat-react** for the actual widget surface.
- **tsyringe** for dependency injection (matches existing `admin/` pattern).
- **openapi-ts** to regenerate the LiteLLM TypeScript client (copy
  `openapi-ts-litellm.config.ts` from `admin/` verbatim).

### What we're dropping from the existing admin

`react-admin` — it's a heavy CRUD-table framework that doesn't fit the
two-distinct-personas UX we need here. Replacing its handful of pages
with plain MUI + Next.js Server Components is a small net loss in
complexity.

## Auth + role model

Two realm roles in Keycloak (named after the product domain, not the
package, so they read sensibly in the Keycloak admin UI):

- `embedded-chat-admin` — full access to `/admin/*`.
- `embedded-chat-tenant` — access to their own `/dashboard/*`.

Server-side route guards check `session.user.realmRoles` (extracted from
the Keycloak access token in the `jwt` callback). Middleware redirects
based on roles.

The Keycloak client `preaa-staging` already exists. We add a new client
mapper that injects `realm_access.roles` into the ID/access token claim,
then map those into the next-auth session.

## Tenant provisioning sequence (admin clicks "Grant Access")

Wrapped in a saga-style coordinator so partial failures can be rolled
back or marked pending. Order matters because of FK-like dependencies:

```
1. CREATE keycloak_user (email + temp password + role: embedded-chat-tenant)
                                    ↓ keycloak_user_id
2. CREATE langflow_user (admin-token; sets is_active=true; superuser=false)
                                    ↓ langflow_user_id
3. CLONE Langflow flow from ECE Chat JSON template
   - replace top-level id with new uuid
   - set user_id = langflow_user_id
   - set endpoint_name = `${tenant_slug}-chat`
   - keep node-level credentials BLANK (tenant fills in their own
     LLM provider keys later via the dashboard)
                                    ↓ langflow_flow_id
4. CREATE langflow API key for langflow_user (POST /api/v1/api_key)
                                    ↓ langflow_api_key (stored encrypted)
5. CREATE langfuse project + user + project-scoped key pair
                                    ↓ langfuse_project_id, public/secret_key
6. CREATE litellm virtual key (POST /key/generate)
   - models: [the new langflow flow as a model alias]
   - max_budget: <admin-provided or default>
   - rpm_limit: <admin-provided or default>
                                    ↓ litellm_virtual_key
7. INSERT Tenant document in MongoDB linking all of the above + the
   initial embedded_chat config (defaults: theme, welcome, origin list).
8. EMAIL the tenant their Keycloak login link (Keycloak handles the
   password-reset flow on first login).
```

If any step fails, write the partial state with `status: 'failed'` and
the step name + error, surface it in the admin UI, and provide a
"retry" button (idempotent per step — each integration check first
whether the resource already exists).

## Data access for tenants — deep-link out, don't proxy

The architectural decision (you asked which is simpler):

| Approach | Pros | Cons |
|---|---|---|
| **Deep-link out** | Tenant gets a real user in LiteLLM Admin UI + Langfuse Project Settings. They see their own data, scoped naturally. Zero data-modeling on our side. | Each system has its own login session unless we wire SSO. |
| Pull data into our UI | Single unified UX. | We re-implement charts/views that LiteLLM and Langfuse already ship, and we have to know their schemas + cache appropriately. |

**Picking deep-link-out.** Each tenant gets accounts in all three systems
during provisioning. Our UI links to:

- `https://litellm-preaa-staging.sail.codes/ui` — LiteLLM Admin UI
- `https://langfuse-preaa-staging.sail.codes` — Langfuse project page

**SSO follow-up:** both LiteLLM (since 1.50) and Langfuse (since 2.x)
support OIDC. We'd wire Keycloak as their OIDC IdP so the deep-link is
a one-click no-second-login flow. That can be a separate PR; first
version can just give them their generated passwords.

## Tenant data model

```typescript
// src/app/lib/db/models/tenant.ts
interface ITenant {
  _id: ObjectId;
  keycloak_user_id: string;          // sub claim, the unique key
  email: string;
  display_name: string;
  status: 'pending' | 'active' | 'failed' | 'suspended';
  provisioning?: { step: string; error: string; at: Date };

  langflow: {
    user_id: string;
    flow_id: string;
    endpoint_name: string;
    api_key_encrypted: string;       // AES-256-GCM, key in env
  };

  langfuse: {
    project_id: string;
    public_key: string;              // pk-lf-..., safe to display
    secret_key_encrypted: string;
  };

  litellm: {
    virtual_key_id: string;          // litellm's internal ID
    virtual_key_encrypted: string;
    model_alias: string;             // user-friendly name
    max_budget?: number;
    rpm_limit?: number;
  };

  embedded_chat: {
    theme_color: string;             // hex
    title: string;
    welcome_message: string;
    placeholder_text: string;
    allowed_origins: string[];       // CORS check for widget endpoint
    daily_message_cap?: number;
  };

  created_at: Date;
  updated_at: Date;
  created_by: string;                // admin's keycloak_user_id
}
```

Secrets are encrypted at rest with a per-deploy key sourced from a new
`TENANT_PORTAL_ENCRYPTION_KEY` env var (32 bytes hex). Admin UI
shows them masked; tenants can reveal-and-copy with a button (which
triggers a server round-trip to decrypt).

## Embedded widget — served from this package

The widget lives at `/widget/[tenantId]` and is loaded by the tenant's
site via:

```html
<script src="https://embedded-chat.sail.codes/embed.js"
        data-tenant="<tenant-id>"></script>
```

`embed.js` reads the data-tenant attribute, fetches
`/api/widget-config/<tenant-id>` (public endpoint, CORS-checked against
`allowed_origins`), then injects an iframe pointing at
`/widget/<tenant-id>` with the right config in the URL hash.

Inside the iframe, the existing `deep-chat-react` widget from
`packages/embedded-chat/src/components/` is reused. Chat messages POST
to `litellm:4000/v1/chat/completions` with the tenant's virtual key
(stored client-side via the widget-config endpoint, scoped to allowed
origins).

## File layout

```
packages/tenant-portal/
├── DESIGN.md                         (this file)
├── README.md
├── Dockerfile
├── package.json
├── next.config.ts
├── openapi-ts-litellm.config.ts
├── tsconfig.json
├── public/
│   └── embed.js                      (the loader)
└── src/
    └── app/
        ├── layout.tsx
        ├── page.tsx                  (landing — sign-in)
        ├── admin/                    (role: embedded-chat-admin)
        │   ├── page.tsx
        │   └── tenants/
        │       ├── page.tsx
        │       ├── new/page.tsx
        │       └── [id]/page.tsx
        ├── dashboard/                (role: embedded-chat-tenant)
        │   ├── page.tsx
        │   ├── configure/page.tsx
        │   ├── usage/page.tsx        (link out to LiteLLM)
        │   └── traces/page.tsx       (link out to Langfuse)
        ├── widget/
        │   └── [tenantId]/page.tsx   (iframe-served widget)
        ├── api/
        │   ├── auth/[...nextauth]/route.ts
        │   ├── tenants/
        │   │   ├── route.ts
        │   │   └── [id]/route.ts
        │   └── widget-config/
        │       └── [tenantId]/route.ts   (public, CORS-gated)
        ├── lib/
        │   ├── auth/
        │   │   ├── config.ts
        │   │   └── roles.ts
        │   ├── clients/
        │   │   ├── keycloak-admin.ts
        │   │   ├── langflow.ts
        │   │   ├── langfuse.ts
        │   │   ├── litellm.ts
        │   │   └── client-litellm/   (generated)
        │   ├── db/
        │   │   ├── mongo.ts
        │   │   └── models/tenant.ts
        │   ├── services/
        │   │   ├── provisioning.service.ts
        │   │   ├── tenant.service.ts
        │   │   ├── flow-template.service.ts
        │   │   ├── crypto.service.ts
        │   │   └── templates/
        │   │       └── ece-chat.json     (server-bundled flow seed)
        │   └── container.ts
        └── components/
            ├── admin/
            │   ├── TenantsList.tsx
            │   ├── TenantForm.tsx
            │   └── ProvisioningStatus.tsx
            ├── tenant/
            │   ├── EmbedSnippet.tsx
            │   ├── ConfigForm.tsx
            │   └── DeepLinkCard.tsx
            └── widget/               (ported from packages/embedded-chat/src/components/)
                ├── ChatWidget.tsx
                ├── ExpandedChat.tsx
                └── MinimizedChat.tsx
```

## Deployment

- New Docker image `hicsail/preaa-tenant-portal:main`.
- New compose service in `deploy/portainer/docker-compose.yml` on port
  **3018** (3016=admin, 3017=embedded-chat — same range).
- Required new stack env vars:
  - `TENANT_PORTAL_ENCRYPTION_KEY` (32 bytes hex; generate locally,
    paste into Portainer stack env)
  - `TENANT_PORTAL_MONGO_URI` (Mongo connection string for a new
    `embedded_chat_admin` DB on the existing Mongo)
  - `LANGFLOW_ADMIN_TOKEN` — a long-lived admin token for the
    `administrator` user, so the package can call Langflow's admin API.
    (Alternative: store admin user/password and log in on each call —
    less efficient, simpler.)
  - `LANGFUSE_ADMIN_API_KEY` — admin scope, for creating projects.
  - `LITELLM_MASTER_KEY` (already exists; reuse).
  - `KEYCLOAK_ADMIN_CLIENT_ID` + `KEYCLOAK_ADMIN_CLIENT_SECRET` — for
    Keycloak admin REST API access (separate from the user-auth client).

## Incremental commits plan

I'll commit in chewable slices so review is easy:

| # | Commit | What lands |
|---|---|---|
| 1 | this DESIGN.md | nothing executable; gets your sign-off |
| 2 | scaffold | package.json, Dockerfile, next.config, tsconfig, layout.tsx, sign-in page; builds & runs but does nothing |
| 3 | auth wiring | next-auth + Keycloak config, role check middleware, sign-in/out flow |
| 4 | Tenant model + Mongo | schema, connection, CRUD service, /api/tenants/* routes (admin-gated) |
| 5 | Integration clients | langflow.ts, langfuse.ts, keycloak-admin.ts, regenerated litellm client; each individually testable |
| 6 | Flow template + clone logic | flow-template.service.ts, ece-chat.json copy under public/ |
| 7 | ProvisioningService | saga that calls 1–6 in order, retry-safe, surface status in DB |
| 8 | Admin UI | TenantsList, TenantForm (grant access), ProvisioningStatus |
| 9 | Tenant dashboard | ConfigForm, EmbedSnippet, DeepLinkCard |
| 10 | Widget port | move deep-chat components from embedded-chat; /widget/[tenantId] route; embed.js loader; /api/widget-config |
| 11 | Compose + deploy | add service to compose files; document new env vars in stack.env.sample |
| 12 | Deprecate old packages | once new package is verified in staging, delete packages/admin/ and packages/embedded-chat/, remove their compose entries |

## Decisions log

Architectural questions and what was decided. All revisitable in a
followup PR, but locks ongoing implementation here.

| # | Question | Decision | Decided by |
|---|---|---|---|
| 1 | Package name | `tenant-portal` | team |
| 2 | UI framework (react-admin vs plain Next.js + MUI) | Plain Next.js + MUI; drop react-admin | team |
| 3 | Tenant data access (deep-link vs proxy) | Deep-link out to LiteLLM and Langfuse UIs | team |
| 4 | Encryption at rest for tenant secrets | AES-256-GCM with per-deploy key in `TENANT_PORTAL_ENCRYPTION_KEY` env var | default |
| 5 | Langflow admin auth | Dedicated long-lived admin API key, stored in `LANGFLOW_ADMIN_API_KEY` env | default |
| 6 | Compose host port | 3018 (extends the 3016/3017 range) | default |

"default" = my recommended choice, not actively chosen by the team —
flag and push back any of these as the scaffold lands if you'd rather
go another way.
