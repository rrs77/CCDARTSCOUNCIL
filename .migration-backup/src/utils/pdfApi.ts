/**
 * PDF generation API URL for Vercel.
 * Uses same-origin /api/generate-pdf endpoint in production.
 * In development, can use VITE_VERCEL_URL if set, otherwise uses relative path.
 */

const VERCEL_PDF_PATH = '/api/generate-pdf';

/**
 * Returns the URL to call for PDF generation (generate PDF + upload to storage).
 * Use this in useShareLesson when generating share links.
 * 
 * In production: Uses relative path /api/generate-pdf (handled by Vercel)
 * In development: 
 *   - If VITE_VERCEL_URL is set, uses that (points to deployed Vercel app)
 *   - Otherwise uses relative path (will fail unless proxy is configured)
 */
export function getPdfApiUrl(): string {
  // In development, check if VITE_VERCEL_URL is set to use deployed Vercel app
  if (import.meta.env.DEV) {
    const vercelUrl = import.meta.env.VITE_VERCEL_URL;
    if (vercelUrl) {
      // Remove trailing slash if present, then append API path
      const baseUrl = vercelUrl.replace(/\/$/, '');
      const fullUrl = `${baseUrl}${VERCEL_PDF_PATH}`;
      console.log('[pdfApi] Using deployed Vercel URL for development:', fullUrl);
      return fullUrl;
    }
    console.warn('[pdfApi] Development mode: VITE_VERCEL_URL not set. API route will only work when deployed to Vercel.');
  }
  
  // Production, or dev without VITE_VERCEL_URL: relative path.
  // In dev this hits the Vite server; proxy only works when VITE_VERCEL_URL is in .env, so Create Link may 404 until then.
  return VERCEL_PDF_PATH;
}
