/**
 * POST /api/pdf/generate
 * Proxies to PDFBolt and returns application/pdf bytes for Export PDF.
 *
 * Env: PDFBOLT_API_KEY
 * Auth: requireAuth via assertAuthorized (+ rate limit)
 */
import {
  assertAuthorized,
  corsHeaders,
  generatePdfBuffer,
  getPdfBoltApiKey,
  jsonResponse,
  MAX_HTML_BYTES,
  optionsResponse,
  whitelistPdfBoltPayload,
} from '../_pdfShared.js';

export const config = {
  maxDuration: 60,
};

export async function OPTIONS(request) {
  return optionsResponse(request);
}

export async function POST(request) {
  const apiKey = getPdfBoltApiKey();
  if (!apiKey) {
    return jsonResponse(
      { error: 'PDF generation is not configured. Set PDFBOLT_API_KEY in Vercel env.' },
      503,
      request,
    );
  }

  const auth = await assertAuthorized(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400, request);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Invalid request payload.' }, 400, request);
  }

  const payload = whitelistPdfBoltPayload(body);
  const html = payload.html;
  if (typeof html !== 'string' || html.length === 0) {
    return jsonResponse({ error: "Missing or empty 'html' field." }, 400, request);
  }
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return jsonResponse(
      { error: 'HTML payload exceeds maximum allowed size.' },
      413,
      request,
    );
  }

  try {
    const pdfBuffer = await generatePdfBuffer(apiKey, payload);
    return new Response(pdfBuffer, {
      status: 200,
      headers: corsHeaders(
        {
          'Content-Type': 'application/pdf',
          'Content-Length': String(pdfBuffer.byteLength),
        },
        request,
      ),
    });
  } catch (error) {
    console.error(
      'pdf/generate failed:',
      error instanceof Error ? error.message : error,
    );
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse(
      { error: 'PDF generation failed.' },
      status >= 400 && status < 600 ? status : 500,
      request,
    );
  }
}
