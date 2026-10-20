/**
 * Shared ordering for Settings → My classes and the header class picker.
 *
 * Natural year order (Reception before Year 1; Year 10 after Year 9) and
 * subject sub-groups (Music, Drama, Dance, Art, Photography, Other).
 */

import { extractYearNumber, normalizeYgKey } from './yearGroupMatchKeys';

export type ClassLike = { id: string; name: string; color?: string };

export type ClassSubjectId =
  | 'music'
  | 'drama'
  | 'dance'
  | 'art'
  | 'photography'
  | 'other';

export type ClassSubjectDef = {
  id: ClassSubjectId;
  label: string;
  /** Dot / accent colour for the subject chip */
  color: string;
};

/** Display order of subject sub-groups within a key stage. */
export const CLASS_SUBJECTS: ClassSubjectDef[] = [
  { id: 'music', label: 'Music', color: '#4338E8' },
  { id: 'drama', label: 'Drama', color: '#DB2777' },
  { id: 'dance', label: 'Dance', color: '#0D9488' },
  { id: 'art', label: 'Art', color: '#D97706' },
  { id: 'photography', label: 'Photography', color: '#7C3AED' },
  { id: 'other', label: 'Other', color: '#6B7280' },
];

const SUBJECT_BY_ID = Object.fromEntries(CLASS_SUBJECTS.map((s) => [s.id, s])) as Record<
  ClassSubjectId,
  ClassSubjectDef
>;

/** Early-years rank before numbered years. */
function earlyYearsRank(normalized: string): number | null {
  if (/\b(nursery|pre[\s-]?school)\b/.test(normalized)) return 0;
  if (/\b(lkg|lower\s+kindergarten)\b/.test(normalized)) return 1;
  if (/\b(ukg|upper\s+kindergarten)\b/.test(normalized)) return 2;
  if (/\breception\b/.test(normalized)) return 3;
  return null;
}

/**
 * Sort key for natural year order.
 * Lower = earlier. Reception before Year 1; Year 9 before Year 10.
 */
export function classNaturalSortKey(cls: ClassLike): [number, number, string] {
  const n = normalizeYgKey(`${cls.name} ${cls.id}`);
  const early = earlyYearsRank(n);
  if (early != null) return [0, early, n];
  const year = extractYearNumber(n);
  if (year) return [1, Number(year), n];
  // Unrecognised — after numbered years, stable by name
  return [2, 999, n];
}

export function compareClassesNatural(a: ClassLike, b: ClassLike): number {
  const ka = classNaturalSortKey(a);
  const kb = classNaturalSortKey(b);
  if (ka[0] !== kb[0]) return ka[0] - kb[0];
  if (ka[1] !== kb[1]) return ka[1] - kb[1];
  return ka[2].localeCompare(kb[2], undefined, { sensitivity: 'base' });
}

export function sortClassesNatural<T extends ClassLike>(classes: T[]): T[] {
  return [...classes].sort(compareClassesNatural);
}

/**
 * Derive subject from class name / id.
 * Unknown → "other". Photography only meaningful at KS4/KS5 but still detected
 * wherever the name says so.
 */
export function detectClassSubject(cls: ClassLike): ClassSubjectId {
  const n = normalizeYgKey(`${cls.name} ${cls.id}`);
  // More specific first
  if (/\b(photograph(?:y|ic)?|photo)\b/.test(n)) return 'photography';
  if (/\bdrama\b|\btheatre\b|\btheater\b/.test(n)) return 'drama';
  if (/\bdance\b/.test(n)) return 'dance';
  if (/\bart\b|\bfine\s*art|\bvisual\s*art/.test(n) && !/\barts?\s+council\b/.test(n)) {
    return 'art';
  }
  if (/\bmusic\b|\bchoir\b|\borchestra\b|\bgcse\b.*\bmusic|\bmusic\b.*\bgcse/.test(n)) {
    return 'music';
  }
  // Default many primary classes named just "Year N" / Reception → Music
  // (demo seed and legacy) — only when no other subject cue.
  if (extractYearNumber(n) || earlyYearsRank(n) != null) {
    // Bare year / early years without subject → Music (most common)
    const after = n
      .replace(/\b(lkg|ukg|reception|nursery|year\s*\d+|y\d+)\b/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .trim();
    if (!after) return 'music';
  }
  return 'other';
}

export function subjectDef(id: ClassSubjectId): ClassSubjectDef {
  return SUBJECT_BY_ID[id] ?? SUBJECT_BY_ID.other;
}

export type SubjectClassGroup<T extends ClassLike> = {
  subject: ClassSubjectDef;
  classes: T[];
};

/**
 * Group classes by subject (only subjects that have classes), each group
 * sorted in natural year order. Subject order follows CLASS_SUBJECTS.
 */
export function groupClassesBySubject<T extends ClassLike>(classes: T[]): SubjectClassGroup<T>[] {
  const buckets = new Map<ClassSubjectId, T[]>();
  for (const cls of classes) {
    const sid = detectClassSubject(cls);
    const list = buckets.get(sid) ?? [];
    list.push(cls);
    buckets.set(sid, list);
  }
  const out: SubjectClassGroup<T>[] = [];
  for (const def of CLASS_SUBJECTS) {
    const list = buckets.get(def.id);
    if (!list || list.length === 0) continue;
    out.push({ subject: def, classes: sortClassesNatural(list) });
  }
  return out;
}

/** Flat list: stages' classes in natural order (for header chip within a section). */
export function flattenClassesNatural<T extends ClassLike>(classes: T[]): T[] {
  return groupClassesBySubject(classes).flatMap((g) => g.classes);
}
