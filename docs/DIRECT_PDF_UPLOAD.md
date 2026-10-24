# Direct-to-DreamHost PDF upload (signed token)

Large lesson PDFs bypass the Vercel Function body limit (~4.5 MB) by uploading
straight to DreamHost with a short-lived HMAC token minted by the app API.

## Limits

| Path | Max size | Entry |
|------|----------|--------|
| Vercel JSON (`POST /api/upload-pdf`) | **3 MB** | Content-Length pre-check + base64 length check → 413 |
| Direct DreamHost (signed token) | **100 MB** | `POST /api/files/upload-token` → PHP → `POST /api/files/upload-complete` |

## Env (do not set here — name only)

| Variable | Where | Purpose |
|----------|--------|---------|
| `DREAMHOST_UPLOAD_TOKEN_SECRET` | Vercel **and** DreamHost | HMAC-SHA256 secret for upload tokens (server-only; never `VITE_*`) |
| `DREAMHOST_PDF_UPLOAD_URL` | Vercel | Absolute URL of `upload-pdf.php` (returned to the client as `uploadUrl`) |
| `DREAMHOST_PDF_API_KEY` | Vercel + DreamHost | Server-to-server API key (JSON base64 mode) |
| `DREAMHOST_CORS_ORIGINS` | DreamHost | Comma-separated browser Origins allowed to POST with `X-Upload-Token` |

Optional DreamHost config file `ccd_private/pdf-api-key.php`:

```php
<?php
return [
  'api_key' => '...',
  'upload_token_secret' => '...', // same value as DREAMHOST_UPLOAD_TOKEN_SECRET
];
```

## Token properties (Security Reviewer checklist)

- **Single-use**: nonce stored in `direct_upload_intents` (consumed on complete) and as an exclusive file under `ccd_private/upload_nonces/` on DreamHost (consumed on PHP write).
- **Short-lived**: 5 minutes (`UPLOAD_TOKEN_TTL_SEC`).
- **Bound to**: user id, organisation id, **server-generated** path (`userId/uuid.pdf` — client never picks the path), max byte size, visibility.
- **Signed**: HMAC-SHA256 with `DREAMHOST_UPLOAD_TOKEN_SECRET`; PHP verifies with `hash_equals`.
- **PHP write**: `%PDF-` magic + `finfo` `application/pdf`; `fopen(..., 'xb')` exclusive (no overwrite); enforces token max / 100 MB.
- **Registry**: `stored_files` row (and visibility) created only after `upload-complete` verifies the object exists.

## Client

`artifacts/ccd/src/utils/pdfUpload.ts` (`uploadLessonPdf`) used by `LessonPrintModal`:

- size ≤ 3 MB → `/api/upload-pdf`
- 3 MB < size ≤ 100 MB → direct token path
- size > 100 MB → clear error

## Migration

Apply `supabase/migrations/20261024130000_direct_upload_intents.sql` when ready (service-role only; no client RLS policies).
