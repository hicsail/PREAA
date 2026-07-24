locals {
  name = "preaa-${var.environment}"

  common_tags = merge({
    Project     = "preaa"
    Environment = var.environment
    ManagedBy   = "terraform"
  }, var.tags)

  ssm_prefix = "/preaa/${var.environment}"

  # Use the created VPC/subnet, or the provided existing ones (default VPC).
  vpc_id    = var.create_network ? aws_vpc.this[0].id : var.existing_vpc_id
  subnet_id = var.create_network ? aws_subnet.public[0].id : var.existing_subnet_id
}
