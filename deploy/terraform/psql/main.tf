

resource "kubernetes_manifest" "psql" {
  manifest = {
    kind       = "PostgresCluster"
    apiVersion = "postgres-operator.crunchydata.com/v1beta1"
    metadata = {
      name      = "preaa-psql"
      namespace = var.namespace
    }
    spec = {
      postgresVersion  = 16
      imagePullSecrets = [{ name = var.docker_pull_secret }]
      instances = [
        {
          dataVolumeClaimSpec = {
            accessModes = ["ReadWriteOnce"]
            resources = {
              requests = {
                storage = "50Gi"
              }
            }
          }
          resources = {
            limits = {
              memory = "4Gi"
              cpu    = "1"
            }
            requests = {
              memory = "1Gi"
              cpu    = "250m"
            }
          }
          sidecars = {
            replicaCertCopy = {
              resources = {
                limits = {
                  memory = "1Gi"
                  cpu    = "250m"
                }
                requests = {
                  memory = "1Gi"
                  cpu    = "250m"
                }
              }
            }
          }
          replicas = 1
        }
      ]
      users = var.users
    }
  }
}

data "kubernetes_secret_v1" "credentials" {
  for_each   = toset([for user in var.users : user.name])
  depends_on = [kubernetes_manifest.psql]
  metadata {
    name      = "preaa-psql-pguser-${each.value}"
    namespace = var.namespace
  }
}
