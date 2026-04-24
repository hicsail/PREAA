// Docker pull secret for images in Dockerhub
resource "kubernetes_secret" "docker_pull" {
  metadata {
    name      = "docker-pull"
    namespace = var.namespace
  }

  data = {
    ".dockerconfigjson" = "${file(var.docker_config)}"
  }

  type = "kubernetes.io/dockerconfigjson"
}
