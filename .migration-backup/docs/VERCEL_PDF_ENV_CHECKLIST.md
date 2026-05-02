# Fix: PDF generation service error on Vercel

If you see: **"PDF generation service error. Ensure PDFBOLT_API_KEY and BLOB_READ_WRITE_TOKEN are set in Vercel environment variables"** — follow these steps.

## 1. Set PDFBolt API key

1. Get an API key from https://www.pdfbolt.com/
2. Vercel Dashboard → Your project → **Settings** → **Environment Variables**
3. Add:
   - **Name:** `PDFBOLT_API_KEY` (or `VITE_PDFBOLT_API_KEY`)
   - **Value:** your PDFBolt API key
   - **Environments:** Production (and Preview if needed)
4. Save

## 2. Create a Blob store (for BLOB_READ_WRITE_TOKEN)

You do **not** set `BLOB_READ_WRITE_TOKEN` manually. Vercel creates it when you add a Blob store.

1. Vercel Dashboard → Your project → **Storage** tab (top navigation)
2. Click **Create Blob Store** (or Create Store → Blob)
3. Name it (e.g. `lesson-pdfs`) and create
4. Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your project. You can confirm under Settings → Environment Variables

## 3. Redeploy

- **Deployments** → ... on latest deployment → **Redeploy**
- Or push a new commit to trigger a deploy

The function must be redeployed to pick up the new env vars and Blob token.

## 4. If it still fails: check function logs

1. **Deployments** → click latest deployment
2. Open **Functions** (or Logs) and find **api/generate-pdf**
3. Look for:
   - `PDFBOLT_API_KEY not set` → add the key and redeploy
   - `BLOB_READ_WRITE_TOKEN not found` → create the Blob store (step 2) and redeploy

## Summary

| Step | Action |
|------|--------|
| 1 | Add `PDFBOLT_API_KEY` or `VITE_PDFBOLT_API_KEY` in Vercel env vars |
| 2 | Create a Blob store in Storage so Vercel sets `BLOB_READ_WRITE_TOKEN` |
| 3 | Redeploy |

More detail: see **VERCEL_BLOB_SETUP.md** in this folder.
