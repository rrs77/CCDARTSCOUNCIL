#!/usr/bin/env bash
# Scratch-Postgres checks for organisations.ai_addon protect trigger.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGDATABASE="${PGDATABASE:-ai_addon_protect_scratch}"

psql_as_postgres() {
  if [ "$(id -u)" = "0" ]; then
    su -s /bin/bash postgres -c "psql -v ON_ERROR_STOP=1 $*"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 "$@"
  fi
}

psql_as_postgres -d postgres -c "DROP DATABASE IF EXISTS ${PGDATABASE};"
psql_as_postgres -d postgres -c "CREATE DATABASE ${PGDATABASE};"

psql_as_postgres -d "$PGDATABASE" \
  -f "$ROOT/supabase/tests/organisations_ai_addon_protect_scratch_schema.sql" \
  -f "$ROOT/supabase/migrations/20261025130000_organisations_ai_addon.sql" \
  -f "$ROOT/supabase/migrations/20261025131000_organisations_ai_addon_protect.sql" \
  -f "$ROOT/supabase/tests/organisations_ai_addon_protect.sql"

echo "organisations_ai_addon_protect: OK"
