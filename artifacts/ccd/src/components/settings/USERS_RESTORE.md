# Users / org admin — what we found and restored

## Git history (already on this tree)

| SHA | What |
| --- | --- |
| `94d3a47` | Users list, Create User, resend-invite, forgot password |
| `573b42b` | Reset password page (`/reset-password`) |
| `b6f8da3` | Full user-mgmt APIs + ForcePasswordChangeGate |
| `8a8ab3c` | Hub admin + org scoping |
| `3d932b3` | Server-side `/api/users/list` with org/hub scope |
| `c1105af` | Invite-only create + local api-server mount |
| `a942f8f` | Settings top-level Users section (this branch) |

There was **never** a separate `/set-password` route. Invitees use **`/reset-password`** (invite/recovery link). Forced change after login uses **`ForcePasswordChangeGate`**. Account menu now also has **Change password**.

## Org / hub scoping (API)

- **Full admins** (`admin` / `superuser` / `super_admin`): see all users; can invite any role (super only by super).
- **`can_manage_users` without full admin** (school / hub leads): list filtered to their `organisation_id` + hubs where they are `hub_administrator`. Create-user forces their organisation and blocks minting system admins.

## Live data vs demo

1. Prefer `GET /api/users/list` (needs `SUPABASE_SERVICE_ROLE_KEY` on api-server).
2. Else client `profiles` SELECT under RLS (migration `20261019_profiles_admin_read_scope.sql`).
3. Else demo roster (includes Rob as `super_admin` + Chelmsford Music Hub org admin for UI demos).

## Rob as super admin

Migration `20260903_hub_administration.sql` (and re-applied in `20261019_profiles_admin_read_scope.sql`) sets `rob.reichstorer@gmail.com` → `super_admin` when that profile exists. Also matches typo `@gmaill.com` in the new migration. **Email is never checked at request time** — only roles.

## Env / migrations needed

See PR notes: run `20260902`, `20260903`, `20260914`, `20261019_profiles_admin_read_scope.sql`; set `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `VITE_APP_URL`, optional Resend.
