#!/usr/bin/env bash
# Run cross-org restore guard SQL tests against a scratch Postgres 15+.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-restore_guards_scratch}"
export PGHOST PGPORT PGUSER PGPASSWORD

psql -v ON_ERROR_STOP=1 -d postgres -c "DROP DATABASE IF EXISTS ${PGDATABASE};"
psql -v ON_ERROR_STOP=1 -d postgres -c "CREATE DATABASE ${PGDATABASE};"

psql -v ON_ERROR_STOP=1 -d "$PGDATABASE" \
  -f "$ROOT/supabase/tests/restore_cross_org_guards_scratch_schema.sql" \
  -f "$ROOT/supabase/migrations/20261024240000_restore_cross_org_guards.sql" \
  -f "$ROOT/supabase/tests/restore_cross_org_guards.sql"

echo "restore_cross_org_guards: OK"
