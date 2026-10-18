import type { Activity } from '../contexts/DataContext';
import type { PolishSuggestionId } from '../components/studio/PolishWithAIModal';
import { buildPolishNotePatches } from '../components/studio/PolishWithAIModal';

const WARMUP = /warm[\s-]?up|welcome|starter|pulse|brain/i;
const REFLECT = /reflect|plenary|cool[\s-]?down|exit|share/i;

/**
 * Apply accepted polish suggestions to a lesson draft.
 * - Notes: appends labelled polish tips (teacher can edit/delete).
 * - Sequence: gently moves warm-up-like activities earlier and reflection-like later
 *   without inventing or deleting activities (DnD remains available afterwards).
 */
export function applyLessonPolishDraft<T extends { notes?: string; activities?: Activity[] }>(
  plan: T,
  ids: PolishSuggestionId[],
): T {
  if (!ids.length) return plan;

  let activities = plan.activities ? [...plan.activities] : undefined;
  if (ids.includes('sequence') && activities && activities.length > 1) {
    const score = (a: Activity, i: number) => {
      const name = `${a.activity || ''} ${a.category || ''}`;
      if (WARMUP.test(name)) return -100 + i;
      if (REFLECT.test(name)) return 100 + i;
      return i;
    };
    activities = activities
      .map((a, i) => ({ a, i, s: score(a, i) }))
      .sort((x, y) => x.s - y.s)
      .map((x) => x.a);
  }

  const patches = buildPolishNotePatches(ids);
  const existing = (plan.notes || '').trim();
  const block = patches.join('\n');
  const notes = existing.includes('Polish ·')
    ? existing
    : [existing, block].filter(Boolean).join('\n\n');

  return {
    ...plan,
    ...(activities ? { activities } : {}),
    notes,
  };
}
