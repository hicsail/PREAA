variable "namespace" {
  description = "K8s namespace for resource deployment"
  type = string
}

variable "docker_pull_secret" {
  description = "K8s secret storing the docker information"
  type        = string
}
