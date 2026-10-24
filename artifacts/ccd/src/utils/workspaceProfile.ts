/**
 * Shared workspace profile — classes, class names, year groups, school name.
 *
 * Owned by CCDesigner Settings → My classes (single source of truth).
 * Add-ons (Assessify, PeriFeedback) and other apps on the same Supabase
 * project should read `public.workspace_profiles` via RLS instead of
 * keeping their own copies.
 *
 * Linking from another app on the same project:
 *   1. Authenticate as the same user (or an org peer with SELECT via RLS).
 *   2. SELECT from workspace_profiles WHERE owner_id = auth.uid()
 *      OR organisation_id matches the reader's profiles.organisation_id.
 *   3. Use `classes` / `year_group_sections` / `school_name` as typed below.
 * Do not write from add-on apps — writes belong to CCDesigner Settings.
 */

export type WorkspaceProfileClass = {
  id: string;
  name: string;
  color?: string;
};

export type WorkspaceProfileSection = {
  id: string;
  label: string;
  sortOrder: number;
  yearGroupIds: string[];
};

export type WorkspaceProfile = {
  id: string;
  ownerId: string;
  organisationId: string | null;
  schoolName: string;
  classes: WorkspaceProfileClass[];
  yearGroupSections: WorkspaceProfileSection[];
  updatedAt: string;
  createdAt: string;
};

export type WorkspaceProfileUpsertInput = {
  schoolName: string;
  classes: WorkspaceProfileClass[];
  yearGroupSections: WorkspaceProfileSection[];
  organisationId?: string | null;
};

export function emptyWorkspaceProfile(ownerId = ''): WorkspaceProfile {
  const now = new Date().toISOString();
  return {
    id: '',
    ownerId,
    organisationId: null,
    schoolName: '',
    classes: [],
    yearGroupSections: [],
    updatedAt: now,
    createdAt: now,
  };
}
