/**
 * Safe post-login return URLs for Forum, downloads, and other gated actions.
 * Always same-origin relative paths so Preview and production both work.
 */

export const FORUM_RETURN_KEY = 'ccd_forum_return';
export const RETURN_QUERY = 'return';
export const SIGNIN_QUERY = 'signin';

/** Only allow in-app relative paths. Reject protocol-relative and absolute URLs. */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return null;
  if (trimmed.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed)) return null;
  if (trimmed.includes('\\')) return null;
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    /* keep trimmed */
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(decoded)) return null;
  return trimmed.split('#')[0] || null;
}

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

export function queryReturnPath(search: string): string | null {
  const q = search.startsWith('?') ? search.slice(1) : search;
  return safeReturnPath(new URLSearchParams(q).get(RETURN_QUERY));
}

export function isMidFlowSignIn(search: string): boolean {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  return params.get(SIGNIN_QUERY) === '1' || Boolean(queryReturnPath(search));
}

/** Relative href so Vercel Preview and production both stay on the current origin. */
export function buildSignInHref(returnPath: string | undefined): string {
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
export function resolvePostAuthReturn(input: {
  search?: string;
  forumReturn?: string | null;
  downloadReturn?: string | null;
}): string | null {
  const fromQuery = queryReturnPath(input.search || '');
  if (fromQuery) return fromQuery;
  const fromForum = safeReturnPath(input.forumReturn);
  if (fromForum) return fromForum;
  return safeReturnPath(input.downloadReturn);
}

export function shouldNavigateToReturn(ret: string | null, currentPathAndSearch: string): boolean {
  return Boolean(ret && ret !== currentPathAndSearch);
}
