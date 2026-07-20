/**
 * POST /api/pdf/generate
 * Proxies to PDFBolt and returns application/pdf bytes for Export PDF.
 *
 * Env: PDFBOLT_API_KEY (or VITE_PDFBOLT_API_KEY)
 * Optional: SUPABASE_JWT_SECRET (when set, requires Authorization: Bearer)
 */
import {
  assertAuthorized,
  corsHeaders,
  generatePdfBuffer,
  getPdfBoltApiKey,
  jsonResponse,
  MAX_HTML_BYTES,
  optionsResponse,
} from '../_pdfShared.js';

export const config = {
  maxDuration: 60,
};

export async function OPTIONS() {
  return optionsResponse();
}

export async function POST(request) {
  const apiKey = getPdfBoltApiKey();
  if (!apiKey) {
    return jsonResponse(
      { error: 'PDF generation is not configured. Set PDFBOLT_API_KEY in Vercel env.' },
      503,
    );
  }

  const auth = await assertAuthorized(request);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'Invalid request payload.' }, 400);
  }

  const html = body.html;
  if (typeof html !== 'string' || html.length === 0) {
    return jsonResponse({ error: "Missing or empty 'html' field." }, 400);
  }
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return jsonResponse({ error: 'HTML payload exceeds maximum allowed size.' }, 413);
  }

  try {
    const pdfBuffer = await generatePdfBuffer(apiKey, body);
    return new Response(pdfBuffer, {
      status: 200,
      headers: corsHeaders({
        'Content-Type': 'application/pdf',
        'Content-Length': String(pdfBuffer.byteLength),
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    const status = error?.status && Number.isFinite(error.status) ? error.status : 500;
    return jsonResponse({ error: message }, status);
  }
}
