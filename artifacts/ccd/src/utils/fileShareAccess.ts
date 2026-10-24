/**
 * Decision 2 — share links require a signed-in Supabase session.
 * Shared links are in-app `/shared/:userId/:fileId` routes (no JWT in the URL).
 * After sign-in, the page fetches `/api/files/...` with Authorization Bearer.
 * `?access_token=` is not used for file shares or the file proxy — it remains
 * only on GET /api/resources/:id/download for window.location redirects.
 */

export {
  isFileShareAppPath,
  isFileShareApiPath,
  toFileShareAppPath,
  storagePathFromShareAppPath,
  fileProxyApiPathFromStorage,
} from './fileShareAccessHelpers.mjs';

import { buildSignInHref, safeReturnPath } from './authReturnHelpers.mjs';
import {
  fileProxyApiPathFromStorage,
  toFileShareAppPath,
} from './fileShareAccessHelpers.mjs';

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
