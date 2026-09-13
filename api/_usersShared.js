/**
 * Pure helpers for Settings user-list API (search / filter / pagination / scope).
 */

export const USERS_LIST_SORTS = new Set([
  'created_at',
  'email',
  'display_name',
  'role',
]);

export const USERS_LIST_ROLES = new Set([
  'viewer',
  'student',
  'teacher',
  'creator',
  'organisation',
  'admin',
  'superuser',
  'super_admin',
]);

export const USERS_LIST_STATUSES = new Set(['active', 'invited', 'suspended']);

/**
 * Strip PostgREST-sensitive characters from free-text search.
 */
export function sanitizeSearchQuery(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/[%_,.()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Parse GET /api/users/list query params.
 * page is 1-based.
 */
export function parseUsersListParams(searchParams) {
  const q = sanitizeSearchQuery(searchParams.get('q') || searchParams.get('search') || '');
  const roleRaw = (searchParams.get('role') || 'all').trim();
  const statusRaw = (searchParams.get('status') || 'all').trim();
  const hub = (searchParams.get('hub') || searchParams.get('organisation_id') || '').trim();
  const sortRaw = (searchParams.get('sort') || 'created_at').trim();
  const orderRaw = (searchParams.get('order') || 'desc').trim().toLowerCase();

  let page = Number.parseInt(searchParams.get('page') || '1', 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let pageSize = Number.parseInt(
    searchParams.get('pageSize') || searchParams.get('limit') || '25',
    10,
  );
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 25;
  if (pageSize > 100) pageSize = 100;

  return {
    q,
    role: roleRaw === 'all' || !USERS_LIST_ROLES.has(roleRaw) ? null : roleRaw,
    status: statusRaw === 'all' || !USERS_LIST_STATUSES.has(statusRaw) ? null : statusRaw,
    hub: hub || null,
    sort: USERS_LIST_SORTS.has(sortRaw) ? sortRaw : 'created_at',
    ascending: orderRaw === 'asc',
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: page * pageSize - 1,
  };
}

/**
 * Intersect two id lists. null means "unrestricted".
 * @returns {string[] | null}
 */
export function intersectIdLists(a, b) {
  if (a == null && b == null) return null;
  if (a == null) return [...new Set(b)];
  if (b == null) return [...new Set(a)];
  const setB = new Set(b);
  return [...new Set(a.filter((id) => setB.has(id)))];
}

/**
 * Build PostgREST or-filter for name/email search.
 */
export function buildProfileSearchOrFilter(q) {
  const safe = sanitizeSearchQuery(q);
  if (!safe) return null;
  const pattern = `%${safe}%`;
  return [
    `email.ilike.${pattern}`,
    `display_name.ilike.${pattern}`,
    `school_or_org.ilike.${pattern}`,
    `first_name.ilike.${pattern}`,
    `last_name.ilike.${pattern}`,
  ].join(',');
}
