# Production environment — SCAFFOLD ONLY, do not apply until staging is
# validated (see deploy/aws/MIGRATION-PLAN.md §8). Mirrors staging; revisit
# instance sizing (D1) and the domain scheme (D7) at the prod phase.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "preaa-terraform-state"
    key          = "prod/terraform.tfstate"
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
      Environment = "prod"
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

  environment       = "prod"
  region            = var.region
  availability_zone = "us-east-1a"

  # Revisit sizing for prod load (D1). Starting from the same shape as staging.
  instance_type       = "m7i-flex.xlarge"
  data_volume_size_gb = 100
  swap_size_gb        = 8

  vpc_cidr           = "10.21.0.0/16"
  public_subnet_cidr = "10.21.1.0/24"

  portainer_server_cidrs = [] # set before apply
  allowed_web_cidrs      = ["0.0.0.0/0"]
  admin_ssh_cidrs        = []
}

output "public_ip" {
  value = module.preaa.public_ip
}

output "instance_id" {
  value = module.preaa.instance_id
}
