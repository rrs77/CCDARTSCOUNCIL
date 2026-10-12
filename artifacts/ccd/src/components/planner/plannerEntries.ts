import type { LessonPlan } from '../../contexts/DataContext';
import type { ClassLessons } from './usePlannerData';
import {
  addDays,
  timeToMinutes,
  ymd,
  type DayEntry,
  type PlannerEvent,
  type TimetableSlot,
} from './plannerModel';

/** Timetable slots and scheduled lessons for one day, matched on class + start time. */
export function buildDayEntries(
  date: Date,
  classIds: Set<string>,
  plans: LessonPlan[],
  slots: TimetableSlot[],
): DayEntry[] {
  const key = ymd(date);
  const dayPlans = plans.filter(
    (p) => classIds.has(p.className) && ymd(new Date(p.date)) === key && p.status !== 'cancelled',
  );
  const used = new Set<string>();
  const entries: DayEntry[] = [];
  slots
    .filter((s) => s.day === date.getDay() && classIds.has(s.className))
    .forEach((slot) => {
      const plan = dayPlans.find((p) => !used.has(p.id) && p.className === slot.className && p.time === slot.startTime);
      if (plan) used.add(plan.id);
      entries.push({
        key: `${slot.id}:${key}`,
        classId: slot.className,
        time: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        plan,
        slot,
      });
    });
  dayPlans
    .filter((p) => !used.has(p.id))
    .forEach((plan) =>
      entries.push({ key: plan.id, classId: plan.className, time: plan.time || '', plan }),
    );
  return entries.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

export const eventsOn = (date: Date, events: PlannerEvent[]) => {
  const d = ymd(date);
  return events.filter((e) => ymd(e.startDate) <= d && d <= ymd(e.endDate));
};

export const isClosedDay = (date: Date, events: PlannerEvent[]) =>
  eventsOn(date, events).some((e) => e.type === 'holiday' || e.type === 'inset');

export function lessonTitle(plan: LessonPlan | undefined, cache?: ClassLessons | 'loading') {
  if (!plan) return '';
  const data = cache && cache !== 'loading' && plan.lessonNumber ? cache.lessons[plan.lessonNumber] : undefined;
  return (
    plan.title ||
    data?.title ||
    data?.lessonName ||
    (plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : 'Untitled lesson')
  );
}

/** Next `count` timetable dates for a class from `from`, skipping holidays, INSET days and taken slots. */
export function nextFreeSlots(
  classId: string,
  from: Date,
  count: number,
  slots: TimetableSlot[],
  plans: LessonPlan[],
  events: PlannerEvent[],
  limitDays = 200,
) {
  const classSlots = slots
    .filter((s) => s.className === classId)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const out: { date: Date; time: string; skipped?: string }[] = [];
  if (!classSlots.length) return out;
  for (let i = 0; i < limitDays && out.filter((o) => !o.skipped).length < count; i++) {
    const day = addDays(from, i);
    const todays = classSlots.filter((s) => s.day === day.getDay());
    if (!todays.length) continue;
    const closed = eventsOn(day, events).find((e) => e.type === 'holiday' || e.type === 'inset');
    todays.forEach((s) => {
      if (out.filter((o) => !o.skipped).length >= count) return;
      if (closed) {
        out.push({ date: day, time: s.startTime, skipped: closed.title });
        return;
      }
      const taken = plans.some(
        (p) => p.className === classId && ymd(new Date(p.date)) === ymd(day) && p.time === s.startTime && p.status !== 'cancelled',
      );
      if (!taken) out.push({ date: day, time: s.startTime });
    });
  }
  return out;
}
