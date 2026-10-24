import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { TimetableBuilder } from '../TimetableBuilder';
import { YearGroupsAccessNotice } from '../ccdPlanner/YearGroupsAccessNotice';
import { usePlannerData, type PlannerData } from './usePlannerData';
import { WeekView, DayView, MonthView } from './PlannerViews';
import { LessonDetailsSheet, SchedulePickerSheet } from './PlannerSheets';
import { buildDayEntries, lessonTitle } from './plannerEntries';
import {
  academicYearFor,
  addDays,
  formatRange,
  HALF_TERMS,
  halfTermFor,
  isWeekend,
  nextWeekday,
  SCHEDULE_VIEWS,
  readableInk,
  startOfDay,
  startOfWeek,
  ymd,
  type DayEntry,
  type PlannerRoom,
  type PlannerView,
} from './plannerModel';
import {
  scheduleViewFromPath,
  syncPlannerViewUrl,
} from '../studio/plannerRoutes';

interface PlannerProps {
  initialView?: PlannerView;
  /** Existing calendar (timetable builder, events, iCal, PDF), kept available while the Planner matures. */
  renderClassic: () => React.ReactNode;
}

type Sheet =
  | { kind: 'details'; entry: DayEntry }
  | { kind: 'pick'; classId?: string; date: Date; time?: string }
  | null;

const navBtn =
  'grid h-10 w-10 place-items-center rounded-xl border border-[#E2E0EF] bg-white text-[#77738F] hover:border-[#bcb7f4] hover:text-[#1F1B4D]';
const toolBtn =
  'inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#E2E0EF] bg-white px-3 text-[13px] font-semibold text-[#1F1B4D] hover:border-[#bcb7f4]';
const primaryBtn =
  'inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#4338E8] px-4 text-[13px] font-bold text-white hover:bg-[#3529d1]';

function rangeFor(view: PlannerView, anchor: Date) {
  if (view === 'day') return { from: startOfDay(anchor), to: addDays(anchor, 1) };
  if (view === 'week') {
    const mon = startOfWeek(anchor);
    return { from: mon, to: addDays(mon, 7) };
  }
  if (view === 'month') {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return { from: startOfWeek(first), to: addDays(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0), 7) };
  }
  const startYear = Number(academicYearFor(anchor).split('-')[0]);
  return { from: new Date(startYear, 7, 1), to: new Date(startYear + 1, 8, 1) };
}

function roomFromView(v: PlannerView): PlannerRoom {
  if (v === 'term' || v === 'units') return 'units';
  if (v === 'timetable') return 'timetable';
  // classic (class calendar) sits under Schedule chrome, not the Timetable tab
  return 'schedule';
}

export function Planner({ initialView, renderClassic }: PlannerProps) {
  const { currentSheetInfo, setCurrentSheetInfo } = useData();
  const { settings } = useSettings();
  // C2: term/units views moved to Half-terms — never open them inside Planner
  const fromPath = typeof window !== 'undefined' ? scheduleViewFromPath() : null;
  const safeInitial =
    fromPath ||
    (initialView && initialView !== 'term' && initialView !== 'units' ? initialView : 'week');
  const [view, setView] = useState<PlannerView>(safeInitial);
  const [anchor, setAnchor] = useState(() => {
    const today = startOfDay(new Date());
    // Day view is Mon–Fri only — never land on a weekend with "Add one-off".
    return safeInitial === 'day' ? nextWeekday(today) : today;
  });
  const [focus, setFocus] = useState<string>('all');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const room = roomFromView(view);
  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const data = usePlannerData(range);
  const { classes, classById } = data;

  const visibleIds = useMemo(
    () => new Set(focus === 'all' ? classes.filter((c) => !c.hidden).map((c) => c.id) : [focus]),
    [classes, focus],
  );
  /** Class calendar uses the header class selector — Timetable is teacher-level (all classes). */
  const focusedClassId =
    view === 'classic'
      ? classById.has(currentSheetInfo.sheet)
        ? currentSheetInfo.sheet
        : classes[0]?.id || ''
      : focus !== 'all'
        ? focus
        : classById.has(currentSheetInfo.sheet)
          ? currentSheetInfo.sheet
          : classes[0]?.id || '';

  // C1: publish All/One focus so the header chip stays in sync
  useEffect(() => {
    const mode = focus === 'all' ? 'all' : 'one';
    try {
      document.documentElement.dataset.ccdPlannerFocus = mode;
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('ccd:planner-focus', { detail: { mode } }));
  }, [focus]);

  useEffect(() => {
    const onRequest = (e: Event) => {
      const mode = (e as CustomEvent<{ mode?: string }>).detail?.mode;
      if (mode === 'all') {
        setFocus('all');
        return;
      }
      if (mode === 'one') {
        const id = classById.has(currentSheetInfo.sheet)
          ? currentSheetInfo.sheet
          : classes[0]?.id;
        if (id) setFocus(id);
      }
    };
    window.addEventListener('ccd:planner-focus-request', onRequest);
    return () => window.removeEventListener('ccd:planner-focus-request', onRequest);
  }, [classById, currentSheetInfo.sheet, classes]);

  // Keep one-class focus aligned with header class when in one-class mode.
  // Never override an intentional "All classes" focus when navigating.
  useEffect(() => {
    if (focus === 'all') return;
    if (currentSheetInfo.sheet && classById.has(currentSheetInfo.sheet) && focus !== currentSheetInfo.sheet) {
      setFocus(currentSheetInfo.sheet);
    }
  }, [currentSheetInfo.sheet, classById, focus]);

  const { refreshStorage, reloadPlans } = data;
  const changeView = useCallback(
    (next: PlannerView) => {
      // C2: year planning lives on Half-terms — bounce old Units/term deep-links
      if (next === 'term' || next === 'units') {
        window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'curriculum' } }));
        return;
      }
      if ((view === 'timetable' || view === 'classic') && next !== view) {
        refreshStorage();
        void reloadPlans();
      }
      if (next === 'day') {
        setAnchor((a) => (isWeekend(a) ? nextWeekday(a) : a));
      }
      setView(next);
      setSheet(null);
      syncPlannerViewUrl(next);
    },
    [view, refreshStorage, reloadPlans],
  );

  // Keep Day view on a weekday if anchor drifts (e.g. "This week" on Sat/Sun).
  useEffect(() => {
    if (view !== 'day') return;
    if (!isWeekend(anchor)) return;
    setAnchor(nextWeekday(anchor));
  }, [view, anchor]);

  // Browser back/forward for /planner/week|day|month
  useEffect(() => {
    const onPop = () => {
      const v = scheduleViewFromPath();
      if (v) {
        setView(v);
        if (v === 'day') setAnchor((a) => (isWeekend(a) ? nextWeekday(a) : a));
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Ensure URL matches initial schedule view when landing on /planner
  useEffect(() => {
    if (view === 'week' || view === 'day' || view === 'month') {
      syncPlannerViewUrl(view);
    }
    // once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goRoom = useCallback(
    (next: PlannerRoom) => {
      // C2: Half-terms owns year planning — Units room redirects to sidebar Half-terms
      if (next === 'units') {
        window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'curriculum' } }));
        return;
      }
      if (next === 'timetable') {
        // Always the full-page teacher timetable — never the class month calendar
        changeView('timetable');
        return;
      }
      if (view === 'term' || view === 'units' || view === 'timetable' || view === 'classic') changeView('week');
    },
    [changeView, view],
  );

  const step = (dir: -1 | 1) => {
    setAnchor((a) => {
      if (view === 'day') {
        let d = addDays(a, dir);
        while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, dir);
        return d;
      }
      if (view === 'week') return addDays(a, 7 * dir);
      if (view === 'month') return new Date(a.getFullYear(), a.getMonth() + dir, 1);
      return new Date(a.getFullYear() + dir, a.getMonth(), 1);
    });
  };

  const openLibrary = (classId: string) => {
    const c = classById.get(classId);
    if (c) setCurrentSheetInfo({ sheet: c.id, display: c.name, eyfs: `${c.id} Statements` });
    window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'lesson-library' } }));
  };

  const onOpenEntry = (entry: DayEntry) =>
    setSheet(entry.plan ? { kind: 'details', entry } : { kind: 'pick', classId: entry.classId, date: anchorForEntry(entry), time: entry.time });
  const anchorForEntry = (entry: DayEntry) => new Date(`${entry.key.split(':').pop()}T12:00:00`);

  const onAdd = (date: Date, classId?: string, time?: string) =>
    setSheet({ kind: 'pick', classId: classId || (focus !== 'all' ? focus : undefined), date, time });

  const academicYear = academicYearFor(anchor);
  const halfTerm = HALF_TERMS.find((h) => h.id === halfTermFor(anchor));
  const isThisWeek = ymd(startOfWeek(anchor)) === ymd(startOfWeek(new Date()));
  const className = classById.get(focusedClassId)?.name;
  const pageTitle =
    view === 'week'
      ? 'Week planner'
      : view === 'day'
        ? 'Day planner'
        : view === 'month'
          ? 'Month planner'
          : view === 'timetable'
            ? 'Timetable builder'
            : view === 'classic'
              ? 'Class calendar'
              : view === 'units'
                ? 'Unit progress'
                : className
                  ? `${className} · half-terms`
                  : 'Half-terms';
  const heading =
    view === 'day'
      ? anchor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      : view === 'week'
        ? isThisWeek
          ? 'This week'
          : `Week of ${startOfWeek(anchor).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`
        : view === 'month'
          ? anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          : pageTitle;
  const dateLabel =
    view === 'day'
      ? anchor.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
      : view === 'week'
        ? formatRange(startOfWeek(anchor), addDays(startOfWeek(anchor), 4))
        : view === 'month'
          ? anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          : academicYear.replace('-', '–');

  const weekStats = useMemo(() => {
    if (view !== 'week') return null;
    const mon = startOfWeek(anchor);
    const entries = Array.from({ length: 5 }, (_, i) =>
      buildDayEntries(addDays(mon, i), visibleIds, data.plans, data.slots, data.events),
    ).flat();
    const planned = entries.filter((e) => e.plan).length;
    return { sessions: entries.length, planned, empty: entries.length - planned, taught: entries.filter((e) => e.plan?.status === 'completed').length };
  }, [view, anchor, visibleIds, data.plans, data.slots, data.events]);

  const inSchedule = room === 'schedule' && view !== 'classic';

  useEffect(() => {
    const openTt = () => goRoom('timetable');
    const openCal = () => changeView('classic');
    window.addEventListener('ccd:open-timetable', openTt);
    window.addEventListener('ccd:open-class-calendar', openCal);
    return () => {
      window.removeEventListener('ccd:open-timetable', openTt);
      window.removeEventListener('ccd:open-class-calendar', openCal);
    };
  }, [goRoom, changeView]);

  return (
    <div className={`ss-planner-shell ${view === 'timetable' ? 'is-timetable-fullpage' : ''}`}>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <YearGroupsAccessNotice />
        <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="ccd-studio-eyebrow mb-1">
              CONNECT &amp; CREATE / <span>PLANNER</span>
            </p>
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1
                className="text-[clamp(22px,2.4vw,30px)] font-extrabold leading-none tracking-tight text-[#1F1B4D]"
                style={{ fontFamily: "var(--ss-font-ui, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}
              >
                {pageTitle}
              </h1>
              <p className="text-[13px] font-medium text-[#77738F]">
                {view === 'timetable'
                  ? 'Your week · all My classes'
                  : view === 'classic'
                    ? `${classById.get(focusedClassId)?.name || 'Class'} · events & key dates`
                    : `${halfTerm?.name} · ${academicYear.replace('-', '–')}${
                        view === 'week' || view === 'day' || view === 'month'
                          ? ` · ${heading}${
                              focus === 'all'
                                ? ' · Showing every class — switch to One class to filter'
                                : ` · ${classById.get(focus)?.name || 'One class'}`
                            }`
                          : ''
                      }`}
              </p>
            </div>
          </div>
          {view !== 'timetable' && (
            <div className="flex flex-wrap items-center gap-2">
              {inSchedule && (
                <button
                  type="button"
                  className={toolBtn}
                  onClick={() => {
                    const today = startOfDay(new Date());
                    setAnchor(view === 'day' ? nextWeekday(today) : today);
                  }}
                >
                  This week
                </button>
              )}
              {view === 'classic' ? (
                <button type="button" className={toolBtn} onClick={() => changeView('week')}>
                  Back to schedule
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onAdd(view === 'day' ? anchor : startOfDay(new Date()))}
                  className={primaryBtn}
                  aria-label="Schedule a lesson"
                >
                  <Plus className="h-4 w-4" />
                  New lesson
                </button>
              )}
            </div>
          )}
        </header>

        {inSchedule && (
          <div className="mt-3 flex shrink-0 flex-wrap items-center gap-3 rounded-2xl border border-[#E2E0EF] bg-white px-3 py-2.5">
            <div
              className="inline-flex rounded-full bg-[#F4F3FA] p-1"
              role="group"
              aria-label="Class focus"
            >
              <button
                type="button"
                onClick={() => setFocus('all')}
                className={`min-h-[32px] rounded-full px-3.5 text-[13px] font-bold ${
                  focus === 'all' ? 'bg-[#4338E8] text-white' : 'text-[#77738F] hover:text-[#1F1B4D]'
                }`}
              >
                All classes
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = classById.has(currentSheetInfo.sheet)
                    ? currentSheetInfo.sheet
                    : classes[0]?.id;
                  if (id) {
                    setFocus(id);
                    if (id !== currentSheetInfo.sheet) {
                      const c = classById.get(id);
                      if (c) setCurrentSheetInfo({ sheet: c.id, display: c.name, eyfs: `${c.id} Statements` });
                    }
                  }
                }}
                className={`min-h-[32px] rounded-full px-3.5 text-[13px] font-bold ${
                  focus !== 'all' ? 'bg-[#4338E8] text-white' : 'text-[#77738F] hover:text-[#1F1B4D]'
                }`}
              >
                One class
              </button>
            </div>
            <p className="hidden text-[13px] text-[#77738F] sm:block">
              Tip: pick one class when you want Activities, Lessons and Half-terms to stay in the same context.
            </p>
          </div>
        )}

        <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[#E2E0EF] bg-white p-1" role="tablist" aria-label="Planner area">
              {(
                [
                  { id: 'schedule' as const, label: 'Schedule' },
                  { id: 'timetable' as const, label: 'Timetable builder' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={room === r.id}
                  onClick={() => goRoom(r.id)}
                  className={`min-h-[36px] rounded-lg px-3.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                    room === r.id ? 'bg-[#4338E8] text-white' : 'text-[#77738F] hover:text-[#1F1B4D]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {inSchedule && (
              <label className="inline-flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wide text-[#77738F]">
                View
                <select
                  className="min-h-[36px] rounded-xl border border-[#E2E0EF] bg-white px-3 text-[13px] font-bold normal-case tracking-normal text-[#1F1B4D]"
                  value={view}
                  aria-label="Planner view"
                  onChange={(e) => changeView(e.target.value as PlannerView)}
                >
                  {SCHEDULE_VIEWS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {inSchedule && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" className={navBtn} onClick={() => step(-1)} aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[140px] px-1 text-center text-[13px] font-extrabold text-[#1F1B4D]">{dateLabel}</span>
              <button type="button" className={navBtn} onClick={() => step(1)} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </button>
              {(view === 'week' || view === 'day' || view === 'month') && (
                <button
                  type="button"
                  className={`${toolBtn} hidden sm:inline-flex`}
                  onClick={() => printSchedule(view, data, anchor, visibleIds, settings)}
                  aria-label={`Print this ${view}`}
                >
                  <Printer className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {room === 'schedule' && view !== 'classic' && weekStats && (
          <button
            type="button"
            onClick={() => setSummaryOpen((o) => !o)}
            className="mt-3 shrink-0 text-[13px] font-medium text-[#77738F] hover:text-[#4338E8]"
            aria-expanded={summaryOpen}
          >
            {weekStats.planned} planned
            {weekStats.empty > 0 ? ` · ${weekStats.empty} empty` : ''}
            {data.loadingPlans ? ' · Updating…' : ''}
          </button>
        )}
        {room === 'schedule' && view !== 'classic' && summaryOpen && weekStats && (
          <p className="mt-1 flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#77738F]">
            <span><b className="text-[#1F1B4D]">{weekStats.sessions}</b> sessions</span>
            <span><b className="text-[#1F1B4D]">{weekStats.planned}</b> planned</span>
            <span><b className="text-[#1F1B4D]">{weekStats.taught}</b> taught</span>
          </p>
        )}

        <div className={`ss-planner-board ${view === 'week' ? '' : ''} ${view === 'timetable' ? 'is-timetable' : ''}`}>
          {view === 'week' && (
            <WeekView data={data} visibleIds={visibleIds} anchor={anchor} selectedKey={sheet?.kind === 'details' ? sheet.entry.key : null} onOpenEntry={onOpenEntry} onAdd={onAdd} />
          )}
          {view === 'day' && (
            <DayView data={data} visibleIds={visibleIds} anchor={anchor} selectedKey={sheet?.kind === 'details' ? sheet.entry.key : null} onOpenEntry={onOpenEntry} onAdd={onAdd} />
          )}
          {view === 'month' && (
            <MonthView
              data={data}
              visibleIds={visibleIds}
              anchor={anchor}
              onPickDay={(d) => {
                setAnchor(isWeekend(d) ? nextWeekday(d) : startOfDay(d));
                changeView('day');
              }}
            />
          )}
          {view === 'timetable' && (
            <TimetableBuilder
              isOpen
              embedded
              onClose={() => changeView('week')}
              onTimetableUpdate={() => {
                refreshStorage();
              }}
            />
          )}
          {view === 'classic' && (
            <div className="min-h-0 flex-1">
              {focusedClassId === currentSheetInfo.sheet ? (
                renderClassic()
              ) : (
                <p className="py-10 text-center text-sm text-[#77738F]">Loading calendar…</p>
              )}
            </div>
          )}
        </div>
      </main>

      {sheet?.kind === 'details' && sheet.entry.plan && (
        <LessonDetailsSheet
          entry={{ ...sheet.entry, plan: data.plans.find((p) => p.id === sheet.entry.plan!.id) || sheet.entry.plan }}
          data={data}
          onClose={() => setSheet(null)}
          onOpenLibrary={openLibrary}
          onEditInBuilder={(plan) => {
            const c = classById.get(plan.className);
            if (c) setCurrentSheetInfo({ sheet: c.id, display: c.name, eyfs: `${c.id} Statements` });
            window.dispatchEvent(new CustomEvent('ccd:open-tab', { detail: { tab: 'lesson-library' } }));
          }}
        />
      )}
      {sheet?.kind === 'pick' && (
        <SchedulePickerSheet initial={sheet} data={data} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

/* ---------------- Schedule print (week / day / month) ---------------- */

type PrintSettings = {
  branding?: {
    loginTitle?: string;
    loginSubtitle?: string;
    loginLogoUrl?: string;
    footerCompanyName?: string;
    footerCopyrightYear?: string;
    loginButtonColor?: string;
    loginBackgroundColor?: string;
  };
  schoolName?: string;
  schoolLogo?: string;
};

function activityLabel(a: { activity?: string; description?: string } | null | undefined): string {
  if (!a) return '';
  return (a.activity || a.description || '').trim();
}

function planActivityLines(data: PlannerData, entry: DayEntry): string[] {
  const plan = entry.plan;
  if (!plan) return [];
  const fromPlan = (plan.activities || []).map(activityLabel).filter(Boolean);
  if (fromPlan.length) return fromPlan.slice(0, 8);
  const cache = data.lessonCache[entry.classId];
  if (!cache || cache === 'loading' || !plan.lessonNumber) return [];
  const lesson = cache.lessons[plan.lessonNumber];
  const list =
    lesson?.orderedActivities ||
    (lesson?.grouped ? Object.values(lesson.grouped).flat() : []);
  return (list || []).map(activityLabel).filter(Boolean).slice(0, 8);
}

function lessonBlockHtml(
  esc: (s: string) => string,
  data: PlannerData,
  entry: DayEntry,
): string {
  if (!entry.plan) return '';
  const c = data.classById.get(entry.classId);
  const color = c?.color || '#475569';
  const end = entry.endTime ? `–${esc(entry.endTime)}` : '';
  const acts = planActivityLines(data, entry);
  const actHtml = acts.length
    ? `<ul class="acts">${acts.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
    : '';
  return `<div class="l" style="border-color:${color}"><div class="a" style="color:${readableInk(color)}">${esc(entry.time || '')}${end} · ${esc(c?.name || entry.classId)}</div><div class="b">${esc(lessonTitle(entry.plan, data.lessonCache[entry.classId]))}</div>${actHtml}</div>`;
}

function openPrintHtml(html: string) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    toast.error('Printing is not available in this browser.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  const cleanUp = () => setTimeout(() => frame.remove(), 1000);
  win.addEventListener('afterprint', cleanUp, { once: true });
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      toast.error('Printing is not available in this browser.');
    }
    setTimeout(() => frame.isConnected && frame.remove(), 60000);
  }, 350);
}

function printChrome(opts: {
  esc: (s: string) => string;
  title: string;
  eyebrow: string;
  rangeLabel: string;
  productName: string;
  productSubtitle: string;
  companyName: string;
  copyrightYear: string;
  absLogo: string;
  termName?: string;
  body: string;
  pageSize?: string;
}) {
  const {
    esc,
    title,
    eyebrow,
    rangeLabel,
    productName,
    productSubtitle,
    companyName,
    copyrightYear,
    absLogo,
    termName,
    body,
    pageSize = 'A4 landscape',
  } = opts;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
@page{size:${pageSize};margin:12mm 11mm 14mm}
*{box-sizing:border-box}
body{
  font-family:"Plus Jakarta Sans",system-ui,sans-serif;
  color:#1F1B4D;margin:0;background:#fff;
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
  position:relative;min-height:100%;
}
.logo-mark{position:absolute;top:0;left:0;z-index:0;width:28px;height:28px;object-fit:contain;opacity:.22;pointer-events:none}
.sheet{position:relative;z-index:1;padding-top:4px}
.mast{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:4px 0 10px 36px;border-bottom:1.5px solid #E2E0EF}
.mast-left{min-width:0}
.eyebrow{margin:0 0 2px;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#77738F}
.mast h1{margin:0;font-size:20px;font-weight:800;letter-spacing:-.03em;line-height:1.15;color:#1F1B4D}
.mast .range{margin:3px 0 0;font-size:13px;font-weight:500;color:#5C5878}
.mast-right{text-align:right;flex-shrink:0}
.term-pill{display:inline-block;font-size:13px;font-weight:700;color:#4338E8;background:#E9E6FF;border-radius:999px;padding:3px 10px}
.product-quiet{margin-top:4px;font-size:13px;font-weight:600;color:#9B97B0}
.accent{height:2px;margin-top:-1.5px;background:linear-gradient(90deg,#4338E8 0%,#E5E2FF 42%,transparent 100%)}
.g{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;margin-top:12px;border:1px solid #E2E0EF;border-radius:10px;overflow:hidden}
.col{min-width:0;padding:8px 9px 10px;border-right:1px solid #E2E0EF;background:#fff}
.col:last-child{border-right:0}
.col:nth-child(odd){background:#FAFAFC}
.d{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#4338E8;padding-bottom:6px;margin-bottom:4px;border-bottom:1px solid #E9E6FF}
.l{border-left:2.5px solid;padding:4px 0 4px 7px;margin-top:6px;break-inside:avoid}
.a{font-size:13px;font-weight:700;letter-spacing:.01em}
.b{font-size:13px;font-weight:600;line-height:1.35;margin-top:1px;color:#1F1B4D}
.acts{margin:3px 0 0;padding:0 0 0 12px;font-size:13px;font-weight:500;color:#5C5878;line-height:1.35}
.acts li{margin:0}
.n{color:#C4C0D4;margin-top:10px;font-size:13px;font-weight:500}
.day-stack{margin-top:12px;border:1px solid #E2E0EF;border-radius:10px;padding:12px 14px}
.month-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:12px}
.month-heads{display:contents}
.month-head{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#4338E8;padding:0 4px 2px}
.month-cell{border:1px solid #E2E0EF;border-radius:8px;padding:6px 7px;min-height:72px;break-inside:avoid}
.month-cell.is-empty{border-style:dashed;background:#FAFAFC;min-height:48px}
.month-cell .dn{font-size:13px;font-weight:800;color:#4338E8;margin-bottom:4px}
.foot{margin-top:12px;padding-top:8px;border-top:1px solid #E2E0EF;display:flex;justify-content:space-between;gap:12px;font-size:13px;font-weight:500;color:#77738F}
</style></head><body>
<img class="logo-mark" src="${esc(absLogo)}" alt="" onerror="this.style.display='none'">
<div class="sheet">
  <header class="mast">
    <div class="mast-left">
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(rangeLabel)}</h1>
      <p class="range">${esc(productName)}${productSubtitle ? ` · ${esc(productSubtitle)}` : ''}</p>
    </div>
    <div class="mast-right">
      ${termName ? `<span class="term-pill">${esc(termName)}</span>` : ''}
      <div class="product-quiet">${esc(companyName)}</div>
    </div>
  </header>
  <div class="accent" aria-hidden="true"></div>
  ${body}
  <footer class="foot">
    <span>© ${esc(copyrightYear)} ${esc(companyName)} · Private reflections are not included</span>
    <span>Page 1</span>
  </footer>
</div>
</body></html>`;
}

function printSchedule(
  view: 'week' | 'day' | 'month',
  data: PlannerData,
  anchor: Date,
  visibleIds: Set<string>,
  settings?: PrintSettings,
) {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const branding = settings?.branding || {};
  const rawName = branding.loginTitle || settings?.schoolName || 'CCDesigner';
  const productName = /Creative\s+Curriculum\s+Designer/i.test(rawName) ? 'CCDesigner' : rawName;
  const productSubtitle = branding.loginSubtitle || '';
  const companyName = branding.footerCompanyName || 'CCDesigner';
  const copyrightYear = branding.footerCopyrightYear || String(new Date().getFullYear());
  const logoSrc = branding.loginLogoUrl || settings?.schoolLogo || '/ccdesigner-logo.png';
  const absLogo = logoSrc.startsWith('http')
    ? logoSrc
    : `${window.location.origin}${logoSrc.startsWith('/') ? '' : '/'}${logoSrc}`;
  const term = HALF_TERMS.find((h) => h.id === halfTermFor(anchor));

  let rangeLabel = '';
  let eyebrow = '';
  let body = '';
  let pageSize = 'A4 landscape';

  if (view === 'week') {
    const mon = startOfWeek(anchor);
    const fri = addDays(mon, 4);
    rangeLabel = `${mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${fri.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    eyebrow = 'Week planner';
    const cols = Array.from({ length: 5 }, (_, i) => {
      const d = addDays(mon, i);
      const items = buildDayEntries(d, visibleIds, data.plans, data.slots, data.events)
        .filter((e) => e.plan)
        .map((e) => lessonBlockHtml(esc, data, e))
        .join('');
      return `<div class="col"><div class="d">${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</div>${items || '<div class="n">—</div>'}</div>`;
    }).join('');
    body = `<div class="g">${cols}</div>`;
  } else if (view === 'day') {
    const d = nextWeekday(startOfDay(anchor));
    rangeLabel = d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    eyebrow = 'Day planner';
    pageSize = 'A4 landscape';
    const items = buildDayEntries(d, visibleIds, data.plans, data.slots, data.events)
      .filter((e) => e.plan)
      .map((e) => lessonBlockHtml(esc, data, e))
      .join('');
    body = `<div class="day-stack">${items || '<div class="n">No lessons planned</div>'}</div>`;
  } else {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    rangeLabel = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    eyebrow = 'Month planner';
    pageSize = 'A4 landscape';
    // Mon–Fri grid aligned to weekdays (empty leading/trailing cells)
    const headers = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      .map((h) => `<div class="month-head">${h}</div>`)
      .join('');
    const cells: string[] = [];
    // Monday=0 … Friday=4; JS Sunday=0 → convert
    const firstDow = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
    const startPad = firstDow <= 4 ? firstDow : 0;
    // If month starts on Sat/Sun, first printed day is the following Monday
    let dayCursor = 1;
    if (firstDow > 4) {
      dayCursor = 1 + (7 - firstDow);
    }
    for (let i = 0; i < startPad; i++) {
      cells.push(`<div class="month-cell is-empty"></div>`);
    }
    while (dayCursor <= last.getDate()) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth(), dayCursor);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) {
        dayCursor += 1;
        continue;
      }
      const items = buildDayEntries(d, visibleIds, data.plans, data.slots, data.events)
        .filter((e) => e.plan)
        .map((e) => lessonBlockHtml(esc, data, e))
        .join('');
      cells.push(
        `<div class="month-cell"><div class="dn">${dayCursor}</div>${items || '<div class="n">—</div>'}</div>`,
      );
      dayCursor += 1;
    }
    while (cells.length % 5 !== 0) {
      cells.push(`<div class="month-cell is-empty"></div>`);
    }
    body = `<div class="month-grid"><div class="month-heads">${headers}</div>${cells.join('')}</div>`;
  }

  openPrintHtml(
    printChrome({
      esc,
      title: `${eyebrow} · ${rangeLabel}`,
      eyebrow,
      rangeLabel,
      productName,
      productSubtitle,
      companyName,
      copyrightYear,
      absLogo,
      termName: term?.name,
      body,
      pageSize,
    }),
  );
}
