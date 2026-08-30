# Supabase password reset email – CCDesigner branding

The password reset email is sent by **Supabase**, not by this app. To send these emails via **Resend** (better deliverability, your domain, fewer rate limits), see **SUPABASE_RESEND_SMTP.md** first. To make it CCDesigner branded and professional (e.g. Rhythmstix / www.rhythmstix.co.uk), you configure it in the **Supabase Dashboard**.

## 1. Fix the reset link (no localhost)

The link in the email must point to your **production** site, not `http://localhost:3000`.

- In your **deployment** (e.g. Vercel), set:
  - **`VITE_APP_URL`** = `https://www.ccdesigner.co.uk` (or your live app URL)
- In **local** `.env` (so emails sent while testing use the correct link), add:
  - `VITE_APP_URL=https://www.ccdesigner.co.uk`

Then redeploy / restart. The app uses this for the “redirect” URL when requesting a reset, so the email will contain a link like `https://www.ccdesigner.co.uk/reset-password#...` instead of localhost.

## 2. Brand the email in Supabase (CCDesigner / Rhythmstix)

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. Go to **Authentication** → **Email Templates** (or **Auth** → **Email**).
3. Open the **“Reset Password”** (or “Change Email”) template.
4. Customise:
   - **Subject**  
     e.g. `Reset your CCDesigner password` or `Reset your password – Rhythmstix`
   - **Body (HTML)**  
     Use your own layout and text. Supabase replaces the reset link with a variable, usually:
     - **`{{ .ConfirmationURL }}`** (or `{{ .SiteURL }}{{ .ConfirmationURL }}` depending on template)

Example idea (replace with your real site name and link text):

```html
<p>Hello,</p>
<p>You asked to reset your password for <strong>CCDesigner</strong> (from Rhythmstix).</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn’t request this, you can ignore this email.</p>
<p>— CCDesigner / <a href="https://www.rhythmstix.co.uk">Rhythmstix</a></p>
```

5. Optionally set a **custom “Sender” name** in Supabase (e.g. “CCDesigner” or “Rhythmstix”) if the project allows it, so the email doesn’t show “Supabase Auth”.
6. Save the template.

After this, reset emails will be CCDesigner branded and the link will point to your production app (once `VITE_APP_URL` is set as above).
