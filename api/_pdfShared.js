/**
 * Shared PDFBolt helpers for Vercel serverless routes.
 */

export const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';
export const DEFAULT_SUPABASE_URL = 'https://wiudrzdkbpyziaodqoog.supabase.co';
export const MAX_HTML_BYTES = 40 * 1024 * 1024;

export function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...extra,
  };
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function getPdfBoltApiKey() {
  return process.env.PDFBOLT_API_KEY || process.env.VITE_PDFBOLT_API_KEY || '';
}

/**
 * Optional JWT check. When SUPABASE_JWT_SECRET is unset, allow the request
 * (PDFBOLT key still required) so export works after setting only PDFBOLT_API_KEY.
 */
export async function assertAuthorized(request) {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) return { ok: true };

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
    }
    // Prefer jose if available; fall back to soft decode + HMAC via Web Crypto
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = enc.encode(`${parts[0]}.${parts[1]}`);
    const sig = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify('HMAC', key, sig, data);
    if (!valid) {
      return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
    }
    return { ok: true };
  } catch {
    return { ok: false, response: jsonResponse({ error: 'Unauthorized' }, 401) };
  }
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

export function pdfBoltPayloadFromShareBody(body) {
  return {
    html: body.html,
    printBackground: true,
    waitUntil: 'networkidle',
    format: 'A4',
    margin: { top: '15px', right: '20px', left: '20px', bottom: '55px' },
    displayHeaderFooter: true,
    footerTemplate: body.footerTemplate || '',
    headerTemplate: body.headerTemplate || '',
    emulateMediaType: 'screen',
  };
}
