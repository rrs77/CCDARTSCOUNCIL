/**
 * Shared lesson length for planner UI, Your lessons list, and print/PDF/Word headers.
 *
 * Preference: stored `totalTime` when set (>0), else sum of activity/section minutes,
 * else DEFAULT_LESSON_DURATION_MINS (45). Keeps the header and the list in sync.
 */
import type { Activity } from '../contexts/DataContext';
import type { LessonSection } from '../types/lessonSections';

export const DEFAULT_LESSON_DURATION_MINS = 45;

export type LessonDurationSource = {
  totalTime?: number | null;
  orderedActivities?: Activity[] | null;
  grouped?: Record<string, Activity[]> | null;
  sections?: LessonSection[] | null;
};

/** Sum of activity / section timings (ignores stored totalTime). */
export function lessonActivityMinutesSum(lesson: LessonDurationSource | null | undefined): number {
  if (!lesson) return 0;
  let sum = 0;
  const sections = lesson.sections;
  if (Array.isArray(sections) && sections.length > 0) {
    for (const s of sections) {
      const n = Number(s.durationMins ?? s.activity?.time ?? 0);
      if (Number.isFinite(n) && n > 0) sum += n;
    }
    return Math.round(sum);
  }
  if (Array.isArray(lesson.orderedActivities) && lesson.orderedActivities.length > 0) {
    for (const a of lesson.orderedActivities) {
      const n = Number(a.time ?? 0);
      if (Number.isFinite(n) && n > 0) sum += n;
    }
    return Math.round(sum);
  }
  const grouped = lesson.grouped;
  if (grouped && typeof grouped === 'object') {
    for (const acts of Object.values(grouped)) {
      if (!Array.isArray(acts)) continue;
      for (const a of acts) {
        const n = Number(a.time ?? 0);
        if (Number.isFinite(n) && n > 0) sum += n;
      }
    }
  }
  return Math.round(sum);
}

/**
 * Minutes shown for a lesson everywhere (list, plan chrome, Preview/Print/PDF/Word).
 * Stored totalTime wins when > 0; otherwise activity sum; otherwise 45.
 */
export function lessonDurationMinutes(lesson: LessonDurationSource | null | undefined): number {
  const stored = Number(lesson?.totalTime);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
  const fromActivities = lessonActivityMinutesSum(lesson);
  if (fromActivities > 0) return fromActivities;
  return DEFAULT_LESSON_DURATION_MINS;
}
