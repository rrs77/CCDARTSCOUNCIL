/** Must match api/_yearGroupAccess.js YEAR_GROUP_ACCESS_NOTICE. */
export const YEAR_GROUP_ACCESS_NOTICE =
  "You haven't been given any year groups yet. You can still create your own activities and plans. Ask your school admin for access to year-group shared plans.";

/** True when the profile has at least one non-blank year group. */
export function hasAssignedYearGroups(allowedYearGroups: string[] | null | undefined): boolean {
  if (!Array.isArray(allowedYearGroups)) return false;
  return allowedYearGroups.some((y) => String(y ?? '').trim().length > 0);
}

export function orgIdOfProfile(profile: { organisation_id?: string | null } | null | undefined): string | null {
  const org =
    typeof profile?.organisation_id === 'string' ? profile.organisation_id.trim() : '';
  return org || null;
}

/** Matches server isOrgAdminForNotify role set (admins / superusers). */
export function isYearGroupNoticeAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'superuser';
}

/** Same gate as server notify recipients — managers should not see the teacher notice. */
export function isYearGroupNoticeManager(profile: {
  role?: string | null;
  can_manage_users?: boolean | null;
} | null | undefined): boolean {
  if (!profile) return false;
  if (isYearGroupNoticeAdminRole(profile.role)) return true;
  return profile.can_manage_users === true;
}

export type YearGroupsNoticeInput = {
  /** AuthContext.loading — hide until profile has settled (no first-login flash). */
  authLoading: boolean;
  profile: {
    id?: string;
    role?: string | null;
    organisation_id?: string | null;
    allowed_year_groups?: string[] | null;
    can_manage_users?: boolean | null;
  } | null;
  /** Demo / preview sessions seed null year groups on admins — never show. */
  isDemo: boolean;
  dismissed: boolean;
};

/**
 * Whether the Planner/Lessons year-groups notice should render.
 * Teachers only; requires loaded profile + organisation; hidden for
 * admins / can_manage_users / demo.
 */
export function shouldShowYearGroupsAccessNotice(input: YearGroupsNoticeInput): boolean {
  if (input.authLoading) return false;
  if (input.isDemo) return false;
  if (input.dismissed) return false;
  const profile = input.profile;
  if (!profile?.id) return false;
  if (isYearGroupNoticeManager(profile)) return false;
  if (!orgIdOfProfile(profile)) return false;
  if (hasAssignedYearGroups(profile.allowed_year_groups)) return false;
  return true;
}
