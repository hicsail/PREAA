# Secret parameters for the stack. Terraform provisions the parameters (so the
# set is codified and IAM can be scoped to them) but does NOT manage their
# values: each is created with a placeholder and `ignore_changes` on value, so
# the real secret is set out-of-band (console / `aws ssm put-parameter`) and
# never lands in Terraform state or the repo.
resource "aws_ssm_parameter" "secret" {
  for_each = var.secret_parameter_names

  name  = "${local.ssm_prefix}/${each.value}"
  type  = "SecureString"
  value = "CHANGE_ME"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}
