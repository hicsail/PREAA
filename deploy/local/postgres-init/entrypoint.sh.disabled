#!/bin/bash
set -e

# Start postgres in the background using the original entrypoint
docker-entrypoint.sh postgres &
POSTGRES_PID=$!

# Wait for postgres to be ready
until pg_isready -U "${POSTGRES_USER:-psql}" -d postgres; do
  echo 'Waiting for postgres to be ready...'
  sleep 1
done

# Run all SQL init scripts (idempotent, safe to run multiple times)
echo "Running database initialization scripts..."
for script in /docker-entrypoint-initdb.d/*.sql; do
  if [ -f "$script" ]; then
    echo "Executing: $(basename "$script")"
    # Capture output and exit code for better error handling
    OUTPUT=$(psql -U "${POSTGRES_USER:-psql}" -d postgres -f "$script" 2>&1)
    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
      # Suppress only expected idempotent errors (e.g., "already exists")
      if echo "$OUTPUT" | grep -qi "already exists"; then
        echo "Note: $(basename "$script") - database already exists (expected)"
      else
        echo "Error executing $(basename "$script"):" >&2
        echo "$OUTPUT" >&2
        exit $EXIT_CODE
      fi
    fi
  fi
done
echo "Database initialization complete."

# Wait for the background postgres process
wait $POSTGRES_PID

