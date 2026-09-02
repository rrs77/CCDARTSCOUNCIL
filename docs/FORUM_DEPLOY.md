# Community Forum — deploy notes

## 1. Apply migrations (Supabase SQL Editor or CLI)

Run in order if not already applied:

1. `supabase/migrations/20260902_user_mgmt_downloads.sql`
2. `supabase/migrations/20260903_hub_administration.sql`
3. `supabase/migrations/20260904_community_forum.sql`

Seeded categories start as **draft**. Publish from `/forum/admin` when ready.

## 2. Environment (Vercel)

Already required for user-mgmt / hubs:

- `SUPABASE_URL` / `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` (preferred for JWT verify)
- `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`

Optional for forum email:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `VITE_APP_URL` / `APP_URL` (links in emails)

## 3. Deploy

Push `feature/user-mgmt-download-tracking` (or merge PR). Vercel serves SPA + `api/forum/**` serverless routes.

## 4. Smoke test

1. Open `/forum` signed out — public categories (once published) list.
2. Sign in as teacher — create topic / reply.
3. Sign in as admin — `/forum/admin` publish category, resolve report, pin/lock/hide.
4. Hub-scoped category: only hub members see it (super_admin always can).
