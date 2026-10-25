# Direct-to-DreamHost PDF upload (signed token)

Large lesson PDFs bypass the Vercel Function body limit (~4.5 MB) by uploading
straight to DreamHost with a short-lived HMAC token minted by the app API.

## Limits

| Path | Max size | Entry |
|------|----------|--------|
| Vercel JSON (`POST /api/upload-pdf`) | **3 MB** | Content-Length required (411) + size checks → 413 |
| Direct DreamHost (signed token) | **100 MB** | `POST /api/files/upload-token` → PHP stream → `POST /api/files/upload-complete` |

## Required DreamHost layout

Deploy PHP under the site `api/` path (e.g. `…/api/upload-pdf.php`, `…/api/download-pdf.php`).

**Private PDF storage (required — no `api/../pdfs` fallback; missing → HTTP 500):**

- `DREAMHOST_PDF_UPLOAD_DIR` — absolute directory **outside** the web root, **or**
- `ccd_private_pdfs/` as a sibling of the public tree (`dirname(api, 2)/ccd_private_pdfs/`)

Also keep outside the web root:

- `ccd_private/pdf-api-key.php` — secrets
- `ccd_private/upload_nonces/` — single-use nonce files (auto-cleaned after ~35 minutes)
- `ccd_private/upload_tmp/` — streamed upload temps before exclusive place (`link`, or `fopen('xb')` + copy on EXDEV)

**Filesystem:** `upload_tmp/` and the PDF upload dir (`DREAMHOST_PDF_UPLOAD_DIR` / `ccd_private_pdfs/`) **must be on the same filesystem** for `link(temp, final)`. If `link` fails with EXDEV/unsupported and the target does not exist, PHP falls back to `fopen(dest,'xb')` + `stream_copy_to_stream` (exclusive; 409 if the target appears). Prefer co-locating the dirs so `link` succeeds.

**download-pdf.php Range:** every `Range` form is parsed (closed, open-ended, suffix). Multiple ranges → **416**. Single ranges are capped at **64 KiB**; unsatisfiable specs → **416**.

## Env (do not set here — name only)

| Variable | Where | Purpose |
|----------|--------|---------|
| `DREAMHOST_UPLOAD_TOKEN_SECRET` | Vercel **and** DreamHost | HMAC-SHA256 secret for upload tokens (server-only; never `VITE_*`) |
| `DREAMHOST_PDF_UPLOAD_URL` | Vercel | Absolute URL of `upload-pdf.php` (returned to the client as `uploadUrl`) |
| `DREAMHOST_PDF_DOWNLOAD_URL` | Vercel | Absolute URL of `download-pdf.php` (probe / proxy) |
| `DREAMHOST_PDF_API_KEY` | Vercel + DreamHost | Server-to-server X-API-Key (JSON upload + download/probe; not in browser CORS Allow-Headers) |
| `DREAMHOST_PDF_UPLOAD_DIR` | DreamHost | Absolute private storage path (preferred) |
| `DREAMHOST_CORS_ORIGINS` | DreamHost | Comma-separated browser Origins allowed to POST with `X-Upload-Token` |

Optional DreamHost config file `ccd_private/pdf-api-key.php`:

```php
<?php
return [
  'api_key' => '...',
  'upload_token_secret' => '...', // same value as DREAMHOST_UPLOAD_TOKEN_SECRET
];
```

## Token / intent properties (Security Reviewer checklist)

- **Single-use**: nonce in `direct_upload_intents` (consumed on complete) + exclusive file under `ccd_private/upload_nonces/` (consumed on PHP write; stale nonces cleaned ~35m).
- **Upload TTL**: 5 minutes (`UPLOAD_TOKEN_TTL_SEC`) — gates PHP write.
- **Complete grace**: `complete_by = exp + 30 minutes` — gates `upload-complete` (not token `exp`).
- **Bound to**: user id, organisation id, **server-generated** path, max byte size, visibility.
- **Signed**: HMAC-SHA256 with `DREAMHOST_UPLOAD_TOKEN_SECRET`; PHP verifies with `hash_equals`.
- **PHP write**: stream `php://input` in 1MB chunks to private temp → 413 if over max (works without Content-Length) → `%PDF-` + finfo → `rename()` into place (no overwrite).
- **Complete order**: probe object first (`?probe=1` / `Range: bytes=0-4` → 206), then consume intent, then register `stored_files`.
- **Registry**: visibility applied only after successful probe + consume.

## Client

`artifacts/ccd/src/utils/pdfUpload.ts` (`uploadLessonPdf`) used by `LessonPrintModal`:

- size ≤ 3 MB → `/api/upload-pdf`
- 3 MB < size ≤ 100 MB → direct token path
- size > 100 MB → clear error

## Migrations

Apply when ready (service-role only; `REVOKE ALL … FROM anon, authenticated`):

1. `20261024130000_direct_upload_intents.sql`
2. `20261024150000_direct_upload_complete_by.sql` (`complete_by` + revoke)
