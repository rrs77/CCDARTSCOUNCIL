/**
 * Collapse catalog rows (year groups / categories) for the Settings UI.
 *
 * Once a school has any org-scoped copies, hide shared NULL-org rows so
 * deleting a school copy (e.g. Year 2) does not make the shared default
 * reappear. Schools with no copies of their own still see the shared defaults.
 * When both org + shared share a name, prefer the org-scoped copy.
 */
export function preferOrgScopedByName<T extends { name?: string | null; organisation_id?: string | null }>(
  rows: T[],
): T[] {
  const hasOrgScoped = rows.some((r) => r.organisation_id != null && String(r.organisation_id).trim() !== '');
  const source = hasOrgScoped
    ? rows.filter((r) => r.organisation_id != null && String(r.organisation_id).trim() !== '')
    : rows;
  const sorted = [...source].sort((a, b) => {
    const aOrg = a.organisation_id == null ? 1 : 0;
    const bOrg = b.organisation_id == null ? 1 : 0;
    return aOrg - bOrg;
  });
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of sorted) {
    const name = row.name == null ? '' : String(row.name);
    if (name) {
      if (seen.has(name)) continue;
      seen.add(name);
    }
    out.push(row);
  }
  return out;
}
