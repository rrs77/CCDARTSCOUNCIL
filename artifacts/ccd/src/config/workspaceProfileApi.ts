/**
 * Typed read/write API for `public.workspace_profiles`.
 * Writes: CCDesigner Settings only. Reads: add-ons + same-project apps via RLS.
 */

import { getLiveSupabase, isSupabaseConfigured, TABLES } from './supabase';
import { isDemoModeActive } from '../utils/demoMode';
import type {
  WorkspaceProfile,
  WorkspaceProfileClass,
  WorkspaceProfileSection,
  WorkspaceProfileUpsertInput,
} from '../utils/workspaceProfile';
import { emptyWorkspaceProfile } from '../utils/workspaceProfile';

const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  owner_id: string;
  organisation_id: string | null;
  school_name: string | null;
  classes: unknown;
  year_group_sections: unknown;
  updated_at: string;
  created_at: string;
};

function authUserId(): string | null {
  if (isDemoModeActive()) return DEMO_USER_ID;
  const uid = localStorage.getItem('rhythmstix_user_id');
  return uid && UUID_RE.test(uid) ? uid : null;
}

function asClasses(value: unknown): WorkspaceProfileClass[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id : '';
      const name = typeof row.name === 'string' ? row.name : '';
      if (!id || !name) return null;
      const color = typeof row.color === 'string' ? row.color : undefined;
      return { id, name, ...(color ? { color } : {}) };
    })
    .filter((c): c is WorkspaceProfileClass => c != null);
}

function asSections(value: unknown): WorkspaceProfileSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id : '';
      const label = typeof row.label === 'string' ? row.label : '';
      if (!id || !label) return null;
      const sortOrder = typeof row.sortOrder === 'number' ? row.sortOrder : 0;
      const yearGroupIds = Array.isArray(row.yearGroupIds)
        ? row.yearGroupIds.filter((x): x is string => typeof x === 'string')
        : [];
      return { id, label, sortOrder, yearGroupIds };
    })
    .filter((s): s is WorkspaceProfileSection => s != null);
}

function mapRow(row: Row): WorkspaceProfile {
  return {
    id: row.id,
    ownerId: row.owner_id,
    organisationId: row.organisation_id,
    schoolName: row.school_name ?? '',
    classes: asClasses(row.classes),
    yearGroupSections: asSections(row.year_group_sections),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

async function resolveOrganisationId(explicit?: string | null): Promise<string | null> {
  if (explicit != null && String(explicit).trim()) return String(explicit).trim();
  const uid = authUserId();
  if (!uid || isDemoModeActive()) return null;
  try {
    const { data } = await getLiveSupabase()
      .from('profiles')
      .select('organisation_id')
      .eq('id', uid)
      .maybeSingle();
    const org = (data as { organisation_id?: string | null } | null)?.organisation_id;
    return org && String(org).trim() ? String(org).trim() : null;
  } catch {
    return null;
  }
}

export const workspaceProfileApi = {
  /**
   * Read the current user's workspace profile (Settings → My classes SSoT).
   * Returns null when unauthenticated or the table/row is missing.
   */
  getMine: async (): Promise<WorkspaceProfile | null> => {
    if (!isSupabaseConfigured()) return null;
    const uid = authUserId();
    if (!uid) return null;
    if (isDemoModeActive()) {
      return emptyWorkspaceProfile(uid);
    }
    try {
      const { data, error } = await getLiveSupabase()
        .from(TABLES.WORKSPACE_PROFILES)
        .select('*')
        .eq('owner_id', uid)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapRow(data as Row);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('workspaceProfileApi.getMine failed (table may not exist yet):', err);
      }
      return null;
    }
  },

  /**
   * Upsert from CCDesigner Settings. Other apps should not call this.
   */
  upsertMine: async (input: WorkspaceProfileUpsertInput): Promise<boolean> => {
    if (!isSupabaseConfigured() || isDemoModeActive()) return false;
    const uid = authUserId();
    if (!uid) {
      console.warn('⚠️ workspaceProfileApi.upsertMine: no authenticated user — refusing write');
      return false;
    }
    try {
      const organisationId = await resolveOrganisationId(input.organisationId);
      const payload = {
        owner_id: uid,
        organisation_id: organisationId,
        school_name: input.schoolName ?? '',
        classes: input.classes ?? [],
        year_group_sections: input.yearGroupSections ?? [],
        updated_at: new Date().toISOString(),
      };
      const { error } = await getLiveSupabase()
        .from(TABLES.WORKSPACE_PROFILES)
        .upsert(payload, { onConflict: 'owner_id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to save workspace profile:', err);
      return false;
    }
  },
};
