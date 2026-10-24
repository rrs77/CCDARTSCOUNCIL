/**
 * Direct-to-DreamHost signed upload tokens.
 *
 * Env (server-only — never VITE_*):
 *   DREAMHOST_UPLOAD_TOKEN_SECRET — HMAC-SHA256 key (also on DreamHost PHP)
 *
 * Token = base64url(JSON payload) + "." + base64url(HMAC-SHA256)
 * Payload binds: user id, org id, server path, max bytes, exp, nonce.
 * TTL: 5 minutes. Nonce is single-use (DB intent + PHP exclusive file).
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServiceClient } from './_authShared.js';
import {
  buildOwnedStoragePath,
  FILE_VISIBILITY,
  getDreamHostUploadUrl,
  normalizeVisibility,
  parseOwnedStoragePath,
} from './_dreamhost.js';

/** Honest Vercel Function JSON body cap (base64 PDF via /api/upload-pdf). */
export const MAX_VERCEL_BODY_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Direct DreamHost / PHP cap (signed-token path). */
export const MAX_DIRECT_UPLOAD_BYTES = 100 * 1024 * 1024;

/** Content-Length ceiling for Vercel JSON upload (base64 ≈ 4/3 + JSON headroom). */
export const VERCEL_JSON_CONTENT_LENGTH_LIMIT =
  Math.floor(MAX_VERCEL_BODY_UPLOAD_BYTES * (4 / 3)) + 8192;

export const UPLOAD_TOKEN_TTL_SEC = 5 * 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getUploadTokenSecret() {
  return (process.env.DREAMHOST_UPLOAD_TOKEN_SECRET || '').trim();
}

export function isUploadTokenConfigured() {
  return Boolean(getUploadTokenSecret() && getDreamHostUploadUrl());
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function b64urlDecode(str) {
  return Buffer.from(String(str), 'base64url');
}

/**
 * @param {object} claims
 * @returns {string}
 */
export function signUploadToken(claims) {
  const secret = getUploadTokenSecret();
  if (!secret) {
    const err = new Error('Upload token secret is not configured.');
    err.status = 503;
    throw err;
  }
  const body = b64url(JSON.stringify(claims));
  const sig = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/**
 * Verify HMAC with timing-safe compare. Returns claims or null.
 * @param {string} token
 * @returns {null | {
 *   userId: string,
 *   orgId: string,
 *   path: string,
 *   maxBytes: number,
 *   exp: number,
 *   nonce: string,
 *   visibility: string,
 * }}
 */
export function verifyUploadToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const secret = getUploadTokenSecret();
  if (!secret) return null;

  const [body, sig] = token.split('.', 2);
  if (!body || !sig) return null;

  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let raw;
  try {
    raw = JSON.parse(b64urlDecode(body).toString('utf8'));
  } catch {
    return null;
  }

  if (!raw || typeof raw !== 'object') return null;
  const userId = typeof raw.u === 'string' ? raw.u : '';
  const orgId = typeof raw.o === 'string' ? raw.o : '';
  const path = typeof raw.p === 'string' ? raw.p : '';
  const maxBytes = Number(raw.m);
  const exp = Number(raw.e);
  const nonce = typeof raw.n === 'string' ? raw.n : '';
  const visibility = normalizeVisibility(raw.v);

  if (!UUID_RE.test(userId) || !UUID_RE.test(nonce)) return null;
  if (!parseOwnedStoragePath(path)) return null;
  if (!Number.isFinite(maxBytes) || maxBytes < 1 || maxBytes > MAX_DIRECT_UPLOAD_BYTES) {
    return null;
  }
  if (!Number.isFinite(exp)) return null;

  return { userId, orgId, path, maxBytes, exp, nonce, visibility };
}

/**
 * Mint a short-lived direct-upload token and store the nonce intent (single-use).
 * Path is always server-generated. Client never chooses the path.
 *
 * @param {{
 *   userId: string,
 *   orgId?: string | null,
 *   byteLength: number,
 *   visibility?: string,
 * }} opts
 */
export async function mintDirectUploadIntent(opts) {
  const { userId, orgId = '', byteLength, visibility = FILE_VISIBILITY.ORG } = opts;
  if (!UUID_RE.test(userId)) {
    const err = new Error('Invalid user id.');
    err.status = 400;
    throw err;
  }
  if (!Number.isFinite(byteLength) || byteLength < 1) {
    const err = new Error('Invalid byteLength.');
    err.status = 400;
    throw err;
  }
  if (byteLength > MAX_DIRECT_UPLOAD_BYTES) {
    const err = new Error(
      `File too large. Maximum upload size is ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)} MB.`,
    );
    err.status = 413;
    throw err;
  }
  if (!isUploadTokenConfigured()) {
    const err = new Error('Direct upload is not configured.');
    err.status = 503;
    throw err;
  }

  const service = createServiceClient();
  if (!service) {
    const err = new Error('Service unavailable.');
    err.status = 503;
    throw err;
  }

  const storagePath = buildOwnedStoragePath(userId);
  const nonce = randomUUID();
  const exp = Math.floor(Date.now() / 1000) + UPLOAD_TOKEN_TTL_SEC;
  const mode = normalizeVisibility(visibility);
  // Clients cannot self-register as licensed.
  const safeVis =
    mode === FILE_VISIBILITY.LICENSED ? FILE_VISIBILITY.PRIVATE : mode;

  const claims = {
    u: userId,
    o: orgId ? String(orgId) : '',
    p: storagePath,
    m: byteLength,
    e: exp,
    n: nonce,
    v: safeVis,
  };
  const token = signUploadToken(claims);

  const { error } = await service.from('direct_upload_intents').insert({
    nonce,
    user_id: userId,
    organisation_id: orgId || null,
    storage_path: storagePath,
    max_bytes: byteLength,
    visibility: safeVis,
    expires_at: new Date(exp * 1000).toISOString(),
  });

  if (error) {
    console.error('direct_upload_intents insert:', error.message);
    const err = new Error('Could not create upload intent.');
    err.status = 500;
    throw err;
  }

  return {
    token,
    uploadUrl: getDreamHostUploadUrl(),
    path: storagePath,
    maxBytes: byteLength,
    expiresAt: exp,
    nonce,
    visibility: safeVis,
  };
}

/**
 * Consume a pending intent (single-use). Returns claims from DB or null.
 * @param {{ nonce: string, userId: string, path: string }} opts
 */
export async function consumeDirectUploadIntent({ nonce, userId, path }) {
  if (!UUID_RE.test(nonce) || !UUID_RE.test(userId)) return null;
  const storagePath = parseOwnedStoragePath(path);
  if (!storagePath) return null;

  const service = createServiceClient();
  if (!service) return null;

  const nowIso = new Date().toISOString();
  const { data, error } = await service
    .from('direct_upload_intents')
    .update({ consumed_at: nowIso })
    .eq('nonce', nonce)
    .eq('user_id', userId)
    .eq('storage_path', storagePath)
    .is('consumed_at', null)
    .gt('expires_at', nowIso)
    .select('nonce, user_id, organisation_id, storage_path, max_bytes, visibility')
    .maybeSingle();

  if (error) {
    console.error('consumeDirectUploadIntent:', error.message);
    return null;
  }
  return data || null;
}

/**
 * Estimate decoded size from base64 string length (ignore padding loosely).
 * @param {string} b64
 * @returns {number}
 */
export function estimateBase64DecodedBytes(b64) {
  if (typeof b64 !== 'string' || !b64) return 0;
  const len = b64.length;
  let pad = 0;
  if (b64.endsWith('==')) pad = 2;
  else if (b64.endsWith('=')) pad = 1;
  return Math.max(0, Math.floor((len * 3) / 4) - pad);
}

/**
 * Vercel JSON upload Content-Length gate (before request.json()).
 * @param {string | null | undefined} contentLengthHeader
 * @param {number} [limit=VERCEL_JSON_CONTENT_LENGTH_LIMIT]
 * @returns {{ status: 411 | 413, error: string, code?: string } | null} null = OK
 */
export function vercelUploadContentLengthGate(
  contentLengthHeader,
  limit = VERCEL_JSON_CONTENT_LENGTH_LIMIT,
) {
  if (contentLengthHeader == null || String(contentLengthHeader).trim() === '') {
    return {
      status: 411,
      error: 'Content-Length header is required.',
    };
  }
  const cl = Number(contentLengthHeader);
  if (!Number.isFinite(cl) || cl < 0) {
    return {
      status: 411,
      error: 'Content-Length header is required.',
    };
  }
  if (cl > limit) {
    return {
      status: 413,
      error: `File too large for this upload route (max ${MAX_VERCEL_BODY_UPLOAD_BYTES / (1024 * 1024)} MB). Use direct upload for files up to ${MAX_DIRECT_UPLOAD_BYTES / (1024 * 1024)} MB.`,
      code: 'USE_DIRECT_UPLOAD',
    };
  }
  return null;
}
