import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import {
  CalendarCog,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Folder,
  Palette,
  Plus,
  Printer,
  Users,
  X,
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { usePlannerData, type PlannerData } from './usePlannerData';
import { WeekView, DayView, MonthView, UnitsView } from './PlannerViews';
import { LessonDetailsSheet, SchedulePickerSheet } from './PlannerSheets';
import { buildDayEntries, lessonTitle } from './plannerEntries';
import {
  academicYearFor,
  addDays,
  CLASS_PALETTE,
  formatRange,
  HALF_TERMS,
  halfTermFor,
  PLANNER_VIEWS,
  readableInk,
  SERIF,
  startOfDay,
  startOfWeek,
  ymd,
  type DayEntry,
  type PlannerView,
} from './plannerModel';

interface PlannerProps {
  initialView?: PlannerView;
  /** Existing Half-Term Designer, shown as the Term view for the focused class. */
  renderTerm: () => React.ReactNode;
  /** Existing calendar (timetable builder, events, iCal, PDF), kept available while the Planner matures. */
  renderClassic: () => React.ReactNode;
}

type Sheet =
  | { kind: 'details'; entry: DayEntry }
  | { kind: 'pick'; classId?: string; date: Date; time?: string }
  | null;

const navBtn =
  'grid h-10 w-10 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F7FAF8]';
const toolBtn =
  'inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[13.5px] font-medium text-[#374151] hover:bg-[#F7FAF8]';

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

export function Planner({ initialView, renderTerm, renderClassic }: PlannerProps) {
  const { currentSheetInfo, setCurrentSheetInfo } = useData();
  const [view, setView] = useState<PlannerView>(initialView || 'week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [focus, setFocus] = useState<string>('all');
  const [drawer, setDrawer] = useState(false);
  const [organise, setOrganise] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const data = usePlannerData(range);
  const { classes, classById } = data;

  const visibleIds = useMemo(
    () => new Set(focus === 'all' ? classes.filter((c) => !c.hidden).map((c) => c.id) : [focus]),
    [classes, focus],
  );
  const focusedClassId = focus !== 'all' ? focus : classById.has(currentSheetInfo.sheet) ? currentSheetInfo.sheet : classes[0]?.id || '';

  /** Term and classic views operate on the app's selected class, so keep it in step with the Planner focus. */
  useEffect(() => {
    if ((view === 'term' || view === 'classic') && focusedClassId && focusedClassId !== currentSheetInfo.sheet) {
      const c = classById.get(focusedClassId);
      if (c) setCurrentSheetInfo({ sheet: c.id, display: c.name, eyfs: `${c.id} Statements` });
    }
  }, [view, focusedClassId, currentSheetInfo.sheet, classById, setCurrentSheetInfo]);

  const { refreshStorage, reloadPlans } = data;
  const changeView = useCallback(
    (next: PlannerView) => {
      if (view === 'classic' && next !== 'classic') {
        refreshStorage();
        void reloadPlans();
      }
      setView(next);
      setSheet(null);
    },
    [view, refreshStorage, reloadPlans],
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
  const heading =
    view === 'day'
      ? anchor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      : view === 'week'
        ? isThisWeek
          ? 'This week'
          : `Week of ${startOfWeek(anchor).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`
        : view === 'month'
          ? anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          : view === 'term'
            ? 'Half-terms'
            : view === 'units'
              ? `${classById.get(focusedClassId)?.name || 'Class'} units`
              : 'Timetable & calendar';
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
    const entries = Array.from({ length: 5 }, (_, i) => buildDayEntries(addDays(mon, i), visibleIds, data.plans, data.slots)).flat();
    const planned = entries.filter((e) => e.plan).length;
    return { sessions: entries.length, planned, empty: entries.length - planned, taught: entries.filter((e) => e.plan?.status === 'completed').length };
  }, [view, anchor, visibleIds, data.plans, data.slots]);

  const classPanel = (
    <ClassPanel
      data={data}
      focus={focus}
      onFocus={(id) => {
        setFocus(id);
        setDrawer(false);
      }}
      onOrganise={() => {
        setOrganise(true);
        setDrawer(false);
      }}
      onTimetable={() => {
        changeView('classic');
        setDrawer(false);
      }}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[236px_minmax(0,1fr)]">
      <div className="hidden lg:block">{classPanel}</div>

      {drawer && createPortal(
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="My classes">
          <div className="absolute inset-0 bg-[#002D24]/35" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[300px] max-w-[86vw] overflow-y-auto rounded-r-3xl bg-white shadow-xl">
            <button type="button" onClick={() => setDrawer(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-[#4B5563] hover:bg-[#F3F6F3]" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            {classPanel}
          </div>
        </div>,
        document.body,
      )}

      <main className="min-w-0 rounded-3xl border border-[#F0F2F1] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="px-4 pb-4 pt-5 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">
                Planner · {halfTerm?.name} · {academicYear.replace('-', '–')}
              </p>
              <h1 className="mt-1 text-[26px] font-semibold leading-tight text-[#002D24] sm:text-[28px]" style={{ fontFamily: SERIF }}>
                {heading}
              </h1>
              {focus !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFocus('all')}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#002D24]/20 bg-[rgba(182,255,126,0.35)] px-2.5 py-0.5 text-xs font-semibold text-[#002D24]"
                >
                  Showing {classById.get(focus)?.name} only <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 rounded-xl border border-[#E5EDE8] bg-[#E8F0EA]/80 p-1 md:flex-none" role="tablist" aria-label="Planner view">
                {PLANNER_VIEWS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={view === v.id}
                    onClick={() => changeView(v.id)}
                    className={`min-h-[38px] flex-1 rounded-lg px-2 text-[13.5px] font-medium sm:px-3.5 md:flex-none ${
                      view === v.id ? 'bg-[#002D24] text-white shadow-sm' : 'text-[#374151] hover:bg-white/70'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onAdd(view === 'day' ? anchor : startOfDay(new Date()))}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#B6FF7E] text-sm font-semibold text-[#002D24] sm:w-auto sm:px-4"
                aria-label="Schedule a lesson"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDrawer(true)} className={`${toolBtn} lg:hidden`}>
              <Users className="h-4 w-4" /> Classes
            </button>
            {view !== 'classic' && view !== 'term' && (
              <>
                <button type="button" className={navBtn} onClick={() => step(-1)} aria-label="Previous">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" className={toolBtn} onClick={() => setAnchor(startOfDay(new Date()))}>
                  Today
                </button>
                <button type="button" className={navBtn} onClick={() => step(1)} aria-label="Next">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="order-first w-full px-0.5 text-[17px] font-semibold text-[#002D24] sm:order-none sm:w-auto sm:px-1.5 sm:text-base">
                  {dateLabel}
                </span>
              </>
            )}
            <div className="ml-auto flex gap-2">
              {view === 'week' && (
                <button type="button" className={`${toolBtn} hidden sm:inline-flex`} onClick={() => printWeek(data, anchor, visibleIds)} aria-label="Print this week">
                  <Printer className="h-4 w-4" /> <span>Print week</span>
                </button>
              )}
              {view !== 'classic' && (
                <button type="button" className={toolBtn} onClick={() => changeView('classic')} aria-label="Timetable and classic calendar">
                  <CalendarCog className="h-4 w-4" /> <span className="hidden sm:inline">Timetable</span>
                </button>
              )}
            </div>
          </div>

          {weekStats && (
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#4B5563]">
              <span><b className="text-[#002D24]">{weekStats.sessions}</b> {weekStats.sessions === 1 ? 'session' : 'sessions'}</span>
              <span><b className="text-[#002D24]">{weekStats.planned}</b> {weekStats.planned === 1 ? 'lesson' : 'lessons'} planned</span>
              <span><b className="text-[#002D24]">{weekStats.taught}</b> taught</span>
              {weekStats.empty > 0 && <span><b className="text-[#8A5300]">{weekStats.empty}</b> empty {weekStats.empty === 1 ? 'slot' : 'slots'}</span>}
              {data.loadingPlans && <span className="text-[#0D9488]">Updating…</span>}
            </p>
          )}
        </div>

        <div className="px-3 pb-5 sm:px-5">
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
                setAnchor(d);
                changeView('day');
              }}
            />
          )}
          {view === 'units' && (
            <>
              <ClassSelect data={data} value={focusedClassId} onChange={setFocus} />
              <UnitsView
                data={data}
                classId={focusedClassId}
                academicYear={academicYear}
                onOpenTimetable={() => changeView('classic')}
                onChangeYear={(y) => setAnchor(new Date(Number(y.split('-')[0]), 9, 1))}
              />
            </>
          )}
          {view === 'term' && (
            <>
              <ClassSelect data={data} value={focusedClassId} onChange={setFocus} />
              {focusedClassId === currentSheetInfo.sheet ? renderTerm() : <p className="py-10 text-center text-sm text-[#4B5563]">Loading…</p>}
            </>
          )}
          {view === 'classic' && (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-[#F1F6F2] px-4 py-3 text-[13px] text-[#374151]">
                Edit {classById.get(focusedClassId)?.name || 'this class'}’s regular timetable, holidays and events here. Changes show in Day, Week and Month.
                <button type="button" onClick={() => changeView('week')} className="ml-auto min-h-[36px] rounded-xl bg-[#002D24] px-3 font-semibold text-white">
                  Back to Planner
                </button>
              </div>
              <ClassSelect data={data} value={focusedClassId} onChange={setFocus} />
              {focusedClassId === currentSheetInfo.sheet ? renderClassic() : <p className="py-10 text-center text-sm text-[#4B5563]">Loading…</p>}
            </>
          )}
        </div>
      </main>

      {sheet?.kind === 'details' && sheet.entry.plan && (
        <LessonDetailsSheet
          entry={{ ...sheet.entry, plan: data.plans.find((p) => p.id === sheet.entry.plan!.id) || sheet.entry.plan }}
          data={data}
          onClose={() => setSheet(null)}
          onOpenLibrary={openLibrary}
        />
      )}
      {sheet?.kind === 'pick' && (
        <SchedulePickerSheet initial={sheet} data={data} onClose={() => setSheet(null)} />
      )}
      {organise && <OrganiseClasses data={data} onClose={() => setOrganise(false)} />}
    </div>
  );
}

/* ---------------- Class panel ---------------- */

function ClassPanel({
  data,
  focus,
  onFocus,
  onOrganise,
  onTimetable,
}: {
  data: PlannerData;
  focus: string;
  onFocus: (id: string) => void;
  onOrganise: () => void;
  onTimetable: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleHidden = (id: string) => {
    const hidden = new Set(data.prefs.hiddenClasses);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    data.updatePrefs({ hiddenClasses: [...hidden] });
  };
  return (
    <nav aria-label="My classes" className="rounded-3xl border border-[#F0F2F1] bg-white px-3.5 pb-3.5 pt-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] lg:sticky lg:top-20">
      <h2 className="mx-1.5 mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4B5563]">My classes</h2>
      <button
        type="button"
        onClick={() => onFocus('all')}
        className={`mb-1 flex min-h-[40px] w-full items-center gap-2 rounded-lg px-2 text-left text-[13.5px] ${
          focus === 'all' ? 'bg-[#F1F6F2] font-semibold text-[#002D24]' : 'text-[#374151] hover:bg-[#F7FAF8]'
        }`}
      >
        <Users className="h-4 w-4" /> All classes
        <span className="ml-auto text-xs font-medium text-[#4B5563]">{data.classes.filter((c) => !c.hidden).length}</span>
      </button>
      {data.folders.map((f) => {
        const open = !collapsed.has(f.id);
        return (
          <div key={f.id} className="mb-1">
            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(f.id)) next.delete(f.id);
                  else next.add(f.id);
                  return next;
                })
              }
              aria-expanded={open}
              className="flex min-h-[36px] w-full items-center gap-1.5 rounded-lg px-2 text-left text-[13px] font-semibold text-[#1F2937] hover:bg-[#F7FAF8]"
            >
              {open ? <ChevronDown className="h-3.5 w-3.5 text-[#4B5563]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#4B5563]" />}
              <Folder className="h-3.5 w-3.5 text-[#4B5563]" />
              <span className="truncate">{f.name}</span>
              <span className="ml-auto text-xs font-medium text-[#4B5563]">{f.classes.length}</span>
            </button>
            {open &&
              f.classes.map((c) => (
                <div key={c.id} className="group flex items-center">
                  <button
                    type="button"
                    onClick={() => onFocus(c.id)}
                    className={`flex min-h-[38px] min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1.5 pl-6 pr-2 text-left text-[13.5px] ${
                      focus === c.id ? 'bg-[#F1F6F2] font-semibold text-[#002D24]' : c.hidden ? 'text-[#9CA3AF]' : 'text-[#374151] hover:bg-[#F7FAF8]'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHidden(c.id)}
                    className="rounded-md p-1.5 text-[#9CA3AF] hover:text-[#374151]"
                    aria-label={c.hidden ? `Show ${c.name} in the Planner` : `Hide ${c.name} from the Planner`}
                    title={c.hidden ? 'Hidden — click to show' : 'Hide from Planner'}
                  >
                    {c.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 opacity-60 lg:opacity-0 lg:group-hover:opacity-100" />}
                  </button>
                </div>
              ))}
          </div>
        );
      })}
      {data.classes.length === 0 && (
        <p className="px-2 py-3 text-[13px] text-[#4B5563]">Add your classes in Settings → Year groups.</p>
      )}
      <div className="mt-2 space-y-0.5 border-t border-[#E5EDE8] pt-2">
        <button type="button" onClick={onOrganise} className="flex min-h-[38px] w-full items-center gap-2 rounded-lg px-2 text-[13px] text-[#4B5563] hover:bg-[#F7FAF8]">
          <Palette className="h-4 w-4" /> Class colours &amp; visibility
        </button>
        <button type="button" onClick={onTimetable} className="flex min-h-[38px] w-full items-center gap-2 rounded-lg px-2 text-[13px] text-[#4B5563] hover:bg-[#F7FAF8]">
          <CalendarCog className="h-4 w-4" /> Timetable &amp; events
        </button>
      </div>
    </nav>
  );
}

function ClassSelect({ data, value, onChange }: { data: PlannerData; value: string; onChange: (id: string) => void }) {
  return (
    <label className="mb-4 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[#374151]">
      Class
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[40px] rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#1F2937]"
      >
        {data.folders.map((f) => (
          <optgroup key={f.id} label={f.name}>
            {f.classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

/* ---------------- Colours and visibility ---------------- */

function OrganiseClasses({ data, onClose }: { data: PlannerData; onClose: () => void }) {
  const setColor = (id: string, color: string) => data.updatePrefs({ classColors: { ...data.prefs.classColors, [id]: color } });
  const toggle = (id: string) => {
    const hidden = new Set(data.prefs.hiddenClasses);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    data.updatePrefs({ hiddenClasses: [...hidden] });
  };
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Class colours and visibility">
      <div className="absolute inset-0 bg-[#002D24]/35" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold text-[#002D24]" style={{ fontFamily: SERIF }}>Class colours &amp; visibility</h2>
            <p className="mt-1 text-[13px] text-[#4B5563]">
              Colours and hiding only change how the Planner looks. Folders and class names come from Settings → Year groups.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#4B5563] hover:bg-[#F3F6F3]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {data.folders.map((f) => (
          <section key={f.id} className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.06em] text-[#4B5563]">{f.name}</h3>
            <ul className="divide-y divide-[#EEF2EF] rounded-2xl border border-[#E5EDE8]">
              {f.classes.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="rounded-md px-2 py-0.5 text-[13px] font-bold" style={{ color: readableInk(c.color), background: `${c.color}22` }}>
                      {c.name}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {CLASS_PALETTE.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColor(c.id, col)}
                        aria-label={`Use colour ${col} for ${c.name}`}
                        className={`h-7 w-7 rounded-lg border-2 ${c.color === col ? 'border-[#002D24] shadow-[inset_0_0_0_2px_#fff]' : 'border-transparent'}`}
                        style={{ background: col }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="ml-1 inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[#E5E7EB] px-2 text-xs font-medium text-[#374151]"
                    >
                      {c.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {c.hidden ? 'Hidden' : 'Shown'}
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <button type="button" onClick={onClose} className="mt-5 min-h-[44px] w-full rounded-xl bg-[#002D24] text-sm font-semibold text-white">
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Weekly overview print ---------------- */

function printWeek(data: PlannerData, anchor: Date, visibleIds: Set<string>) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const mon = startOfWeek(anchor);
  const cols = Array.from({ length: 5 }, (_, i) => {
    const d = addDays(mon, i);
    const items = buildDayEntries(d, visibleIds, data.plans, data.slots)
      .filter((e) => e.plan)
      .map((e) => {
        const c = data.classById.get(e.classId);
        const color = c?.color || '#475569';
        return `<div class="l" style="border-color:${color}"><div class="a" style="color:${readableInk(color)}">${esc(e.time || '')} · ${esc(c?.name || e.classId)}</div><div class="b">${esc(lessonTitle(e.plan, data.lessonCache[e.classId]))}</div></div>`;
      })
      .join('');
    return `<div><div class="d">${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</div>${items || '<div class="n">—</div>'}</div>`;
  }).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Week of ${mon.toLocaleDateString('en-GB')}</title>
<style>@page{size:A4 landscape;margin:12mm}body{font-family:Inter,system-ui,sans-serif;color:#1F2937;margin:0}
h1{font-family:"Playfair Display",Georgia,serif;color:#002D24;font-size:22px;margin:0 0 2px}small{color:#4B5563}
.g{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:12px;border-top:2px solid #002D24;padding-top:10px}
.d{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#4B5563;border-bottom:1px solid #E5E7EB;padding-bottom:4px}
.l{border-left:3px solid;padding:3px 0 3px 7px;margin-top:8px;break-inside:avoid}.a{font-size:10.5px;font-weight:700}.b{font-size:12px;font-weight:600}
.n{color:#9CA3AF;margin-top:8px}</style></head><body>
<h1>Week of ${mon.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h1>
<small>Weekly overview · private reflections are not included</small><div class="g">${cols}</div></body></html>`;
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
  }, 250);
}
