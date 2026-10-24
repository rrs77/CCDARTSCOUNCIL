/**
 * Pure post-login return URL helpers (plain ESM for Node tests + Vite).
 * Keep in sync with server safeInAppReturnPath control-character rules.
 */

export const FORUM_RETURN_KEY = 'ccd_forum_return';
export const RETURN_QUERY = 'return';
export const SIGNIN_QUERY = 'signin';

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/** Only allow in-app relative paths. Reject protocol-relative, absolute, and control chars. */
export function safeReturnPath(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (CONTROL_CHARS.test(trimmed)) return null;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed)) return null;
  if (trimmed.includes('\\')) return null;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    /* keep trimmed */
  }
  if (CONTROL_CHARS.test(decoded)) return null;
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(decoded)) return null;
  return trimmed.split('#')[0] || null;
}

export function queryReturnPath(search) {
  const q = search.startsWith('?') ? search.slice(1) : search;
  return safeReturnPath(new URLSearchParams(q).get(RETURN_QUERY));
}

export function isMidFlowSignIn(search) {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  return params.get(SIGNIN_QUERY) === '1' || Boolean(queryReturnPath(search));
}

/** Relative href so Vercel Preview and production both stay on the current origin. */
export function buildSignInHref(returnPath) {
  const safe = safeReturnPath(returnPath) || '/forum';
  const params = new URLSearchParams();
  params.set(RETURN_QUERY, safe);
  params.set(SIGNIN_QUERY, '1');
  return `/?${params.toString()}`;
}

/**
 * Explicit `?return=` wins (this navigation), then the forum session stash,
 * then a download return only when no higher-priority path exists.
 */
export function resolvePostAuthReturn(input) {
  const fromQuery = queryReturnPath(input.search || '');
  if (fromQuery) return fromQuery;
  const fromForum = safeReturnPath(input.forumReturn);
  if (fromForum) return fromForum;
  return safeReturnPath(input.downloadReturn);
}

export function shouldNavigateToReturn(ret, currentPathAndSearch) {
  return Boolean(ret && ret !== currentPathAndSearch);
}
