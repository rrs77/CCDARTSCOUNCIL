# Deploy: user management + download tracking

## 1. Run SQL migrations (in order)

In Supabase SQL Editor, run:

1. `supabase/migrations/20260902_user_mgmt_downloads.sql`
2. `supabase/migrations/20260903_hub_administration.sql`

Migration 1 creates profiles extensions, organisations, resources, download_events, audit_log, and Jazz North resource seeds.

Migration 2 adds `super_admin`, `hub_memberships`, hub pages, resource lifecycle fields, activities/media, and idempotently assigns `super_admin` to the existing verified account `rob.reichstorer@gmail.com` (email is checked **only** in this migration — never at request time).

## Hub administration

After migrations:

- Settings → **Hub admin** for hub members / super admins
- Sections: Edit page, Resources, Activities, Media, Drafts, Preview, Publish, Hub users, Analytics, Export, Audit
- Public hub content: `GET /api/hubs/public/:slug`
- Tracked downloads: `GET /api/resources/:id/download` (Bearer or `?access_token=`)

## 2. Upload binary files

Upload the Desktop Jazz North PDFs/ZIPs to the allow-listed host paths matching `resources.download_url`, **or** update those URLs to Supabase Storage public/signed paths on `*.supabase.co`.

Allow-listed hosts by default: `www.rhythmstix.co.uk`, `rhythmstix.co.uk`, `*.supabase.co` storage paths. Extend with `DOWNLOAD_ALLOWLIST_HOSTS`.

## 3. Vercel environment variables

Set for Production (and Preview if testing):

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | create-user, register, download insert, anonymise |
| `SUPABASE_JWT_SECRET` | Strongly recommended | Verify Bearer JWTs on APIs |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Yes | Project URL |
| `VITE_APP_URL` | Yes | Invite/reset redirects |
| `RESEND_API_KEY` | Optional | Branded emails from API |
| `RESEND_FROM_EMAIL` | Optional | From address |
| `IP_HASH_SALT` | Optional | IP hash salt |
| `DOWNLOAD_ALLOWLIST_HOSTS` | Optional | Extra redirect hosts |
| `PDFBOLT_API_KEY` | Existing | PDF export |

## 4. Deploy

Push this feature branch / merge to the Vercel-connected branch. Confirm `/api/create-user` returns JSON (not SPA HTML). `vercel.json` rewrites exclude `/api/*`.

## 5. Smoke test

1. Admin → Users → Create User (invite) with Authorization working.
2. Open `/jazznorth` signed out → Download → sign-in modal.
3. Sign in → download → 302 to allow-listed URL; row in `download_events`.
4. Settings → My Downloads shows the event (UK time).
5. Admin → Download analytics → CSV export.
6. Suspend / anonymise / last-admin protection.

## Local without service role

Implementations and tests run without live credentials. For local UI, set `VITE_VERCEL_URL` to a deployed Preview that has the secrets, or run against production carefully.
