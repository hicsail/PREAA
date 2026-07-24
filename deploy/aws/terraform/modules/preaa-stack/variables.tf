variable "environment" {
  description = "Environment name (e.g. staging, prod). Used in resource names and the SSM prefix /preaa/<environment>/."
  type        = string
}

variable "region" {
  description = "AWS region."
  type        = string
  default     = "us-east-1"
}

variable "create_network" {
  description = <<-EOT
    true: create a dedicated VPC + public subnet + IGW for the box.
    false: launch into an existing VPC/subnet (set existing_vpc_id +
    existing_subnet_id) — e.g. the account default VPC so the shared
    nginx-proxy-manager can reach the box's service ports privately.
  EOT
  type        = bool
  default     = true
}

variable "existing_vpc_id" {
  description = "VPC to launch into when create_network = false."
  type        = string
  default     = ""
}

variable "existing_subnet_id" {
  description = "Subnet to launch into when create_network = false (must be in availability_zone)."
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR for the dedicated VPC (only when create_network = true)."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet (only when create_network = true)."
  type        = string
  default     = "10.20.1.0/24"
}

variable "proxy_cidrs" {
  description = "CIDRs allowed to reach the app service ports (the shared reverse proxy). Empty = closed."
  type        = list(string)
  default     = []
}

variable "service_ports" {
  description = "Host ports the app services publish, reachable from proxy_cidrs."
  type        = list(number)
  default     = [3000, 3009, 3016, 3017, 4000, 5678, 7080, 7600, 7860]
}

variable "availability_zone" {
  description = "AZ for the subnet + EBS data volume (must match the instance's AZ)."
  type        = string
  default     = "us-east-1a"
}

variable "instance_type" {
  description = "EC2 instance type. Staging default per plan D1 (4 vCPU / 16 GB, flex/burstable)."
  type        = string
  default     = "m7i-flex.xlarge"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size (GB)."
  type        = number
  default     = 30
}

variable "data_volume_size_gb" {
  description = "Dedicated gp3 data volume size (GB) mounted at /data for all docker volumes."
  type        = number
  default     = 100
}

variable "swap_size_gb" {
  description = "Swap file size (GB) on the data volume — RAM-spike safety net per plan D1. Set 0 to disable."
  type        = number
  default     = 8
}

variable "allowed_web_cidrs" {
  description = "CIDRs allowed to reach 80/443. Default open (behind Cloudflare); tighten to Cloudflare ranges to lock down."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "admin_ssh_cidrs" {
  description = "CIDRs allowed SSH (22). Leave empty to disable SSH entirely and use SSM Session Manager (preferred)."
  type        = list(string)
  default     = []
}

variable "key_name" {
  description = "Optional EC2 key pair name for SSH. Only used if admin_ssh_cidrs is non-empty."
  type        = string
  default     = null
}

variable "secret_parameter_names" {
  description = <<-EOT
    Names of SSM SecureString parameters to provision under /preaa/<environment>/.
    Terraform creates them with a placeholder and ignores value changes — set the
    real values out-of-band (console/CLI) so secrets never live in state/code.
  EOT
  type        = set(string)
  default = [
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
    "CLICKHOUSE_PASSWORD",
    "MINIO_ROOT_PASSWORD",
    "ELASTIC_PASSWORD",
    "LITELLM_MASTER_KEY",
    "LITELLM_API_KEY",
    "LANGFUSE_PUBLIC_KEY",
    "LANGFUSE_SECRET_KEY",
    "LANGFUSE_SALT",
    "LANGFUSE_ENCRYPTION_KEY",
    "NEXTAUTH_SECRET",
    "ADMIN_ENCRYPTION_KEY",
    "N8N_ENCRYPTION_KEY",
    "LANGFLOW_SECRET_KEY",
    "LANGFLOW_SUPERUSER_PASSWORD",
    "KEYCLOAK_ADMIN_PASSWORD",
    "KEYCLOAK_CLIENT_SECRET",
  ]
}

variable "use_eip" {
  description = <<-EOT
    Allocate an Elastic IP for a stable address. Set false to use the
    instance's auto-assigned (ephemeral) public IP instead — useful when the
    account's EIP quota is exhausted. Ephemeral IPs change on stop/start.
  EOT
  type        = bool
  default     = true
}

variable "tags" {
  description = "Extra tags applied to all resources."
  type        = map(string)
  default     = {}
}
