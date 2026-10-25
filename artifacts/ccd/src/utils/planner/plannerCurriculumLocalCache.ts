/**
 * Org+user scoped localStorage for planner curriculum.
 * Legacy unscoped keys are migrated once into the first fully-scoped
 * (organisation_id + user_id) identity, then removed so a later user/org
 * on a shared browser cannot import them.
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

function trimmed(value?: string | null): string {
  return value != null ? String(value).trim() : '';
}

/** True when both organisation and user are known — safe to claim legacy blobs. */
export function hasFullCurriculumScope(
  organisationId?: string | null,
  userId?: string | null,
): boolean {
  return Boolean(trimmed(organisationId) && trimmed(userId));
}

/**
 * Read a scoped cache entry.
 *
 * - Unsigned / demo (no user and no org): may read the unscoped key.
 * - Partial scope (user without org, or vice versa): read the scoped key only;
 *   never claim/delete the unscoped legacy key (it would be lost when the other
 *   half of the scope arrives).
 * - Full scope (user + org): migrate legacy once into this scoped key and delete it.
 */
export function readScopedOrMigrateLegacy(
  base: string,
  organisationId?: string | null,
  userId?: string | null,
): string | null {
  try {
    const org = trimmed(organisationId);
    const user = trimmed(userId);
    const scoped = scopedCurriculumKey(base, org || null, user || null);

    if (!org && !user) {
      return localStorage.getItem(base);
    }

    const scopedRaw = localStorage.getItem(scoped);
    if (scopedRaw != null) return scopedRaw;

    // Wait for full scope before claiming the legacy blob.
    if (!hasFullCurriculumScope(org, user)) {
      return null;
    }

    const legacy = localStorage.getItem(base);
    if (legacy == null) return null;

    // First fully-scoped identity on this browser claims the legacy blob.
    localStorage.setItem(scoped, legacy);
    localStorage.removeItem(base);

    // Also reclaim any earlier user-only / org-only partial key if present.
    const userOnly = scopedCurriculumKey(base, null, user);
    const orgOnly = scopedCurriculumKey(base, org, null);
    if (userOnly !== scoped) localStorage.removeItem(userOnly);
    if (orgOnly !== scoped) localStorage.removeItem(orgOnly);

    return legacy;
  } catch {
    return null;
  }
}

/**
 * Read personal legacy/scoped blob only — never the school STORAGE_KEY.
 * Used by the one-time personal import path.
 */
export function readPersonalLegacyBlob(
  organisationId?: string | null,
  userId?: string | null,
): string | null {
  return readScopedOrMigrateLegacy(PERSONAL_STORAGE_KEY, organisationId, userId);
}

export function writeScopedLocal(
  base: string,
  value: string,
  organisationId?: string | null,
  userId?: string | null,
): void {
  try {
    // Prefer full-scope keys; avoid writing to a user-only key that will be orphaned.
    if (!hasFullCurriculumScope(organisationId, userId)) {
      const org = trimmed(organisationId);
      const user = trimmed(userId);
      if (!org && !user) {
        localStorage.setItem(base, value);
        return;
      }
      // Partial scope: still write the partial key for session continuity, but
      // callers that import must wait for full scope before claiming legacy.
    }
    const scoped = scopedCurriculumKey(base, organisationId, userId);
    localStorage.setItem(scoped, value);
  } catch {
    /* quota / private mode */
  }
}
