variable "docker_config" {
  description = "Location of logged in Docker config to generate k8s secret from"
  type        = string
}

variable "namespace" {
  description = "K8s namespace to add resources into"
  type        = string
}
