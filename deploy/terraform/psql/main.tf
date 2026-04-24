

resource "kubernetes_manifest" "psql" {
  manifest = {
    kind = "PostgresCluster"
    apiVersion = "postgres-operator.crunchydata.com/v1beta1"
    metadata = {
      name = "preaa-psql"
      namespace = var.namespace
    }
    spec = {
      postgresVersion = 16
    }
  }
}
