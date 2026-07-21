/**
 * Shared year-group key matching for Settings assignments ↔ Activity Library.
 *
 * Settings stores category.yearGroups under yearGroup.id (e.g. LKG, Year6).
 * Sheets / activity tags may use id, display name, or aliases
 * (Lower Kindergarten, Year 6 Music, etc.). Match all of them.
 */

export type YearGroupLike = { id?: string; name?: string };

export function normalizeYgKey(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Alias tokens that should be treated as the same year group. */
const ALIAS_GROUPS: string[][] = [
  ['lkg', 'lower kindergarten', 'lower kindergarten music', 'lower kindergarden'],
  ['ukg', 'upper kindergarten', 'upper kindergarten music', 'upper kindergarden'],
  ['reception', 'reception music', 'reception class'],
  ['year6', 'year 6', 'year 6 music', 'y6'],
  ['year5', 'year 5', 'year 5 music', 'y5'],
  ['year4', 'year 4', 'year 4 music', 'y4'],
  ['year3', 'year 3', 'year 3 music', 'y3'],
  ['year2', 'year 2', 'year 2 music', 'y2'],
  ['year1', 'year 1', 'year 1 music', 'y1'],
];

function aliasTokensFor(normalized: string): string[] {
  const out = new Set<string>([normalized]);
  for (const group of ALIAS_GROUPS) {
    if (group.some((g) => g === normalized || normalized.includes(g) || g.includes(normalized))) {
      group.forEach((g) => out.add(g));
    }
  }
  // Compact forms: "year 6" ↔ "year6"
  const compact = normalized.replace(/\s+/g, '');
  if (compact !== normalized) out.add(compact);
  return [...out];
}

/** True if two year-group tokens refer to the same class (id/name/alias). */
export function yearGroupTokensMatch(a: string, b: string): boolean {
  const na = normalizeYgKey(a);
  const nb = normalizeYgKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const aAliases = aliasTokensFor(na);
  const bAliases = aliasTokensFor(nb);
  return aAliases.some((x) => bAliases.includes(x));
}

/**
 * Resolve all keys that should match category.yearGroups / activity tags
 * for the currently selected sheet / class.
 */
export function resolveYearGroupMatchKeys(
  sheetId: string | undefined | null,
  customYearGroups: YearGroupLike[] | undefined | null,
): string[] {
  const sheet = (sheetId || '').trim();
  if (!sheet) return [];

  const groups = Array.isArray(customYearGroups) ? customYearGroups : [];
  const sheetNorm = normalizeYgKey(sheet);

  const shortToLong: Record<string, (name: string) => boolean> = {
    lkg: (n) => n.includes('lower') && n.includes('kindergarten'),
    ukg: (n) => n.includes('upper') && n.includes('kindergarten'),
    reception: (n) => n === 'reception' || n.startsWith('reception '),
    year6: (n) => n === 'year 6' || n.startsWith('year 6 ') || n === 'year6',
  };

  let yearGroup = groups.find(
    (yg) =>
      normalizeYgKey(yg.id) === sheetNorm || normalizeYgKey(yg.name) === sheetNorm,
  );

  if (!yearGroup) {
    yearGroup = groups.find((yg) => {
      const name = normalizeYgKey(yg.name);
      const id = normalizeYgKey(yg.id);
      return (
        sheetNorm.includes(name) ||
        name.includes(sheetNorm) ||
        sheetNorm.includes(id) ||
        id.includes(sheetNorm)
      );
    });
  }

  if (!yearGroup && shortToLong[sheetNorm]) {
    const matcher = shortToLong[sheetNorm];
    yearGroup = groups.find((yg) => matcher(normalizeYgKey(yg.name)));
  }

  // Year N short codes (Year6) → name starting with Year N
  if (!yearGroup) {
    const m = sheetNorm.match(/^year\s*(\d+)$/);
    if (m) {
      const n = m[1];
      yearGroup = groups.find((yg) => {
        const name = normalizeYgKey(yg.name);
        return name === `year ${n}` || name.startsWith(`year ${n} `);
      });
    }
  }

  const keys = new Set<string>();
  keys.add(sheet);

  if (yearGroup) {
    if (yearGroup.id) keys.add(String(yearGroup.id));
    if (yearGroup.name) keys.add(String(yearGroup.name));

    const nameLower = normalizeYgKey(yearGroup.name);
    const idLower = normalizeYgKey(yearGroup.id);

    if (nameLower.includes('lower') || nameLower.includes('lkg') || idLower === 'lkg') {
      keys.add('LKG');
      keys.add('Lower Kindergarten');
    }
    if (nameLower.includes('upper') || nameLower.includes('ukg') || idLower === 'ukg') {
      keys.add('UKG');
      keys.add('Upper Kindergarten');
    }
    if (nameLower.includes('reception') || idLower === 'reception') {
      keys.add('Reception');
    }

    const yearMatch = nameLower.match(/year\s*(\d+)/) || idLower.match(/year\s*(\d+)/);
    if (yearMatch) {
      const n = yearMatch[1];
      keys.add(`Year${n}`);
      keys.add(`Year ${n}`);
      keys.add(`Year ${n} Music`);
    }
  } else {
    // Sheet-only fallback aliases so tags / legacy keys still match
    for (const token of aliasTokensFor(sheetNorm)) {
      // Prefer canonical casing for common codes
      if (token === 'lkg') keys.add('LKG');
      else if (token === 'ukg') keys.add('UKG');
      else if (token === 'reception') keys.add('Reception');
      else if (/^year\d+$/.test(token)) {
        const n = token.replace('year', '');
        keys.add(`Year${n}`);
        keys.add(`Year ${n}`);
      } else if (token.startsWith('year ')) {
        keys.add(token.replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    }
  }

  return [...keys].filter(Boolean);
}

/** Whether a category.yearGroups map assigns this year group (any alias). */
export function categoryAssignedToYearGroupKeys(
  yearGroups: Record<string, unknown> | null | undefined,
  matchKeys: string[],
): boolean {
  if (!yearGroups || typeof yearGroups !== 'object' || matchKeys.length === 0) return false;

  const assignedKeys = Object.keys(yearGroups).filter((k) => yearGroups[k] === true);
  if (assignedKeys.length === 0) return false;

  return assignedKeys.some((assigned) =>
    matchKeys.some((need) => yearGroupTokensMatch(assigned, need)),
  );
}

/** Activity yearGroups tag array matches current year group keys. */
export function activityTagsMatchYearGroupKeys(
  activityYearGroups: unknown,
  matchKeys: string[],
): boolean {
  const tags = Array.isArray(activityYearGroups) ? activityYearGroups : [];
  if (tags.length === 0 || matchKeys.length === 0) return false;
  return tags.some((tag) =>
    matchKeys.some((need) => yearGroupTokensMatch(String(tag), need)),
  );
}

/**
 * Year 6 / Year6 / Year 6 Music keys for seeding LSO category ticks.
 * Reads custom-year-groups from localStorage when available.
 */
export function resolveYear6AssignmentKeys(): Record<string, boolean> {
  const keys = new Set<string>(['Year6', 'Year 6', 'Year 6 Music']);
  try {
    const raw = localStorage.getItem('custom-year-groups');
    if (raw) {
      const groups = JSON.parse(raw) as YearGroupLike[];
      if (Array.isArray(groups)) {
        for (const k of resolveYearGroupMatchKeys('Year6', groups)) keys.add(k);
        for (const k of resolveYearGroupMatchKeys('Year 6', groups)) keys.add(k);
        const music = groups.find((g) => normalizeYgKey(g.name).includes('year 6'));
        if (music?.id) keys.add(String(music.id));
        if (music?.name) keys.add(String(music.name));
      }
    }
  } catch {
    /* ignore */
  }
  const out: Record<string, boolean> = {};
  keys.forEach((k) => {
    out[k] = true;
  });
  return out;
}
