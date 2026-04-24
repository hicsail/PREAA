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
  users = []
}

module "n8n" {
  source = "./n8n/"

  # Meta Configs
  namespce = var.namespace
  docker_pull_secret = module.commpon.docker_pull_secret
}
