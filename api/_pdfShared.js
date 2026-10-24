/**
 * Shared PDFBolt helpers for Vercel serverless routes.
 */

import {
  assertRateLimit,
  getClientIp,
  requireAuth,
} from './_authShared.js';

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

function parseCorsAllowlist() {
  const raw =
    process.env.CORS_ALLOWED_ORIGINS ||
    process.env.ALLOWED_ORIGINS ||
    '';
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const extras = [];
  if (process.env.VITE_APP_URL) {
    extras.push(String(process.env.VITE_APP_URL).replace(/\/$/, ''));
  }
  if (process.env.APP_URL) {
    extras.push(String(process.env.APP_URL).replace(/\/$/, ''));
  }
  if (process.env.VERCEL_URL) {
    extras.push(`https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}`);
  }
  return [...new Set([...fromEnv, ...extras])];
}

/**
 * Reflect Origin only when it is on the allowlist; otherwise omit ACAO
 * (browsers treat missing ACAO as blocked for credentialed cross-origin).
 */
export function resolveCorsOrigin(request) {
  const origin = (request?.headers?.get?.('origin') || '').replace(/\/$/, '');
  if (!origin) return null;
  const allow = parseCorsAllowlist();
  if (allow.includes(origin)) return origin;
  return null;
}

export function corsHeaders(extra = {}, request = null) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
    ...extra,
  };
  const allowed = resolveCorsOrigin(request);
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return headers;
}

export function jsonResponse(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders({}, request),
    },
  });
}

export function optionsResponse(request = null) {
  return new Response(null, { status: 204, headers: corsHeaders({}, request) });
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
