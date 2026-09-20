/**
 * Hub admin access helpers — used by Settings gates and Auth enrichment.
 * Prefer real Sign-in (JWT + hub_memberships); prototype Preview cannot administer hubs.
 */

import type { Profile } from '../types/auth';
import { getVercelApiUrl } from './apiUrl';
import { supabase } from '../config/supabase';

/** Roles that unlock Settings → Hub admin (edit page / shop at minimum). */
export const HUB_SETTINGS_ROLES = new Set([
  'hub_administrator',
  'hub_publisher',
  'hub_editor',
  'admin',
  'owner',
]);

/** Roles that unlock Downloads analytics + Sales for a hub. */
export const HUB_ANALYTICS_ROLES = new Set([
  'hub_administrator',
  'admin',
  'owner',
]);

export function profileHasHubSettingsAccess(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (
    profile.role === 'admin' ||
    profile.role === 'superuser' ||
    profile.role === 'super_admin' ||
    profile.role === 'organisation'
  ) {
    return true;
  }
  return profile.hub_memberships?.some((m) => HUB_SETTINGS_ROLES.has(m.role)) ?? false;
}

export function profileHasHubAnalyticsAccess(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (
    profile.role === 'admin' ||
    profile.role === 'superuser' ||
    profile.role === 'super_admin' ||
    profile.role === 'organisation' ||
    profile.can_view_download_analytics === true
  ) {
    return true;
  }
  return profile.hub_memberships?.some((m) => HUB_ANALYTICS_ROLES.has(m.role)) ?? false;
}

/**
 * Attach hub_memberships from GET /api/hubs (requires signed-in JWT).
 * No-op when unauthenticated or API unavailable.
 */
export async function enrichProfileWithHubMemberships(
  profile: Profile | null,
): Promise<Profile | null> {
  if (!profile) return null;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return profile;

    const res = await fetch(getVercelApiUrl('/api/hubs'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return profile;
    const json = (await res.json()) as {
      hubs?: Array<{ id: string; hub_role?: string }>;
    };
    const hubs = json.hubs || [];
    if (hubs.length === 0) {
      return {
        ...profile,
        hub_ids: profile.hub_ids ?? [],
        hub_memberships: profile.hub_memberships ?? [],
      };
    }
    return {
      ...profile,
      hub_ids: hubs.map((h) => h.id),
      hub_memberships: hubs.map((h) => ({
        organisation_id: h.id,
        role: h.hub_role || 'hub_viewer',
      })),
    };
  } catch {
    return profile;
  }
}
