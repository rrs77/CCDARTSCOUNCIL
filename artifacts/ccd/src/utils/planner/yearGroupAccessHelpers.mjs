/**
 * Pure notice-visibility helpers shared with Node tests.
 * Keep in sync with yearGroupAccess.ts.
 */

export const YEAR_GROUP_ACCESS_NOTICE =
  "You haven't been given any year groups yet. You can still create your own activities and plans. Ask your school admin for access to year-group shared plans.";

export function hasAssignedYearGroups(allowedYearGroups) {
  if (!Array.isArray(allowedYearGroups)) return false;
  return allowedYearGroups.some((y) => String(y ?? '').trim().length > 0);
}

export function orgIdOfProfile(profile) {
  const org =
    typeof profile?.organisation_id === 'string' ? profile.organisation_id.trim() : '';
  return org || null;
}

export function isYearGroupNoticeAdminRole(role) {
  return role === 'admin' || role === 'super_admin' || role === 'superuser';
}

export function shouldShowYearGroupsAccessNotice({
  authLoading,
  profile,
  isDemo,
  dismissed,
}) {
  if (authLoading) return false;
  if (isDemo) return false;
  if (dismissed) return false;
  if (!profile?.id) return false;
  if (isYearGroupNoticeAdminRole(profile.role)) return false;
  if (!orgIdOfProfile(profile)) return false;
  if (hasAssignedYearGroups(profile.allowed_year_groups)) return false;
  return true;
}
