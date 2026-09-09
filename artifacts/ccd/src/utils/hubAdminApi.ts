/**
 * Client helpers for hub administration APIs.
 */

import { supabase } from '../config/supabase';
import { getVercelApiUrl } from '../utils/apiUrl';
import type {
  HubPageContent,
  HubResource,
  OrganisationHub,
  PublicHubPayload,
} from '../types/hubs';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(getVercelApiUrl(path), {
    ...init,
    headers: {
      ...(await authHeaders()),
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  }
  return json as T;
}

export async function listAdminHubs(params?: {
  q?: string;
  status?: string;
}): Promise<{ hubs: OrganisationHub[]; is_super_admin: boolean }> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.status) qs.set('status', params.status);
  const q = qs.toString();
  return apiFetch(`/api/hubs${q ? `?${q}` : ''}`);
}

export async function loadHubAdmin(hubId: string) {
  return apiFetch<{
    organisation: OrganisationHub;
    hub_role: string;
    page: HubPageContent | null;
    collections: { id: string; title: string; description?: string }[];
    resources: HubResource[];
    activities: unknown[];
    media: unknown[];
  }>(`/api/hubs/${hubId}`);
}

export async function updateHubPage(
  hubId: string,
  body: { page?: Partial<HubPageContent> } & Partial<OrganisationHub>,
) {
  return apiFetch(`/api/hubs/${hubId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function hubPageAction(
  hubId: string,
  action: 'publish' | 'unpublish' | 'save_draft',
  extra?: Record<string, unknown>,
) {
  return apiFetch(`/api/hubs/${hubId}`, {
    method: 'POST',
    body: JSON.stringify({ action, ...extra }),
  });
}

export async function createHubResource(
  hubId: string,
  body: Partial<HubResource> & { title: string; external_url: string },
) {
  return apiFetch<{ resource: HubResource; warning?: string | null }>(
    `/api/hubs/${hubId}/resources`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function updateHubResource(
  hubId: string,
  resourceId: string,
  body: Record<string, unknown>,
) {
  return apiFetch<{ resource: HubResource; warning?: string | null }>(
    `/api/hubs/${hubId}/resources/${resourceId}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function resourceLifecycle(
  hubId: string,
  resourceId: string,
  action: 'publish' | 'unpublish' | 'archive',
) {
  return updateHubResource(hubId, resourceId, { action });
}

export async function reorderHubResources(hubId: string, ids: string[]) {
  return apiFetch(`/api/hubs/${hubId}/resources`, {
    method: 'POST',
    body: JSON.stringify({ action: 'reorder', ids }),
  });
}

export async function listHubMembers(hubId: string) {
  return apiFetch<{
    members: {
      id: string;
      user_id: string;
      role: string;
      profile: {
        email: string | null;
        display_name: string | null;
        status?: string;
      } | null;
    }[];
  }>(`/api/hubs/${hubId}/members`);
}

export async function grantHubMember(
  hubId: string,
  body: { email?: string; user_id?: string; role: string },
) {
  return apiFetch(`/api/hubs/${hubId}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function revokeHubMember(hubId: string, userId: string) {
  return apiFetch(`/api/hubs/${hubId}/members`, {
    method: 'DELETE',
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function loadHubAnalytics(hubId: string, days = 30) {
  return apiFetch<{
    total: number;
    by_resource: Record<string, number>;
    events: unknown[];
  }>(`/api/hubs/${hubId}/analytics?days=${days}`);
}

export async function loadHubAudit(hubId: string) {
  return apiFetch<{ events: unknown[] }>(`/api/hubs/${hubId}/audit`);
}

export function hubExportUrl(hubId: string, days = 90): string {
  return getVercelApiUrl(`/api/hubs/${hubId}/export?days=${days}`);
}

export async function downloadTrackedResource(resourceId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(getVercelApiUrl(`/api/resources/${resourceId}/download`), {
    method: 'GET',
    headers,
    redirect: 'manual',
  });
  if (res.status === 302 || res.status === 301) {
    const loc = res.headers.get('Location');
    if (loc) {
      window.open(loc, '_blank', 'noopener,noreferrer');
      return;
    }
  }
  if (res.ok) {
    const loc = res.url;
    if (loc) window.open(loc, '_blank', 'noopener,noreferrer');
    return;
  }
  const json = await res.json().catch(() => ({}));
  throw new Error((json as { error?: string }).error || 'Download failed');
}

export async function fetchPublicHub(slug: string): Promise<PublicHubPayload | null> {
  try {
    const res = await fetch(getVercelApiUrl(`/api/hubs/public/${encodeURIComponent(slug)}`));
    if (!res.ok) return null;
    return (await res.json()) as PublicHubPayload;
  } catch {
    return null;
  }
}
