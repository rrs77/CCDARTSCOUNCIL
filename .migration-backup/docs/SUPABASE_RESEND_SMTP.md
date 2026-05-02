# Configure Supabase Auth emails with Resend

Use **Resend** as the SMTP provider for Supabase so all auth emails (password reset, email confirmation, magic links) are sent via Resend. This improves deliverability, avoids Supabase’s default rate limits, and lets you use a custom sender (e.g. `noreply@ccdesigner.co.uk`).

## 1. Resend setup

1. Sign up at **[resend.com](https://resend.com)** and log in.
2. **Create an API key**: **API Keys** → **Create API Key** → name it (e.g. “Supabase Auth”) → copy the key (starts with `re_`). You won’t see it again.
3. **Verify your domain** (so you can send from e.g. `noreply@ccdesigner.co.uk`):
   - **Domains** → **Add Domain** → enter `ccdesigner.co.uk` (or your app domain).
   - Add the DNS records Resend shows (SPF, DKIM, etc.) at your DNS provider.
   - Wait until the domain shows as verified.
4. **Sender address**: You’ll use something like `noreply@ccdesigner.co.uk` or `CCDesigner <noreply@ccdesigner.co.uk>` in Supabase. The domain must be the one you verified.

If you don’t verify a domain yet, you can still use Resend’s sandbox domain (e.g. `onboarding@resend.dev`) for testing; add your own email as a recipient in Resend.

## 2. Resend SMTP details

Use these in Supabase:

| Setting    | Value              |
|-----------|--------------------|
| **Host**  | `smtp.resend.com`  |
| **Port**  | `465` (recommended) or `587` |
| **Username** | `resend`        |
| **Password** | Your Resend **API key** (the `re_...` key) |

- Port **465**: SMTPS (implicit TLS).  
- Port **587**: STARTTLS. Use this if 465 doesn’t work.

Reference: [Resend – Send with SMTP](https://resend.com/docs/send-with-smtp).

## 3. Configure Supabase to use Resend

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. Go to **Authentication** → **Providers** (or **Auth** → **Settings**).
3. Find **SMTP Settings** (or **Custom SMTP** / **Email**).
4. **Enable** custom SMTP and fill in:

   - **Sender email**: Your verified address, e.g. `noreply@ccdesigner.co.uk`.
   - **Sender name** (if available): e.g. `CCDesigner` or `Creative Curriculum Designer`.
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (or `587`)
   - **Username**: `resend`
   - **Password**: Your Resend API key (`re_...`).

5. Save. Supabase will send all auth emails (password reset, confirmations, etc.) through Resend.

Reference: [Supabase – Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 4. Brand the emails (optional)

- In Supabase: **Authentication** → **Email Templates**.
- Edit the **Reset Password** (and others if you want) subject and body.
- Use `{{ .ConfirmationURL }}` for the reset link.

See **SUPABASE_EMAIL_BRANDING.md** in this folder for CCDesigner/Rhythmstix wording and link to rhythmstix.co.uk.

## 5. App config (unchanged)

The app already uses `resetPasswordForEmail` and `VITE_APP_URL` for the reset link. No code changes are needed; only Supabase is configured to send via Resend.

**Note:** Resend runs entirely in Supabase (SMTP). The app never calls Resend. So Resend cannot cause the app to load slowly. If the app feels slow after enabling Resend, the cause is likely Supabase response time, network, or data size—not email sending.

## Summary

| Step | Where | What |
|------|--------|------|
| 1 | Resend | Create API key, verify domain, choose sender (e.g. `noreply@ccdesigner.co.uk`) |
| 2 | Supabase → Auth → SMTP | Enable custom SMTP; host `smtp.resend.com`, port 465, user `resend`, password = API key |
| 3 | Supabase → Email Templates | Optionally brand reset email (see SUPABASE_EMAIL_BRANDING.md) |

After this, password reset and other auth emails are sent via Resend with your domain and branding.
