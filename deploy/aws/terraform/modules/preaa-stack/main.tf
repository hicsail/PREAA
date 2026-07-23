locals {
  name = "preaa-${var.environment}"

  common_tags = merge({
    Project     = "preaa"
    Environment = var.environment
    ManagedBy   = "terraform"
  }, var.tags)

  ssm_prefix = "/preaa/${var.environment}"
}
