import { getVercelApiUrl } from './apiUrl';
import { supabase } from '../config/supabase';

/**
 * Returns the URL of the server-side PDF generation proxy.
 * The proxy holds the PDFBolt API key in the server environment — the key
 * is never sent to the browser.
 */
export function getPdfBoltProxyUrl(): string {
  return getVercelApiUrl('/api/pdf/generate');
}

/**
 * Calls the server-side PDF proxy and returns the resulting PDF as a Blob.
 * Attaches the current Supabase access token so the proxy can verify the
 * caller is an authenticated user (guards against open-proxy quota abuse).
 * Throws an Error with a descriptive message on any failure.
 */
export async function generatePdfViaProxy(
  body: Record<string, unknown>,
): Promise<Blob> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // Session lookup failed — no token will be sent; the server will reject
    // the request with 401. PDF exports require an authenticated session.
  }

  let response: Response;
  try {
    response = await fetch(getPdfBoltProxyUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'network error';
    throw new Error(
      `Cannot reach the PDF service (${detail}). Start the API server on port 8080, or use Print → Save as PDF.`,
    );
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = errText;
    try {
      const d = JSON.parse(errText || '{}') as { error?: string };
      if (d.error) msg = d.error;
    } catch (_) {}
    if (!msg || !msg.trim()) {
      msg =
        response.status === 502 || response.status === 503 || response.status === 500
          ? 'PDF service unavailable. Ensure the API server is running and PDFBOLT_API_KEY is set.'
          : `PDF generation failed: ${response.status}`;
    }
    throw new Error(msg);
  }

  return response.blob();
}

export type SharePdfOptions = {
  html: string;
  footerTemplate?: string;
  headerTemplate?: string;
  /** Storage path under the lesson-pdfs bucket, e.g. shared-pdfs/123_Lesson_1.pdf */
  fileName: string;
  lessonNumber?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  } catch {
    // ignore — local PDF may allow unauthenticated
  }
  return headers;
}

/**
 * Generate a PDF via PDFBolt, upload to Supabase Storage (server-side),
 * and return the public URL for Copy Link / share flows.
 */
export async function generateAndUploadSharePdf(
  options: SharePdfOptions,
): Promise<{ url: string }> {
  const headers = await authHeaders();
  const response = await fetch(getVercelApiUrl('/api/generate-pdf'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      html: options.html,
      footerTemplate: options.footerTemplate || '',
      headerTemplate: options.headerTemplate || '',
      fileName: options.fileName,
      lessonNumber: options.lessonNumber,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = errText;
    try {
      const d = JSON.parse(errText || '{}') as { error?: string };
      if (d.error) msg = d.error;
    } catch (_) {}
    throw new Error(msg || `Share PDF failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    url?: string;
    publicUrl?: string;
    error?: string;
  };
  const url = data.url || data.publicUrl;
  if (!url) {
    throw new Error(data.error || 'No share URL was returned.');
  }
  return { url };
}

/**
 * @deprecated Prefer generateAndUploadSharePdf() for share/copy-link flows.
 */
export function getPdfApiUrl(): string {
  if (import.meta.env.DEV) {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (vercelUrl) {
      const baseUrl = vercelUrl.replace(/\/$/, '');
      return `${baseUrl}/api/generate-pdf`;
    }
  }
  return '/api/generate-pdf';
}
