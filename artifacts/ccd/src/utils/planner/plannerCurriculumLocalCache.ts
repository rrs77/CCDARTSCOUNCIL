/**
 * Org+user scoped localStorage for planner curriculum.
 * Legacy unscoped keys are migrated once into the first signed-in identity,
 * then removed so a later user/org on a shared browser cannot import them.
 */

export const STORAGE_KEY = 'ccd-planner-curriculum-v1';
export const PERSONAL_STORAGE_KEY = 'ccd-planner-curriculum-personal-v1';

export function scopedCurriculumKey(
  base: string,
  organisationId?: string | null,
  userId?: string | null,
): string {
  const org = organisationId != null ? String(organisationId).trim() : '';
  const user = userId != null ? String(userId).trim() : '';
  if (org || user) return `${base}:${org}:${user}`;
  return base;
}

export function cacheScopeToken(
  organisationId?: string | null,
  userId?: string | null,
): string {
  const org = organisationId != null ? String(organisationId).trim() : '';
  const user = userId != null ? String(userId).trim() : '';
  return `${org}:${user}`;
}

/**
 * Read a scoped cache entry. For signed-in identities (userId or organisationId
 * present), never fall back to the unscoped legacy key for a different identity —
 * migrate legacy once into this scoped key and delete it.
 *
 * Unsigned / demo (no userId and no organisationId): may still read the unscoped key.
 */
export function readScopedOrMigrateLegacy(
  base: string,
  organisationId?: string | null,
  userId?: string | null,
): string | null {
  try {
    const hasIdentity = Boolean(
      (organisationId != null && String(organisationId).trim()) ||
        (userId != null && String(userId).trim()),
    );
    const scoped = scopedCurriculumKey(base, organisationId, userId);

    if (!hasIdentity) {
      return localStorage.getItem(base);
    }

    const scopedRaw = localStorage.getItem(scoped);
    if (scopedRaw != null) return scopedRaw;

    const legacy = localStorage.getItem(base);
    if (legacy == null) return null;

    // First signed-in user on this browser claims the legacy blob.
    localStorage.setItem(scoped, legacy);
    localStorage.removeItem(base);
    return legacy;
  } catch {
    return null;
  }
}

export function writeScopedLocal(
  base: string,
  value: string,
  organisationId?: string | null,
  userId?: string | null,
): void {
  try {
    const scoped = scopedCurriculumKey(base, organisationId, userId);
    localStorage.setItem(scoped, value);
  } catch {
    /* quota / private mode */
  }
}
