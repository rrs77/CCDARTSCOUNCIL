# Email templates — CCDesigner / Rhythmstix

## Overview

| Email | Sent by | Template source |
|-------|---------|-----------------|
| Account created (temp password) | Vercel `api/create-user` via Resend | `api/_emailTemplates.js` → `accountCreatedEmail` |
| Activate / invite | Supabase invite + optional Resend mirror | `activateAccountEmail` + Dashboard Invite template |
| Verify email | `api/register` via Resend (when link generated) | `verifyEmailTemplate` |
| Reset password | Supabase Auth (custom SMTP → Resend) | Dashboard + `resetPasswordEmail` reference |
| Password changed | App after reset (optional Resend) | `passwordChangedEmail` |

## Env vars

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=CCDesigner <noreply@ccdesigner.co.uk>
VITE_APP_URL=https://www.ccdesigner.co.uk
SUPABASE_SERVICE_ROLE_KEY=...
```

## Supabase Dashboard branding (Auth emails)

1. Configure Resend as custom SMTP — see `.migration-backup/docs/SUPABASE_RESEND_SMTP.md`.
2. **Authentication → Email Templates** — paste HTML/text from `api/_emailTemplates.js` wording.
3. Use `{{ .ConfirmationURL }}` for verify / reset / invite links.
4. Ensure Site URL and redirect allow-list include `VITE_APP_URL` and `/reset-password`.

## Resend from serverless

When `RESEND_API_KEY` is unset, create-user / register still succeed; only the extra branded Resend send is skipped (Supabase may still email via SMTP).
