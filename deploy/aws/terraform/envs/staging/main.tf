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

  # Model B: launch into the ACCOUNT DEFAULT VPC (us-east-1a subnet) so the
  # shared nginx-proxy-manager (on 52.87.70.124, default VPC) can reach the
  # box's service ports privately. Cloudflare points *-preaa-staging.sail.codes
  # at the proxy's public IP; the proxy forwards to <private_ip>:<port>. No EIP
  # needed (private reachability), and no public web ingress on this box.
  create_network     = false
  existing_vpc_id    = "vpc-242ec241"    # default VPC (172.31.0.0/16)
  existing_subnet_id = "subnet-fe290ab8" # default VPC, us-east-1a
  use_eip            = false

  proxy_cidrs       = ["172.31.94.46/32"] # nginx-proxy-manager private IP
  allowed_web_cidrs = []                  # no public web on this box; proxy fronts it
  admin_ssh_cidrs   = []                  # use SSM Session Manager
}

output "public_ip" {
  value = module.preaa.public_ip
}

output "instance_id" {
  value = module.preaa.instance_id
}

output "private_ip" {
  value = module.preaa.private_ip
}

output "secret_parameter_names" {
  value = module.preaa.secret_parameter_names
}

output "backups_bucket" {
  value = module.preaa.backups_bucket
}
