/** Must match api/_yearGroupAccess.js YEAR_GROUP_ACCESS_NOTICE. */
export const YEAR_GROUP_ACCESS_NOTICE =
  "You haven't been given any year groups yet. You can still create your own activities and plans. Ask your school admin for access to year-group shared plans.";

/** True when the profile has at least one non-blank year group. */
export function hasAssignedYearGroups(allowedYearGroups: string[] | null | undefined): boolean {
  if (!Array.isArray(allowedYearGroups)) return false;
  return allowedYearGroups.some((y) => String(y ?? '').trim().length > 0);
}
