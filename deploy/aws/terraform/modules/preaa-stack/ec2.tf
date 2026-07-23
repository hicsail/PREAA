# Latest Amazon Linux 2023 x86_64 AMI (m7i-flex is x86_64).
data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

resource "aws_instance" "this" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  availability_zone      = var.availability_zone
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.instance.id]
  iam_instance_profile   = aws_iam_instance_profile.instance.name
  key_name               = length(var.admin_ssh_cidrs) > 0 ? var.key_name : null

  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    data_volume_device = "/dev/sdf"
    swap_size_gb       = var.swap_size_gb
    region             = var.region
    ssm_prefix         = local.ssm_prefix
  })

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint = "enabled"
  }

  tags = merge(local.common_tags, { Name = local.name })

  # user_data changes shouldn't force replacement of a running data node.
  lifecycle {
    ignore_changes = [ami]
  }
}

# Dedicated data volume for all docker volumes (mounted at /data by user_data).
resource "aws_ebs_volume" "data" {
  availability_zone = var.availability_zone
  size              = var.data_volume_size_gb
  type              = "gp3"
  encrypted         = true
  tags              = merge(local.common_tags, { Name = "${local.name}-data" })
}

resource "aws_volume_attachment" "data" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.data.id
  instance_id = aws_instance.this.id
}

resource "aws_eip" "this" {
  count      = var.use_eip ? 1 : 0
  domain     = "vpc"
  instance   = aws_instance.this.id
  tags       = merge(local.common_tags, { Name = local.name })
  depends_on = [aws_internet_gateway.this]
}
