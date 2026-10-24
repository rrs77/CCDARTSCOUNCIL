/**
 * Decision 2 — share links require a signed-in Supabase session.
 * Shared links are in-app `/shared/:userId/:fileId` routes (no JWT in the URL).
 * After sign-in, the page fetches `/api/files/...` with Authorization Bearer.
 * `?access_token=` is not used for file shares or the file proxy — it remains
 * only on GET /api/resources/:id/download for window.location redirects.
 */

import { buildSignInHref, safeReturnPath } from './authReturn.ts';

const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SHARE_PATH_RE = new RegExp(
  `^/shared/(${UUID})/(${UUID})(?:\\.pdf)?/?$`,
  'i',
);
const API_FILES_RE = new RegExp(
  `^/api/files/(${UUID})/(${UUID})\\.pdf$`,
  'i',
);

export function isFileShareAppPath(path: string | null | undefined): boolean {
  const safe = safeReturnPath(path);
  if (!safe) return false;
  const pathname = safe.split('?')[0] || '';
  return SHARE_PATH_RE.test(pathname);
}

/** Legacy clipboard / return URLs that pointed at the API proxy. */
export function isFileShareApiPath(path: string | null | undefined): boolean {
  const safe = safeReturnPath(path);
  if (!safe) return false;
  const pathname = safe.split('?')[0] || '';
  return API_FILES_RE.test(pathname);
}

/**
 * Normalise a share or legacy API path to `/shared/{userId}/{fileId}`.
 * Never appends access_token.
 */
export function toFileShareAppPath(path: string | null | undefined): string | null {
  const safe = safeReturnPath(path);
  if (!safe) return null;
  const pathname = safe.split('?')[0] || '';

  let m = pathname.match(SHARE_PATH_RE);
  if (m) return `/shared/${m[1]}/${m[2]}`;

  m = pathname.match(API_FILES_RE);
  if (m) return `/shared/${m[1]}/${m[2]}`;

  return null;
}

export function storagePathFromShareAppPath(
  path: string | null | undefined,
): string | null {
  const share = toFileShareAppPath(path);
  if (!share) return null;
  const m = share.match(SHARE_PATH_RE);
  if (!m) return null;
  return `${m[1]}/${m[2]}.pdf`;
}

export function fileProxyApiPathFromStorage(storagePath: string): string {
  return `/api/files/${storagePath}`;
}

/**
 * Fetch the shared PDF with the live session Bearer header (never put JWT in the URL).
 */
export async function fetchSharedFileWithBearer(
  storagePath: string,
): Promise<Response> {
  const { supabase } = await import('../config/supabase');
  const { getVercelApiUrl } = await import('./apiUrl');

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const err = new Error('Sign in required');
    (err as Error & { status: number }).status = 401;
    throw err;
  }

  return fetch(getVercelApiUrl(fileProxyApiPathFromStorage(storagePath)), {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/pdf',
    },
    credentials: 'same-origin',
  });
}

/** Redirect signed-out visitors to sign-in, then back to the in-app share path. */
export function redirectToSignInForShare(path: string): void {
  const share = toFileShareAppPath(path) || safeReturnPath(path) || '/';
  window.location.assign(buildSignInHref(share));
}
