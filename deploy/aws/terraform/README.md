# PREAA AWS Terraform

Infrastructure for running PREAA on dedicated AWS resources, per
[`../MIGRATION-PLAN.md`](../MIGRATION-PLAN.md). Provisions a dedicated VPC and a
single right-sized EC2 host that runs the existing docker-compose stack,
managed by a Portainer agent. **All datastores stay self-hosted in the compose
stack** — this Terraform provisions the *host and surrounding AWS resources*,
not managed databases.

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
- EC2 (`m7i-flex.xlarge` staging) with an Elastic IP, IMDSv2-only
- A dedicated encrypted **gp3 data volume** mounted at `/data` (holds all Docker
  data), plus an **8 GB swap** file (RAM-spike safety net, plan D1)
- Security group: 80/443 (open, meant to sit behind Cloudflare), Portainer agent
  9001 (from the Portainer server only), SSH disabled by default (use SSM)
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
#    Before applying, set portainer_server_cidrs (and tighten allowed_web_cidrs
#    if desired) in main.tf.
terraform init
terraform plan
terraform apply

# 3) Populate the secret values (Terraform only creates the parameters with a
#    placeholder and ignores value changes):
aws ssm put-parameter --overwrite --type SecureString \
  --name /preaa/staging/POSTGRES_PASSWORD --value '...'
#    ...repeat for each name in the `secret_parameter_names` output.

# 4) Point Cloudflare DNS (*-preaa-staging.sail.codes) at the `public_ip` output,
#    add the host to the central Portainer as a new environment (<public_ip>:9001),
#    and deploy the stack (deploy/portainer/docker-compose.yml) rendering
#    stack.env from the SSM parameters.
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
