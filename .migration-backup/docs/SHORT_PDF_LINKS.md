# Short PDF links (e.g. ccdesigner.co.uk/pdf/1)

Create Link can produce short URLs like `https://ccdesigner.co.uk/pdf/1` that redirect to the current lesson PDF. The same short URL is reused for that lesson and always points to the latest generated PDF.

## Setup

1. **Run the Supabase migration** (once) in Supabase SQL Editor:
   - Open `supabase_migrations/create_share_short_links.sql` and run its contents.

2. **Set environment variables** in Vercel (Project → Settings → Environment Variables):
   - **VITE_APP_URL** or **PDF_SHORT_BASE_URL**: your public app URL with no trailing slash, e.g. `https://ccdesigner.co.uk` or `https://www.ccdesigner.co.uk`.
   - Supabase is already used; the redirect uses **VITE_SUPABASE_URL** (or **SUPABASE_URL**) and **VITE_SUPABASE_ANON_KEY** (or **SUPABASE_SERVICE_ROLE_KEY**) to read from `share_short_links`. The generate-pdf API uses the service role (or anon) to write short links.

3. **Redeploy** so the new API route and rewrite are live.

## Behaviour

- When a user clicks **Copy Link** for a lesson, the app generates the PDF, uploads it to Vercel Blob, and (if the env vars above are set) registers a short code (derived from the lesson number) in `share_short_links`.
- The share URL shown and copied is the short URL (e.g. `https://ccdesigner.co.uk/pdf/1`) when registration succeeds; otherwise it falls back to the long blob URL.
- Visiting the short URL triggers a 302 redirect to the current blob URL, so the link keeps working and always shows the latest PDF for that lesson when you regenerate.

## Optional

- To use a different base URL only for short links, set **PDF_SHORT_BASE_URL** and leave **VITE_APP_URL** for the rest of the app (e.g. password reset emails).
