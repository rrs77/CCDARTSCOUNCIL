/**
 * Decision 2 — share links require a signed-in Supabase session.
 * No anonymous / public / expiring signed share tokens.
 * After login, open /api/files/... with the session access_token (same pattern
 * as tracked downloads) so the proxy can run requireAuth + visibility checks.
 */

import { buildSignInHref, safeReturnPath } from './authReturn.ts';

export function isFileShareApiPath(path: string | null | undefined): boolean {
  const safe = safeReturnPath(path);
  if (!safe) return false;
  const pathname = safe.split('?')[0] || '';
  return /^\/api\/files\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i.test(pathname);
}

/**
 * Append the current session token for a top-level navigation to the file proxy.
 * Does not create a long-lived share token — uses the live Supabase session JWT.
 */
export function appendSessionTokenToFileShareUrl(
  path: string,
  accessToken: string,
): string {
  const safe = safeReturnPath(path);
  if (!safe) return '/';
  const url = new URL(safe, 'https://ccd.local');
  url.searchParams.set('access_token', accessToken);
  return `${url.pathname}${url.search}`;
}

/**
 * Navigate to a shared file proxy URL with the signed-in session, or to sign-in.
 */
export async function openAuthenticatedFileShare(
  path: string,
): Promise<'opened' | 'signin'> {
  const safe = safeReturnPath(path);
  if (!safe || !isFileShareApiPath(safe)) {
    window.location.assign(buildSignInHref(safe || '/'));
    return 'signin';
  }

  const { supabase } = await import('../config/supabase');
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    window.location.assign(buildSignInHref(safe));
    return 'signin';
  }

  window.location.assign(appendSessionTokenToFileShareUrl(safe, session.access_token));
  return 'opened';
}
