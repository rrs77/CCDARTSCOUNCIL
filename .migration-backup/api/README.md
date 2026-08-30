# Vercel API Routes

This directory contains serverless functions for Vercel.

## Routes

### `/api/generate-pdf`
Generates a PDF from HTML (via PDFBolt) and uploads it to **Vercel Blob Storage**, returning a public URL. Used for lesson “Copy Link” / share.

**Required in Vercel:**

1. **Environment variables (Settings → Environment Variables):**
   - `PDFBOLT_API_KEY` or `VITE_PDFBOLT_API_KEY` – your [PDFBolt](https://www.pdfbolt.com/) API key
   - `BLOB_READ_WRITE_TOKEN` – **do not set by hand**; it is created automatically when you add a Blob store (see below)

2. **Blob store (Storage tab):**
   - Project → **Storage** → Create **Blob** store (e.g. name `lesson-pdfs`)
   - Vercel then adds `BLOB_READ_WRITE_TOKEN` for you

3. **Redeploy** after adding the key and/or creating the Blob store.

**Request:**
```json
{
  "html": "base64-encoded-html-content",
  "footerTemplate": "base64-encoded-footer-html",
  "fileName": "shared-pdfs/timestamp_lesson.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://...blob.vercel-storage.com/...",
  "path": "shared-pdfs/timestamp_lesson.pdf"
}
```

See **docs/VERCEL_PDF_ENV_CHECKLIST.md** for a step-by-step fix if you see “PDF generation service error”.

## Deployment

1. Ensure `api/generate-pdf.js` exists in your project.
2. Deploy to Vercel (git push or Vercel CLI).
3. Set `PDFBOLT_API_KEY` (or `VITE_PDFBOLT_API_KEY`) in Vercel → Settings → Environment Variables.
4. Create a Blob store: Project → Storage → Create Blob Store (so `BLOB_READ_WRITE_TOKEN` is set).
5. Redeploy after changing env vars or Storage.

## Troubleshooting

**“PDF generation service error” / 500:**
- See **docs/VERCEL_PDF_ENV_CHECKLIST.md**.
- In Vercel: Deployments → latest deployment → **Functions** / **Logs** → `api/generate-pdf` for the exact error.

**BLOB_READ_WRITE_TOKEN not found:**
- Create a Blob store in the project’s **Storage** tab (Vercel creates the token automatically), then redeploy.

**PDFBOLT_API_KEY not set:**
- Add `PDFBOLT_API_KEY` or `VITE_PDFBOLT_API_KEY` in Settings → Environment Variables and redeploy.
