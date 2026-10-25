/** `${org}:${user}` the in-memory curriculum caches were loaded for. */
let cacheLoadedFor: string | null = null;

function scopeToken(
  organisationId: string | null | undefined,
  userId: string | null | undefined,
): string {
  const org = organisationId != null ? String(organisationId).trim() : '';
  const user = userId != null ? String(userId).trim() : '';
  return `${org}:${user}`;
}

export function getPlannerCurriculumCacheScope(): string | null {
  return cacheLoadedFor;
}

export function resetPlannerCurriculumCacheScope(): void {
  cacheLoadedFor = null;
}

/**
 * If caches were loaded for a different org/user, run onMismatch (clear caches)
 * then record the new identity.
 */
export function ensurePlannerCurriculumCacheScope(
  organisationId: string | null | undefined,
  userId: string | null | undefined,
  onMismatch: () => void,
): string {
  const token = scopeToken(organisationId, userId);
  if (cacheLoadedFor != null && cacheLoadedFor !== token) {
    onMismatch();
  }
  cacheLoadedFor = token;
  return token;
}
