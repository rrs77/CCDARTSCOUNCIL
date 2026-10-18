/** Shared half-term calendar + Studio Score accents for the year map and designer. */

export const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', short: 'Aut 1', months: 'Sep–Oct' },
  { id: 'A2', name: 'Autumn 2', short: 'Aut 2', months: 'Nov–Dec' },
  { id: 'SP1', name: 'Spring 1', short: 'Spr 1', months: 'Jan–Feb' },
  { id: 'SP2', name: 'Spring 2', short: 'Spr 2', months: 'Mar–Apr' },
  { id: 'SM1', name: 'Summer 1', short: 'Sum 1', months: 'Apr–May' },
  { id: 'SM2', name: 'Summer 2', short: 'Sum 2', months: 'Jun–Jul' },
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

export function termLessonCount(term: { lessons?: string[]; stacks?: string[] } | undefined): number {
  if (!term) return 0;
  return (term.lessons?.length ?? 0) + (term.stacks?.length ?? 0);
}
