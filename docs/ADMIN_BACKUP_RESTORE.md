# Super-admin curriculum backup / restore

`GET/POST /api/admin/backup` — `requireSuperAdmin` only.

## Hardening (Security Reviewer)

| ID | Control |
|----|---------|
| R1 | Per-table zod allowlists; strip `id` / `user_id` / `owner_id` / `organisation_id` / `created_by` / timestamps unless restoring into an explicit org (`organisationId`) |
| R2 | Restore runs in one txn via `restore_curriculum_backup` SECURITY DEFINER RPC; `REVOKE EXECUTE` from `PUBLIC`/`anon`/`authenticated`; dependency order; `dryRun`; automatic export before restore |
| R3 | `Content-Length` required (411) / over ~4 MB (413); row cap 10 000 per table |
| R4 | `assertRateLimit('admin-backup:'+userId, { limit: 5, windowMs: 600000 })` on GET and POST |
| R5 | `Cache-Control: private, no-store` |
| R6 | Audit successes **and** failures; `hashIpForStorage`; log per-table row counts |
| R7 | Optional `?organisationId=` export filter |

Migration: `20261024170000_restore_curriculum_backup_rpc.sql` (not applied live until owner reviews).
