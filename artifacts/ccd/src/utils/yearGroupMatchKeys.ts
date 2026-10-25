/**
 * Shared year-group key matching for Settings assignments ↔ Activity Library.
 *
 * Settings stores category.yearGroups under yearGroup.id (e.g. LKG, Year6).
 * Sheets / activity tags may use id, display name, or aliases
 * (Lower Kindergarten, Year 6 Music, EYFS Reception Music, etc.). Match all of them.
 *
 * Important: never treat "Year 10" as a match for "Year 1" — naive
 * `includes('year 1')` would match inside "year 10".
 */

export type YearGroupLike = { id?: string; name?: string };

/**
 * Canonical shared normaliser for year-group keys.
 * Trim, lower-case, collapse whitespace. Use everywhere keys are compared.
 */
export function normalizeYearGroupKey(value: string | undefined | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** @deprecated Prefer normalizeYearGroupKey — kept as an alias for call sites. */
export function normalizeYgKey(value: string | undefined | null): string {
  return normalizeYearGroupKey(value);
}

/** Alias tokens that should be treated as the same year group. */
const ALIAS_GROUPS: string[][] = [
  ['lkg', 'lower kindergarten', 'lower kindergarten music', 'lower kindergarden'],
  ['ukg', 'upper kindergarten', 'upper kindergarten music', 'upper kindergarden'],
  [
    'reception',
    'reception music',
    'reception drama',
    'reception class',
    'rec',
    'r',
    'yr r',
    'year r',
    'y r',
    'eyfs',
    'eyfs reception',
    'eyfs reception music',
    'nursery',
    'nursery reception',
  ],
  ['year6', 'year 6', 'year 6 music', 'year 6 drama', 'y6', 'yr 6', 'y 6'],
  ['year5', 'year 5', 'year 5 music', 'year 5 drama', 'y5', 'yr 5', 'y 5'],
  ['year4', 'year 4', 'year 4 music', 'year 4 drama', 'y4', 'yr 4', 'y 4'],
  ['year3', 'year 3', 'year 3 music', 'year 3 drama', 'y3', 'yr 3', 'y 3'],
  ['year2', 'year 2', 'year 2 music', 'year 2 drama', 'y2', 'yr 2', 'y 2'],
  ['year1', 'year 1', 'year 1 music', 'year 1 drama', 'y1', 'yr 1', 'y 1'],
];

/** KS band → year numbers it covers (unambiguous English primary mapping). */
const KS_YEARS: Record<string, string[]> = {
  ks1: ['1', '2'],
  'key stage 1': ['1', '2'],
  ks2: ['3', '4', '5', '6'],
  'key stage 2': ['3', '4', '5', '6'],
  ks3: ['7', '8', '9'],
  'key stage 3': ['7', '8', '9'],
};

/** Extract a Year N number when present (word-boundary safe). */
export function extractYearNumber(normalized: string): string | null {
  const n = normalizeYearGroupKey(normalized);
  if (!n) return null;
  const m =
    n.match(/\byear\s*(\d+)\b/) ||
    n.match(/\byr\s*(\d+)\b/) ||
    n.match(/^year(\d+)\b/) ||
    n.match(/^y\s*(\d+)$/) ||
    n.match(/^y(\d+)$/);
  return m ? m[1] : null;
}

/** Detect an unambiguous KS label (e.g. KS1, Key Stage 2). */
export function extractKeyStage(normalized: string): string | null {
  const n = normalizeYearGroupKey(normalized);
  if (!n) return null;
  const m = n.match(/\b(ks\s*[1-5]|key stage\s*[1-5])\b/);
  if (!m) return null;
  return m[1].replace(/\s+/g, ' ').replace(/^key stage/, 'key stage').replace(/^ks\s*/, 'ks');
}

function yearsForKeyStage(ks: string | null): string[] {
  if (!ks) return [];
  const key = ks.replace(/\s+/g, ' ');
  const compact = key.replace(/\s+/g, '');
  return KS_YEARS[key] || KS_YEARS[compact] || KS_YEARS[`key stage ${compact.replace('ks', '')}`] || [];
}

/** Subject / suffix after a Year N token, e.g. "year 1 drama" → "drama". */
function subjectAfterYear(normalized: string): string {
  const n = normalizeYearGroupKey(normalized);
  return n
    .replace(/^(?:y(?:ear)?|yr)\s*\d+\s*/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Strip leading stage labels so "eyfs reception music" ↔ "reception music". */
function stripStagePrefix(normalized: string): string {
  return normalizeYearGroupKey(normalized)
    .replace(/^(eyfs|early years|ks\s*[1-5]|key stage\s*[1-5])\s+/i, '')
    .trim();
}

function hasReceptionToken(normalized: string): boolean {
  const n = normalizeYearGroupKey(normalized);
  if (/\breception\b/.test(n) || /\brec\b/.test(n)) return true;
  if (/\beyfs\b/.test(n) && !extractYearNumber(n)) return true;
  if (/\bnursery\b/.test(n) && !extractYearNumber(n)) return true;
  // Bare R / Yr R / Year R (not Year 1…)
  if (/^(yr|year|y)\s*r$/.test(n) || n === 'r') return true;
  return false;
}

function aliasTokensFor(normalized: string): string[] {
  const out = new Set<string>([normalized]);
  const stripped = stripStagePrefix(normalized);
  if (stripped && stripped !== normalized) out.add(stripped);

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
    const candidates = [normalized, stripped].filter(Boolean);
    const hit = group.some((g) =>
      candidates.some((candidate) => {
        if (g === candidate) return true;
        if (candidate === g) return true;
        if (candidate.startsWith(`${g} `) || candidate.endsWith(` ${g}`)) return true;
        if (candidate.includes(` ${g} `)) return true;
        return false;
      }),
    );
    if (hit) group.forEach((g) => out.add(g));
  }

  // Compact forms: "year 6" ↔ "year6"
  const compact = normalized.replace(/\s+/g, '');
  if (compact !== normalized) out.add(compact);
  return [...out];
}

/** True if two year-group tokens refer to the same class (id/name/alias). */
export function yearGroupTokensMatch(a: string, b: string): boolean {
  const na = normalizeYearGroupKey(a);
  const nb = normalizeYearGroupKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const sa = stripStagePrefix(na);
  const sb = stripStagePrefix(nb);
  if (sa && sb && sa === sb) return true;

  const ya = extractYearNumber(na);
  const yb = extractYearNumber(nb);
  // "Year 10 …" must never match "Year 1 …"
  if (ya && yb && ya !== yb) return false;

  // Same Year N: treat subject suffixes (Music / Drama / …) as the same class,
  // consistent with Reception Music ↔ Reception Drama.
  if (ya && yb && ya === yb) return true;

  // KS labels cover their years only when unambiguous (KS1 ↔ Year 1 / Year 2).
  const ksA = extractKeyStage(na);
  const ksB = extractKeyStage(nb);
  if (ksA && yb) {
    const years = yearsForKeyStage(ksA);
    if (years.includes(yb) && !extractYearNumber(na)) return true;
  }
  if (ksB && ya) {
    const years = yearsForKeyStage(ksB);
    if (years.includes(ya) && !extractYearNumber(nb)) return true;
  }
  if (ksA && ksB) {
    const yaYears = yearsForKeyStage(ksA);
    const ybYears = yearsForKeyStage(ksB);
    if (yaYears.length && ybYears.length && yaYears.join() === ybYears.join()) return true;
  }

  const aAliases = aliasTokensFor(na);
  const bAliases = aliasTokensFor(nb);
  return aAliases.some((x) => bAliases.includes(x));
}

/**
 * Resolve all keys that should match category.yearGroups / activity tags
 * for the currently selected sheet / class.
 *
 * Always includes:
 *  - the sheet id / name
 *  - the matched Settings year-group row id + name
 *  - safe aliases (Reception, Year 6, …)
 *  - ids/names of sibling year-group rows that token-match (so a category
 *    ticked against UUID "yg-rec" still matches class "EYFS Reception Music")
 */
export function resolveYearGroupMatchKeys(
  sheetId: string | undefined | null,
  customYearGroups: YearGroupLike[] | undefined | null,
): string[] {
  const sheet = (sheetId || '').trim();
  if (!sheet) return [];

  const groups = Array.isArray(customYearGroups) ? customYearGroups : [];
  const sheetNorm = normalizeYearGroupKey(sheet);

  const shortToLong: Record<string, (name: string) => boolean> = {
    lkg: (n) => n.includes('lower') && n.includes('kindergarten'),
    ukg: (n) => n.includes('upper') && n.includes('kindergarten'),
    reception: (n) => hasReceptionToken(n),
    year6: (n) => n === 'year 6' || n.startsWith('year 6 ') || n === 'year6',
  };

  let yearGroup = groups.find(
    (yg) =>
      normalizeYearGroupKey(yg.id) === sheetNorm ||
      normalizeYearGroupKey(yg.name) === sheetNorm,
  );

  if (!yearGroup) {
    yearGroup = groups.find((yg) => {
      const name = normalizeYearGroupKey(yg.name);
      const id = normalizeYearGroupKey(yg.id);
      return (
        sheetNorm === name ||
        sheetNorm === id ||
        sheetNorm.startsWith(`${name} `) ||
        name.startsWith(`${sheetNorm} `) ||
        sheetNorm.startsWith(`${id} `) ||
        id.startsWith(`${sheetNorm} `) ||
        yearGroupTokensMatch(sheet, yg.name || '') ||
        yearGroupTokensMatch(sheet, yg.id || '')
      );
    });
  }

  if (!yearGroup && shortToLong[sheetNorm]) {
    const matcher = shortToLong[sheetNorm];
    yearGroup = groups.find((yg) => matcher(normalizeYearGroupKey(yg.name)));
  }

  // Year N short codes (Year6) → name starting with Year N
  if (!yearGroup) {
    const m = sheetNorm.match(/^year\s*(\d+)$/);
    if (m) {
      const n = m[1];
      yearGroup = groups.find((yg) => {
        const name = normalizeYearGroupKey(yg.name);
        return name === `year ${n}` || name.startsWith(`year ${n} `);
      });
    }
  }

  const keys = new Set<string>();
  keys.add(sheet);

  const addAliasesFor = (raw: string | undefined | null) => {
    const nameLower = normalizeYearGroupKey(raw);
    if (!nameLower) return;

    if (
      nameLower.includes('lower') ||
      nameLower.includes('lkg') ||
      nameLower === 'lkg'
    ) {
      keys.add('LKG');
      keys.add('Lower Kindergarten');
    }
    if (
      nameLower.includes('upper') ||
      nameLower.includes('ukg') ||
      nameLower === 'ukg'
    ) {
      keys.add('UKG');
      keys.add('Upper Kindergarten');
    }
    if (hasReceptionToken(nameLower)) {
      keys.add('Reception');
      keys.add('Reception Music');
      keys.add('EYFS Reception');
      keys.add('EYFS Reception Music');
    }

    const yearMatch = nameLower.match(/\byear\s*(\d+)\b/);
    if (yearMatch) {
      const n = yearMatch[1];
      keys.add(`Year${n}`);
      keys.add(`Year ${n}`);
      const subject = subjectAfterYear(nameLower);
      if (subject) {
        const titled = subject.replace(/\b\w/g, (c) => c.toUpperCase());
        keys.add(`Year ${n} ${titled}`);
      }
    }

    for (const token of aliasTokensFor(nameLower)) {
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
  };

  if (yearGroup) {
    if (yearGroup.id) keys.add(String(yearGroup.id));
    if (yearGroup.name) keys.add(String(yearGroup.name));
    addAliasesFor(yearGroup.name);
    addAliasesFor(yearGroup.id);
  } else {
    addAliasesFor(sheet);
  }

  // Include sibling year-group ids/names that token-match the selected class.
  // Fixes "0 of 0" when Settings ticks used a different Reception row's UUID.
  const anchorTokens = [
    sheet,
    yearGroup?.id,
    yearGroup?.name,
    ...keys,
  ].filter(Boolean) as string[];

  for (const yg of groups) {
    const id = yg.id != null ? String(yg.id) : '';
    const name = yg.name != null ? String(yg.name) : '';
    const matches = anchorTokens.some(
      (token) =>
        (id && yearGroupTokensMatch(token, id)) ||
        (name && yearGroupTokensMatch(token, name)),
    );
    if (!matches) continue;
    if (id) keys.add(id);
    if (name) keys.add(name);
    addAliasesFor(name);
    addAliasesFor(id);
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
