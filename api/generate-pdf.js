/**
 * POST /api/generate-pdf
 * Generate PDF via PDFBolt, upload to Supabase Storage, return public URL (Copy Link).
 *
 * Env: PDFBOLT_API_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Optional: SUPABASE_URL / VITE_SUPABASE_URL, SUPABASE_JWT_SECRET
 */
import { createClient } from '@supabase/supabase-js';
import {
  assertAuthorized,
  DEFAULT_SUPABASE_URL,
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

  const encodedHtml = body?.html;
  if (typeof encodedHtml !== 'string' || encodedHtml.length === 0) {
    return jsonResponse({ error: 'Missing html content' }, 400);
  }
  if (Buffer.byteLength(encodedHtml, 'utf8') > MAX_HTML_BYTES) {
    return jsonResponse({ error: 'HTML payload exceeds maximum allowed size.' }, 413);
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return jsonResponse(
      {
        error:
          'Copy link requires SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.',
      },
      503,
    );
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const fileNameRaw =
    typeof body.fileName === 'string' && body.fileName
      ? body.fileName
      : `shared-pdfs/${Date.now()}_lesson.pdf`;
  const storagePath = fileNameRaw.startsWith('shared-pdfs/')
    ? fileNameRaw
    : `shared-pdfs/${fileNameRaw}`;

  try {
    const pdfBuffer = await generatePdfBuffer(
      apiKey,
      pdfBoltPayloadFromShareBody({
        html: encodedHtml,
        footerTemplate: body.footerTemplate || '',
        headerTemplate: body.headerTemplate || '',
      }),
    );

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error: uploadError } = await supabase.storage
      .from('lesson-pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return jsonResponse({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    const { data: urlData } = supabase.storage
      .from('lesson-pdfs')
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      return jsonResponse({ error: 'No public URL returned after upload.' }, 500);
    }

    return jsonResponse({
      success: true,
      url: urlData.publicUrl,
      path: storagePath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    return jsonResponse({ error: message }, 500);
  }
}
