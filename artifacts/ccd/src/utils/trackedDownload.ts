/**
 * Open a tracked resource download via the Vercel API (records event, then redirects).
 * Never link buttons directly to Rhythmstix / DreamHost URLs.
 */

import { supabase } from '../config/supabase';
import { getVercelApiUrl } from './apiUrl';

export function getTrackedDownloadPath(resourceId: string): string {
  return `/api/resources/${encodeURIComponent(resourceId)}/download`;
}

/**
 * Fetch session access token and navigate to the tracking endpoint.
 * Returns false if the user is not signed in (caller should show sign-in modal).
 */
export async function startTrackedDownload(resourceId: string): Promise<
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'error'; message?: string }
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const base = getVercelApiUrl(getTrackedDownloadPath(resourceId));
  const url = new URL(base, typeof window !== 'undefined' ? window.location.origin : undefined);
  url.searchParams.set('access_token', session.access_token);

  window.location.assign(url.toString());
  return { ok: true };
}

/**
 * Build return URL for post-login redirect (path + search + hash).
 */
export function currentReturnUrl(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export const DOWNLOAD_RETURN_KEY = 'ccd_download_return';
export const DOWNLOAD_PENDING_RESOURCE_KEY = 'ccd_pending_download_resource';

export function stashDownloadIntent(resourceId: string, returnUrl?: string) {
  try {
    sessionStorage.setItem(DOWNLOAD_PENDING_RESOURCE_KEY, resourceId);
    sessionStorage.setItem(DOWNLOAD_RETURN_KEY, returnUrl || currentReturnUrl());
  } catch {
    /* ignore */
  }
}

export function consumeDownloadIntent(): { resourceId: string | null; returnUrl: string | null } {
  try {
    const resourceId = sessionStorage.getItem(DOWNLOAD_PENDING_RESOURCE_KEY);
    const returnUrl = sessionStorage.getItem(DOWNLOAD_RETURN_KEY);
    sessionStorage.removeItem(DOWNLOAD_PENDING_RESOURCE_KEY);
    sessionStorage.removeItem(DOWNLOAD_RETURN_KEY);
    return { resourceId, returnUrl };
  } catch {
    return { resourceId: null, returnUrl: null };
  }
}
