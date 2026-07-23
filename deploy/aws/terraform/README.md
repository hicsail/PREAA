# PREAA AWS Terraform

Infrastructure for running PREAA on dedicated AWS resources, per
[`../MIGRATION-PLAN.md`](../MIGRATION-PLAN.md). Provisions a dedicated VPC and a
single right-sized EC2 host that runs the existing docker-compose stack. The
host is **self-contained** — no external orchestrator: it manages its own
compose stack via a systemd unit that renders `stack.env` from SSM and runs
`docker compose up`. **All datastores stay self-hosted in the compose stack** —
this Terraform provisions the *host and surrounding AWS resources*, not managed
databases.

## Layout

```
bootstrap/              one-time: create the S3 state bucket (local state)
modules/preaa-stack/    the reusable stack: VPC, SG, EC2 (+EIP, data volume,
                        swap, Portainer agent), IAM, SSM secrets, S3 backups
envs/staging/           staging root (m7i-flex.xlarge) — apply first
envs/prod/              prod root (scaffold; do not apply until staging is validated)
```

## What it creates (per env)

- VPC + public subnet + IGW + routing
- EC2 (`m7i-flex.xlarge` staging), IMDSv2-only (Elastic IP optional via
  `use_eip`; staging uses the instance's ephemeral public IP)
- A dedicated encrypted **gp3 data volume** mounted at `/data` (holds all Docker
  data), plus an **8 GB swap** file (RAM-spike safety net, plan D1)
- Security group: 80/443 (open, meant to sit behind Cloudflare), SSH disabled by
  default (use SSM Session Manager)
- A `preaa.service` systemd unit + `/opt/preaa/render-env.sh` that renders
  `stack.env` from the SSM parameters and runs `docker compose up` — no external
  orchestrator
- IAM instance role: SSM Session Manager, scoped read of the stack's secrets,
  access to the per-env backups bucket
- SSM **SecureString** parameters under `/preaa/<env>/` (values set out-of-band)
- S3 backups bucket (versioned, encrypted, private)

## Usage

```bash
# 0) Auth to the AWS account (region us-east-1).

# 1) One-time: create the Terraform state bucket.
cd deploy/aws/terraform/bootstrap
terraform init && terraform apply

# 2) Staging.
cd ../envs/staging
#    Optionally tighten allowed_web_cidrs in main.tf (default open for Cloudflare).
terraform init
terraform plan
terraform apply

# 3) Populate the secret values (Terraform only creates the parameters with a
#    placeholder and ignores value changes):
aws ssm put-parameter --overwrite --type SecureString \
  --name /preaa/staging/POSTGRES_PASSWORD --value '...'
#    ...repeat for each name in the `secret_parameter_names` output.

# 4) Deploy the app stack (self-contained, no external orchestrator):
#    - place the compose file(s) in /opt/preaa on the host (via SSM/scp/S3)
#    - `sudo systemctl start preaa.service`  (renders stack.env from SSM, then
#      `docker compose up -d`)
#    Then point Cloudflare DNS (*-preaa-staging.sail.codes) at the `public_ip`
#    output.
```

## Notes

- **State locking** uses S3 native locking (`use_lockfile`, Terraform ≥ 1.10) —
  no DynamoDB table needed.
- **Secrets** never live in Terraform state or the repo: parameters are created
  with a `CHANGE_ME` placeholder and `ignore_changes = [value]`.
- **Data volume device**: on Nitro instances the attached volume surfaces under
  a non-deterministic `/dev/nvme*` name; `user_data.sh.tftpl` finds and
  labels it (`preaa-data`) so mounts are stable across reboots.
- **`prod/` is a scaffold** — revisit instance sizing (D1) and the domain scheme
  (D7) before applying it.
