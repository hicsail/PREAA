terraform {
  required_providers {
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
  }

  backend "kubernetes" {
    secret_suffix = "state"
    config_path   = "~/.kube/config"
    namespace     = "software-application-innovation-lab-sa-07a3bf"
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

module "common" {
  source        = "./common"
  docker_config = var.docker_config
  namespace     = var.namespace
}

module "psql" {
  source = "./psql/"

  # Meta Configs
  namespace = var.namespace
  docker_pull_secret = module.common.docker_pull_secret

  # Users for each service
  users = [
    {
      name = "n8n"
      databases = ["n8n"]
    }
  ]
}

module "n8n" {
  source = "./n8n/"

  # Meta Configs
  namespace = var.namespace
  docker_pull_secret = module.common.docker_pull_secret

  # Database connection
  db_creds = module.psql.credentials["n8n"]

  # Endpoint configuration
  hostname = "n8n.sail.codes"
  webhook_url = "https://n8n.sail.codes/"
}
