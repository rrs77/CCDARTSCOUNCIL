/**
 * Returns the full URL for Vercel API routes.
 * Use for create-user, resend-invite, etc.
 *
 * - When VITE_API_BASE_URL or VITE_VERCEL_URL is set: uses that base (for dev proxy or external host).
 * - Otherwise: same-origin (window.location.origin + path) so /api/create-user always hits this app's API.
 */
export function getVercelApiUrl(path: string): string {
  const baseFromEnv = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_VERCEL_URL;
  if (baseFromEnv) {
    const base = String(baseFromEnv).replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }
  const pathStr = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${pathStr}`;
  }
  return pathStr;
}

/**
 * Base URL for the app (used in password reset emails so the link points to production, not localhost).
 * Set VITE_APP_URL or VITE_VERCEL_URL so reset emails contain the correct link.
 */
export function getAppBaseUrl(): string {
  const base = import.meta.env.VITE_APP_URL || import.meta.env.VITE_VERCEL_URL;
  if (base) {
    return String(base).replace(/\/$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}
