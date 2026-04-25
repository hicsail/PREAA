##############################################
# Meta Configs
##############################################
variable "namespace" {
  description = "K8s namespace for resource deployment"
  type        = string
  default     = "software-application-innovation-lab-sa-07a3bf"
}

variable "docker_config" {
  description = "Location of logged in Docker config to generate k8s secret from"
  type        = string
  default     = "~/.docker/config.json"
}
