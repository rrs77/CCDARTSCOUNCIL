import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarPlus, Check, CalendarClock, Plus } from 'lucide-react';
import type { LessonPlan } from '../../contexts/DataContext';
import type { PlannerData } from './usePlannerData';
import { PlannerLessonCard } from './PlannerLessonCard';
import { buildDayEntries, eventsOn, lessonTitle, nextFreeSlots } from './plannerEntries';
import {
  addDays,
  HALF_TERMS,
  isoWeek,
  plural,
  readableInk,
  sameDay,
  startOfDay,
  startOfWeek,
  tint,
  ymd,
  type DayEntry,
  type PlannerEvent,
} from './plannerModel';

export interface ViewProps {
  data: PlannerData;
  visibleIds: Set<string>;
  anchor: Date;
  selectedKey?: string | null;
  onOpenEntry: (entry: DayEntry) => void;
  onAdd: (date: Date, classId?: string, time?: string) => void;
}

const EVENT_TONE: Record<PlannerEvent['type'], string> = {
  holiday: 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]',
  inset: 'bg-[#F5F3FF] text-[#5B21B6] border-[#DDD6FE]',
  event: 'bg-[#F7FAF8] text-[#374151] border-[#D5E0D8]',
  'key-date': 'bg-[#F0FDFA] text-[#115E59] border-[#99F6E4]',
};

function EventPill({ event }: { event: PlannerEvent }) {
  return (
    <div className={`rounded-xl border border-dashed px-3 py-2 text-[13px] font-medium ${EVENT_TONE[event.type]}`}>
      {event.title}
    </div>
  );
}

function useUnitLabel(data: PlannerData) {
  return (plan?: LessonPlan) => {
    if (!plan) return undefined;
    if (plan.unitName) return plan.unitName;
    const cache = data.lessonCache[plan.className];
    if (cache && cache !== 'loading' && plan.lessonNumber) {
      const term = cache.halfTerms.find((t) => t.lessons.includes(plan.lessonNumber!));
      const meta = HALF_TERMS.find((h) => h.id === term?.id);
      if (term && meta) return `${meta.name} · lesson ${term.lessons.indexOf(plan.lessonNumber!) + 1} of ${term.lessons.length}`;
    }
    return plan.lessonNumber ? `Lesson ${plan.lessonNumber}` : undefined;
  };
}

function useEnsureVisibleLessons(data: PlannerData, entries: DayEntry[]) {
  const { ensureLessons } = data;
  const ids = useMemo(() => [...new Set(entries.filter((e) => e.plan).map((e) => e.classId))].join('|'), [entries]);
  useEffect(() => {
    ids.split('|').filter(Boolean).forEach((id) => ensureLessons(id));
  }, [ids, ensureLessons]);
}

/* ---------------- Week ---------------- */

export function WeekView({ data, visibleIds, anchor, selectedKey, onOpenEntry, onAdd }: ViewProps) {
  const mondayKey = startOfWeek(anchor).getTime();
  const days = useMemo(() => {
    const all = Array.from({ length: 7 }, (_, i) => addDays(new Date(mondayKey), i));
    return all.map((d) => ({ date: d, entries: buildDayEntries(d, visibleIds, data.plans, data.slots), events: eventsOn(d, data.events) }));
  }, [mondayKey, visibleIds, data.plans, data.slots, data.events]);
  const shown = days.filter((d, i) => i < 5 || d.entries.length > 0);
  const allEntries = useMemo(() => days.flatMap((d) => d.entries), [days]);
  useEnsureVisibleLessons(data, allEntries);
  const unitLabel = useUnitLabel(data);
  const today = new Date();

  return (
    <div
      className={`-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 ${
        shown.length > 5 ? 'lg:grid-cols-7' : 'lg:grid-cols-5'
      }`}
    >
      {shown.map(({ date, entries, events }) => {
        const isToday = sameDay(date, today);
        const lessons = entries.filter((e) => e.plan).length;
        return (
          <section
            key={ymd(date)}
            aria-label={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            className={`flex w-[86%] shrink-0 snap-start flex-col gap-2 rounded-2xl border p-2.5 sm:w-[46%] md:w-[38%] lg:w-auto lg:min-w-0 ${
              isToday ? 'border-[#002D24]/30 bg-white shadow-[0_0_0_3px_rgba(182,255,126,0.35)]' : 'border-[#E5EDE8] bg-[#FBFCFB]'
            }`}
          >
            <header className="flex items-baseline gap-2 border-b border-[#E5EDE8] px-1.5 pb-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-[#4B5563]">
                {date.toLocaleDateString('en-GB', { weekday: 'short' })}
              </span>
              <span
                className={`text-xl font-bold ${isToday ? 'rounded-full bg-[#002D24] px-2 text-white' : 'text-[#002D24]'}`}
                title={isToday ? 'Today' : undefined}
              >
                {date.getDate()}
              </span>
              {isToday && <span className="sr-only">(today)</span>}
              <span className="ml-auto whitespace-nowrap text-xs text-[#4B5563]">{plural(lessons, 'lesson')}</span>
            </header>
            {events.map((ev) => (
              <EventPill key={ev.id} event={ev} />
            ))}
            {entries.map((entry) => (
              <PlannerLessonCard
                key={entry.key}
                entry={entry}
                cls={data.classById.get(entry.classId)}
                title={lessonTitle(entry.plan, data.lessonCache[entry.classId])}
                unitLabel={unitLabel(entry.plan)}
                hasReflection={!!(entry.plan && data.reflections[entry.plan.id])}
                selected={selectedKey === entry.key}
                onOpen={onOpenEntry}
              />
            ))}
            {entries.length === 0 && events.length === 0 && (
              <p className="px-1.5 py-3 text-[13px] text-[#4B5563]">Nothing planned.</p>
            )}
            <button
              type="button"
              onClick={() => onAdd(date)}
              className="mt-auto flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D5E0D8] text-[13px] text-[#4B5563] hover:bg-white"
            >
              <Plus className="h-4 w-4" /> Add lesson
            </button>
          </section>
        );
      })}
    </div>
  );
}

/* ---------------- Day ---------------- */

export function DayView({ data, visibleIds, anchor, selectedKey, onOpenEntry, onAdd }: ViewProps) {
  const dayKey = startOfDay(anchor).getTime();
  const date = new Date(dayKey);
  const entries = useMemo(
    () => buildDayEntries(new Date(dayKey), visibleIds, data.plans, data.slots),
    [dayKey, visibleIds, data.plans, data.slots],
  );
  const events = eventsOn(date, data.events);
  useEnsureVisibleLessons(data, entries);
  const unitLabel = useUnitLabel(data);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="grid grid-cols-1 gap-1 sm:grid-cols-[72px_1fr] sm:gap-4">
          <span className="hidden sm:block" />
          <EventPill event={ev} />
        </div>
      ))}
      {entries.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#D5E0D8] bg-[#FBFCFB] px-4 py-8 text-center text-sm text-[#4B5563]">
          Nothing planned for this day.
        </p>
      )}
      {entries.map((entry) => (
        <div key={entry.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[72px_1fr] sm:gap-4">
          <span className="px-1 text-[13px] font-semibold tabular-nums text-[#4B5563] sm:pt-3 sm:text-right">
            {entry.time || '—'}
            {entry.endTime && <span className="block font-normal sm:mt-0.5">{entry.endTime}</span>}
          </span>
          <PlannerLessonCard
            entry={entry}
            size="roomy"
            cls={data.classById.get(entry.classId)}
            title={lessonTitle(entry.plan, data.lessonCache[entry.classId])}
            unitLabel={unitLabel(entry.plan)}
            hasReflection={!!(entry.plan && data.reflections[entry.plan.id])}
            selected={selectedKey === entry.key}
            onOpen={onOpenEntry}
          />
        </div>
      ))}
      <div className="grid grid-cols-1 sm:grid-cols-[72px_1fr] sm:gap-4">
        <span className="hidden sm:block" />
        <button
          type="button"
          onClick={() => onAdd(date)}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D5E0D8] text-sm text-[#4B5563] hover:bg-[#F7FAF8]"
        >
          <Plus className="h-4 w-4" /> Add a lesson
        </button>
      </div>
    </div>
  );
}

/* ---------------- Month ---------------- */

export function MonthView({ data, visibleIds, anchor, onPickDay }: Omit<ViewProps, 'onOpenEntry' | 'onAdd'> & { onPickDay: (d: Date) => void }) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const weeks = useMemo(() => {
    const out: Date[][] = [];
    let cursor = startOfWeek(new Date(year, month, 1));
    const last = new Date(year, month + 1, 0);
    while (cursor <= last) {
      const monday = cursor;
      out.push(Array.from({ length: 5 }, (_, i) => addDays(monday, i)));
      cursor = addDays(cursor, 7);
    }
    return out;
  }, [year, month]);
  const today = new Date();

  return (
    <div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
          <div key={d} className="px-1 py-1.5 text-center text-xs font-bold uppercase tracking-[0.06em] text-[#4B5563] sm:text-left">
            {d}
          </div>
        ))}
        {weeks.flat().map((date) => {
          const inMonth = date.getMonth() === anchor.getMonth();
          const entries = buildDayEntries(date, visibleIds, data.plans, data.slots).filter((e) => e.plan);
          const closed = eventsOn(date, data.events).find((e) => e.type === 'holiday' || e.type === 'inset');
          const isToday = sameDay(date, today);
          return (
            <button
              type="button"
              key={ymd(date)}
              onClick={() => onPickDay(date)}
              className={`flex min-h-[64px] flex-col gap-1 rounded-xl border p-1.5 text-left sm:min-h-[118px] sm:p-2 ${
                closed ? 'border-[#FECDD3] bg-[#FFF7F7]' : inMonth ? 'border-[#E5EDE8] bg-white hover:bg-[#F7FAF8]' : 'border-[#EEF2EF] bg-[#F7FAF8]'
              } ${isToday ? 'ring-2 ring-[#B6FF7E] border-[#002D24]/40' : ''}`}
            >
              <span className={`flex items-center justify-between text-[13px] font-bold ${inMonth ? 'text-[#1F2937]' : 'text-[#9CA3AF]'}`}>
                <span className={isToday ? 'rounded-full bg-[#002D24] px-1.5 text-white' : ''}>{date.getDate()}</span>
                {closed && <span className="hidden truncate rounded-md bg-[#FFE4E6] px-1.5 text-[11px] font-semibold text-[#9F1239] sm:inline">{closed.title}</span>}
              </span>
              <span className="flex flex-wrap gap-1 sm:hidden">
                {entries.slice(0, 6).map((e) => (
                  <i key={e.key} className="h-2 w-2 rounded-full" style={{ background: data.classById.get(e.classId)?.color }} />
                ))}
              </span>
              <span className="hidden flex-col gap-1 sm:flex">
                {entries.slice(0, 3).map((e) => {
                  const cls = data.classById.get(e.classId);
                  const color = cls?.color || '#475569';
                  return (
                    <span
                      key={e.key}
                      className="flex items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[12px] text-[#1F2937]"
                      style={{ background: tint(color, 0.12) }}
                    >
                      <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                      <b className="shrink-0 font-bold" style={{ color: readableInk(color) }}>{cls?.name}</b>
                      <span className="truncate">{lessonTitle(e.plan, data.lessonCache[e.classId])}</span>
                    </span>
                  );
                })}
                {entries.length > 3 && <span className="px-1.5 text-xs font-semibold text-[#0D9488]">+{entries.length - 3} more</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[13px] text-[#4B5563]">Tap a day to see its lessons.</p>
    </div>
  );
}

/* ---------------- Units: lesson sequence vs dates ---------------- */

export function UnitsView({
  data,
  classId,
  academicYear,
  onOpenTimetable,
}: {
  data: PlannerData;
  classId: string;
  academicYear: string;
  onOpenTimetable: () => void;
}) {
  const { ensureLessons } = data;
  useEffect(() => {
    if (classId) ensureLessons(classId, academicYear);
  }, [classId, academicYear, ensureLessons]);
  const cls = data.classById.get(classId);
  const cache = data.lessonCache[data.lessonKey(classId, academicYear)];
  const [preview, setPreview] = useState<{ termId: string; items: { n: string; date: Date; time: string }[]; skipped: string[] } | null>(null);

  const planByLesson = useMemo(() => {
    const m = new Map<string, LessonPlan>();
    data.plans
      .filter((p) => p.className === classId && p.lessonNumber && p.status !== 'cancelled')
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .forEach((p) => m.set(p.lessonNumber!, p));
    return m;
  }, [data.plans, classId]);

  if (!cls) return <p className="text-sm text-[#4B5563]">Choose a class to see its units.</p>;
  if (!cache || cache === 'loading') return <p className="py-10 text-center text-sm text-[#4B5563]">Loading {cls.name}…</p>;

  const terms = HALF_TERMS.map((h) => ({ ...h, lessons: cache.halfTerms.find((t) => t.id === h.id)?.lessons.filter((n) => cache.lessons[n]) || [] })).filter(
    (t) => t.lessons.length,
  );
  const hasSlots = data.slots.some((s) => s.className === classId);

  const planRemaining = (termId: string, lessons: string[]) => {
    const remaining = lessons.filter((n) => !planByLesson.has(n));
    const free = nextFreeSlots(classId, addDays(new Date(), 1), remaining.length, data.slots, data.plans, data.events);
    const usable = free.filter((f) => !f.skipped);
    setPreview({
      termId,
      items: remaining.slice(0, usable.length).map((n, i) => ({ n, date: usable[i].date, time: usable[i].time })),
      skipped: free.filter((f) => f.skipped).map((f) => `${f.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} — ${f.skipped}`),
    });
  };

  const confirm = () => {
    if (!preview) return;
    const newPlans: LessonPlan[] = preview.items.map(({ n, date, time }) => {
      const l = cache.lessons[n];
      const d = new Date(`${ymd(date)}T12:00:00`);
      return {
        id: crypto.randomUUID(),
        date: d,
        week: isoWeek(d),
        className: classId,
        activities: (l.orderedActivities?.length ? l.orderedActivities : Object.values(l.grouped || {}).flat()).map((a) => ({ ...a, lessonNumber: n })),
        duration: l.totalTime || 0,
        notes: '',
        status: 'planned',
        lessonNumber: n,
        title: l.title || l.lessonName || `Lesson ${n}`,
        term: preview.termId,
        time,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
    void data.savePlans(newPlans, `Scheduled ${newPlans.length} lesson${newPlans.length === 1 ? '' : 's'}.`).then(() => setPreview(null));
  };

  if (!terms.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[#D5E0D8] px-4 py-8 text-center text-sm text-[#4B5563]">
        {cls.name} has no lessons in a half-term yet. Add lessons to a half-term in the Term view.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!hasSlots && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#8A5300] sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="flex-1">Add {cls.name}’s regular lesson times to the timetable so remaining lessons can be scheduled automatically.</span>
          <button type="button" onClick={onOpenTimetable} className="min-h-[40px] rounded-xl bg-white px-3 font-semibold text-[#002D24] ring-1 ring-[#FDE68A]">
            Open timetable
          </button>
        </div>
      )}
      {terms.map((t) => {
        const remaining = t.lessons.filter((n) => !planByLesson.has(n)).length;
        const taught = t.lessons.filter((n) => planByLesson.get(n)?.status === 'completed').length;
        return (
          <section key={t.id} className="overflow-hidden rounded-2xl border border-[#E5EDE8] bg-white">
            <header className="flex flex-col gap-3 border-b border-[#E5EDE8] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[#002D24]">{t.name}</h3>
                <p className="text-[13px] text-[#4B5563]">
                  {plural(t.lessons.length, 'lesson')} · {taught} taught · {t.lessons.length - remaining - taught} scheduled ·{' '}
                  <b className={remaining ? 'text-[#8A5300]' : 'text-[#1E6B3E]'}>{remaining} not scheduled</b>
                </p>
              </div>
              {remaining > 0 && hasSlots && (
                <button
                  type="button"
                  onClick={() => planRemaining(t.id, t.lessons)}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#B6FF7E] px-3.5 text-sm font-semibold text-[#002D24]"
                >
                  <CalendarPlus className="h-4 w-4" /> Schedule remaining
                </button>
              )}
            </header>
            {preview?.termId === t.id && (
              <div className="border-b border-[#D6EBC9] bg-[#F6FBF3] px-4 py-3 text-[13px]">
                <p className="mb-2 font-semibold text-[#002D24]">Preview — nothing is saved until you confirm</p>
                <ul className="space-y-1 text-[#1E6B3E]">
                  {preview.items.map((it) => (
                    <li key={it.n} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <b>{cache.lessons[it.n]?.title || `Lesson ${it.n}`}</b> →{' '}
                        {it.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, {it.time}
                      </span>
                    </li>
                  ))}
                  {preview.skipped.map((s) => (
                    <li key={s} className="flex gap-2 text-[#8A5300]">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Skipped {s}
                    </li>
                  ))}
                  {preview.items.length === 0 && <li className="text-[#8A5300]">No free timetable slots found.</li>}
                </ul>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setPreview(null)} className="min-h-[40px] rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm">
                    Cancel
                  </button>
                  {preview.items.length > 0 && (
                    <button type="button" onClick={confirm} className="ml-auto min-h-[40px] rounded-xl bg-[#002D24] px-4 text-sm font-semibold text-white">
                      Schedule {preview.items.length}
                    </button>
                  )}
                </div>
              </div>
            )}
            <ol>
              {t.lessons.map((n, i) => {
                const l = cache.lessons[n];
                const p = planByLesson.get(n);
                const when = p ? new Date(p.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
                return (
                  <li key={n} className="grid grid-cols-[32px_1fr] items-center gap-x-3 gap-y-1 border-b border-[#EEF2EF] px-4 py-2.5 last:border-b-0 sm:grid-cols-[32px_1fr_190px]">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F6F2] text-xs font-bold text-[#002D24]">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#1F2937]">{l?.title || l?.lessonName || `Lesson ${n}`}</span>
                      <span className="block text-xs text-[#4B5563]">
                        {plural(Object.values(l?.grouped || {}).flat().length, 'activity', 'activities')} · {l?.totalTime || 0} min
                      </span>
                    </span>
                    <span
                      className={`col-start-2 inline-flex items-center gap-1.5 text-[13px] font-medium sm:col-start-auto ${
                        !p ? 'text-[#8A5300]' : p.status === 'completed' ? 'text-[#1E6B3E]' : 'text-[#374151]'
                      }`}
                    >
                      {!p ? <AlertTriangle className="h-4 w-4" /> : p.status === 'completed' ? <Check className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                      {!p ? 'Not scheduled' : p.status === 'completed' ? `Taught · ${when}` : `${when}${p.time ? ` · ${p.time}` : ''}`}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
