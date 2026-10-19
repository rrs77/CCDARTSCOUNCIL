import type { LessonPlan } from '../../contexts/DataContext';
import { isoWeek, normalizeTime, timeToMinutes, ymd } from './plannerModel';

/** react-dnd item type for scheduled lesson cards in the Studio Score planner. */
export const PLANNER_LESSON_DND = 'planner-lesson';

export type PlannerLessonDragItem = {
  type: typeof PLANNER_LESSON_DND;
  planId: string;
  classId: string;
  title: string;
  fromYmd: string;
  time?: string;
};

/** Minutes → `HH:MM` (24h). */
export function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 55, Math.round(total)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Pick a sensible start time when dropping relative to other lessons on a day.
 * - `beforeTime`: five minutes before that lesson (floored at 08:00)
 * - `afterTime`: five minutes after (capped at 17:55)
 * - otherwise keep the plan's existing time
 */
export function resolveDropTime(opts: {
  keepTime?: string;
  beforeTime?: string;
  afterTime?: string;
}): string | undefined {
  if (opts.beforeTime) {
    const t = timeToMinutes(opts.beforeTime) - 5;
    return minutesToTime(Math.max(8 * 60, t));
  }
  if (opts.afterTime) {
    const t = timeToMinutes(opts.afterTime) + 5;
    return minutesToTime(Math.min(17 * 60 + 55, t));
  }
  return opts.keepTime;
}

/** Clone a plan onto `targetDate`, updating week + optional time. */
export function movePlanToDate(
  plan: LessonPlan,
  targetDate: Date,
  time?: string,
): LessonPlan {
  const nextTime = time !== undefined ? time || undefined : plan.time;
  const normalized = nextTime ? normalizeTime(nextTime) : undefined;
  const hhmm = normalized && /^\d{2}:\d{2}$/.test(normalized) ? normalized : '12:00';
  const d = new Date(`${ymd(targetDate)}T${hhmm}:00`);
  return {
    ...plan,
    date: d,
    week: isoWeek(d),
    time: nextTime,
    updatedAt: new Date(),
  };
}

/** Drop a scheduled lesson onto a timetable outline slot (date + time + class). */
export function fillOutlineSlot(
  plan: LessonPlan,
  targetDate: Date,
  slot: { classId: string; time: string },
): LessonPlan {
  const next = movePlanToDate(plan, targetDate, slot.time);
  return {
    ...next,
    className: slot.classId,
    time: slot.time,
    status: plan.status === 'cancelled' ? 'planned' : plan.status,
  };
}
