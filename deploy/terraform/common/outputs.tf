output "docker_pull_secret" {
  value = kubernetes_secret_v1.docker_pull.metadata.0.name
}
