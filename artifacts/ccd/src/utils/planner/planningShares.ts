/**
 * Planning shares — lessons / units / schemes / year overviews.
 * Separate from LessonPrintModal public PDF share links (no conflict).
 * Uses Supabase when available; falls back to localStorage for demo/offline.
 */

import { supabase } from '../../config/supabase';

export type PlanningResourceType = 'lesson' | 'unit' | 'scheme' | 'year_overview';
export type ShareAudienceType = 'person' | 'group' | 'school' | 'year_group' | 'hub_org';
export type SharePermission = 'view' | 'copy' | 'edit';

export type PlanningShareResource = {
  id: string;
  ownerId: string;
  resourceType: PlanningResourceType;
  resourceId: string;
  title: string;
  summary: string;
  organisationId?: string | null;
  updatedAt: string;
};

export type PlanningShareGrant = {
  id: string;
  resourceId: string;
  audienceType: ShareAudienceType;
  audienceId: string;
  audienceLabel: string;
  permission: SharePermission;
  sharedBy: string;
  createdAt: string;
  /** Denormalised for Shared with me list */
  title?: string;
  resourceType?: PlanningResourceType;
};

const LOCAL_KEY = 'ccd-planning-shares-v1';

type LocalStore = {
  resources: PlanningShareResource[];
  grants: PlanningShareGrant[];
};

function readLocal(): LocalStore {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { resources: [], grants: [] };
    const parsed = JSON.parse(raw) as LocalStore;
    return {
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      grants: Array.isArray(parsed.grants) ? parsed.grants : [],
    };
  } catch {
    return { resources: [], grants: [] };
  }
}

function writeLocal(store: LocalStore) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent('ccd:planning-shares-updated'));
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function upsertPlanningResource(input: {
  ownerId: string;
  resourceType: PlanningResourceType;
  resourceId: string;
  title: string;
  summary?: string;
  organisationId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<PlanningShareResource> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('planning_share_resources')
      .upsert(
        {
          owner_id: input.ownerId,
          resource_type: input.resourceType,
          resource_id: input.resourceId,
          title: input.title,
          summary: input.summary || '',
          organisation_id: input.organisationId || null,
          payload: input.payload || {},
          updated_at: now,
        },
        { onConflict: 'owner_id,resource_type,resource_id' },
      )
      .select('*')
      .single();
    if (!error && data) {
      return {
        id: data.id,
        ownerId: data.owner_id,
        resourceType: data.resource_type,
        resourceId: data.resource_id,
        title: data.title,
        summary: data.summary || '',
        organisationId: data.organisation_id,
        updatedAt: data.updated_at || now,
      };
    }
  } catch {
    /* fall through to local */
  }

  const store = readLocal();
  const existing = store.resources.find(
    (r) =>
      r.ownerId === input.ownerId &&
      r.resourceType === input.resourceType &&
      r.resourceId === input.resourceId,
  );
  const row: PlanningShareResource = existing
    ? {
        ...existing,
        title: input.title,
        summary: input.summary || '',
        organisationId: input.organisationId,
        updatedAt: now,
      }
    : {
        id: uid('res'),
        ownerId: input.ownerId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        title: input.title,
        summary: input.summary || '',
        organisationId: input.organisationId,
        updatedAt: now,
      };
  store.resources = existing
    ? store.resources.map((r) => (r.id === row.id ? row : r))
    : [...store.resources, row];
  writeLocal(store);
  return row;
}

export async function createPlanningShareGrant(input: {
  resourceId: string;
  sharedBy: string;
  audienceType: ShareAudienceType;
  audienceId: string;
  audienceLabel: string;
  permission: SharePermission;
  title?: string;
  resourceType?: PlanningResourceType;
}): Promise<PlanningShareGrant> {
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('planning_shares')
      .upsert(
        {
          resource_id: input.resourceId,
          shared_by: input.sharedBy,
          audience_type: input.audienceType,
          audience_id: input.audienceId,
          audience_label: input.audienceLabel,
          permission: input.permission,
        },
        { onConflict: 'resource_id,audience_type,audience_id' },
      )
      .select('*')
      .single();
    if (!error && data) {
      window.dispatchEvent(new CustomEvent('ccd:planning-shares-updated'));
      return {
        id: data.id,
        resourceId: data.resource_id,
        audienceType: data.audience_type,
        audienceId: data.audience_id,
        audienceLabel: data.audience_label || '',
        permission: data.permission,
        sharedBy: data.shared_by,
        createdAt: data.created_at || now,
        title: input.title,
        resourceType: input.resourceType,
      };
    }
  } catch {
    /* local fallback */
  }

  const store = readLocal();
  const existing = store.grants.find(
    (g) =>
      g.resourceId === input.resourceId &&
      g.audienceType === input.audienceType &&
      g.audienceId === input.audienceId,
  );
  const grant: PlanningShareGrant = existing
    ? {
        ...existing,
        audienceLabel: input.audienceLabel,
        permission: input.permission,
        title: input.title || existing.title,
        resourceType: input.resourceType || existing.resourceType,
      }
    : {
        id: uid('share'),
        resourceId: input.resourceId,
        audienceType: input.audienceType,
        audienceId: input.audienceId,
        audienceLabel: input.audienceLabel,
        permission: input.permission,
        sharedBy: input.sharedBy,
        createdAt: now,
        title: input.title,
        resourceType: input.resourceType,
      };
  store.grants = existing
    ? store.grants.map((g) => (g.id === grant.id ? grant : g))
    : [...store.grants, grant];
  writeLocal(store);
  return grant;
}

/** Items shared with the current user (recipient view). */
export async function listSharedWithMe(user: {
  id: string;
  organisationId?: string | null;
  schoolOrOrg?: string | null;
}): Promise<PlanningShareGrant[]> {
  const org = user.organisationId || user.schoolOrOrg || '';
  try {
    const { data: grants, error } = await supabase
      .from('planning_shares')
      .select('*, planning_share_resources ( title, resource_type, resource_id )')
      .or(
        [
          `and(audience_type.eq.person,audience_id.eq.${user.id})`,
          org ? `and(audience_type.eq.school,audience_id.eq.${org})` : '',
          org ? `and(audience_type.eq.hub_org,audience_id.eq.${org})` : '',
          org ? `and(audience_type.eq.group,audience_id.eq.${org})` : '',
          'audience_type.eq.year_group',
        ]
          .filter(Boolean)
          .join(','),
      )
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && Array.isArray(grants)) {
      return grants.map((g: any) => ({
        id: g.id,
        resourceId: g.resource_id,
        audienceType: g.audience_type,
        audienceId: g.audience_id,
        audienceLabel: g.audience_label || '',
        permission: g.permission,
        sharedBy: g.shared_by,
        createdAt: g.created_at,
        title: g.planning_share_resources?.title || 'Shared planning',
        resourceType: g.planning_share_resources?.resource_type,
      }));
    }
  } catch {
    /* local */
  }

  const store = readLocal();
  return store.grants
    .filter((g) => {
      if (g.sharedBy === user.id) return false;
      if (g.audienceType === 'person') return g.audienceId === user.id;
      if (g.audienceType === 'school' || g.audienceType === 'hub_org' || g.audienceType === 'group') {
        return !!org && g.audienceId === org;
      }
      if (g.audienceType === 'year_group') return true;
      return false;
    })
    .map((g) => {
      const res = store.resources.find((r) => r.id === g.resourceId);
      return {
        ...g,
        title: g.title || res?.title || 'Shared planning',
        resourceType: g.resourceType || res?.resourceType,
      };
    });
}
