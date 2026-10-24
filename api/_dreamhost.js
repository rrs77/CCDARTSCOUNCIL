/**
 * Shared DreamHost storage helpers for authenticated upload + proxy.
 *
 * Env (server-only — never VITE_*):
 *   DREAMHOST_PDF_UPLOAD_URL — POST endpoint that accepts { fileData, fileName }
 *   DREAMHOST_PDF_API_KEY    — X-API-Key for that endpoint
 *   DREAMHOST_PDF_BASE_URL   — HTTPS base used by the proxy to fetch objects
 *                              (e.g. https://host/pdfs). Optional if upload
 *                              responses always include a private `url`.
 */

import { randomUUID } from 'node:crypto';
import {
  createServiceClient,
  jsonResponse,
  loadProfile,
} from './_authShared.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** UUID v4-ish path segment (Supabase user ids). */
const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

export function getDreamHostUploadUrl() {
  return (
    process.env.DREAMHOST_PDF_UPLOAD_URL ||
    process.env.PDF_UPLOAD_URL ||
    ''
  ).trim();
}

export function getDreamHostApiKey() {
  return (
    process.env.DREAMHOST_PDF_API_KEY ||
    process.env.PDF_API_KEY ||
    ''
  ).trim();
}

export function getDreamHostBaseUrl() {
  return (
    process.env.DREAMHOST_PDF_BASE_URL ||
    process.env.PDF_STORAGE_BASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
}

export function isDreamHostConfigured() {
  return Boolean(getDreamHostUploadUrl() && getDreamHostApiKey());
}

/**
 * Server-built per-user object key. Never accept a client path.
 * @param {string} userId
 * @returns {string} `<userId>/<uuid>.pdf`
 */
export function buildOwnedStoragePath(userId) {
  if (!userId || !USER_ID_RE.test(userId)) {
    throw new Error('Invalid user id for storage path.');
  }
  return `${userId}/${randomUUID()}.pdf`;
}

/**
 * Validate and normalise a storage path from a proxy request.
 * @returns {string|null}
 */
export function parseOwnedStoragePath(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const cleaned = raw.replace(/^\/+/, '').replace(/\/+/g, '/');
  const parts = cleaned.split('/');
  if (parts.length !== 2) return null;
  const [userId, fileName] = parts;
  if (!USER_ID_RE.test(userId) || !FILE_UUID_RE.test(fileName)) return null;
  if (cleaned.includes('..')) return null;
  return `${userId}/${fileName}`;
}

/**
 * App-facing URL (authenticated proxy). Not a public DreamHost link.
 */
export function buildProxyFileUrl(request, storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path) throw new Error('Invalid storage path.');
  const fromEnv =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  let origin = fromEnv ? String(fromEnv).replace(/\/$/, '') : '';
  if (!origin) {
    try {
      origin = new URL(request.url).origin;
    } catch {
      origin = '';
    }
  }
  const relative = `/api/files/${path}`;
  return origin ? `${origin}${relative}` : relative;
}

/**
 * Upload bytes to DreamHost. Path must already be server-built.
 * No overwrite: DreamHost endpoint must reject existing keys (or we rely on UUID uniqueness).
 *
 * @param {{ buffer: Buffer|Uint8Array, storagePath: string, contentType?: string }} opts
 * @returns {Promise<{ path: string, dreamhostUrl: string|null }>}
 */
export async function uploadToDreamHost({
  buffer,
  storagePath,
  contentType = 'application/pdf',
}) {
  const uploadUrl = getDreamHostUploadUrl();
  const apiKey = getDreamHostApiKey();
  if (!uploadUrl || !apiKey) {
    const err = new Error('DreamHost storage is not configured.');
    err.status = 503;
    throw err;
  }

  const path = parseOwnedStoragePath(storagePath);
  if (!path) {
    const err = new Error('Invalid storage path.');
    err.status = 400;
    throw err;
  }

  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (bytes.byteLength === 0) {
    const err = new Error('Empty file.');
    err.status = 400;
    throw err;
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    const err = new Error('File too large.');
    err.status = 413;
    throw err;
  }

  const fileData = bytes.toString('base64');
  const upstream = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      // Signal no-overwrite; PHP script should honour when present.
      'X-Upsert': 'false',
    },
    body: JSON.stringify({
      fileData,
      fileName: path,
      contentType,
      upsert: false,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    console.error('DreamHost upload failed:', upstream.status, text.slice(0, 200));
    const err = new Error('Upload failed.');
    err.status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
    throw err;
  }

  let result = null;
  try {
    result = await upstream.json();
  } catch {
    result = null;
  }

  if (result && result.success === false) {
    console.error('DreamHost upload rejected:', result.error || result);
    const err = new Error('Upload failed.');
    err.status = 502;
    throw err;
  }

  const dreamhostUrl =
    typeof result?.url === 'string' && result.url.startsWith('https://')
      ? result.url
      : dreamHostObjectUrl(path);

  return { path, dreamhostUrl };
}

/**
 * Absolute URL on DreamHost for a storage path (server-side fetch only).
 */
export function dreamHostObjectUrl(storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path) return null;
  const base = getDreamHostBaseUrl();
  if (!base) return null;
  return `${base}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Fetch object bytes from DreamHost for proxying.
 */
export async function fetchFromDreamHost(storagePath, preferredUrl = null) {
  const apiKey = getDreamHostApiKey();
  const url =
    (typeof preferredUrl === 'string' && preferredUrl.startsWith('https://')
      ? preferredUrl
      : null) || dreamHostObjectUrl(storagePath);
  if (!url) {
    const err = new Error('File storage is not configured.');
    err.status = 503;
    throw err;
  }

  const headers = {};
  if (apiKey) headers['X-API-Key'] = apiKey;

  const upstream = await fetch(url, { method: 'GET', headers });
  if (!upstream.ok) {
    console.error('DreamHost fetch failed:', upstream.status, url.replace(/https:\/\/[^/]+/, 'https://…'));
    const err = new Error(upstream.status === 404 ? 'File not found.' : 'Failed to fetch file.');
    err.status = upstream.status === 404 ? 404 : 502;
    throw err;
  }
  return Buffer.from(await upstream.arrayBuffer());
}

/**
 * Owner or same-organisation colleague may access a stored file.
 * Extensible for future explicit share grants.
 */
export async function userMayAccessStoredFile(userId, storagePath) {
  const path = parseOwnedStoragePath(storagePath);
  if (!path || !userId) return false;
  const ownerId = path.split('/')[0];
  if (userId === ownerId) return true;

  try {
    const [viewer, owner] = await Promise.all([
      loadProfile(userId),
      loadProfile(ownerId),
    ]);
    if (
      viewer?.organisation_id &&
      owner?.organisation_id &&
      viewer.organisation_id === owner.organisation_id &&
      viewer.status !== 'suspended' &&
      !viewer.anonymised_at
    ) {
      return true;
    }

    // Optional explicit share grants table (present when migrations land).
    const service = createServiceClient();
    if (service) {
      const { data } = await service
        .from('file_shares')
        .select('id')
        .eq('storage_path', path)
        .eq('shared_with', userId)
        .maybeSingle();
      if (data?.id) return true;
    }
  } catch (e) {
    console.warn(
      'userMayAccessStoredFile:',
      e instanceof Error ? e.message : e,
    );
  }
  return false;
}

export function dreamHostNotConfiguredResponse() {
  return jsonResponse(
    {
      error:
        'File storage is not configured. Set DREAMHOST_PDF_UPLOAD_URL and DREAMHOST_PDF_API_KEY.',
    },
    503,
  );
}
