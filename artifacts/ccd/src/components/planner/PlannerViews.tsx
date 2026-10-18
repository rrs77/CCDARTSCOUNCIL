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
  academicYearFor,
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
  event: 'bg-[#F4F3FA] text-[#374151] border-[#E2E0EF]',
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
    <div className="ss-week-grid -mx-1 overflow-x-auto px-1 pb-2 lg:mx-0 lg:overflow-visible lg:px-0">
      {shown.filter((_, i) => i < 5 || shown.length <= 5).map(({ date, entries, events }) => {
        const isToday = sameDay(date, today);
        return (
          <section
            key={ymd(date)}
            aria-label={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            className={`ss-day ${isToday ? 'is-today' : ''}`}
          >
            <header className="ss-day-head">
              <span className="ss-day-num">{date.getDate()}</span>
              <span className="ss-day-dow">{date.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              {isToday && <span className="ss-today-pill">Today</span>}
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
                showClass={visibleIds.size !== 1}
                onOpen={onOpenEntry}
              />
            ))}
            <button type="button" onClick={() => onAdd(date)} className="ss-empty-slot" aria-label={`Add lesson on ${date.toLocaleDateString('en-GB')}`}>
              <Plus className="h-3.5 w-3.5" /> Add lesson
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
    <div className="mx-auto max-w-3xl space-y-3 rounded-[20px] bg-white/70 p-4 sm:p-5">
      <h3 className="text-[17px] font-extrabold tracking-tight text-[#1F1B4D]" style={{ fontFamily: 'var(--ss-font-display)' }}>
        {date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        <span className="ml-2 text-[12px] font-semibold text-[#77738F]">· your teaching</span>
      </h3>
      {events.map((ev) => (
        <div key={ev.id} className="grid grid-cols-1 gap-1 sm:grid-cols-[72px_1fr] sm:gap-4">
          <span className="hidden sm:block" />
          <EventPill event={ev} />
        </div>
      ))}
      {entries.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[#E2E0EF] bg-[#F4F3FA] px-4 py-8 text-center text-sm text-[#77738F]">
          Nothing planned for this day.
        </p>
      )}
      {entries.map((entry) => (
        <div key={entry.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[72px_1fr] sm:gap-4">
          <span className="px-1 text-[13px] font-semibold tabular-nums text-[#77738F] sm:pt-3 sm:text-right">
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
            showClass={visibleIds.size !== 1}
            onOpen={onOpenEntry}
          />
        </div>
      ))}
      <div className="grid grid-cols-1 sm:grid-cols-[72px_1fr] sm:gap-4">
        <span className="hidden sm:block" />
        <button type="button" onClick={() => onAdd(date)} className="ss-empty-slot" aria-label="Add a lesson">
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
    <div className="ss-month">
      <div className="ss-month-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
          <div key={d} className="ss-month-dow">
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
              className={`ss-month-day ${closed ? 'is-closed' : ''} ${inMonth ? 'in-month' : 'out-month'} ${isToday ? 'is-today' : ''}`}
            >
              <span className={`ss-month-num ${inMonth ? '' : 'is-muted'}`}>
                <span className={isToday ? 'is-badge' : ''}>{date.getDate()}</span>
                {closed && <span className="ss-month-closed">{closed.title}</span>}
              </span>
              <span className="ss-month-dots">
                {entries.slice(0, 6).map((e) => (
                  <i key={e.key} style={{ background: data.classById.get(e.classId)?.color }} />
                ))}
              </span>
              <span className="ss-month-lessons">
                {entries.slice(0, 3).map((e) => {
                  const cls = data.classById.get(e.classId);
                  const color = cls?.color || '#475569';
                  return (
                    <span key={e.key} className="ss-month-chip" style={{ background: tint(color, 0.12) }}>
                      <i style={{ background: color }} />
                      <b style={{ color: readableInk(color) }}>{cls?.name}</b>
                      <em>{lessonTitle(e.plan, data.lessonCache[e.classId])}</em>
                    </span>
                  );
                })}
                {entries.length > 3 && <span className="ss-month-more">+{entries.length - 3}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Units: lesson sequence vs dates ---------------- */

export function UnitsView({
  data,
  classId,
  academicYear,
  onOpenTimetable,
  onChangeYear,
}: {
  data: PlannerData;
  classId: string;
  academicYear: string;
  onOpenTimetable: () => void;
  onChangeYear: (academicYear: string) => void;
}) {
  const { ensureLessons } = data;
  useEffect(() => {
    if (classId) ensureLessons(classId, academicYear);
  }, [classId, academicYear, ensureLessons]);
  const cls = data.classById.get(classId);
  const cache = data.lessonCache[data.lessonKey(classId, academicYear)];
  const startYear = Number(academicYear.split('-')[0]);
  const prevYear = `${startYear - 1}-${startYear}`;
  const isPastYear = startYear < Number(academicYearFor(new Date()).split('-')[0]);
  const hasTerms = (c: typeof cache) =>
    !!c && c !== 'loading' && c.halfTerms.some((t) => t.lessons.some((n) => c.lessons[n]));
  const prevCache = data.lessonCache[data.lessonKey(classId, prevYear)];
  const cacheLoaded = !!cache && cache !== 'loading';
  const thisYearEmpty = cacheLoaded && !hasTerms(cache);
  useEffect(() => {
    if (classId && thisYearEmpty) ensureLessons(classId, prevYear);
  }, [classId, thisYearEmpty, prevYear, ensureLessons]);
  const [preview, setPreview] = useState<{ termId: string; items: { n: string; date: Date; time: string }[]; skipped: string[] } | null>(null);

  const planByLesson = useMemo(() => {
    const m = new Map<string, LessonPlan>();
    data.plans
      .filter((p) => p.className === classId && p.lessonNumber && p.status !== 'cancelled')
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .forEach((p) => m.set(p.lessonNumber!, p));
    return m;
  }, [data.plans, classId]);

  if (!cls) return <p className="text-sm text-[#77738F]">Choose a class to see its units.</p>;
  if (!cache || cache === 'loading') return <p className="py-10 text-center text-sm text-[#77738F]">Loading {cls.name}…</p>;

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
    const label = (y: string) => y.replace('-', '–');
    return (
      <div className="rounded-2xl border border-dashed border-[#E2E0EF] px-4 py-8 text-center text-sm text-[#77738F]">
        <p>
          {cls.name} has no lessons in a half-term for {label(academicYear)} yet. Add lessons to a half-term in the Term view.
        </p>
        {hasTerms(prevCache) && (
          <button type="button" className="mt-3 inline-flex min-h-[40px] items-center rounded-xl border border-[#E2E0EF] bg-white px-3 font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]" onClick={() => onChangeYear(prevYear)}>
            See {cls.name}’s {label(prevYear)} units
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasSlots && !isPastYear && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#8A5300] sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="flex-1">Add {cls.name}’s regular lesson times to the timetable so remaining lessons can be scheduled automatically.</span>
          <button type="button" onClick={onOpenTimetable} className="min-h-[40px] rounded-xl bg-white px-3 font-semibold text-[#1F1B4D] ring-1 ring-[#FDE68A]">
            Open timetable
          </button>
        </div>
      )}
      {terms.map((t) => {
        const remaining = t.lessons.filter((n) => !planByLesson.has(n)).length;
        const taught = t.lessons.filter((n) => planByLesson.get(n)?.status === 'completed').length;
        return (
          <section key={t.id} className="overflow-hidden rounded-2xl border border-[#E2E0EF] bg-white">
            <header className="flex flex-col gap-3 border-b border-[#E2E0EF] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[#1F1B4D]">{t.name}</h3>
                <p className="text-[13px] text-[#77738F]">
                  {plural(t.lessons.length, 'lesson')} · {taught} taught · {t.lessons.length - remaining - taught} scheduled ·{' '}
                  <b className={remaining ? 'text-[#8A5300]' : 'text-[#1E6B3E]'}>{remaining} not scheduled</b>
                </p>
              </div>
              {remaining > 0 && hasSlots && !isPastYear && (
                <button
                  type="button"
                  onClick={() => planRemaining(t.id, t.lessons)}
                  className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#FFC93C] px-3.5 text-sm font-extrabold text-[#1F1B4D] hover:brightness-95"
                >
                  <CalendarPlus className="h-4 w-4" /> Schedule remaining
                </button>
              )}
            </header>
            {preview?.termId === t.id && (
              <div className="border-b border-[#D8D4F5] bg-[#E9E6FF] px-4 py-3 text-[13px]">
                <p className="mb-2 font-semibold text-[#1F1B4D]">Preview — nothing is saved until you confirm</p>
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
                    <button type="button" onClick={confirm} className="ml-auto min-h-[40px] rounded-xl bg-[#4338E8] px-4 text-sm font-bold text-white hover:bg-[#3529d1]">
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
                  <li key={n} className="grid grid-cols-[32px_1fr] items-center gap-x-3 gap-y-1 border-b border-[#E2E0EF] px-4 py-2.5 last:border-b-0 sm:grid-cols-[32px_1fr_190px]">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#E9E6FF] text-xs font-bold text-[#1F1B4D]">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#1F2937]">{l?.title || l?.lessonName || `Lesson ${n}`}</span>
                      <span className="block text-xs text-[#77738F]">
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
