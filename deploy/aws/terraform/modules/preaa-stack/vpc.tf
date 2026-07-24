# Only created when create_network = true. When false, the box uses an existing
# VPC/subnet (var.existing_vpc_id / var.existing_subnet_id) — e.g. the account
# default VPC so the shared reverse proxy can reach it privately.
resource "aws_vpc" "this" {
  count                = var.create_network ? 1 : 0
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = local.name })
}

resource "aws_internet_gateway" "this" {
  count  = var.create_network ? 1 : 0
  vpc_id = aws_vpc.this[0].id
  tags   = merge(local.common_tags, { Name = local.name })
}

resource "aws_subnet" "public" {
  count                   = var.create_network ? 1 : 0
  vpc_id                  = aws_vpc.this[0].id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true
  tags                    = merge(local.common_tags, { Name = "${local.name}-public" })
}

resource "aws_route_table" "public" {
  count  = var.create_network ? 1 : 0
  vpc_id = aws_vpc.this[0].id
  tags   = merge(local.common_tags, { Name = "${local.name}-public" })
}

resource "aws_route" "default" {
  count                  = var.create_network ? 1 : 0
  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}

resource "aws_route_table_association" "public" {
  count          = var.create_network ? 1 : 0
  subnet_id      = aws_subnet.public[0].id
  route_table_id = aws_route_table.public[0].id
}
