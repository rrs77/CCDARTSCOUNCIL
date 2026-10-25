/** Organisation id shape used in PostgREST filters and resolveOrganisationId. */
export const ORG_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Safe PostgREST `.or()` filter for org-scoped + NULL-org shared rows.
 * Returns null when the id is missing or unsafe — callers must not interpolate it.
 */
export function orgOrNullFilter(organisationId: string | null | undefined): string | null {
  if (typeof organisationId !== 'string') return null;
  const id = organisationId.trim();
  if (!ORG_ID_RE.test(id)) return null;
  return `organisation_id.eq.${id},organisation_id.is.null`;
}
