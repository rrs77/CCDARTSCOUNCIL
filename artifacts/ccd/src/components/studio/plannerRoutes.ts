/**
 * Deep-linkable planner schedule URLs: /planner/week|day|month
 * and lesson editor: /lessons/edit/:lessonNumber
 */

import type { PlannerView } from '../planner/plannerModel';

export type ScheduleViewId = 'week' | 'day' | 'month';

const SCHEDULE_PATH: Record<ScheduleViewId, string> = {
  week: '/planner/week',
  day: '/planner/day',
  month: '/planner/month',
};

export function isScheduleViewId(v: string): v is ScheduleViewId {
  return v === 'week' || v === 'day' || v === 'month';
}

export function plannerPathForView(view: PlannerView | string): string | null {
  if (isScheduleViewId(view)) return SCHEDULE_PATH[view];
  if (view === 'timetable') return '/planner/timetable';
  if (view === 'classic') return '/planner/calendar';
  return '/planner';
}

export function scheduleViewFromPath(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
): ScheduleViewId | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/planner/week') return 'week';
  if (p === '/planner/day') return 'day';
  if (p === '/planner/month') return 'month';
  return null;
}

export function syncPlannerViewUrl(view: PlannerView | string): void {
  if (typeof window === 'undefined') return;
  const next = plannerPathForView(view);
  if (!next) return;
  const current = window.location.pathname.replace(/\/+$/, '') || '/';
  const target = next.replace(/\/+$/, '') || '/';
  if (current === target) return;
  window.history.pushState({}, '', next);
}

export function lessonEditorPath(lessonNumber: string): string {
  return `/lessons/edit/${encodeURIComponent(lessonNumber)}`;
}

export function lessonEditorFromPath(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '/',
): string | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  const m = p.match(/^\/lessons\/edit\/([^/]+)$/i);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export function syncLessonEditorUrl(lessonNumber: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (!lessonNumber) {
    const current = window.location.pathname.replace(/\/+$/, '') || '/';
    if (current.startsWith('/lessons/edit/')) {
      window.history.pushState({}, '', '/lessons');
    }
    return;
  }
  const next = lessonEditorPath(lessonNumber);
  const current = `${window.location.pathname}`;
  if (current.replace(/\/+$/, '') === next.replace(/\/+$/, '')) return;
  window.history.pushState({}, '', next);
}

export function isWalkthroughPath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  return p === '/walkthrough';
}

export function syncWalkthroughUrl(open: boolean): void {
  if (typeof window === 'undefined') return;
  const current = window.location.pathname.replace(/\/+$/, '') || '/';
  if (open) {
    if (current !== '/walkthrough') window.history.pushState({}, '', '/walkthrough');
    return;
  }
  if (current === '/walkthrough') {
    window.history.pushState({}, '', '/planner');
  }
}
