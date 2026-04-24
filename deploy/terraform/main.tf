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

}

module "common" {
  source        = "./common"
  docker_config = var.docker_config
  namespace     = var.namespace
}

module "psql" {
  source = "./psql/"

  # K8s Configs
  namespace = var.namespace
}
