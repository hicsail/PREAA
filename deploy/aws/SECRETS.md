# PREAA secrets model

**1Password is the source of truth.** Humans edit secrets there; they are
mirrored to AWS SSM Parameter Store, which is what the running host reads at
deploy time (no interactive auth needed on the box).

```
   1Password  ──sync-secrets.sh──►  SSM Parameter Store  ──render-env.sh──►  /opt/preaa/stack.env
   (edit here)   (human/CI, op auth)   /preaa/<env>/*        (on the box)      (docker compose)
```

## Locations

- **1Password:** vault `PREAA`, one item per environment — `PREAA staging`
  (later `PREAA prod`). Each secret is a concealed field named exactly as the
  env var (e.g. `POSTGRES_PASSWORD`, `LITELLM_MASTER_KEY`).
- **SSM:** `/preaa/<env>/<KEY>` SecureString. Terraform *declares* these
  parameters (so IAM can be scoped) with a placeholder + `ignore_changes` on
  value — the real values come from the sync, never from Terraform state.

## Everyday workflow

1. Edit a value in 1Password (`PREAA` vault → `PREAA <env>` item).
2. Push to SSM:
   ```bash
   deploy/aws/scripts/sync-secrets.sh staging
   ```
3. Re-apply on the host:
   ```bash
   # via SSM Session Manager on the instance
   sudo systemctl restart preaa.service   # re-renders stack.env, docker compose up -d
   ```

## Adding a new secret

1. Add a concealed field to the `PREAA <env>` 1Password item.
2. Add the key to `secret_parameter_names` in the Terraform module (so the SSM
   parameter + IAM scope exist), `terraform apply`.
3. `sync-secrets.sh <env>`, then restart the service.

## CLI setup (one-time, per machine)

```bash
brew install 1password-cli
# 1Password desktop app → Settings → Developer → "Integrate with 1Password CLI"
op vault list      # Touch ID prompt authorizes the CLI
```

## Referencing secrets directly (local/human use)

Fields are addressable as 1Password secret references, handy for local runs
without touching SSM:

```
op://PREAA/PREAA staging/POSTGRES_PASSWORD
```
e.g. `op read "op://PREAA/PREAA staging/LITELLM_MASTER_KEY"`, or template a file
with `op inject`.

## Alternative: box pulls from 1Password directly

The box currently reads SSM (zero interactive auth via its IAM role). If you'd
rather it pull from 1Password at runtime, create a **1Password Service Account**
scoped read-only to the `PREAA` vault, store its token (in SSM), and have
`render-env.sh` use `op` with `OP_SERVICE_ACCOUNT_TOKEN`. Not used today — it
adds a token to manage and requires a 1Password Business plan; the SSM mirror
avoids both.
