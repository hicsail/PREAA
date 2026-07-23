#!/usr/bin/env bash
#
# Sync PREAA secrets from 1Password (source of truth) to AWS SSM Parameter
# Store (the runtime mirror the instance reads via render-env.sh).
#
#   Flow:  1Password  --(this script, human/CI with op auth)-->  SSM  --(box)--> stack.env
#
# 1Password is where humans edit values. Run this after any change so the box
# picks them up (then `systemctl restart preaa.service` on the host).
#
# Usage:   deploy/aws/scripts/sync-secrets.sh [env]      (env defaults to staging)
# Requires: op (authenticated via desktop app or OP_SERVICE_ACCOUNT_TOKEN), aws.
set -euo pipefail

ENV="${1:-staging}"
REGION="${AWS_REGION:-us-east-1}"
VAULT="PREAA"
ITEM="PREAA ${ENV}"

command -v op  >/dev/null || { echo "op (1Password CLI) not found" >&2; exit 1; }
command -v aws >/dev/null || { echo "aws CLI not found" >&2; exit 1; }

echo "Syncing 1Password '${VAULT}/${ITEM}'  ->  SSM /preaa/${ENV}/* (${REGION})"

count=0
# Read fields as key<TAB>value from the 1Password item; never printed to stdout.
while IFS=$'\t' read -r key value; do
  [ -n "$key" ] || continue
  aws ssm put-parameter --region "$REGION" --overwrite --type SecureString \
    --name "/preaa/${ENV}/${key}" --value "$value" >/dev/null
  echo "  -> /preaa/${ENV}/${key}"
  count=$((count + 1))
done < <(
  op item get "$ITEM" --vault "$VAULT" --format json \
    | python3 -c '
import json, sys
d = json.load(sys.stdin)
for f in d.get("fields", []):
    label, value = f.get("label"), f.get("value")
    # skip the item notes / empty fields; only sync concealed secret fields
    if label and value and f.get("id") != "notesPlain":
        print(f"{label}\t{value}")
'
)

echo "Done. Synced ${count} parameters."
echo "Next: on the host, 'sudo systemctl restart preaa.service' to re-render stack.env and re-apply."
