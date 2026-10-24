/**
 * Shared PDFBolt helpers for Vercel serverless routes.
 */

import {
  assertRateLimit,
  corsHeaders as sharedCorsHeaders,
  getClientIp,
  jsonResponse as sharedJsonResponse,
  optionsResponse as sharedOptionsResponse,
  requireAuth,
  resolveCorsOrigin,
} from './_authShared.js';

export { resolveCorsOrigin };

export const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';
export const DEFAULT_SUPABASE_URL = 'https://wiudrzdkbpyziaodqoog.supabase.co';
/** Cap HTML payloads early to reduce proxy abuse (PDFBolt also enforces limits). */
export const MAX_HTML_BYTES = 5 * 1024 * 1024;

const DEFAULT_MARGIN = {
  top: '15px',
  right: '20px',
  left: '20px',
  bottom: '55px',
};

/** Keys allowed through to PDFBolt — never forward arbitrary client JSON. */
const PDFBOLT_ALLOWED_KEYS = new Set([
  'html',
  'printBackground',
  'waitUntil',
  'format',
  'margin',
  'displayHeaderFooter',
  'footerTemplate',
  'headerTemplate',
  'emulateMediaType',
]);

export function corsHeaders(extra = {}, request = null) {
  return sharedCorsHeaders(
    {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      ...extra,
    },
    request,
  );
}

export function jsonResponse(body, status = 200, request = null) {
  return sharedJsonResponse(body, status, {}, request);
}

export function optionsResponse(request = null) {
  return sharedOptionsResponse(request);
}

export function getPdfBoltApiKey() {
  // Server-only. Do not fall back to VITE_* (would encourage shipping keys to the client).
  return process.env.PDFBOLT_API_KEY || '';
}

/**
 * Require a valid Supabase JWT and apply a per-IP rate limit.
 * @returns {Promise<{ ok: true, userId: string, ... } | { ok: false, response: Response }>}
 */
export async function assertAuthorized(request) {
  const ip = getClientIp(request) || 'unknown';
  const limited = assertRateLimit(`pdf:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!limited.ok) return limited.response;
  return requireAuth(request);
}

export async function generatePdfBuffer(apiKey, body) {
  const upstream = await fetch(PDFBOLT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      API_KEY: apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    const err = new Error(`PDFBolt error: ${upstream.status} ${errorText}`);
    err.status = upstream.status;
    throw err;
  }

  return Buffer.from(await upstream.arrayBuffer());
}

function sanitiseMargin(margin) {
  if (!margin || typeof margin !== 'object' || Array.isArray(margin)) {
    return { ...DEFAULT_MARGIN };
  }
  const out = { ...DEFAULT_MARGIN };
  for (const key of ['top', 'right', 'left', 'bottom']) {
    const v = margin[key];
    if (typeof v === 'string' && v.length <= 20 && /^[0-9.]+(px|mm|cm|in)?$/i.test(v)) {
      out[key] = v;
    }
  }
  return out;
}

/**
 * Build a whitelisted PDFBolt payload from a share/export request body.
 * Unknown keys are dropped.
 */
export function pdfBoltPayloadFromShareBody(body) {
  const html = typeof body?.html === 'string' ? body.html : '';
  const footerTemplate =
    typeof body?.footerTemplate === 'string' ? body.footerTemplate : '';
  const headerTemplate =
    typeof body?.headerTemplate === 'string' ? body.headerTemplate : '';

  return {
    html,
    printBackground: true,
    waitUntil: 'networkidle',
    format: 'A4',
    margin: sanitiseMargin(body?.margin),
    displayHeaderFooter: true,
    footerTemplate,
    headerTemplate,
    emulateMediaType: 'screen',
  };
}

/**
 * Whitelist an arbitrary client body (e.g. /api/pdf/generate) before PDFBolt.
 */
export function whitelistPdfBoltPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return pdfBoltPayloadFromShareBody({});
  }
  // Start from the safe share shape, then only copy known keys that we already sanitise.
  const base = pdfBoltPayloadFromShareBody(body);
  // Drop anything that somehow snuck onto base outside the allowlist.
  const out = {};
  for (const key of PDFBOLT_ALLOWED_KEYS) {
    if (key in base) out[key] = base[key];
  }
  return out;
}
