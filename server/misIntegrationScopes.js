/**
 * Shared MIS scope allow-list (Node). Keep in sync with
 * artifacts/ccd/src/features/mis-integrations/scopes.ts and
 * supabase/migrations/20261024_mis_integrations.sql.
 *
 * CCDesigner must never receive pupil (or related) scopes.
 */

export const MIS_APP_ALLOWED_SCOPES = Object.freeze({
  ccdesigner: Object.freeze(['year_groups.read']),
  assessify: Object.freeze(['pupils.read', 'classes.read', 'year_groups.read']),
  perifeedback: Object.freeze([
    'pupils.read',
    'year_groups.read',
    'lesson_assignments.read',
    'parent_contacts.read',
  ]),
  periplanner: Object.freeze([
    'pupils.read',
    'timetables.read',
    'activities.read',
    'year_groups.read',
  ]),
});

export const MIS_SCOPES_EXCLUDED_FROM_CCDESIGNER = Object.freeze([
  'pupils.read',
  'classes.read',
  'lesson_assignments.read',
  'parent_contacts.read',
  'timetables.read',
  'activities.read',
]);

export function assertScopeAllowedForApp(appId, scopeId) {
  if (appId === 'ccdesigner' && MIS_SCOPES_EXCLUDED_FROM_CCDESIGNER.includes(scopeId)) {
    const err = new Error(
      `CCDesigner cannot be granted scope "${scopeId}". Pupil records stay outside CCDesigner's data model.`,
    );
    err.name = 'MisScopeViolationError';
    throw err;
  }
  const allowed = MIS_APP_ALLOWED_SCOPES[appId];
  if (!allowed || !allowed.includes(scopeId)) {
    const err = new Error(`Scope "${scopeId}" is not allow-listed for app "${appId}".`);
    err.name = 'MisScopeViolationError';
    throw err;
  }
}

export function filterScopesForApp(appId, scopes) {
  return (scopes || []).filter((scopeId) => {
    try {
      assertScopeAllowedForApp(appId, scopeId);
      return true;
    } catch {
      return false;
    }
  });
}
