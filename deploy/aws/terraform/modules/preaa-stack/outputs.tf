output "public_ip" {
  description = "Public IP to point Cloudflare DNS records at (Elastic IP if use_eip, else the instance's ephemeral public IP)."
  value       = var.use_eip ? aws_eip.this[0].public_ip : aws_instance.this.public_ip
}

output "instance_id" {
  description = "EC2 instance ID (use with SSM Session Manager)."
  value       = aws_instance.this.id
}

output "vpc_id" {
  value = aws_vpc.this.id
}

output "ssm_prefix" {
  description = "SSM parameter prefix holding the stack secrets."
  value       = local.ssm_prefix
}

output "backups_bucket" {
  description = "S3 bucket for DB dumps / snapshots / archives."
  value       = aws_s3_bucket.backups.bucket
}

output "secret_parameter_names" {
  description = "Fully-qualified SSM parameter names to populate out-of-band."
  value       = [for p in aws_ssm_parameter.secret : p.name]
}
