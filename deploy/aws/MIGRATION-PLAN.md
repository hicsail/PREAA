# PREAA → AWS Migration Plan

Status: **draft for review** · Owner: platform · Target: move PREAA off the
NERC Portainer node onto dedicated AWS resources.

This is a planning document. No infrastructure is created by merging it. It
exists to get alignment on architecture and sequencing before we write any
Terraform.

---

## 1. Goals & principles

1. **Get PREAA off shared NERC infrastructure** onto dedicated, right-sized,
   reproducible AWS resources.
2. **Stay portable / open-source.** PREAA's mission is equitable, reproducible
   AI access — an institution must be able to run it on their own hardware or
   any cloud. So we **do not** adopt AWS-managed data services (Aurora,
   DocumentDB, OpenSearch, ElastiCache). Every datastore stays self-hosted in
   compose. Object storage stays MinIO (open-source, S3-API-compatible), which
   an AWS deployment *may optionally* point at real S3 via config — no lock-in.
3. **Infrastructure as code.** All AWS resources in Terraform, state in S3
   (matches the account's existing `*-terraform-state` pattern).
4. **Phased, low-risk.** Staging first, validate end-to-end, then clone for
   prod, then decommission NERC. NERC data is untouched (read-only dumps)
   during the window so rollback is a DNS flip.
5. **Fix the secrets story.** Move off plaintext Portainer env to AWS SSM
   Parameter Store.

## 2. Current state (source of truth)

- **Where:** NERC Portainer environment "NERC 1", compose project
  `preaa-staging`, deployed from `deploy/portainer/docker-compose.yml`.
- **Public:** `*-preaa-staging.sail.codes` (DNS at Cloudflare — there is **no
  Route53 zone** in the AWS account, so DNS cutover happens in Cloudflare).
- **Auth today:** admin authenticates to an **external, shared** Keycloak at
  `damplab-keycloak.sail.codes`, realm `preaa`. We will bring our own Keycloak
  into the AWS stack and migrate that realm.
- **Stack (post-cleanup):** Open WebUI, LangFlow, n8n, RagFlow, LiteLLM,
  Langfuse (+ ClickHouse, Redis, MinIO, Postgres), admin, chat-client,
  embedded-chat. Datastore floor: **Postgres, Redis, ClickHouse,
  Elasticsearch, MinIO**.

## 3. AWS account context

- Account `135854645631`, region **us-east-1** (shared HICSAIL account).
- Team pattern is **Portainer + docker-compose on EC2** (14 instances, only one
  ECS cluster, zero EKS). Terraform already used by some projects.
- No ECR (images from Docker Hub `hicsail/*`); no Route53 zones.

## 4. Target architecture

```
                    Cloudflare DNS  (*-preaa.sail.codes)
                            │  (A record → Elastic IP)
                            ▼
        ┌──────────────────────────────────────────────┐
        │  Dedicated VPC (10.20.0.0/16)  us-east-1       │
        │  ┌──────────────────────────────────────────┐ │
        │  │  Public subnet                            │ │
        │  │   EC2 (Elastic IP)                        │ │
        │  │    reverse proxy (TLS) ──► compose stack: │ │
        │  │      open-webui, langflow, n8n, ragflow,  │ │
        │  │      litellm, langfuse(+worker), admin,   │ │
        │  │      chat-client, embedded-chat, keycloak,│ │
        │  │      postgres, redis, clickhouse, minio,  │ │
        │  │      elasticsearch                        │ │
        │  │    portainer agent (mgmt)                 │ │
        │  │    EBS gp3 data volume (/data)            │ │
        │  └──────────────────────────────────────────┘ │
        │  SSM Parameter Store (secrets)  S3 (backups)   │
        └──────────────────────────────────────────────┘
```

### 4.1 Compute
- Single dedicated **EC2** instance per environment running the existing
  docker-compose stack. Managed via a **Portainer agent** added to the team's
  central Portainer (matches current ops); the in-repo compose stays the source
  of truth.
- **Sizing (staging):** the stack needs ~16–24 GB RAM (Elasticsearch alone is
  pinned to 4 GB; ClickHouse + RagFlow + Langfuse are the next heaviest).
  Recommend **`m7i.2xlarge` (8 vCPU / 32 GB)** for staging with headroom.
  → *Decision D1: confirm instance size; prod may want more or a split.*
- **Storage:** root EBS + a dedicated **gp3 data volume (~100 GB, resizable)**
  mounted at `/data` holding all docker volumes (ES, ClickHouse, Postgres,
  MinIO, n8n, langflow). Keeps data separable from the instance.

### 4.2 Networking
- New VPC, one public subnet, Internet Gateway, EC2 with an **Elastic IP**.
- **Security groups:** 443/80 from anywhere (behind Cloudflare — optionally
  restrict to Cloudflare IP ranges), Portainer agent port from the Portainer
  server only, SSH restricted to known admin IPs (or SSM Session Manager, no
  open SSH — preferred).

### 4.3 Ingress / TLS
- **Recommended:** an in-stack reverse proxy (**Caddy** for auto-Let's-Encrypt
  simplicity, or **nginx-proxy-manager** which the team already runs on the
  grist/GDP stack) terminating TLS per subdomain, with Cloudflare in front.
  Portable, cloud-agnostic, matches the mission.
- **Alternative:** AWS ALB + ACM. More AWS-native, auto-renewing certs, but
  couples to AWS and adds per-service target groups to Terraform.
  → *Decision D2: Caddy vs nginx-proxy-manager vs ALB+ACM.*

### 4.4 Secrets
- **SSM Parameter Store** (SecureString) holds every value currently in
  `stack.env` (DB passwords, API keys, `ADMIN_ENCRYPTION_KEY`, Keycloak client
  secret, n8n/langflow encryption keys). Values are entered out-of-band (never
  committed). At deploy, a small bootstrap step renders `stack.env` from SSM (or
  the instance role reads them). Instance gets an IAM role with scoped SSM read.

### 4.5 Object storage
- MinIO stays as the default. On AWS we *may* point Langfuse + RagFlow at **S3**
  (same S3 API) via config + an IAM role instead of running MinIO — optional,
  per-deployment, no code change. → *Decision D3: MinIO-in-stack vs S3 on AWS.*

## 5. Terraform layout

```
deploy/aws/terraform/
  modules/
    preaa-stack/
      vpc.tf              # vpc, subnet, igw, route table
      security-groups.tf
      ec2.tf              # instance, EIP, EBS data volume, user_data
      iam.tf              # instance role: SSM read, S3, CloudWatch logs
      ssm.tf              # SecureString param *declarations* (values out-of-band)
      s3.tf               # optional: object storage + backups bucket
      variables.tf
      outputs.tf          # eip, instance_id
  envs/
    staging/
      main.tf             # instantiates module with staging vars
      backend.tf          # s3 state: preaa-terraform-state/staging
    prod/
      main.tf
      backend.tf          # s3 state: preaa-terraform-state/prod
```

- **State:** S3 bucket `preaa-terraform-state` (to create), native S3 locking.
- `user_data` installs Docker + Docker Compose + the Portainer agent, mounts the
  gp3 data volume at `/data`, and pulls the stack. Actual `docker compose up`
  is driven by Portainer (or a systemd unit if we skip Portainer).
  → *Decision D4: Portainer-managed vs plain compose + systemd.*

## 6. Data migration runbook (staging cutover)

Performed during a maintenance window. NERC stays read-only source; nothing on
NERC is mutated.

| Store | Method | Notes / risk |
|---|---|---|
| **Postgres** (litellm, langfuse, langflow, n8n, rag_flow) | `pg_dump` per DB → restore on AWS | Straightforward. Preserve roles/passwords. |
| **admin proxies** | Export Mongo `deepchatproxies` from NERC → transform → insert into new `deepchat_proxies` Postgres table | One-time script. Keys are plaintext in Mongo; **encrypt on insert** with the new `ADMIN_ENCRYPTION_KEY`. Small dataset. |
| **MinIO** | `mc mirror` NERC → AWS (langfuse + ragflow buckets) | Or skip if switching to S3 (D3). |
| **ClickHouse** (Langfuse traces) | `clickhouse-backup` or Langfuse export | Non-trivial. → *Decision D5: migrate history vs start fresh on staging.* |
| **Elasticsearch** (RagFlow indices) | ES snapshot → restore, or re-ingest from MinIO source docs | Snapshot/restore cleanest. → *Decision D5 applies here too.* |
| **Redis** | none | Ephemeral cache/queues. |
| **n8n** | Postgres (if DB-backed) + carry `N8N_ENCRYPTION_KEY` | **Critical:** without the same encryption key, stored credentials break. |
| **LangFlow** | `langflow` Postgres DB + `LANGFLOW_SECRET_KEY` | Same: secret key must match or encrypted creds break. |

### Keycloak realm migration
- Export the `preaa` realm from `damplab-keycloak` (`kc.sh export` or Admin API):
  clients, roles, and (if we own them) users.
- Import into the new in-stack Keycloak; repoint every service's OIDC issuer +
  `KEYCLOAK_URL` to the new host.
- → *Decision D6: migrate users with password hashes (full export) vs
  re-invite / keep federating to damplab for a transition period.*

## 7. Cutover sequence

1. `terraform apply` staging infra (VPC, EC2, EIP, SSM, IAM).
2. Bootstrap: Docker + Portainer agent + data volume; bring the stack up empty.
3. Populate SSM secrets; render `stack.env`.
4. Maintenance window: run the data migration runbook (§6).
5. Migrate the Keycloak realm; repoint OIDC.
6. Smoke test end-to-end (each UI, a chat round-trip, a trace in Langfuse, a
   RagFlow query, admin proxy CRUD, SSO login).
7. Flip Cloudflare DNS → new Elastic IP (low TTL beforehand).
8. Monitor; keep NERC running as hot fallback for N days.
9. Decommission the NERC `preaa-staging` stack.

**Rollback:** flip DNS back to NERC. Data on NERC is unchanged (dumps were
read-only), so no data loss.

## 8. Prod

Same module, `envs/prod`, its own EC2 + EIP + state. Clone once staging is
validated. Revisit sizing (D1) and whether to split heavy stateful services
(ES/ClickHouse) onto a second node under prod load. New domain scheme
(`*-preaa.sail.codes`?) decided here. → *Decision D7.*

## 9. Rough cost (staging, on-demand)

| Item | Est. / mo |
|---|---|
| EC2 `m7i.2xlarge` | ~$290 (less with Savings Plan / RI) |
| EBS gp3 100 GB | ~$8 |
| Elastic IP (attached) | $0 |
| S3 (backups/state) | ~$1–5 |
| Data transfer | minor |
| **Total** | **~$300/mo** |

Prod comparable or larger.

## 10. Open decisions (need sign-off before Terraform)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Staging instance size | `m7i.2xlarge` (8/32) |
| D2 | Ingress/TLS | In-stack Caddy (portable) |
| D3 | Object storage on AWS | Keep MinIO in-stack (portability) |
| D4 | Orchestration on the box | Portainer agent (matches ops) |
| D5 | ClickHouse + ES history | Start fresh on **staging**; migrate for prod |
| D6 | Keycloak users | Full realm export incl. users |
| D7 | Prod domain scheme | Decide at prod phase |

## 11. Out of scope (tracked elsewhere)
- RagFlow ↔ Keycloak SSO mechanism — spike on branch
  `spike/keycloak-shared-auth` (`deploy/local/SPIKE-keycloak-auth.md`).
- n8n SSO (community edition has no OIDC) — deferred.
- Pre-existing prod `stack.env` quirks (duplicate `DATABASE_URL`, NextAuth
  coupling).
