#!/usr/bin/env bash
# Run cross-org restore guard + curriculum org RLS + year-group defaults SQL tests
# against scratch Postgres 15+.
# Full `supabase db reset` is not used here: the production migration chain depends on
# live app tables/extensions not present in CI. Scratch schema applies 240000 + 240500
# + 310000..340000 then the tests — same invariants, deterministic on postgres:15+.
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
  -f "$ROOT/supabase/migrations/20261024240500_curriculum_org_rls.sql" \
  -f "$ROOT/supabase/migrations/20261024310000_year_group_defaults_seed.sql" \
  -f "$ROOT/supabase/migrations/20261024320000_planner_curriculum_org.sql" \
  -f "$ROOT/supabase/migrations/20261024330000_planner_curriculum_user.sql" \
  -f "$ROOT/supabase/migrations/20261024340000_catalog_partial_defaults_backfill.sql" \
  -f "$ROOT/supabase/migrations/20261024350000_catalog_org_write_rights.sql" \
  -f "$ROOT/supabase/migrations/20261024360000_null_org_admin_and_personal_org_bind.sql" \
  -f "$ROOT/supabase/migrations/20261024370000_personal_curriculum_owner_select.sql" \
  -f "$ROOT/supabase/migrations/20261024380000_catalog_backfill_skip_partial_orgs.sql" \
  -f "$ROOT/supabase/tests/assert_curriculum_policies.sql" \
  -f "$ROOT/supabase/tests/restore_cross_org_guards.sql" \
  -f "$ROOT/supabase/tests/curriculum_org_rls.sql" \
  -f "$ROOT/supabase/tests/year_group_defaults_seed.sql" \
  -f "$ROOT/supabase/tests/planner_curriculum_user_rls.sql" \
  -f "$ROOT/supabase/tests/catalog_partial_defaults_backfill.sql" \
  -f "$ROOT/supabase/tests/catalog_org_write_rights.sql" \
  -f "$ROOT/supabase/tests/null_org_admin_and_personal_org_bind.sql"

echo "restore_cross_org_guards + curriculum_org_rls + year_group_defaults_seed + planner_curriculum_user_rls + catalog_partial_defaults_backfill + catalog_org_write_rights + null_org_admin_and_personal_org_bind + personal_owner_select: OK"
