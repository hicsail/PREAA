resource "aws_security_group" "instance" {
  name        = "${local.name}-instance"
  description = "PREAA ${var.environment} instance: web + reverse-proxy service ports + optional SSH"
  vpc_id      = local.vpc_id
  tags        = merge(local.common_tags, { Name = "${local.name}-instance" })
}

# App service ports reachable from the shared reverse proxy (private). One rule
# per (port, proxy CIDR) pair.
resource "aws_vpc_security_group_ingress_rule" "service_ports" {
  for_each = {
    for pair in setproduct(var.service_ports, var.proxy_cidrs) :
    "${pair[0]}-${pair[1]}" => { port = pair[0], cidr = pair[1] }
  }
  security_group_id = aws_security_group.instance.id
  description       = "App service port ${each.value.port} from reverse proxy"
  cidr_ipv4         = each.value.cidr
  ip_protocol       = "tcp"
  from_port         = each.value.port
  to_port           = each.value.port
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  for_each          = toset(var.allowed_web_cidrs)
  security_group_id = aws_security_group.instance.id
  description       = "HTTP (redirected to HTTPS by the reverse proxy)"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  for_each          = toset(var.allowed_web_cidrs)
  security_group_id = aws_security_group.instance.id
  description       = "HTTPS"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  for_each          = toset(var.admin_ssh_cidrs)
  security_group_id = aws_security_group.instance.id
  description       = "SSH (prefer SSM Session Manager; leave admin_ssh_cidrs empty to disable)"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.instance.id
  description       = "All egress"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
