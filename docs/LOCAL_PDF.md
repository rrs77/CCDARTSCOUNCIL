# PDF export and share links when running locally

`pnpm dev` (Vite) serves only the front end. The PDF functions live in `/api` and only run
on Vercel (or under `vercel dev`), so locally:

| Feature | Without the API | With the API (`vercel dev` or deployed) |
|---|---|---|
| Export PDF / Print | Browser print opens; choose "Save as PDF" | Downloads a PDF (PDFBolt) |
| Copy link (share) | No link is made. Print opens instead, with a message explaining why | Uploads the PDF to DreamHost and copies a link |

## Running the API locally

1. `vercel link` (once), then `vercel env pull .env.local` to get the variables, or set them by hand.
2. Run `vercel dev` from the repo root instead of `pnpm dev`.

Server-side variables (names only; never prefix them with `VITE_` and never commit values):

- `PDFBOLT_API_KEY`: PDF rendering (`/api/pdf/generate`, `/api/generate-pdf`)
- `DREAMHOST_PDF_UPLOAD_URL`: DreamHost upload endpoint for shared PDFs
- `DREAMHOST_PDF_DOWNLOAD_URL`: public base URL of shared PDFs
- `DREAMHOST_PDF_API_KEY`: key for the DreamHost upload endpoint
- `DREAMHOST_PDF_UPLOAD_DIR`: read by the DreamHost PHP scripts (`dreamhost/api/*.php`), set on the DreamHost side, not in Vercel
- Legacy fallbacks still read by `api/_dreamhost.js`: `PDF_UPLOAD_URL`, `PDF_DOWNLOAD_URL`, `PDF_API_KEY`

To point a local front end at a deployed API instead, set `VITE_API_BASE_URL` (a URL, not a secret)
to the deployment's origin.
