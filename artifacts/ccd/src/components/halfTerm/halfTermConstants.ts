/** Shared half-term calendar + Studio Score accents for the year map and designer. */

export const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', short: 'Aut 1', months: 'Sep–Oct', season: 'autumn' as const },
  { id: 'A2', name: 'Autumn 2', short: 'Aut 2', months: 'Nov–Dec', season: 'autumn' as const },
  { id: 'SP1', name: 'Spring 1', short: 'Spr 1', months: 'Jan–Feb', season: 'spring' as const },
  { id: 'SP2', name: 'Spring 2', short: 'Spr 2', months: 'Mar–Apr', season: 'spring' as const },
  { id: 'SM1', name: 'Summer 1', short: 'Sum 1', months: 'Apr–May', season: 'summer' as const },
  { id: 'SM2', name: 'Summer 2', short: 'Sum 2', months: 'Jun–Jul', season: 'summer' as const },
] as const;

export type HalfTermId = (typeof HALF_TERMS)[number]['id'];

/** Quiet Studio Score column accents (not rainbow traffic lights). */
export const TERM_COLORS: Record<string, string> = {
  A1: '#4338E8',
  A2: '#3529d1',
  SP1: '#0B6B5F',
  SP2: '#148F7F',
  SM1: '#E97451',
  SM2: '#C45C3A',
};

/** Soft column / chip tint backgrounds keyed by half-term id. */
export const TERM_TINTS: Record<string, string> = {
  A1: 'rgba(67, 56, 232, 0.10)',
  A2: 'rgba(53, 41, 209, 0.10)',
  SP1: 'rgba(11, 107, 95, 0.10)',
  SP2: 'rgba(20, 143, 127, 0.10)',
  SM1: 'rgba(233, 116, 81, 0.12)',
  SM2: 'rgba(196, 92, 58, 0.12)',
};

/**
 * Default UK academic-year half-term windows (approx).
 * Academic years start in September; months are 0-indexed Date months.
 */
export function defaultHalfTermRanges(academicYear: string): Record<HalfTermId, { start: Date; end: Date }> {
  const start = Number(academicYear.split('-')[0]);
  const r = (y: number, m1: number, d1: number, m2: number, d2: number) => ({
    start: new Date(y, m1, d1),
    end: new Date(y, m2, d2, 23, 59, 59, 999),
  });
  return {
    A1: r(start, 8, 1, 9, 31),
    A2: r(start, 10, 1, 11, 31),
    SP1: r(start + 1, 0, 1, 1, 20),
    SP2: r(start + 1, 1, 21, 3, 10),
    SM1: r(start + 1, 3, 11, 4, 31),
    SM2: r(start + 1, 5, 1, 7, 31),
  };
}

/** Academic year string ("2026-2027") that contains `d`; years start in September. */
export function academicYearForDate(d: Date): string {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

/** Which half-term column is "now" for the given academic year (or null if outside that year). */
export function currentHalfTermIdForYear(academicYear: string, now: Date = new Date()): HalfTermId | null {
  if (academicYearForDate(now) !== academicYear) return null;
  const ranges = defaultHalfTermRanges(academicYear);
  const hit = (Object.keys(ranges) as HalfTermId[]).find(
    (id) => now >= ranges[id].start && now <= ranges[id].end,
  );
  return hit ?? null;
}

export function termLessonCount(term: { lessons?: string[]; stacks?: string[] } | undefined): number {
  if (!term) return 0;
  return (term.lessons?.length ?? 0) + (term.stacks?.length ?? 0);
}
