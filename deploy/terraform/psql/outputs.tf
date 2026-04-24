output "credentials" {
  sensitive = true

  value = {
    for user, secret in data.kubernetes_secret_v1.credentials :
    user => {
      host = secret.data["host"]
      port = secret.data["port"]
      user = secret.data["user"]
      password = secret.data["password"]
    }
  }
}
