variable "namespace" {
  description = "K8s namespace for resource deployment"
  type        = string
}

variable "docker_pull_secret" {
  description = "K8s secret storing the docker information"
  type        = string
}

variable "users" {
  description = "Each psql user and the database they should have access to"
  type = list(object({
    name      = string
    databases = optional(list(string))
    options   = optional(string)
  }))
}
