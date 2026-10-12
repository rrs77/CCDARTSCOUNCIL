import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Lock,
  MoveRight,
  Search,
  X,
} from 'lucide-react';
import type { Activity, LessonPlan } from '../../contexts/DataContext';
import type { PlannerData } from './usePlannerData';
import {
  isoWeek,
  planStatusLabel,
  plural,
  readableInk,
  SERIF,
  tint,
  ymd,
  type DayEntry,
  type PlannerClass,
  type PlannerReflection,
} from './plannerModel';
import { lessonTitle } from './plannerEntries';

const fieldClass =
  'w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488]';
const sectionTitle = 'text-xs font-bold uppercase tracking-[0.06em] text-[#4B5563] mb-2';
const btn =
  'inline-flex items-center justify-center gap-2 min-h-[40px] rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-sm font-medium text-[#374151] hover:bg-[#F7FAF8] disabled:opacity-50';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 min-h-[40px] rounded-xl bg-[#002D24] px-4 text-sm font-semibold text-white hover:bg-[#014034] disabled:opacity-50';

/** Side panel on wide screens; bottom sheet with a scrim on tablets and phones. */
export function PlannerSheet({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-[#002D24]/30 md:bg-[#002D24]/15" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-[61] max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-3xl md:px-6 md:pt-6 md:shadow-[-12px_0_40px_rgba(0,0,0,0.14)]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D1D5DB] md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">{label}</span>
          <button type="button" onClick={onClose} className="-mt-1 rounded-lg p-1.5 text-[#4B5563] hover:bg-[#F3F6F3]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </>,
    document.body,
  );
}

function ClassChip({ cls }: { cls?: PlannerClass }) {
  if (!cls) return null;
  return (
    <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ color: readableInk(cls.color), background: tint(cls.color, 0.13) }}>
      {cls.name}
    </span>
  );
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

/* ---------------- Lesson details, reflection, move / reuse ---------------- */

export function LessonDetailsSheet({
  entry,
  data,
  onClose,
  onOpenLibrary,
}: {
  entry: DayEntry & { plan: LessonPlan };
  data: PlannerData;
  onClose: () => void;
  onOpenLibrary: (classId: string) => void;
}) {
  const plan = entry.plan;
  const cls = data.classById.get(plan.className);
  const cache = data.lessonCache[plan.className];
  const title = lessonTitle(plan, cache);
  const lesson = cache && cache !== 'loading' && plan.lessonNumber ? cache.lessons[plan.lessonNumber] : undefined;
  const activities: Activity[] = plan.activities?.length
    ? plan.activities
    : lesson?.orderedActivities || Object.values(lesson?.grouped || {}).flat();

  const [mode, setMode] = useState<'details' | 'move' | 'reuse'>('details');
  const [note, setNote] = useState(plan.notes || '');
  const existing = data.reflections[plan.id];
  const [reflection, setReflection] = useState<PlannerReflection>(
    existing || {
      lessonPlanId: plan.id,
      className: plan.className,
      lessonDate: ymd(new Date(plan.date)),
      outcome: null,
      wentWell: '',
      toRevisit: '',
      nextTime: '',
    },
  );

  const { ensureLessons } = data;
  useEffect(() => {
    ensureLessons(plan.className);
  }, [plan.className, ensureLessons]);

  useEffect(() => {
    setNote(plan.notes || '');
    setMode('details');
  }, [plan.id, plan.notes]);

  const setStatus = (status: LessonPlan['status']) =>
    data.savePlans([{ ...plan, status }], status === 'completed' ? 'Marked as taught.' : `Marked as ${planStatusLabel[status].toLowerCase()}.`);

  const date = new Date(plan.date);
  const isPast = date < new Date(new Date().toDateString());

  return (
    <PlannerSheet onClose={onClose} label={mode === 'details' ? 'Lesson details' : mode === 'move' ? 'Move this lesson' : 'Teach to another class'}>
      <h2 className="mt-1 text-[22px] font-semibold leading-tight text-[#002D24]" style={{ fontFamily: SERIF }}>{title}</h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-[#4B5563]">
        <ClassChip cls={cls} />
        <span>
          {fmtDate(date)}
          {plan.time ? ` · ${plan.time}` : ''}
          {entry.endTime ? ` – ${entry.endTime}` : ''}
          {entry.location ? ` · ${entry.location}` : ''}
        </span>
      </div>

      {mode === 'details' && (
        <>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Lesson status">
            {(['planned', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`min-h-[36px] rounded-full border px-3 text-[13px] font-semibold ${
                  plan.status === s ? 'border-[#002D24] bg-[#002D24] text-white' : 'border-[#D5E0D8] bg-white text-[#374151] hover:bg-[#F3F6F3]'
                }`}
              >
                {s === 'completed' && <Check className="mr-1 inline h-3.5 w-3.5" />}
                {planStatusLabel[s]}
              </button>
            ))}
          </div>

          <section className="mt-4 border-t border-[#E5EDE8] pt-4">
            <h3 className={sectionTitle}>In this lesson</h3>
            {activities.length ? (
              <ol className="space-y-1.5">
                {activities.slice(0, 12).map((a, i) => (
                  <li key={a._uniqueId || a.id || i} className="flex items-baseline gap-2 text-sm text-[#1F2937]">
                    <span className="w-5 shrink-0 text-xs font-semibold text-[#4B5563] tabular-nums">{i + 1}.</span>
                    <span className="flex-1">{a.activity || 'Activity'}</span>
                    {a.time ? <span className="text-xs text-[#4B5563] tabular-nums">{a.time} min</span> : null}
                  </li>
                ))}
                {activities.length > 12 && <li className="text-xs text-[#4B5563]">+{activities.length - 12} more</li>}
              </ol>
            ) : (
              <p className="text-sm text-[#4B5563]">No activities yet. Build this lesson in the Lesson Builder.</p>
            )}
            {lesson?.learningOutcome && (
              <p className="mt-3 rounded-xl bg-[#F1F6F2] px-3 py-2 text-sm text-[#1F2937]">
                <span className="font-semibold">Learning outcome: </span>
                {lesson.learningOutcome.replace(/<[^>]+>/g, ' ')}
              </p>
            )}
          </section>

          <section className="mt-4 border-t border-[#E5EDE8] pt-4">
            <h3 className={sectionTitle}>Note for this class</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={`A quick reminder for ${cls?.name || 'this class'} only…`}
              className={fieldClass}
            />
            {note !== (plan.notes || '') && (
              <button type="button" className={`${btnPrimary} mt-2`} onClick={() => data.savePlans([{ ...plan, notes: note }], 'Note saved.')}>
                Save note
              </button>
            )}
          </section>

          {(isPast || plan.status === 'completed') && (
            <section className="mt-4 border-t border-[#E5EDE8] pt-4">
              <h3 className={sectionTitle}>How did it go?</h3>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lesson outcome">
                {([
                  ['below', 'Below plan'],
                  ['as_planned', 'As planned'],
                  ['exceeded', 'Exceeded'],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setReflection((r) => ({ ...r, outcome: r.outcome === v ? null : v }))}
                    className={`min-h-[34px] rounded-full border px-3 text-[13px] ${
                      reflection.outcome === v ? 'border-[#002D24] bg-[#002D24] text-white' : 'border-[#D5E0D8] text-[#374151]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {([
                ['wentWell', 'What worked well?'],
                ['toRevisit', 'What needs revisiting?'],
                ['nextTime', 'Note for next lesson'],
              ] as const).map(([k, label]) => (
                <label key={k} className="mt-3 block">
                  <span className="mb-1 block text-[13px] font-semibold text-[#374151]">{label}</span>
                  <textarea
                    rows={2}
                    value={reflection[k]}
                    onChange={(e) => setReflection((r) => ({ ...r, [k]: e.target.value }))}
                    className={fieldClass}
                  />
                </label>
              ))}
              <p className="mt-2 flex items-center gap-2 rounded-xl bg-[#F1F6F2] px-3 py-2 text-[12.5px] text-[#374151]">
                <Lock className="h-4 w-4 shrink-0 text-[#002D24]" />
                Private to you. Saved against {cls?.name || 'this class'} on this date, not the lesson itself.
              </p>
              <button type="button" className={`${btnPrimary} mt-3`} onClick={() => data.saveReflection(reflection)}>
                Save reflection
              </button>
            </section>
          )}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E5EDE8] pt-4">
            <button type="button" className={btn} onClick={() => setMode('move')}>
              <MoveRight className="h-4 w-4" /> Move
            </button>
            <button type="button" className={btn} onClick={() => setMode('reuse')}>
              <Copy className="h-4 w-4" /> Teach to another class
            </button>
            <button type="button" className={btn} onClick={() => onOpenLibrary(plan.className)}>
              <ExternalLink className="h-4 w-4" /> Open lessons for {cls?.name || 'class'}
            </button>
          </div>
        </>
      )}

      {mode === 'move' && <MoveForm plan={plan} data={data} onDone={() => setMode('details')} />}
      {mode === 'reuse' && <ReuseForm plan={plan} title={title} data={data} onDone={() => setMode('details')} />}
    </PlannerSheet>
  );
}

function MoveForm({ plan, data, onDone }: { plan: LessonPlan; data: PlannerData; onDone: () => void }) {
  const [date, setDate] = useState(ymd(new Date(plan.date)));
  const [time, setTime] = useState(plan.time || '');
  const slotTimes = useMemo(() => {
    const day = new Date(`${date}T12:00:00`).getDay();
    return data.slots.filter((s) => s.className === plan.className && s.day === day).map((s) => s.startTime);
  }, [date, data.slots, plan.className]);
  const save = () => {
    const d = new Date(`${date}T12:00:00`);
    void data.savePlans([{ ...plan, date: d, week: isoWeek(d), time: time || undefined }], 'Lesson moved.').then(onDone);
  };
  return (
    <section className="mt-4 space-y-3">
      <p className="text-sm text-[#374151]">The lesson, its notes and any reflection move together.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-[13px] font-semibold text-[#374151]">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-[13px] font-semibold text-[#374151]">
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
      </div>
      {slotTimes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#374151]">
          Timetabled:
          {slotTimes.map((t) => (
            <button key={t} type="button" onClick={() => setTime(t)} className="rounded-full border border-[#D5E0D8] px-2.5 py-1 hover:bg-[#F3F6F3]">
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button type="button" className={btn} onClick={onDone}>Cancel</button>
        <button type="button" className={`${btnPrimary} ml-auto`} onClick={save}>Move lesson</button>
      </div>
    </section>
  );
}

function ReuseForm({ plan, title, data, onDone }: { plan: LessonPlan; title: string; data: PlannerData; onDone: () => void }) {
  const others = data.classes.filter((c) => c.id !== plan.className);
  const [target, setTarget] = useState(others[0]?.id || '');
  const [date, setDate] = useState(ymd(new Date(plan.date)));
  const [time, setTime] = useState('');
  const day = new Date(`${date}T12:00:00`).getDay();
  const slotTimes = useMemo(
    () => data.slots.filter((s) => s.className === target && s.day === day).map((s) => s.startTime),
    [data.slots, target, day],
  );
  useEffect(() => {
    setTime(slotTimes[0] || plan.time || '');
  }, [slotTimes, plan.time]);

  const targetName = data.classById.get(target)?.name || 'that class';
  const save = () => {
    const d = new Date(`${date}T12:00:00`);
    const copy: LessonPlan = {
      ...plan,
      id: crypto.randomUUID(),
      className: target,
      date: d,
      week: isoWeek(d),
      time: time || undefined,
      title,
      lessonNumber: undefined,
      unitId: undefined,
      notes: `Copied from ${data.classById.get(plan.className)?.name || plan.className}, ${fmtDate(new Date(plan.date))}.`,
      status: 'planned',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    void data.savePlans([copy], `Added to ${targetName}.`).then(onDone);
  };

  if (!others.length) return <p className="mt-4 text-sm text-[#374151]">Add another class in Settings → Year groups first.</p>;
  return (
    <section className="mt-4 space-y-3">
      <label className="block text-[13px] font-semibold text-[#374151]">
        Class
        <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${fieldClass} mt-1`}>
          {others.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-[13px] font-semibold text-[#374151]">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-[13px] font-semibold text-[#374151]">
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
      </div>
      <ul className="space-y-1.5 rounded-2xl border border-[#D6EBC9] bg-[#F6FBF3] px-4 py-3 text-[13px] text-[#1E6B3E]">
        <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" />A new session for {targetName} with the same activities.</li>
        <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" />The original lesson and its reflection are not changed.</li>
        <li className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />Each class keeps its own copy, so you can adapt it for {targetName} without affecting the original.</li>
      </ul>
      <div className="flex gap-2 pt-1">
        <button type="button" className={btn} onClick={onDone}>Cancel</button>
        <button type="button" className={`${btnPrimary} ml-auto`} onClick={save} disabled={!target}>Add session</button>
      </div>
    </section>
  );
}

/* ---------------- Choose a lesson for an empty slot or a new session ---------------- */

export function SchedulePickerSheet({
  initial,
  data,
  onClose,
}: {
  initial: { classId?: string; date: Date; time?: string };
  data: PlannerData;
  onClose: () => void;
}) {
  const visible = data.classes.filter((c) => !c.hidden);
  const [classId, setClassId] = useState(initial.classId || visible[0]?.id || '');
  const [date, setDate] = useState(ymd(initial.date));
  const [time, setTime] = useState(initial.time || '');
  const [query, setQuery] = useState('');
  const cache = data.lessonCache[classId];
  const { ensureLessons } = data;

  useEffect(() => {
    if (classId) ensureLessons(classId);
  }, [classId, ensureLessons]);

  const cls = data.classById.get(classId);
  const scheduled = useMemo(
    () => new Set(data.plans.filter((p) => p.className === classId && p.lessonNumber).map((p) => p.lessonNumber!)),
    [data.plans, classId],
  );
  const lessons = useMemo(() => {
    if (!cache || cache === 'loading') return [];
    const q = query.trim().toLowerCase();
    return cache.lessonNumbers
      .map((n) => ({ n, l: cache.lessons[n] }))
      .filter(({ n, l }) => !q || `${l.title || ''} ${l.lessonName || ''} lesson ${n}`.toLowerCase().includes(q));
  }, [cache, query]);

  const choose = (n: string) => {
    if (!cache || cache === 'loading') return;
    const l = cache.lessons[n];
    const d = new Date(`${date}T12:00:00`);
    const activities = (l.orderedActivities?.length ? l.orderedActivities : Object.values(l.grouped || {}).flat()).map((a) => ({
      ...a,
      lessonNumber: n,
    }));
    const plan: LessonPlan = {
      id: crypto.randomUUID(),
      date: d,
      week: isoWeek(d),
      className: classId,
      activities,
      duration: l.totalTime || 0,
      notes: '',
      status: 'planned',
      lessonNumber: n,
      title: l.title || l.lessonName || `Lesson ${n}`,
      time: time || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    void data.savePlans([plan], `Scheduled for ${cls?.name || 'class'}.`).then(onClose);
  };

  return (
    <PlannerSheet onClose={onClose} label="Choose a lesson">
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1">
        <label className="block text-[13px] font-semibold text-[#374151]">
          Class
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={`${fieldClass} mt-1`}>
            {visible.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-[13px] font-semibold text-[#374151]">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-[13px] font-semibold text-[#374151]">
          Time
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
      </div>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${cls?.name || ''} lessons…`}
          className={`${fieldClass} pl-9`}
        />
      </div>
      <div className="mt-3 space-y-2">
        {cache === 'loading' || !cache ? (
          <p className="py-6 text-center text-sm text-[#4B5563]">Loading lessons…</p>
        ) : lessons.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#4B5563]">
            No lessons found for {cls?.name}. Create one in the Lesson Builder first.
          </p>
        ) : (
          lessons.map(({ n, l }) => (
            <button
              key={n}
              type="button"
              onClick={() => choose(n)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#E5EDE8] bg-white px-3 py-2.5 text-left hover:bg-[#F7FAF8]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F1F6F2] text-xs font-bold text-[#002D24]">{n}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#1F2937]">{l.title || l.lessonName || `Lesson ${n}`}</span>
                <span className="block text-xs text-[#4B5563]">
                  {plural(Object.values(l.grouped || {}).flat().length, 'activity', 'activities')} · {l.totalTime || 0} min
                </span>
              </span>
              {scheduled.has(n) && <span className="rounded-full bg-[#E7F5EC] px-2 py-0.5 text-[11.5px] font-semibold text-[#1E6B3E]">Scheduled</span>}
              <BookOpen className="h-4 w-4 shrink-0 text-[#6B7280]" />
            </button>
          ))
        )}
      </div>
    </PlannerSheet>
  );
}
