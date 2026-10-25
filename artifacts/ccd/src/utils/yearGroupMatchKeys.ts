/**
 * Shared year-group key matching for Settings assignments ↔ Activity Library.
 *
 * Settings stores category.yearGroups under yearGroup.id (e.g. LKG, Year6).
 * Sheets / activity tags may use id, display name, or aliases
 * (Lower Kindergarten, Year 6 Music, etc.). Match all of them.
 *
 * Important: never treat "Year 10" as a match for "Year 1" — naive
 * `includes('year 1')` would match inside "year 10".
 */

export type YearGroupLike = { id?: string; name?: string };

export function normalizeYgKey(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Alias tokens that should be treated as the same year group. */
const ALIAS_GROUPS: string[][] = [
  // EYFS umbrella: a class named EYFS matches categories ticked for any of these, and the reverse.
  ['eyfs', 'reception', 'lkg', 'ukg', 'nursery'],
  ['lkg', 'lower kindergarten', 'lower kindergarten music', 'lower kindergarden'],
  ['ukg', 'upper kindergarten', 'upper kindergarten music', 'upper kindergarden'],
  ['reception', 'reception music', 'reception class'],
  ['nursery', 'nursery class', 'nursery music'],
  ['year6', 'year 6', 'year 6 music', 'y6'],
  ['year5', 'year 5', 'year 5 music', 'y5'],
  ['year4', 'year 4', 'year 4 music', 'y4'],
  ['year3', 'year 3', 'year 3 music', 'y3'],
  ['year2', 'year 2', 'year 2 music', 'y2'],
  ['year1', 'year 1', 'year 1 music', 'y1'],
];

/** Extract a Year N number when present (word-boundary safe). */
export function extractYearNumber(normalized: string): string | null {
  const n = normalizeYgKey(normalized);
  if (!n) return null;
  const m =
    n.match(/\byear\s*(\d+)\b/) ||
    n.match(/^year(\d+)\b/) ||
    n.match(/^y(\d+)$/);
  return m ? m[1] : null;
}

/** Subject / suffix after a Year N token, e.g. "year 1 drama" → "drama". */
function subjectAfterYear(normalized: string): string {
  const n = normalizeYgKey(normalized);
  return n
    .replace(/^y(?:ear)?\s*\d+\s*/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function aliasTokensFor(normalized: string): string[] {
  const out = new Set<string>([normalized]);
  const yn = extractYearNumber(normalized);

  for (const group of ALIAS_GROUPS) {
    const groupYear = extractYearNumber(group[0]);
    if (groupYear) {
      // Year-N aliases only apply when the year numbers match exactly.
      if (yn && yn === groupYear) {
        group.forEach((g) => out.add(g));
      }
      continue;
    }

    // Non-year aliases (LKG / Reception / …): exact or whole-phrase contains.
    const hit = group.some((g) => {
      if (g === normalized) return true;
      // Require word-ish boundaries so short tokens don't false-positive.
      if (normalized === g) return true;
      if (normalized.startsWith(`${g} `) || normalized.endsWith(` ${g}`)) return true;
      if (normalized.includes(` ${g} `)) return true;
      return false;
    });
    if (hit) group.forEach((g) => out.add(g));
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

  const ya = extractYearNumber(na);
  const yb = extractYearNumber(nb);
  // "Year 10 …" must never match "Year 1 …"
  if (ya && yb && ya !== yb) return false;

  if (ya && yb && ya === yb) {
    const sa = subjectAfterYear(na);
    const sb = subjectAfterYear(nb);
    // Generic "Year 1" matches "Year 1 Drama" / "Year 1 Music".
    // Subject-specific labels only match the same subject (drama ≠ music).
    if (!sa || !sb) return true;
    if (sa === sb) return true;
    // Allow OCR/GCSE parenthetical variants already stripped above.
    if (sa.startsWith(sb) || sb.startsWith(sa)) return true;
    return false;
  }

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
    eyfs: (n) => n === 'eyfs' || n.startsWith('eyfs '),
    lkg: (n) => n.includes('lower') && n.includes('kindergarten'),
    ukg: (n) => n.includes('upper') && n.includes('kindergarten'),
    reception: (n) => n === 'reception' || n.startsWith('reception '),
    nursery: (n) => n === 'nursery' || n.startsWith('nursery '),
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
        sheetNorm === name ||
        sheetNorm === id ||
        sheetNorm.startsWith(`${name} `) ||
        name.startsWith(`${sheetNorm} `) ||
        sheetNorm.startsWith(`${id} `) ||
        id.startsWith(`${sheetNorm} `)
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

    if (
      nameLower === 'eyfs' ||
      nameLower.startsWith('eyfs ') ||
      idLower === 'eyfs' ||
      nameLower.includes('early years')
    ) {
      keys.add('EYFS');
      keys.add('Reception');
      keys.add('LKG');
      keys.add('UKG');
      keys.add('Nursery');
    }
    if (nameLower.includes('lower') || nameLower.includes('lkg') || idLower === 'lkg') {
      keys.add('LKG');
      keys.add('Lower Kindergarten');
      keys.add('EYFS');
    }
    if (nameLower.includes('upper') || nameLower.includes('ukg') || idLower === 'ukg') {
      keys.add('UKG');
      keys.add('Upper Kindergarten');
      keys.add('EYFS');
    }
    if (nameLower === 'reception' || nameLower.startsWith('reception ') || idLower === 'reception') {
      keys.add('Reception');
      keys.add('EYFS');
    }
    if (nameLower === 'nursery' || nameLower.startsWith('nursery ') || idLower === 'nursery') {
      keys.add('Nursery');
      keys.add('EYFS');
    }

    const yearMatch = nameLower.match(/\byear\s*(\d+)\b/) || idLower.match(/\byear\s*(\d+)\b/);
    if (yearMatch) {
      const n = yearMatch[1];
      keys.add(`Year${n}`);
      keys.add(`Year ${n}`);
      // Subject-specific extras from the class name (Music / Drama / …)
      const subject = subjectAfterYear(nameLower);
      if (subject) {
        const titled = subject.replace(/\b\w/g, (c) => c.toUpperCase());
        keys.add(`Year ${n} ${titled}`);
      }
    }
  } else {
    // Sheet-only fallback aliases so tags / legacy keys still match
    for (const token of aliasTokensFor(sheetNorm)) {
      if (token === 'eyfs') {
        keys.add('EYFS');
        keys.add('Reception');
        keys.add('LKG');
        keys.add('UKG');
        keys.add('Nursery');
      } else if (token === 'lkg') {
        keys.add('LKG');
        keys.add('EYFS');
      } else if (token === 'ukg') {
        keys.add('UKG');
        keys.add('EYFS');
      } else if (token === 'reception') {
        keys.add('Reception');
        keys.add('EYFS');
      } else if (token === 'nursery') {
        keys.add('Nursery');
        keys.add('EYFS');
      } else if (/^year\d+$/.test(token)) {
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
 * Build category.yearGroups ticks for a chosen class (id + name + aliases).
 * Used when opening LSO activities in a selected year group.
 */
export function resolveYearGroupAssignmentKeys(
  yearGroup: YearGroupLike | string | undefined | null,
  customYearGroups?: YearGroupLike[] | null,
): Record<string, boolean> {
  let groups = Array.isArray(customYearGroups) ? customYearGroups : [];
  if (groups.length === 0) {
    try {
      const raw = localStorage.getItem('custom-year-groups');
      if (raw) {
        const parsed = JSON.parse(raw) as YearGroupLike[];
        if (Array.isArray(parsed)) groups = parsed;
      }
    } catch {
      /* ignore */
    }
  }

  const sheet =
    typeof yearGroup === 'string'
      ? yearGroup
      : String(yearGroup?.id || yearGroup?.name || '').trim();
  if (!sheet) return {};

  const keys = new Set<string>(resolveYearGroupMatchKeys(sheet, groups));
  if (typeof yearGroup === 'object' && yearGroup) {
    if (yearGroup.id) keys.add(String(yearGroup.id));
    if (yearGroup.name) keys.add(String(yearGroup.name));
  }

  const out: Record<string, boolean> = {};
  keys.forEach((k) => {
    if (k) out[k] = true;
  });
  return out;
}

/**
 * Year 6 / Year6 / Year 6 Music keys for seeding LSO category ticks.
 * Reads custom-year-groups from localStorage when available.
 */
export function resolveYear6AssignmentKeys(): Record<string, boolean> {
  const out = resolveYearGroupAssignmentKeys('Year6');
  // Always include canonical Year 6 aliases used by the LSO seed
  out.Year6 = true;
  out['Year 6'] = true;
  out['Year 6 Music'] = true;
  return out;
}
