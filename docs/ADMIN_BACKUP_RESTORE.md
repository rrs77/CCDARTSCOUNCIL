# Super-admin curriculum backup / restore

`GET/POST /api/admin/backup` — `requireSuperAdmin` only.

**Real restore is currently disabled** (`RESTORE_ENABLED = false`): export and `dryRun` only; a non-dry-run restore returns **503** `restore disabled` until Security Reviewer signs off items 1–5.

## Hardening

| ID | Control |
|----|---------|
| 1 | Org-scoped RPC: `p_organisation_id` required; `organisation_id` set on every insert / `ON CONFLICT` update; API returns 400 when org is null/invalid |
| 2 | `organisationId` must match `^[A-Za-z0-9_-]{1,64}$` and exist in `public.organisations` |
| 3 | Pre-export persisted to service-role-only `curriculum_backups` (`storage_key` = `backups/<ts>-<userId>.json`); abort if save fails; ref in audit + response |
| 4 | Keep zod-validated UUID `id` (strip owner/user/timestamps); RPC deletes org-scoped rows then upserts |
| 5 | Four custom-objective tables restored (or 400 if tables missing when present in payload) |
| 6 | Stack tables: zod requires `data` object; RPC does not `COALESCE(r->'data', r)` |
| 7 | `GRANT EXECUTE ON FUNCTION public.restore_curriculum_backup(jsonb,text,boolean) TO service_role` |
| 8 | DreamHost upload: EXDEV stages in dest dir then `link()` into place; shutdown unlinks staging unless placed |
| TP | `SET search_path = public, pg_temp`; result `counts` = `ROW_COUNT` actually written |

Also: Content-Length 411/413; row cap 10 000; rate limit 5/10m; `Cache-Control: private, no-store`; audit with `hashIpForStorage`.

Migrations (not applied live until owner reviews):

- `20261024170000_restore_curriculum_backup_rpc.sql` (initial RPC)
- `20261024200000_org_scoped_curriculum_restore.sql` (org-scoped + snapshots + GRANT)
- `20261024220000_restore_on_conflict_org_where.sql` (`ON CONFLICT … DO UPDATE WHERE t.organisation_id = v_org`)
- `20261024240000_restore_cross_org_guards.sql` (42501 cross-org id guards; lessons unique `(organisation_id, sheet_name, academic_year, user_id)`; private helpers; branding owner policy; own-org SELECT with suspended/anonymised gates; `GRANT ALL` on `curriculum_backups`)
- `20261024235800_curriculum_org_rls.sql` (RLS on activities/lessons/eyfs)

App upserts must use org-scoped `onConflict` keys:
- activities: `organisation_id,activity,category,lesson_number`
- lessons: `organisation_id,sheet_name,academic_year,user_id`
- eyfs_statements: `organisation_id,sheet_name` (app has no year/user on EYFS writes)
- activity_custom_objectives: `organisation_id,activity_id,objective_id`

Always send `organisation_id`.

Also: `20261024235800_curriculum_org_rls.sql` — RLS on activities/lessons/eyfs (own-org + NULL-org system reads + super_admin); own-org SELECT excludes suspended/anonymised. Policy names are `ccd_*_202610242358` to avoid MIS 235500 clashes.

SQL tests (CI scratch Postgres 15): `supabase/tests/run_restore_cross_org_guards.sh` (full `supabase db reset` is not feasible in CI without the live schema chain).
