/**
 * Server-only Freesound helpers (search + preview proxy).
 * Secret: FREESOUND_API_KEY (never VITE_*).
 */

import {
  assertRateLimit,
  getClientIp,
  jsonResponse,
  optionsResponse,
  requireAuth,
} from './_authShared.js';

export const FREESOUND_API_BASE = 'https://freesound.org/apiv2';
export const FREESOUND_PAGE_SIZE_MAX = 20;
export const FREESOUND_QUERY_MAX = 200;

export function getFreesoundApiKey() {
  const key = (process.env.FREESOUND_API_KEY || '').trim();
  return key || '';
}

export function isFreesoundConfigured() {
  return Boolean(getFreesoundApiKey());
}

/**
 * @param {Request} request
 * @param {string} bucket
 * @param {{ limit?: number, windowMs?: number }} [opts]
 */
export function assertFreesoundRateLimit(request, bucket, opts = {}) {
  const ip = getClientIp(request) || 'unknown';
  return assertRateLimit(`freesound:${bucket}:${ip}`, {
    limit: opts.limit ?? 30,
    windowMs: opts.windowMs ?? 60_000,
  });
}

export async function requireFreesoundAuth(request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth;
  const limited = assertFreesoundRateLimit(request, auth.userId || 'anon');
  if (!limited.ok) return { ok: false, response: limited.response };
  return auth;
}

export function freesoundNotConfiguredResponse(request) {
  return jsonResponse(
    {
      error: 'Freesound is not configured.',
      available: false,
    },
    503,
    {},
    request,
  );
}

/**
 * Whitelist search query params. Only `query`/`q`, `page`, `page_size`.
 * @param {URLSearchParams} incoming
 */
export function buildFreesoundSearchParams(incoming) {
  const rawQuery = (incoming.get('query') || incoming.get('q') || '').trim();
  if (!rawQuery) {
    return { ok: false, error: 'query is required.' };
  }
  if (rawQuery.length > FREESOUND_QUERY_MAX) {
    return { ok: false, error: 'query is too long.' };
  }

  let pageSize = Number.parseInt(incoming.get('page_size') || '20', 10);
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 20;
  pageSize = Math.min(FREESOUND_PAGE_SIZE_MAX, pageSize);

  let page = Number.parseInt(incoming.get('page') || '1', 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  page = Math.min(page, 50);

  const params = new URLSearchParams({
    query: rawQuery,
    page: String(page),
    page_size: String(pageSize),
    fields: 'id,name,previews,images,license,username,url',
    filter: 'license:"Creative Commons 0"',
  });

  return { ok: true, params };
}

/**
 * @param {string|number} raw
 * @returns {number|null}
 */
export function parseFreesoundSoundId(raw) {
  const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw || ''), 10);
  if (!Number.isFinite(n) || n < 1 || n > 2_147_483_647) return null;
  return n;
}

/**
 * Call Freesound API with the server token (Authorization: Token …).
 * @param {string} pathAndQuery path starting with / e.g. /search/text/?…
 */
export async function freesoundFetch(pathAndQuery, { signal } = {}) {
  const key = getFreesoundApiKey();
  if (!key) {
    const err = new Error('Freesound is not configured.');
    err.status = 503;
    throw err;
  }
  const url = `${FREESOUND_API_BASE}${pathAndQuery.startsWith('/') ? pathAndQuery : `/${pathAndQuery}`}`;
  const res = await fetch(url, {
    signal,
    headers: {
      Authorization: `Token ${key}`,
      Accept: 'application/json',
    },
  });
  return res;
}

export { jsonResponse, optionsResponse };
