/**
 * POST /api/generate-pdf
 * Generate PDF via PDFBolt, upload to DreamHost, return authenticated proxy URL.
 *
 * Env: PDFBOLT_API_KEY, DREAMHOST_PDF_UPLOAD_URL, DREAMHOST_PDF_API_KEY
 * Optional: DREAMHOST_PDF_BASE_URL, SUPABASE_JWT_SECRET
 */
import {
  buildOwnedStoragePath,
  buildProxyFileUrl,
  dreamHostNotConfiguredResponse,
  isDreamHostConfigured,
  uploadToDreamHost,
} from './_dreamhost.js';
import {
  assertAuthorized,
  generatePdfBuffer,
  getPdfBoltApiKey,
  jsonResponse,
  MAX_HTML_BYTES,
  optionsResponse,
  pdfBoltPayloadFromShareBody,
} from './_pdfShared.js';

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

  // assertAuthorized → requireAuth + rate limit (C2 path ownership via auth.userId)
  const auth = await assertAuthorized(request);
  if (!auth.ok) return auth.response;

  if (!isDreamHostConfigured()) {
    return dreamHostNotConfiguredResponse();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400, request);
  }

  const encodedHtml = body?.html;
  if (typeof encodedHtml !== 'string' || encodedHtml.length === 0) {
    return jsonResponse({ error: 'Missing html content' }, 400, request);
  }
  if (Buffer.byteLength(encodedHtml, 'utf8') > MAX_HTML_BYTES) {
    return jsonResponse(
      { error: 'HTML payload exceeds maximum allowed size.' },
      413,
      request,
    );
  }

  const storagePath = buildOwnedStoragePath(auth.userId);

  try {
    const pdfBuffer = await generatePdfBuffer(
      apiKey,
      pdfBoltPayloadFromShareBody({
        html: encodedHtml,
        footerTemplate: body.footerTemplate || '',
        headerTemplate: body.headerTemplate || '',
      }),
    );

    await uploadToDreamHost({
      buffer: pdfBuffer,
      storagePath,
      contentType: 'application/pdf',
    });

    const url = buildProxyFileUrl(request, storagePath);

    return jsonResponse({
      success: true,
      url,
      path: storagePath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    return jsonResponse({ error: message }, 500, request);
  }
}
