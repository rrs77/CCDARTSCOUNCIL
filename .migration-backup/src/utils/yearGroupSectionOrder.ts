/** Resolve year-group section tokens (id or display name) to the canonical group. */

export type YearGroupLike = { id: string; name: string; color?: string };

export function normalizeYearGroupToken(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase();
}

export function resolveYearGroupFromToken<T extends YearGroupLike>(
  groups: T[],
  token: string
): T | undefined {
  const t = (token || '').trim();
  if (!t) return undefined;
  const byId = groups.find((g) => g.id === t);
  if (byId) return byId;
  const nk = normalizeYearGroupToken(t);
  return groups.find(
    (g) =>
      normalizeYearGroupToken(g.id) === nk || normalizeYearGroupToken(g.name) === nk
  );
}

/** Collapse section tokens to canonical ids; preserve first-seen order; drop unknown duplicate tokens. */
export function normalizeSectionYearGroupIdList<T extends YearGroupLike>(
  tokens: string[],
  groups: T[]
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const g = resolveYearGroupFromToken(groups, token);
    const id = (g?.id ?? (token || '').trim()).trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function getOrderedYearGroupsFromSections<T extends YearGroupLike>(
  sections: { sortOrder: number; yearGroupIds: string[] }[],
  groups: T[]
): T[] {
  const ordered: T[] = [];
  const seen = new Set<string>();
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const section of sortedSections) {
    for (const token of section.yearGroupIds) {
      const g = resolveYearGroupFromToken(groups, token);
      if (g && !seen.has(g.id)) {
        ordered.push(g);
        seen.add(g.id);
      }
    }
  }
  for (const g of groups) {
    if (!seen.has(g.id)) ordered.push(g);
  }
  return ordered;
}

/** True if this section's tokens include the given canonical group id. */
export function sectionContainsCanonicalId<T extends YearGroupLike>(
  yearGroupIds: string[],
  canonicalId: string,
  groups: T[]
): boolean {
  return yearGroupIds.some(
    (token) => resolveYearGroupFromToken(groups, token)?.id === canonicalId
  );
}

/**
 * Append any canonical ids missing from sections into Other (matches legacy ids or names in lists).
 */
export function mergeSectionsWithYearGroups<
  S extends { id: string; yearGroupIds: string[] },
  T extends YearGroupLike
>(sections: S[], yearGroupCanonicalIds: string[], groups: T[]): S[] {
  const canonicalAssigned = new Set<string>();
  for (const s of sections) {
    for (const token of s.yearGroupIds) {
      const g = resolveYearGroupFromToken(groups, token);
      if (g) canonicalAssigned.add(g.id);
    }
  }
  const otherSection = sections.find((s) => s.id === 'other');
  let otherIds = otherSection
    ? normalizeSectionYearGroupIdList(otherSection.yearGroupIds || [], groups)
    : [];
  yearGroupCanonicalIds.forEach((id) => {
    if (!canonicalAssigned.has(id)) {
      otherIds.push(id);
      canonicalAssigned.add(id);
    }
  });
  return sections.map((s) =>
    s.id === 'other' ? { ...s, yearGroupIds: otherIds } : s
  );
}
