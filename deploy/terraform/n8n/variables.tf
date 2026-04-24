variable "namespace" {
  description = "K8s namespace for resource deployment"
  type = string
}

variable "docker_pull_secret" {
  description = "K8s secret storing the docker information"
  type        = string
}

variable "hostname" {
  description = "Hostname where the n8n instance is available"
  type = string
}

variable "webhook_url" {
  description = "For n8n to recognize webhooks behind a proxy"
  type = string
}

variable "n8n_version" {
  description = "n8n version to run"
  type = string
  default = "2.17.7"
}

variable "db_creds" {
  description = "Connection details"
  type = object({
    host = string
    port = number
    name = string
    password = string
  })
  sensitive = true
}
