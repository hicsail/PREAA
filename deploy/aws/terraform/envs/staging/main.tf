terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State in S3 (bucket created by ../../bootstrap). Native S3 locking
  # (use_lockfile) — no DynamoDB table required with Terraform >= 1.10.
  backend "s3" {
    bucket       = "preaa-terraform-state"
    key          = "staging/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "preaa"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

variable "region" {
  type    = string
  default = "us-east-1"
}

module "preaa" {
  source = "../../modules/preaa-stack"

  environment       = "staging"
  region            = var.region
  availability_zone = "us-east-1a"

  # Plan D1: cost-optimized staging box (4 vCPU / 16 GB, flex/burstable) + swap.
  instance_type       = "m7i-flex.xlarge"
  data_volume_size_gb = 100
  swap_size_gb        = 8

  # TODO before apply: set the central Portainer server IP (CIDR /32) so it can
  # reach the agent on 9001. Leave web open (behind Cloudflare) or tighten to
  # Cloudflare ranges. SSH left disabled (use SSM Session Manager).
  portainer_server_cidrs = [] # e.g. ["203.0.113.10/32"]
  allowed_web_cidrs      = ["0.0.0.0/0"]
  admin_ssh_cidrs        = []
}

output "public_ip" {
  value = module.preaa.public_ip
}

output "instance_id" {
  value = module.preaa.instance_id
}

output "secret_parameter_names" {
  value = module.preaa.secret_parameter_names
}

output "backups_bucket" {
  value = module.preaa.backups_bucket
}
