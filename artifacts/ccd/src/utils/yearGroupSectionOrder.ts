/** Resolve year-group section tokens (id or display name) to the canonical group. */

export type YearGroupLike = { id: string; name: string; color?: string };

export type YearGroupSectionLike = {
  id: string;
  label: string;
  sortOrder: number;
  collapsed?: boolean;
  yearGroupIds: string[];
};

/** Default section labels (user can customise in Settings → Manage Year Groups). */
export const DEFAULT_YEAR_GROUP_SECTION_LABELS = [
  { id: 'eyfs', label: 'EYFS', sortOrder: 0 },
  { id: 'ks1', label: 'KS1', sortOrder: 1 },
  { id: 'ks2', label: 'KS2', sortOrder: 2 },
  { id: 'ks3', label: 'KS3', sortOrder: 3 },
  { id: 'ks4', label: 'KS4', sortOrder: 4 },
  { id: 'ks5', label: 'KS5', sortOrder: 5 },
  { id: 'other', label: 'Other', sortOrder: 6 },
] as const;

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

/** Suggest a key-stage section by name/id pattern (hint only — never auto-allocate for real users). */
export function getDefaultSectionIdForYearGroup(id: string, name: string): string {
  const n = name || id || '';
  const lower = n.toLowerCase();
  if (['lkg', 'ukg', 'lower kindergarten', 'upper kindergarten', 'reception'].some((k) => lower.includes(k))) {
    return 'eyfs';
  }
  if (lower.includes('year 1') || lower.includes('year1')) return 'ks1';
  if (lower.includes('year 2') || lower.includes('year2')) return 'ks1';
  if (['year 3', 'year 4', 'year 5', 'year 6'].some((y) => lower.includes(y.replace(' ', '')) || lower.includes(y))) {
    return 'ks2';
  }
  if (['year 7', 'year 8', 'year 9'].some((y) => lower.includes(y.replace(' ', '')) || lower.includes(y))) {
    return 'ks3';
  }
  if (['year 10', 'year 11'].some((y) => lower.includes(y.replace(' ', '')) || lower.includes(y))) {
    return 'ks4';
  }
  if (['year 12', 'year 13', 'year 14'].some((y) => lower.includes(y.replace(' ', '')) || lower.includes(y))) {
    return 'ks5';
  }
  return 'other';
}

function emptySectionBuckets(): Map<string, string[]> {
  const bySection = new Map<string, string[]>();
  DEFAULT_YEAR_GROUP_SECTION_LABELS.forEach((s) => bySection.set(s.id, []));
  return bySection;
}

function sectionsFromBuckets(bySection: Map<string, string[]>): YearGroupSectionLike[] {
  return DEFAULT_YEAR_GROUP_SECTION_LABELS.map((s) => ({
    id: s.id,
    label: s.label,
    sortOrder: s.sortOrder,
    collapsed: true,
    yearGroupIds: bySection.get(s.id) || [],
  }));
}

/**
 * Default sections for real users: empty key-stage folders, every class in Other.
 * Header only lists classes the user has dragged into a key stage in Settings.
 */
export function buildDefaultYearGroupSections<T extends YearGroupLike>(
  yearGroups: T[]
): YearGroupSectionLike[] {
  const bySection = emptySectionBuckets();
  const other = bySection.get('other')!;
  yearGroups.forEach((g) => other.push(g.id));
  return sectionsFromBuckets(bySection);
}

/**
 * Name-based bucketing into EYFS/KS1…/Other. Kept for optional tooling;
 * do not use for live defaults or Header visibility.
 */
export function buildHeuristicYearGroupSections<T extends YearGroupLike>(
  yearGroups: T[]
): YearGroupSectionLike[] {
  const bySection = emptySectionBuckets();
  yearGroups.forEach((g) => {
    const sectionId = getDefaultSectionIdForYearGroup(g.id, g.name);
    const arr = bySection.get(sectionId) ?? bySection.get('other')!;
    arr.push(g.id);
  });
  return sectionsFromBuckets(bySection);
}

/**
 * Demo cold-start: pre-assign a primary subset (EYFS / KS1 / KS2) by name;
 * leave KS3+ and unmatched classes in Other so they stay out of the Header
 * until dragged into a key stage in Settings.
 */
export function buildDemoYearGroupSections<T extends YearGroupLike>(
  yearGroups: T[]
): YearGroupSectionLike[] {
  const bySection = emptySectionBuckets();
  yearGroups.forEach((g) => {
    const hinted = getDefaultSectionIdForYearGroup(g.id, g.name);
    const sectionId =
      hinted === 'eyfs' || hinted === 'ks1' || hinted === 'ks2' ? hinted : 'other';
    (bySection.get(sectionId) ?? bySection.get('other')!).push(g.id);
  });
  return sectionsFromBuckets(bySection);
}

/**
 * Demo helper: move classes out of KS3/KS4/KS5 into Other so the Header only
 * surfaces a primary (EYFS/KS1/KS2) allocated subset unless the user re-drags.
 */
export function demoteSecondarySectionsToOther<S extends YearGroupSectionLike>(
  sections: S[],
  groups: YearGroupLike[],
): S[] {
  const secondaryIds = new Set(['ks3', 'ks4', 'ks5']);
  const moved: string[] = [];
  const working = sections.map((s) => {
    if (!secondaryIds.has(s.id)) return s;
    const ids = normalizeSectionYearGroupIdList(s.yearGroupIds || [], groups);
    moved.push(...ids);
    return { ...s, yearGroupIds: [] as string[] };
  });
  if (moved.length === 0) return working;
  if (!working.some((s) => s.id === 'other')) {
    const maxOrder = working.reduce((m, s) => Math.max(m, Number(s.sortOrder) || 0), -1);
    working.push({
      id: 'other',
      label: 'Other',
      sortOrder: maxOrder + 1,
      collapsed: true,
      yearGroupIds: [] as string[],
    } as unknown as S);
  }
  return working.map((s) => {
    if (s.id !== 'other') return s;
    const existing = normalizeSectionYearGroupIdList(s.yearGroupIds || [], groups);
    const seen = new Set(existing);
    const extra = moved.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return { ...s, yearGroupIds: [...existing, ...extra] };
  });
}

/**
 * Remap section yearGroupIds onto a target year-group list.
 * Resolves tokens via optional source groups (name/id), then canonical target ids.
 * Drops tokens that cannot be resolved in the target list.
 */
export function remapYearGroupSectionsToGroups<
  S extends YearGroupSectionLike,
  T extends YearGroupLike
>(sections: S[], targetGroups: T[], sourceGroups?: YearGroupLike[]): S[] {
  return sections.map((section) => {
    const remapped: string[] = [];
    const seen = new Set<string>();
    for (const token of section.yearGroupIds || []) {
      const fromSource = sourceGroups?.length
        ? resolveYearGroupFromToken(sourceGroups, token)
        : undefined;
      const lookup = fromSource?.name || fromSource?.id || token;
      const target =
        resolveYearGroupFromToken(targetGroups, lookup) ||
        resolveYearGroupFromToken(targetGroups, token);
      if (!target || seen.has(target.id)) continue;
      seen.add(target.id);
      remapped.push(target.id);
    }
    return { ...section, yearGroupIds: remapped };
  });
}

/** True when any section token resolves to a group in the given list (by id or name). */
export function sectionsHaveResolvableGroups<T extends YearGroupLike>(
  sections: { yearGroupIds: string[] }[],
  groups: T[]
): boolean {
  return sections.some((s) =>
    (s.yearGroupIds || []).some((token) => Boolean(resolveYearGroupFromToken(groups, token)))
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
 * True when section nesting matches name-based heuristic bucketing exactly
 * (same section id per class). Used to detect the old v2 auto-migration so we
 * can reset those users to unallocated (Other) without wiping real custom layouts.
 */
export function sectionsMatchHeuristicAssignment<
  S extends YearGroupSectionLike,
  T extends YearGroupLike
>(sections: S[], groups: T[]): boolean {
  if (!groups.length || !sections.length) return false;
  const heuristic = buildHeuristicYearGroupSections(groups);
  const sectionIdFor = (secs: YearGroupSectionLike[], groupId: string): string | null => {
    for (const s of secs) {
      if (sectionContainsCanonicalId(s.yearGroupIds || [], groupId, groups)) return s.id;
    }
    return null;
  };
  return groups.every(
    (g) => sectionIdFor(sections, g.id) === sectionIdFor(heuristic, g.id),
  );
}

/**
 * Append any canonical ids missing from sections into Other (unallocated pool).
 * Creates an Other section when the user removed it, so classes are never dropped.
 * Does not auto-place orphans into EYFS/KS1… — only explicit Settings drags do that.
 */
export function mergeSectionsWithYearGroups<
  S extends { id: string; label?: string; sortOrder?: number; collapsed?: boolean; yearGroupIds: string[] },
  T extends YearGroupLike
>(sections: S[], yearGroupCanonicalIds: string[], groups: T[]): S[] {
  const working: S[] = sections.length > 0 ? [...sections] : (buildDefaultYearGroupSections(groups) as S[]);
  if (!working.some((s) => s.id === 'other')) {
    const maxOrder = working.reduce((m, s) => Math.max(m, Number(s.sortOrder) || 0), -1);
    working.push({
      id: 'other',
      label: 'Other',
      sortOrder: maxOrder + 1,
      collapsed: true,
      yearGroupIds: [] as string[],
    } as unknown as S);
  }

  const canonicalAssigned = new Set<string>();
  for (const s of working) {
    for (const token of s.yearGroupIds) {
      const g = resolveYearGroupFromToken(groups, token);
      if (g) canonicalAssigned.add(g.id);
    }
  }
  const otherSection = working.find((s) => s.id === 'other')!;
  let otherIds = normalizeSectionYearGroupIdList(otherSection.yearGroupIds || [], groups);
  yearGroupCanonicalIds.forEach((id) => {
    if (!canonicalAssigned.has(id)) {
      otherIds.push(id);
      canonicalAssigned.add(id);
    }
  });
  return working.map((s) =>
    s.id === 'other' ? { ...s, yearGroupIds: otherIds } : s
  );
}
