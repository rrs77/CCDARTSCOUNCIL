# PDF Export regression check

Use this to verify the Lesson Export → PDF flow after changes.

## Expected behaviour

1. **Export uses PDF service**  
   "Download PDF" calls the backend (Netlify `/.netlify/functions/generate-pdf` or Vercel `/api/generate-pdf`). The service generates the PDF via PDFBolt, uploads it to Supabase Storage, and returns a public URL.

2. **PDF is stored**  
   The returned URL points to the file in Supabase Storage (`lesson-pdfs` bucket). The same URL can be used for "Copy Link" or opening the PDF later.

3. **Links are clickable**  
   The PDF is generated with `emulateMediaType: 'screen'` so resource links (Video, Music, etc.) are real URL annotations and work in viewers.

4. **Custom header & footer**  
   The export modal has "Use custom header & footer" with optional Custom header and Custom footer fields. When set, they appear in the exported PDF.

## Quick verification (manual)

### 1. Service call

1. Open DevTools → Network.
2. Export a lesson (e.g. from lesson list → Export lesson → Download PDF).
3. Confirm a **POST** request to:
   - `/.netlify/functions/generate-pdf` (Netlify), or
   - `/api/generate-pdf` (Vercel).
4. Response should be **200** with JSON `{ success: true, url: "https://...", path: "..." }`.

### 2. Stored PDF / URL

- Copy the `url` from the response.
- Open it in a new tab; the PDF should load (same as the downloaded file).

### 3. Clickable links

- Open the exported PDF in at least two viewers (e.g. browser, Preview, Acrobat).
- Find a resource link (e.g. "Video" or "Music") and click it.
- It should open the target URL (or prompt to open).

### 4. Custom header/footer

- In the export modal, check "Use custom header & footer".
- Enter a custom header (e.g. "My Lesson Title") and footer (e.g. "My School • 2026").
- Export and open the PDF; the header and footer should show your text.

## Instrumentation (development)

When running in dev (`import.meta.env.DEV`), the app logs:

- `[PDF Export] Using service path: <url>` – which API is used.
- `[PDF Export] Service returned url: <url>` – stored PDF URL.
- On error: `[PDF Export] Service error:` or `[PDF Export] No url in response:`.

Remove or guard these with a feature flag before production if you want to avoid any console output.

## Scripted check (optional)

To automate the "service called + returns url" part:

1. Start the app and Netlify dev (or use a deployed URL).
2. In a test script: POST to `/.netlify/functions/generate-pdf` with minimal body  
   `{ "html": "<base64 of simple HTML>", "footerTemplate": "", "fileName": "test/check.pdf" }`.
3. Assert status 200 and `response.url` is a string and starts with `https://`.
4. Optionally `fetch(response.url)` and assert Content-Type is `application/pdf`.

Link annotation checks (clickable links) remain manual or require a PDF library to parse the file.
