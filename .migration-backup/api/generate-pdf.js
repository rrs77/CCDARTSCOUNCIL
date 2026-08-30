/**
 * Vercel Serverless Function: Generate lesson PDF and upload to Vercel Blob Storage.
 * Returns a public URL for the saved PDF (shortcut link for the lesson plan).
 *
 * POST body: { html: string (base64), footerTemplate?: string (base64), headerTemplate?: string (base64), fileName?: string, lessonNumber?: string, returnPdfBlob?: boolean }
 * - If lessonNumber is provided, registers a short URL (e.g. ccdesigner.co.uk/pdf/1) that redirects to this PDF; same lessonNumber overwrites so the short link always points to the latest PDF.
 * Env: VITE_PDFBOLT_API_KEY or PDFBOLT_API_KEY, BLOB_READ_WRITE_TOKEN, VITE_APP_URL or PDF_SHORT_BASE_URL (e.g. https://ccdesigner.co.uk), SUPABASE_SERVICE_ROLE_KEY (or anon), VITE_SUPABASE_URL or SUPABASE_URL
 */

import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const PDFBOLT_API_URL = 'https://api.pdfbolt.com/v1/direct';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request) {
  try {
    // Log that the function was called (for debugging)
    console.log('[generate-pdf] Function called');
    
    const body = await request.json();
    const { html: encodedHtml, footerTemplate: encodedFooter, headerTemplate: encodedHeader, fileName, returnPdfBlob, lessonNumber } = body || {};

    if (!encodedHtml) {
      console.error('[generate-pdf] Missing html content');
      return jsonResponse({ error: 'Missing html content' }, 400);
    }

    const PDFBOLT_API_KEY = process.env.VITE_PDFBOLT_API_KEY || process.env.PDFBOLT_API_KEY;
    if (!PDFBOLT_API_KEY) {
      console.error('[generate-pdf] PDFBOLT_API_KEY not set');
      return jsonResponse({ error: 'PDFBOLT_API_KEY or VITE_PDFBOLT_API_KEY not set in Vercel environment variables' }, 500);
    }

    // Pass base64 HTML and footer directly to PDFBolt. Use emulateMediaType: 'screen' so
    // hyperlinks in the HTML (e.g. resource links) are preserved as clickable in the PDF.
    const pdfResponse = await fetch(PDFBOLT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': PDFBOLT_API_KEY,
      },
      body: JSON.stringify({
        html: encodedHtml,
        printBackground: true,
        waitUntil: 'networkidle',
        format: 'A4',
        margin: { top: '15px', right: '20px', left: '20px', bottom: '55px' },
        displayHeaderFooter: true,
        footerTemplate: encodedFooter || '',
        headerTemplate: encodedHeader || '',
        emulateMediaType: 'screen',
      }),
    });

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error('PDFBolt error:', pdfResponse.status, errText);
      return jsonResponse({ error: `PDF generation failed: ${pdfResponse.status}` }, 500);
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // If client requested blob for download (e.g. Export PDF when no client-side key), return PDF directly
    if (returnPdfBlob) {
      const downloadName = (fileName && typeof fileName === 'string') ? fileName.replace(/^.*\//, '') : 'lesson.pdf';
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${downloadName}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const storageFileName = fileName || `shared-pdfs/${Date.now()}_lesson.pdf`;

    // Use Vercel Blob Storage (free tier: 1 GB storage, 2,000 uploads/month)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('[generate-pdf] BLOB_READ_WRITE_TOKEN not set');
      return jsonResponse({
        error: 'BLOB_READ_WRITE_TOKEN not found. Please create a Blob store in Vercel Dashboard → Storage → Create Blob Store. The token is automatically created.'
      }, 500);
    }

    console.log('[generate-pdf] Configuration OK, uploading to Vercel Blob...');
    try {
      const blob = await put(storageFileName, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
        addRandomSuffix: false,
      });
      console.log('[generate-pdf] PDF uploaded successfully to Vercel Blob:', blob.url);

      let shortUrl = null;
      const shortCode = lessonNumber != null && String(lessonNumber).trim() ? String(lessonNumber).trim().replace(/[^a-zA-Z0-9_-]/g, '') || null : null;
      // Use PDF_SHORT_BASE_URL or VITE_APP_URL; VERCEL_URL is available in serverless so short links work even without custom domain set
      const baseUrlRaw = process.env.PDF_SHORT_BASE_URL || process.env.VITE_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
      const baseUrl = baseUrlRaw.replace(/\/$/, '');
      if (shortCode && baseUrl) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
            const { error: upsertError } = await supabase.from('share_short_links').upsert(
              { short_code: shortCode, blob_url: blob.url, lesson_number: lessonNumber, updated_at: new Date().toISOString() },
              { onConflict: 'short_code' }
            );
            if (!upsertError) {
              shortUrl = `${baseUrl}/pdf/${shortCode}`;
              console.log('[generate-pdf] Short URL registered:', shortUrl);
            } else {
              console.warn('[generate-pdf] Short link upsert failed:', upsertError.message);
            }
          } catch (e) {
            console.warn('[generate-pdf] Short link registration error:', e.message);
          }
        }
      }

      return jsonResponse({ success: true, url: blob.url, path: storageFileName, shortUrl: shortUrl || undefined });
    } catch (blobError) {
      console.error('[generate-pdf] Vercel Blob upload error:', blobError);
      return jsonResponse({ error: `Upload to Vercel Blob failed: ${blobError.message || 'Unknown error'}` }, 500);
    }
  } catch (err) {
    console.error('generate-pdf error:', err);
    return jsonResponse(
      { error: err.message || 'Internal server error' },
      500
    );
  }
}
