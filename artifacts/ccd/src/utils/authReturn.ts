/**
 * Safe post-login return URLs for Forum, downloads, and other gated actions.
 * Always same-origin relative paths so Preview and production both work.
 * Pure helpers live in authReturnHelpers.mjs (Node-testable without TS strip).
 */

export {
  FORUM_RETURN_KEY,
  RETURN_QUERY,
  SIGNIN_QUERY,
  safeReturnPath,
  queryReturnPath,
  isMidFlowSignIn,
  buildSignInHref,
  resolvePostAuthReturn,
  shouldNavigateToReturn,
} from './authReturnHelpers.mjs';

import {
  FORUM_RETURN_KEY,
  safeReturnPath,
} from './authReturnHelpers.mjs';

export function persistForumReturn(path: string | undefined): void {
  const safe = safeReturnPath(path);
  if (!safe || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(FORUM_RETURN_KEY, safe);
  } catch {
    /* ignore */
  }
}

export function consumeForumReturn(): string | null {
  try {
    const value = sessionStorage.getItem(FORUM_RETURN_KEY);
    if (value) sessionStorage.removeItem(FORUM_RETURN_KEY);
    return safeReturnPath(value);
  } catch {
    return null;
  }
}
