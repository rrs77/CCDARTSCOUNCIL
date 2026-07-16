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

  const response = await fetch(getPdfBoltProxyUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    let msg = errText;
    try {
      const d = JSON.parse(errText || '{}') as { error?: string };
      if (d.error) msg = d.error;
    } catch (_) {}
    throw new Error(msg || `PDF generation failed: ${response.status}`);
  }

  return response.blob();
}

/**
 * @deprecated Use generatePdfViaProxy() for all new PDF generation calls.
 * Kept for any callers that still reference the old Vercel generate-pdf route.
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
