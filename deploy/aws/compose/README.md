# PREAA AWS compose bundle

The self-contained application stack that runs on the AWS host (provisioned by
`../terraform`). No external orchestrator: the host's `preaa.service` systemd
unit renders `stack.env` and runs `docker compose up`.

## Contents

```
docker-compose.yml      the slimmed stack (15 services)
stack.env.base          NON-SECRET config (committed); secrets come from SSM
config/litellm.yaml     LiteLLM config
litellm-custom/         LiteLLM custom provider (langflow handler)
ragflow/                RagFlow entrypoint + service_conf template + nginx conf
postgres-init/          creates the per-service databases on first boot
```

## How config + secrets combine

`/opt/preaa/render-env.sh` (installed by Terraform `user_data`) builds
`/opt/preaa/stack.env` as:

```
stack.env.base   (committed, non-secret)
      +
/preaa/<env>/*   (SecureString secrets from SSM, appended last → win on dup keys)
```

DB connection strings that embed the Postgres password are **not** stored
anywhere — they're built in `docker-compose.yml` via `${POSTGRES_PASSWORD}`
interpolation at `up` time.

## Deploy onto the host

The bundle is delivered via the per-env S3 backups bucket (the instance role
can read it), then started by systemd.

```bash
# 1) From the repo, push the bundle to S3 (one-time + on every change):
BUCKET=$(cd ../terraform/envs/staging && terraform output -raw backups_bucket)
aws s3 sync . "s3://$BUCKET/compose" --delete \
  --exclude '.git/*' --exclude 'stack.env'

# 2) On the host (via SSM Session Manager or Run Command):
sudo aws s3 sync "s3://$BUCKET/compose" /opt/preaa
sudo systemctl start preaa.service      # renders stack.env, then compose up -d
#   ... check status:
sudo systemctl status preaa.service
cd /opt/preaa && sudo docker compose --env-file stack.env ps
```

`render-env.sh` runs as `ExecStartPre`, so `systemctl restart preaa.service`
re-pulls secrets and re-applies the stack after any change.

## Set-per-environment values (before real use)

`stack.env.base` ships with `localhost` placeholders for anything that depends
on the public hostnames. Override these (in `stack.env.base`, or as extra SSM
params) once the domain scheme is set (MIGRATION-PLAN D7):

- `N8N_HOST`, `WEBHOOK_URL` — n8n's public host (webhooks break if wrong)
- `WEBUI_URL` — Open WebUI public URL
- `LANGFUSE_NEXTAUTH_URL`, `ADMIN_NEXTAUTH_URL` — public URLs (OIDC/callbacks)
- `ALLOWED_ORIGINS` — embedded-chat origin(s) for admin CORS

TLS/ingress (nginx-proxy-manager, D2) and Keycloak are added in a later step;
until then services are reachable directly on their published ports for
testing.
