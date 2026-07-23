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
- **Sizing (staging):** **`m7i-flex.xlarge` (4 vCPU / 16 GB)** — cost-optimized
  (~$138/mo, roughly half the 32 GB option). The **flex family** fits the
  bursty workload (mostly idle with spikes during RAG parsing / LLM proxying;
  flex gives burstable CPU at ~5% lower cost). 16 GB is adequate because this
  config is lighter than it looks: Elasticsearch runs a **512 MB heap** (not
  its 4 GB cap), and RagFlow has docling/mineru **off** with **external**
  embeddings, so realistic idle footprint is ~8–13 GB.
  - **RAM safety nets** (RAM, unlike CPU, is not reclaimed when a service is
    idle): (1) **~8 GB swap** on the EBS data volume so a spike degrades to
    slow rather than OOM-killing a container; (2) **per-container `mem_limit`s**
    so no single service starves the rest; (3) resize is a 2-min
    stop/change-type/start — bump to `m7i-flex.2xlarge` (32 GB) if CloudWatch
    shows sustained memory pressure, no rebuild.
  - **Right-size from data:** treat 16 GB as the starting point; review
    CloudWatch memory/CPU under real use and adjust. If sustained (not bursty)
    heavy RAG parsing appears, flex CPU may throttle → switch to plain
    `m7i.xlarge`/`m7i.2xlarge` (same trivial resize).
  - → *Decision D1: **RESOLVED** — start on `m7i-flex.xlarge`; prod sized
    separately (§8).*
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
- **Decision D2: RESOLVED — in-stack `nginx-proxy-manager`** (the team already
  runs it on the grist/GDP stack), terminating TLS per subdomain with
  Let's Encrypt, Cloudflare in front. Portable, cloud-agnostic, matches
  existing ops. (AWS ALB+ACM considered and set aside to avoid AWS coupling.)

### 4.4 Secrets
- **SSM Parameter Store** (SecureString) holds every value currently in
  `stack.env` (DB passwords, API keys, `ADMIN_ENCRYPTION_KEY`, Keycloak client
  secret, n8n/langflow encryption keys). Values are entered out-of-band (never
  committed). At deploy, a small bootstrap step renders `stack.env` from SSM (or
  the instance role reads them). Instance gets an IAM role with scoped SSM read.

### 4.5 Object storage
- **Decision D3: RESOLVED — keep MinIO in-stack** (portability; no AWS lock-in).
  Because MinIO speaks the S3 API, a future deployment can still repoint
  Langfuse + RagFlow at real S3 via config + an IAM role with no code change —
  kept as an option, not adopted now.

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
  is driven by Portainer.
  → *Decision D4: RESOLVED — Portainer agent (matches existing team ops;
  in-repo compose remains the source of truth).*

## 6. Data migration runbook (staging cutover)

Performed during a maintenance window. NERC stays read-only source; nothing on
NERC is mutated.

| Store | Method | Notes / risk |
|---|---|---|
| **Postgres** (litellm, langfuse, langflow, n8n, rag_flow) | `pg_dump` per DB → restore on AWS | Straightforward. Preserve roles/passwords. |
| **admin proxies** | Export Mongo `deepchatproxies` from NERC → transform → insert into new `deepchat_proxies` Postgres table | One-time script. Keys are plaintext in Mongo; **encrypt on insert** with the new `ADMIN_ENCRYPTION_KEY`. Small dataset. |
| **MinIO** | `mc mirror` NERC → AWS (langfuse + ragflow buckets) | Or skip if switching to S3 (D3). |
| **ClickHouse** (Langfuse traces) | **D5 RESOLVED:** export existing traces to a **local archive** (Langfuse export / `clickhouse-backup` dump kept off-box), then **start fresh** — no live import. | Historical traces preserved as an archive for reference, not loaded into AWS. |
| **Elasticsearch** (RagFlow indices) | **D5 RESOLVED:** **snapshot → restore** to preserve datasets (no re-parsing). Register an ES snapshot repo, snapshot the `ragflow_*` indices, restore on AWS. | Versions match (`elasticsearch:8.11.3` both sides), so restore is clean. Must be taken as a **consistent set** with the `rag_flow` Postgres dump + MinIO mirror, RagFlow **quiesced** during the window (see note below). |

**RagFlow consistency note:** RagFlow state spans Elasticsearch (chunks +
embeddings), Postgres `rag_flow` (dataset/document/chunk metadata), and MinIO
(source files). To preserve knowledge bases intact, all three are captured at
the same quiesced point and restored together; carrying metadata without the
matching ES index would break retrieval.
| **Redis** | none | Ephemeral cache/queues. |
| **n8n** | Postgres (if DB-backed) + carry `N8N_ENCRYPTION_KEY` | **Critical:** without the same encryption key, stored credentials break. |
| **LangFlow** | `langflow` Postgres DB + `LANGFLOW_SECRET_KEY` | Same: secret key must match or encrypted creds break. |

### Keycloak realm setup
- **Decision D6: RESOLVED — start fresh.** The `preaa` realm on
  `damplab-keycloak` was added late and has few users, so we do **not** migrate
  users.
- Stand up the in-stack Keycloak and **recreate the `preaa` realm + clients**
  fresh (realm config can be authored as a JSON realm-import file committed to
  the repo — clients, roles, redirect URIs — so it's reproducible IaC). Users
  re-register / are re-invited.
- Repoint every service's OIDC issuer + `KEYCLOAK_URL` to the new host.

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
| EC2 `m7i-flex.xlarge` (4/16) | ~$138 (less with Savings Plan / RI) |
| EBS gp3 100 GB | ~$8 |
| Elastic IP (attached) | $0 |
| S3 (backups/state) | ~$1–5 |
| Data transfer | minor |
| **Total** | **~$150/mo** |

Bumping to `m7i-flex.2xlarge` (32 GB) if needed would add ~$138/mo. Prod sized
separately.

## 10. Open decisions (need sign-off before Terraform)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Staging instance size | ✅ **RESOLVED: `m7i-flex.xlarge` (4/16)** + swap; resize if pressure |
| D2 | Ingress/TLS | ✅ **RESOLVED: in-stack `nginx-proxy-manager`** |
| D3 | Object storage on AWS | ✅ **RESOLVED: keep MinIO in-stack** (S3 stays an option) |
| D4 | Orchestration on the box | ✅ **RESOLVED: Portainer agent** (compose = source of truth) |
| D5 | ClickHouse + ES history | ✅ **RESOLVED:** Langfuse traces archived + fresh; **RagFlow snapshot→restore** (datasets preserved, consistent ES+pg+MinIO) |
| D6 | Keycloak users | ✅ **RESOLVED: start fresh**, recreate realm as JSON import, no user migration |
| D7 | Prod domain scheme | Decide at prod phase |

## 11. Out of scope (tracked elsewhere)
- RagFlow ↔ Keycloak SSO mechanism — spike on branch
  `spike/keycloak-shared-auth` (`deploy/local/SPIKE-keycloak-auth.md`).
- n8n SSO (community edition has no OIDC) — deferred.
- Pre-existing prod `stack.env` quirks (duplicate `DATABASE_URL`, NextAuth
  coupling).
