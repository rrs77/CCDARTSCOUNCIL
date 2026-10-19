/**
 * Helpers for enumerating real lessons from sheet / library blobs.
 *
 * Sheet storage sometimes nests metadata (`allLessonsData`, `lessonStandards`,
 * `teachingUnits`, …) inside the lessons map. Those keys must never be treated
 * as lesson entries in pickers, planners, or libraries.
 */

import type { Activity, LessonData } from '../contexts/DataContext';

/** Keys that belong on a sheet bundle, never as lesson ids. */
export const LESSON_SHEET_META_KEYS = new Set([
  'allLessonsData',
  'lessonStandards',
  'teachingUnits',
  'lessonNumbers',
  'notes',
  'eyfs_statements_map',
  'eyfsStatementsMap',
]);

/** True when `value` looks like a LessonData record (not a nested sheet blob). */
export function isLessonEntry(key: string, value: unknown): value is LessonData {
  if (!key || LESSON_SHEET_META_KEYS.has(key)) return false;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  // Nested sheet / library blob mistaken for a single lesson
  if ('allLessonsData' in v && typeof v.allLessonsData === 'object') return false;
  if (Array.isArray(v.lessonNumbers) && !('grouped' in v) && !('title' in v) && !('orderedActivities' in v)) {
    return false;
  }
  return (
    'grouped' in v ||
    'orderedActivities' in v ||
    'totalTime' in v ||
    typeof v.title === 'string' ||
    typeof v.lessonName === 'string' ||
    typeof v.learningOutcome === 'string' ||
    typeof v.mainActivity === 'string' ||
    typeof v.introduction === 'string'
  );
}

/** Drop metadata / nested-blob keys; keep only real lesson entries. */
export function filterLessonEntries(
  lessons: Record<string, unknown> | null | undefined,
): Record<string, LessonData> {
  const out: Record<string, LessonData> = {};
  if (!lessons) return out;
  for (const [key, value] of Object.entries(lessons)) {
    if (isLessonEntry(key, value)) out[key] = value;
  }
  return out;
}

/** Activities for display / scheduling: prefer orderedActivities, else flatten grouped. */
export function lessonActivities(lesson: LessonData | null | undefined): Activity[] {
  if (!lesson) return [];
  if (lesson.orderedActivities?.length) return lesson.orderedActivities;
  return Object.values(lesson.grouped || {}).flat();
}

export function lessonActivityCount(lesson: LessonData | null | undefined): number {
  return lessonActivities(lesson).length;
}

/**
 * Compact badge for a lesson row: numeric id ("1", "12"), or title initial.
 * Never renders a long raw key that would overflow a round avatar.
 */
export function lessonBadgeLabel(key: string, lesson?: LessonData | null): string {
  const trimmed = String(key || '').trim();
  const numeric = /^(?:lesson)?(\d+)$/i.exec(trimmed);
  if (numeric) return numeric[1];
  const title = (lesson?.title || lesson?.lessonName || '').trim();
  if (title) return title.charAt(0).toUpperCase();
  if (trimmed.length <= 2) return trimmed.toUpperCase() || '?';
  return trimmed.charAt(0).toUpperCase();
}

/** Sorted lesson ids from a lessons map (metadata stripped). */
export function sortedLessonNumbers(lessons: Record<string, LessonData>): string[] {
  return Object.keys(lessons).sort(
    (a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)),
  );
}
