import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Save, Trash2, MapPin, Settings, ChevronDown, ChevronRight, Copy, CopyPlus, Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';
import { useDrop, useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDropZoneStyle, useDropFlash } from './dnd';
import { supabase, TABLES, isSupabaseConfigured } from '../config/supabase';
import { ColorPickerWithFavorites } from './ColorPickerWithFavorites';
import {
  TERM_IDS as SHARED_TERM_IDS,
  loadTeacherTimetable,
  migrateLegacyTimetablesToTeacher,
  saveTeacherTimetable,
  teacherGlobalFlagKey,
  teacherTermKey,
  teacherTimeConfigKey,
  type TimetableEntry,
} from '../utils/timetableStorage';

interface TimetableClass {
  id: string;
  day: number; // 0-6 for Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  className: string; // Year group name or club name
  location: string;
  color: string;
  type: 'curriculum' | 'non-curriculum' | 'club'; // Type of class
  yearGroupId?: string; // If linked to a year group
  recurringUnitId?: string;
}

interface TimetableBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated Teacher-level timetable — kept optional for callers/theme fallback only. */
  className?: string;
  onTimetableUpdate?: (classes: TimetableClass[]) => void;
  initialEditClass?: TimetableClass | null; // Optional class to edit when opening
  /** When true, render as the Timetable builder room canvas (no modal over a calendar). */
  embedded?: boolean;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCHOOL_DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Terms in order (for "previous term" and "same for year")
const TERM_IDS = SHARED_TERM_IDS;
const TERM_LABELS: Record<string, string> = {
  A1: 'Autumn 1',
  A2: 'Autumn 2',
  SP1: 'Spring 1',
  SP2: 'Spring 2',
  SM1: 'Summer 1',
  SM2: 'Summer 2'
};

const DRAG_TYPE_TIMETABLE_BLOCK = 'timetable-block';

const PX_PER_MINUTE = 1.15;
const MIN_SLOT_HEIGHT_PX = 36;

const DEFAULT_DAY_START = '8:00';
const DEFAULT_DAY_END = '16:00';
const DEFAULT_SLOT_INTERVAL = 30; // minutes; 5, 15, 30, 60 supported — 30 is the calm default

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(s => parseInt(s, 10) || 0);
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

function generateSlotStartTimes(dayStart: string, dayEnd: string, intervalMinutes: number): string[] {
  const startM = parseTimeToMinutes(dayStart);
  const endM = parseTimeToMinutes(dayEnd);
  const out: string[] = [];
  for (let m = startM; m < endM; m += intervalMinutes) {
    out.push(formatMinutesToTime(m));
  }
  return out;
}

function snapMinutesToInterval(totalMinutes: number, intervalMinutes: number): number {
  return Math.round(totalMinutes / intervalMinutes) * intervalMinutes;
}

/** Map a viewport Y coordinate to the slot start time for that grid row. */
function dropClientYToSlotTime(
  dropClientY: number,
  columnEl: HTMLElement,
  slotHeightPx: number,
  slotStartTimes: string[],
): string {
  const y = dropClientY - columnEl.getBoundingClientRect().top;
  const slotIndex = Math.floor(y / slotHeightPx);
  const clampedIndex = Math.max(0, Math.min(slotStartTimes.length - 1, slotIndex));
  return slotStartTimes[clampedIndex];
}

function applyResizeEndTime(
  classes: TimetableClass[],
  classId: string,
  newEndTime: string,
  slotInterval: number,
  dayEndMinutes: number,
  timeToMinutesFn: (time: string) => number
): TimetableClass[] | null {
  const cls = classes.find(c => c.id === classId);
  if (!cls) return null;
  const startMin = timeToMinutesFn(cls.startTime);
  let endMin = snapMinutesToInterval(timeToMinutesFn(newEndTime), slotInterval);
  endMin = Math.max(startMin + slotInterval, Math.min(dayEndMinutes, endMin));
  if (endMin <= startMin) return null;
  const endTime = formatMinutesToTime(endMin);
  return classes.map(c => (c.id === classId ? { ...c, endTime } : c));
}

export function TimetableBuilder({
  isOpen,
  onClose,
  className,
  onTimetableUpdate,
  initialEditClass,
  embedded = false,
}: TimetableBuilderProps) {
  const { customYearGroups, getThemeForClass, yearGroupSections } = useSettings();

  const myClasses = useMemo(
    () =>
      customYearGroups.map((g) => ({
        id: g.id,
        name: g.name,
        color: g.color || getThemeForClass(g.id).primary,
      })),
    [customYearGroups, getThemeForClass],
  );

  const [selectedTermId, setSelectedTermId] = useState<string>('A1');
  const [timetableClasses, setTimetableClasses] = useState<TimetableClass[]>([]);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(initialEditClass || null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'days'>('days');
  const [showRotationLabel, setShowRotationLabel] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const gridViewportRef = useRef<HTMLDivElement>(null);
  const [gridViewportH, setGridViewportH] = useState(0);
  const [classSearch, setClassSearch] = useState('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState<Set<string>>(() => new Set());

  const getStorageKey = (termId: string) => teacherTermKey(termId);
  const globalFlagKey = () => teacherGlobalFlagKey();

  const timeConfigKey = (key: string) => teacherTimeConfigKey(key);
  const [dayStart, setDayStart] = useState<string>(() => {
    try { return localStorage.getItem(timeConfigKey('dayStart')) || DEFAULT_DAY_START; } catch { return DEFAULT_DAY_START; }
  });
  const [dayEnd, setDayEnd] = useState<string>(() => {
    try { return localStorage.getItem(timeConfigKey('dayEnd')) || DEFAULT_DAY_END; } catch { return DEFAULT_DAY_END; }
  });
  const [slotInterval, setSlotInterval] = useState<number>(() => {
    try {
      const v = localStorage.getItem(timeConfigKey('slotInterval'));
      const n = v ? parseInt(v, 10) : DEFAULT_SLOT_INTERVAL;
      return [5, 15, 30, 60].includes(n) ? n : DEFAULT_SLOT_INTERVAL;
    } catch { return DEFAULT_SLOT_INTERVAL; }
  });

  const classesByKeyStage = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    const match = (name: string) => !q || name.toLowerCase().includes(q);
    const sections = [...yearGroupSections].sort((a, b) => a.sortOrder - b.sortOrder);
    const grouped = sections
      .map((section) => ({
        id: section.id,
        label: section.label,
        classes: (section.yearGroupIds || [])
          .map((id) => myClasses.find((g) => g.id === id || g.name === id))
          .filter((g): g is (typeof myClasses)[number] => Boolean(g) && match(g.name)),
      }))
      .filter((s) => s.classes.length > 0);
    const assigned = new Set(grouped.flatMap((s) => s.classes.map((c) => c.id)));
    const other = myClasses.filter((g) => !assigned.has(g.id) && match(g.name));
    if (other.length) grouped.push({ id: 'other', label: 'Other classes', classes: other });
    return grouped;
  }, [yearGroupSections, myClasses, classSearch]);

  // Expand every key stage on first load so a long My classes list is
  // immediately scrollable; each section remains individually collapsible.
  useEffect(() => {
    if (sectionsExpanded.size > 0) return;
    if (classesByKeyStage.length === 0) return;
    setSectionsExpanded(new Set(classesByKeyStage.map((s) => s.id)));
  }, [classesByKeyStage, sectionsExpanded.size]);

  const toggleSection = (id: string) => {
    setSectionsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const persistTimeConfig = (key: string, value: string) => {
    try { localStorage.setItem(timeConfigKey(key), value); } catch { /* ignore */ }
  };

  const themeFallbackClass = className || myClasses[0]?.id || 'LKG';

  const dayStartMinutes = parseTimeToMinutes(dayStart);
  const dayEndMinutes = parseTimeToMinutes(dayEnd);
  const slotStartTimes = useMemo(
    () => generateSlotStartTimes(dayStart, dayEnd, slotInterval),
    [dayStart, dayEnd, slotInterval]
  );
  const slotDurationMinutes = slotInterval;

  const [isGlobalTimetable, setIsGlobalTimetable] = useState<boolean>(() => {
    try {
      return localStorage.getItem(globalFlagKey()) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const el = gridViewportRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      setGridViewportH(h);
    });
    ro.observe(el);
    setGridViewportH(el.clientHeight);
    return () => ro.disconnect();
  }, [isOpen, embedded]);

  // Fit the school day into the available page height when possible —
  // full-page feel instead of a tall sparse scroll.
  const fittedSlotH =
    gridViewportH > 0 && slotStartTimes.length > 0
      ? gridViewportH / slotStartTimes.length
      : slotDurationMinutes * PX_PER_MINUTE;
  const slotHeightPx = Math.max(MIN_SLOT_HEIGHT_PX, fittedSlotH);
  const effectivePxPerMinute = slotHeightPx / slotDurationMinutes;
  const gridHeightPx = slotStartTimes.length * slotHeightPx;

  const loadTimetable = React.useCallback(async (termId: string) => {
    try {
      migrateLegacyTimetablesToTeacher(myClasses);
      const classes = loadTeacherTimetable(termId) as TimetableClass[];
      setTimetableClasses(classes);
    } catch (error) {
      console.error('Error loading timetable:', error);
      setTimetableClasses([]);
    }
  }, [myClasses]);

  useEffect(() => {
    if (!isOpen) return;
    migrateLegacyTimetablesToTeacher(myClasses);
    loadTimetable(selectedTermId);
    if (initialEditClass) setEditingClass(initialEditClass);
    else setEditingClass(null);
  }, [isOpen, selectedTermId, initialEditClass, loadTimetable, myClasses]);

  useEffect(() => {
    const flag = localStorage.getItem(globalFlagKey()) === 'true';
    setIsGlobalTimetable(flag);
  }, [isOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [settingsOpen]);

  const saveTimetable = async (classes: TimetableClass[], termId?: string) => {
    const useGlobal = localStorage.getItem(globalFlagKey()) === 'true';
    const term = termId ?? selectedTermId;
    setIsSaving(true);
    try {
      saveTeacherTimetable(classes as TimetableEntry[], {
        termId: term,
        useGlobal,
        classes: myClasses,
      });
      if (termId === undefined) {
        setTimetableClasses(classes);
      }
      if (onTimetableUpdate) {
        onTimetableUpdate(classes);
      }
      try {
        window.dispatchEvent(new CustomEvent('ccd:timetable-updated'));
      } catch {
        /* ignore */
      }
      // Best-effort cloud mirror keyed by teacher scope (not a single class)
      if (isSupabaseConfigured()) {
        const scope = 'teacher';
        await supabase
          .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
          .delete()
          .eq('class_name', scope);
        if (classes.length > 0) {
          const insertData = classes.map(cls => ({
            class_name: scope,
            day: cls.day,
            start_time: cls.startTime,
            end_time: cls.endTime,
            class_name_display: cls.className,
            location: cls.location || '',
            color: cls.color,
            type: cls.type || 'curriculum',
            year_group_id: cls.yearGroupId || null,
            recurring_unit_id: cls.recurringUnitId || null
          }));
          await supabase
            .from(TABLES.TIMETABLE_CLASSES || 'timetable_classes')
            .insert(insertData);
        }
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyFromPreviousTerm = () => {
    if (isGlobalTimetable) {
      alert('Turn off "Same timetable for all terms" first to copy from a specific term.');
      return;
    }
    const idx = TERM_IDS.indexOf(selectedTermId as any);
    if (idx <= 0) {
      alert('There is no previous term. Autumn 1 is the first term.');
      return;
    }
    const prevTermId = TERM_IDS[idx - 1];
    const saved = localStorage.getItem(getStorageKey(prevTermId));
    if (!saved) {
      alert(`No timetable saved for ${TERM_LABELS[prevTermId]}. Set that term first or add classes here.`);
      return;
    }
    const classes = JSON.parse(saved);
    const withNewIds = classes.map((c: TimetableClass) => ({ ...c, id: `class-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
    saveTimetable(withNewIds).then(() => {
      setTimetableClasses(withNewIds);
      if (onTimetableUpdate) onTimetableUpdate(withNewIds);
    });
  };

  const setSameForWholeYear = () => {
    const classes = timetableClasses.length
      ? timetableClasses.map(c => ({ ...c, id: `class-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
      : [];
    if (classes.length === 0) {
      alert('Add or copy a timetable first, then use "Same timetable for all terms".');
      return;
    }
    localStorage.setItem(globalFlagKey(), 'true');
    saveTeacherTimetable(classes as TimetableEntry[], {
      termId: selectedTermId,
      useGlobal: true,
      classes: myClasses,
    });
    setIsGlobalTimetable(true);
    setTimetableClasses(classes);
    if (onTimetableUpdate) onTimetableUpdate(classes);
    alert('Timetable is now used for all terms. Changing the semester will not change the grid; edits apply to the whole year. Turn off "Same timetable for all terms" to edit per term again.');
  };

  const setPerTermTimetable = () => {
    const current = timetableClasses.map(c => ({ ...c, id: `class-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
    localStorage.setItem(globalFlagKey(), 'false');
    setIsGlobalTimetable(false);
    saveTeacherTimetable(current as TimetableEntry[], {
      termId: selectedTermId,
      useGlobal: false,
      classes: myClasses,
    });
    loadTimetable(selectedTermId);
    alert('Each term now has its own timetable. Change the semester to see or edit that term\'s timetable.');
  };

  const handleAddYearGroup = (day: number, timeSlot: string, yearGroup: any) => {
    const startM = parseTimeToMinutes(timeSlot);
    const endM = Math.min(dayEndMinutes, startM + slotDurationMinutes);
    const newClass: TimetableClass = {
      id: `class-${Date.now()}`,
      day,
      startTime: timeSlot,
      endTime: formatMinutesToTime(endM),
      className: yearGroup.name,
      location: '',
      color: yearGroup.color || getThemeForClass(yearGroup.id || themeFallbackClass).primary,
      type: 'curriculum',
      yearGroupId: yearGroup.id
    };
    
    saveTimetable([...timetableClasses, newClass]);
  };

  const handleAddNonCurriculum = (day: number, timeSlot: string) => {
    const name = prompt('Enter name for non-curriculum time (e.g., Break, Lunch, Club):');
    if (!name) return;
    const startM = parseTimeToMinutes(timeSlot);
    const endM = Math.min(dayEndMinutes, startM + slotDurationMinutes);
    const newClass: TimetableClass = {
      id: `class-${Date.now()}`,
      day,
      startTime: timeSlot,
      endTime: formatMinutesToTime(endM),
      className: name,
      location: '',
      color: '#9CA3AF', // Gray for non-curriculum
      type: name.toLowerCase().includes('club') ? 'club' : 'non-curriculum'
    };
    
    saveTimetable([...timetableClasses, newClass]);
  };

  const handleDeleteClass = (classId: string) => {
    // Instant remove — the builder X control is an undoable canvas action,
    // not a destructive account operation. (A confirm() also breaks automated DnD tests.)
    saveTimetable(timetableClasses.filter((c) => c.id !== classId));
    if (editingClass?.id === classId) {
      setEditingClass(null);
    }
  };

  const handleUpdateClass = (updatedClass: TimetableClass) => {
    saveTimetable(timetableClasses.map(c => c.id === updatedClass.id ? updatedClass : c));
    setEditingClass(null);
  };

  // Get all classes for a day (for continuous time column)
  const getClassesForDay = (day: number) => {
    return timetableClasses.filter(cls => cls.day === day);
  };

  // Parse time string to total minutes from midnight
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Update class end time while dragging (preview) or on release (persist)
  const handleResizeClass = (classId: string, newEndTime: string, commit = false) => {
    setTimetableClasses(prev => {
      const updated = applyResizeEndTime(prev, classId, newEndTime, slotInterval, dayEndMinutes, timeToMinutes);
      if (!updated) return prev;
      if (commit) {
        void saveTimetable(updated);
      }
      return updated;
    });
  };

  // Move a class to a new day and/or new start time (drag-and-drop)
  const handleMoveClass = (classId: string, newDay: number, newStartTime: string) => {
    const cls = timetableClasses.find(c => c.id === classId);
    if (!cls) return;
    const durationMin = timeToMinutes(cls.endTime) - timeToMinutes(cls.startTime);
    const snappedStartMin = snapMinutesToInterval(timeToMinutes(newStartTime), slotInterval);
    const clampedStartMin = Math.max(
      dayStartMinutes,
      Math.min(dayEndMinutes - slotInterval, snappedStartMin)
    );
    const newEndMin = Math.min(
      dayEndMinutes,
      clampedStartMin + Math.max(slotInterval, durationMin)
    );
    const snappedStartTime = minutesToTime(clampedStartMin);
    const newEndTime = minutesToTime(newEndMin);
    const updated = timetableClasses.map(c =>
      c.id === classId
        ? { ...c, day: newDay, startTime: snappedStartTime, endTime: newEndTime }
        : c
    );
    setTimetableClasses(updated);
    void saveTimetable(updated);
  };

  // Get days to display based on view mode
  const displayDayIndices = viewMode === 'days'
    ? [1, 2, 3, 4, 5] // Monday-Friday
    : [0, 1, 2, 3, 4, 5, 6]; // All days

  if (!isOpen) return null;

  const dayHeaders = viewMode === 'days' ? SCHOOL_DAY_SHORT : DAY_SHORT_NAMES;
  const termHint = isGlobalTimetable ? 'All terms' : TERM_LABELS[selectedTermId];

  const settingsPopover = (
    <div
      ref={settingsRef}
      className="absolute right-0 top-full z-40 mt-2 w-[300px] rounded-2xl border border-[#E2E0EF] bg-white p-4 shadow-[0_16px_40px_rgba(31,27,77,0.12)]"
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#77738F]">Term</p>
      <select
        value={selectedTermId}
        onChange={(e) => setSelectedTermId(e.target.value)}
        disabled={isGlobalTimetable}
        className="mt-1.5 w-full rounded-xl border border-[#E2E0EF] bg-[#F4F3FA] px-3 py-2 text-[13px] font-semibold text-[#1F1B4D] disabled:opacity-60"
      >
        {TERM_IDS.map((id) => (
          <option key={id} value={id}>{TERM_LABELS[id]}</option>
        ))}
      </select>
      <label className="mt-3 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={isGlobalTimetable}
          onChange={(e) => {
            if (e.target.checked) setSameForWholeYear();
            else setPerTermTimetable();
          }}
          className="mt-0.5 rounded border-gray-300 text-[#4338E8] focus:ring-[#4338E8]"
        />
        <span className="text-[13px] font-medium text-[#1F1B4D]">Same timetable for all terms</span>
      </label>
      {!isGlobalTimetable && (
        <div className="mt-2 space-y-1.5">
          <button
            type="button"
            onClick={copyFromPreviousTerm}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-[#E9E6FF] px-3 py-2 text-[12px] font-semibold text-[#4338E8] hover:bg-[#E2E0EF]"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy from previous term
          </button>
          <button
            type="button"
            onClick={setSameForWholeYear}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E2E0EF] bg-white px-3 py-2 text-[12px] font-semibold text-[#1F1B4D] hover:bg-[#F4F3FA]"
          >
            <CopyPlus className="h-3.5 w-3.5" />
            Apply to whole year
          </button>
        </div>
      )}
      <div className="my-3 border-t border-[#E2E0EF]" />
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#77738F]">Grid</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] font-medium text-[#77738F]">Day start</span>
          <input
            type="time"
            value={normalizeTimeForInput(dayStart)}
            onChange={(e) => {
              const v = e.target.value;
              setDayStart(v);
              persistTimeConfig('dayStart', v);
            }}
            className="mt-0.5 w-full rounded-xl border border-[#E2E0EF] px-2 py-1.5 text-[13px]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-[#77738F]">Day end</span>
          <input
            type="time"
            value={normalizeTimeForInput(dayEnd)}
            onChange={(e) => {
              const v = e.target.value;
              setDayEnd(v);
              persistTimeConfig('dayEnd', v);
            }}
            className="mt-0.5 w-full rounded-xl border border-[#E2E0EF] px-2 py-1.5 text-[13px]"
          />
        </label>
      </div>
      <label className="mt-2 block">
        <span className="text-[11px] font-medium text-[#77738F]">Slot interval</span>
        <select
          value={slotInterval}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setSlotInterval(n);
            persistTimeConfig('slotInterval', String(n));
          }}
          className="mt-0.5 w-full rounded-xl border border-[#E2E0EF] px-2 py-1.5 text-[13px] font-semibold text-[#1F1B4D]"
        >
          <option value={5}>5 min</option>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={60}>60 min</option>
        </select>
      </label>
      <label className="mt-3 flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={showRotationLabel}
          onChange={(e) => setShowRotationLabel(e.target.checked)}
          className="rounded border-gray-300 text-[#4338E8] focus:ring-[#4338E8]"
        />
        <span className="text-[13px] font-medium text-[#1F1B4D]">Show rotation label</span>
      </label>
      <button
        type="button"
        onClick={() => setViewMode(viewMode === 'days' ? 'week' : 'days')}
        className="mt-2 w-full rounded-xl border border-[#E2E0EF] px-3 py-2 text-[12px] font-semibold text-[#77738F] hover:bg-[#F4F3FA]"
      >
        {viewMode === 'days' ? 'Show weekend days' : 'School days only (Mon–Fri)'}
      </button>
    </div>
  );

  const openBreakClub = () => {
    if (selectedSlot) handleAddNonCurriculum(selectedSlot.day, selectedSlot.time);
    else {
      setEditingClass({
        id: `new-${Date.now()}`,
        day: 1,
        startTime: dayStart,
        endTime: formatMinutesToTime(parseTimeToMinutes(dayStart) + slotInterval),
        className: '',
        location: '',
        color: '#9CA3AF',
        type: 'non-curriculum',
      });
    }
  };

  const page = (
    <div className={`ss-timetable-page ${panelCollapsed ? 'is-panel-collapsed' : ''}`}>
      <div className="ss-timetable-topbar">
        <div className="ss-timetable-topbar-left">
          <button
            type="button"
            className="ss-timetable-icon-btn"
            onClick={() => setPanelCollapsed((c) => !c)}
            aria-pressed={panelCollapsed}
            aria-label={panelCollapsed ? 'Show class panel' : 'Hide class panel'}
            title={panelCollapsed ? 'Show classes' : 'Hide classes'}
          >
            {panelCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <span className="ss-timetable-term">{termHint}</span>
          <span className="ss-timetable-hint">Drag a class onto the week</span>
        </div>
        <div className="ss-timetable-actions relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="ss-timetable-icon-btn"
            aria-expanded={settingsOpen}
            aria-label="Timetable settings"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          {settingsOpen && settingsPopover}
          <button
            type="button"
            onClick={() => saveTimetable(timetableClasses)}
            disabled={isSaving}
            className="ss-timetable-save"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          {!embedded && (
            <button type="button" onClick={onClose} className="ss-timetable-icon-btn" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="ss-timetable-body">
        <aside className="ss-timetable-rail" aria-label="My classes">
          {!panelCollapsed && (
            <>
              <div className="ss-timetable-rail-head">
                <p className="ss-timetable-kicker">My classes</p>
                <div className="ss-timetable-search">
                  <Search className="h-3.5 w-3.5 text-[#77738F]" aria-hidden />
                  <input
                    type="search"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    placeholder="Search classes"
                    aria-label="Search classes"
                  />
                </div>
              </div>
              <div className="ss-timetable-rail-scroll">
                {myClasses.length === 0 ? (
                  <p className="ss-timetable-empty-hint">Add classes in Settings → My classes.</p>
                ) : classesByKeyStage.length === 0 ? (
                  <p className="ss-timetable-empty-hint">No classes match “{classSearch}”.</p>
                ) : (
                  classesByKeyStage.map((section) => {
                    const open = sectionsExpanded.has(section.id);
                    return (
                      <div key={section.id} className="ss-timetable-section">
                        <button
                          type="button"
                          className="ss-timetable-section-btn"
                          onClick={() => toggleSection(section.id)}
                          aria-expanded={open}
                        >
                          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          <span>{section.label}</span>
                          <span className="ss-timetable-section-count">{section.classes.length}</span>
                        </button>
                        {open && (
                          <div className="ss-timetable-section-list">
                            {section.classes.map((yg) => (
                              <DraggableYearGroup key={yg.id} yearGroup={yg} chip />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="ss-timetable-rail-foot">
                <button type="button" className="ss-timetable-break" onClick={openBreakClub}>
                  <Plus className="h-3.5 w-3.5" />
                  Break / club
                </button>
              </div>
            </>
          )}
        </aside>

        <div className="ss-timetable-board">
          <div
            className="ss-timetable-dayhead"
            style={{ gridTemplateColumns: `52px repeat(${displayDayIndices.length}, minmax(0, 1fr))` }}
          >
            <div className="ss-timetable-corner">
              {showRotationLabel ? <span>Rot.</span> : null}
            </div>
            {displayDayIndices.map((dayIndex, index) => (
              <div key={dayIndex} className="ss-timetable-dow">
                {dayHeaders[index]}
              </div>
            ))}
          </div>

          <div ref={gridViewportRef} className="ss-timetable-grid-viewport">
            <div
              className="ss-timetable-grid"
              style={{
                gridTemplateColumns: `52px repeat(${displayDayIndices.length}, minmax(0, 1fr))`,
                height: gridHeightPx,
              }}
            >
              <div className="ss-timetable-ruler" style={{ height: gridHeightPx }}>
                {slotStartTimes.map((slotTime) => (
                  <div key={slotTime} className="ss-timetable-tick" style={{ height: slotHeightPx }}>
                    <span>{slotTime}</span>
                  </div>
                ))}
              </div>
              {displayDayIndices.map((dayIndex, index) => (
                <TimetableDayColumn
                  key={dayIndex}
                  day={dayIndex}
                  dayLabel={dayHeaders[index]}
                  classes={getClassesForDay(dayIndex)}
                  dayStartMinutes={dayStartMinutes}
                  dayEndMinutes={dayEndMinutes}
                  pxPerMinute={effectivePxPerMinute}
                  slotHeightPx={slotHeightPx}
                  gridHeightPx={gridHeightPx}
                  slotStartTimes={slotStartTimes}
                  slotDurationMinutes={slotDurationMinutes}
                  onAddYearGroup={(timeSlot) => (yearGroup: any) => handleAddYearGroup(dayIndex, timeSlot, yearGroup)}
                  onAddNonCurriculum={(timeSlot) => () => handleAddNonCurriculum(dayIndex, timeSlot)}
                  onEdit={(cls) => setEditingClass(cls)}
                  onDelete={handleDeleteClass}
                  onResize={handleResizeClass}
                  onMoveClass={handleMoveClass}
                  onSelectSlot={(timeSlot) => setSelectedSlot({ day: dayIndex, time: timeSlot })}
                  timeToMinutes={timeToMinutes}
                  minutesToTime={minutesToTime}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {editingClass && (
        <EditTimetableClassModal
          class={editingClass}
          onSave={handleUpdateClass}
          onClose={() => setEditingClass(null)}
          onDelete={() => (editingClass.id.startsWith('new-') ? setEditingClass(null) : handleDeleteClass(editingClass.id))}
          yearGroups={customYearGroups}
          theme={getThemeForClass(themeFallbackClass)}
          isNew={editingClass.id.startsWith('new-')}
        />
      )}
    </div>
  );


  // Full-page inside Studio shell when embedded; otherwise a workspace-covering layer
  // (never a small dialog perched on the classic calendar).
  if (embedded) return page;
  return (
    <div className="ss-timetable-overlay" role="dialog" aria-modal="true" aria-label="Timetable builder">
      {page}
    </div>
  );
}


// Format minutes from midnight as HH:MM
function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

// One grid slot row: drop target for adding a class at this time
function TimetableSlotRow({
  slotTime,
  heightPx,
  onDropYearGroup,
  onSelectSlot
}: {
  slotTime: string;
  heightPx: number;
  onDropYearGroup: (yearGroup: any) => void;
  onSelectSlot: () => void;
}) {
  const { flashClass, triggerFlash } = useDropFlash();
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'year-group',
    drop: (item: any) => {
      onDropYearGroup(item.yearGroup);
      triggerFlash();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    })
  }), [slotTime, onDropYearGroup]);

  const slotZoneClass = useDropZoneStyle({ isOver, canDrop, variant: 'cell' });

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      data-slot-row
      className={`flex cursor-pointer items-center justify-center border-b border-[#E2E0EF]/80 transition-colors ${
        isOver ? 'border-[#bcb7f4]' : 'hover:bg-[#F4F3FA]/80'
      } ${slotZoneClass} ${flashClass}`}
      style={{ height: heightPx }}
      onClick={(e) => { e.stopPropagation(); onSelectSlot(); }}
    >
      {isOver ? (
        <span className="text-xs font-medium text-[#4338E8]">Drop here</span>
      ) : canDrop ? (
        <span className="text-[10px] font-medium text-[#4338E8]/70" aria-hidden>Drop year group here</span>
      ) : (
        <span className="text-xs text-gray-300 opacity-0 hover:opacity-100" aria-hidden>+</span>
      )}
    </div>
  );
}

// Single day column: slot grid + overlay of class blocks
function TimetableDayColumn({
  day,
  dayLabel,
  classes,
  dayStartMinutes,
  dayEndMinutes,
  pxPerMinute,
  slotHeightPx,
  gridHeightPx,
  slotStartTimes,
  slotDurationMinutes,
  onAddYearGroup,
  onAddNonCurriculum,
  onEdit,
  onDelete,
  onResize,
  onMoveClass,
  onSelectSlot,
  timeToMinutes,
  minutesToTime
}: {
  day: number;
  dayLabel: string;
  classes: TimetableClass[];
  dayStartMinutes: number;
  dayEndMinutes: number;
  pxPerMinute: number;
  slotHeightPx: number;
  gridHeightPx: number;
  slotStartTimes: string[];
  slotDurationMinutes: number;
  onAddYearGroup: (timeSlot: string) => (yearGroup: any) => void;
  onAddNonCurriculum: (timeSlot: string) => () => void;
  onEdit: (cls: TimetableClass) => void;
  onDelete: (id: string) => void;
  onResize: (classId: string, newEndTime: string, commit?: boolean) => void;
  onMoveClass: (classId: string, newDay: number, newStartTime: string) => void;
  onSelectSlot: (timeSlot: string) => void;
  timeToMinutes: (time: string) => number;
  minutesToTime: (totalMinutes: number) => string;
}) {
  const [resizingId, setResizingId] = useState<string | null>(null);
  const columnRef = React.useRef<HTMLDivElement>(null);

  const [{ isOver, isDraggingBlock }, drop] = useDrop(() => ({
    accept: [DRAG_TYPE_TIMETABLE_BLOCK],
    drop: (item: any, monitor) => {
      if (item.type !== DRAG_TYPE_TIMETABLE_BLOCK || !item.class || !columnRef.current) return;
      const clientOffset = monitor.getClientOffset();
      const sourceOffset = monitor.getSourceClientOffset();
      const dropY = clientOffset?.y ?? sourceOffset?.y;
      if (dropY == null) return;
      const slotTime = dropClientYToSlotTime(
        dropY,
        columnRef.current,
        slotHeightPx,
        slotStartTimes
      );
      onMoveClass(item.class.id, day, slotTime);
    },
    collect: (monitor) => {
      const item = monitor.getItem() as any;
      return {
        isOver: monitor.isOver(),
        isDraggingBlock: item?.type === DRAG_TYPE_TIMETABLE_BLOCK
      };
    }
  }), [day, onMoveClass, slotHeightPx, slotStartTimes]);

  const showDropHint = isOver && isDraggingBlock;

  const handleColumnClick = (e: React.MouseEvent) => {
    if (!columnRef.current || (e.target as HTMLElement).closest('[data-class-block]') || (e.target as HTMLElement).closest('[data-slot-row]')) return;
    const slotTime = dropClientYToSlotTime(
      e.clientY,
      columnRef.current,
      slotHeightPx,
      slotStartTimes
    );
    onSelectSlot(slotTime);
  };

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      data-day-column
      className={`relative min-w-0 border-r border-[#E2E0EF] transition-colors last:border-r-0 ${
        showDropHint ? 'bg-[#E9E6FF] ring-2 ring-[#a9a3ff] ring-inset' : 'bg-white'
      }`}
      style={{ height: gridHeightPx }}
    >
      <div
        ref={columnRef}
        className="relative cursor-pointer flex flex-col"
        style={{ height: gridHeightPx }}
        onClick={handleColumnClick}
      >
        {/* Grid: one drop target per slot */}
        {slotStartTimes.map((slotTime) => (
          <TimetableSlotRow
            key={slotTime}
            slotTime={slotTime}
            heightPx={slotHeightPx}
            onDropYearGroup={(yg) => onAddYearGroup(slotTime)(yg)}
            onSelectSlot={() => onSelectSlot(slotTime)}
          />
        ))}
        {/* Class blocks (absolute so they sit on top of slot grid and remain interactive) */}
        {classes.map((cls) => {
          const startMin = timeToMinutes(cls.startTime);
          const endMin = timeToMinutes(cls.endTime);
          const topPx = (startMin - dayStartMinutes) * pxPerMinute;
          const heightPx = (endMin - startMin) * pxPerMinute;
          const minHeight = 24;
          if (heightPx < 2) return null;
          return (
            <TimetableClassBlock
              key={cls.id}
              class={cls}
              currentDay={day}
              topPx={topPx}
              heightPx={Math.max(heightPx, minHeight)}
              onEdit={() => onEdit(cls)}
              onDelete={() => onDelete(cls.id)}
              onResize={(newEndTime, commit) => onResize(cls.id, newEndTime, commit)}
              resizing={resizingId === cls.id}
              onResizeStart={() => setResizingId(cls.id)}
              onResizeEnd={() => setResizingId(null)}
              pxPerMinute={pxPerMinute}
              slotDurationMinutes={slotDurationMinutes}
              dayStartMinutes={dayStartMinutes}
              dayEndMinutes={dayEndMinutes}
              timeToMinutes={timeToMinutes}
              minutesToTime={minutesToTime}
            />
          );
        })}
      </div>
    </div>
  );
}

// One class block with start time label, draggable, and bottom resize handle
function TimetableClassBlock({
  class: cls,
  currentDay,
  topPx,
  heightPx,
  onEdit,
  onDelete,
  onResize,
  resizing,
  onResizeStart,
  onResizeEnd,
  pxPerMinute,
  slotDurationMinutes,
  dayStartMinutes,
  dayEndMinutes,
  timeToMinutes,
  minutesToTime
}: {
  class: TimetableClass;
  currentDay: number;
  topPx: number;
  heightPx: number;
  onEdit: () => void;
  onDelete: () => void;
  onResize: (newEndTime: string, commit?: boolean) => void;
  resizing: boolean;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  pxPerMinute: number;
  slotDurationMinutes: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
  timeToMinutes: (time: string) => number;
  minutesToTime: (min: number) => string;
}) {
  const blockRef = React.useRef<HTMLDivElement>(null);
  const suppressClickRef = React.useRef(false);
  const lastEndTimeRef = React.useRef(cls.endTime);
  const startMin = timeToMinutes(cls.startTime);

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: DRAG_TYPE_TIMETABLE_BLOCK,
    item: () => ({ type: DRAG_TYPE_TIMETABLE_BLOCK, class: cls }),
    canDrag: () => !resizing,
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  }), [cls, resizing]);

  React.useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  const yToEndTime = (clientY: number) => {
    const parentEl = blockRef.current?.parentElement;
    if (!parentEl) return null;
    const y = clientY - parentEl.getBoundingClientRect().top;
    const minutes = dayStartMinutes + y / pxPerMinute;
    const snapped = snapMinutesToInterval(minutes, slotDurationMinutes);
    const clamped = Math.max(startMin + slotDurationMinutes, Math.min(dayEndMinutes, snapped));
    return minutesToTime(clamped);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResizeStart();
    const move = (ev: MouseEvent) => {
      const endTime = yToEndTime(ev.clientY);
      if (!endTime) return;
      lastEndTimeRef.current = endTime;
      onResize(endTime, false);
    };
    const up = () => {
      onResize(lastEndTimeRef.current, true);
      suppressClickRef.current = true;
      onResizeEnd();
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onEdit();
  };

  return (
    <div
      data-class-block
      ref={blockRef}
      className={`absolute left-0.5 right-0.5 rounded px-2 py-1 text-xs font-medium text-white flex flex-col z-10 ${
        isDragging ? 'opacity-0 pointer-events-none' : resizing ? 'ring-2 ring-white/60' : 'hover:opacity-95 transition-opacity'
      }`}
      style={{
        backgroundColor: cls.color,
        top: `${topPx}px`,
        height: `${heightPx}px`,
        minHeight: 20,
        transform: 'none'
      }}
      onClick={handleBlockClick}
      title={`${cls.className} (${cls.startTime} - ${cls.endTime}). Drag to move; drag bottom edge to resize.`}
    >
      <div
        ref={drag as unknown as React.Ref<HTMLDivElement>}
        className={`flex items-center justify-between flex-1 min-h-0 min-w-0 pb-3 cursor-grab active:cursor-grabbing ${isDragging ? 'cursor-grabbing' : ''}`}
      >
        <div className="truncate flex-1 min-w-0">
          <span className="font-semibold text-white/90">{cls.startTime}</span>
          <span className="ml-1 truncate">{cls.className}</span>
          {resizing && (
            <span className="ml-1 text-white/80">→ {cls.endTime}</span>
          )}
        </div>
        <button
          type="button"
          aria-label={`Remove ${cls.className}`}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="ml-1 opacity-80 hover:opacity-100 p-0.5 shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 z-20 h-4 cursor-ns-resize flex items-end justify-center group touch-none"
        onMouseDown={handleResizeMouseDown}
        title="Drag to change duration"
      >
        {resizing && <div className="absolute inset-0 bg-white/30 rounded-b" />}
        <div className="w-10 h-1 mb-0.5 bg-white/70 group-hover:bg-white rounded-full" />
      </div>
    </div>
  );
}

/** Draggable class chip for the left rail (full-width, colour-coded). */
function DraggableYearGroup({ yearGroup }: { yearGroup: any; chip?: boolean }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'year-group',
    item: { yearGroup },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [yearGroup]);

  const color = yearGroup.color || '#4338E8';
  return (
    <button
      type="button"
      ref={drag as unknown as React.Ref<HTMLButtonElement>}
      className={`ss-timetable-class-chip ${isDragging ? 'is-dragging' : ''}`}
      title={`Drag ${yearGroup.name} onto the grid`}
      style={{ borderLeftColor: color }}
      data-class-chip={yearGroup.name}
    >
      <span className="ss-timetable-class-dot" style={{ backgroundColor: color }} aria-hidden />
      <span className="ss-timetable-class-name">{yearGroup.name}</span>
    </button>
  );
}

// Timetable Grid Cell Component with Drop Zone
function TimetableGridCell({
  day,
  timeSlot,
  slotHour,
  slotMinute,
  classes,
  onAddYearGroup,
  onAddNonCurriculum,
  onEdit,
  onDelete,
  onSelect
}: {
  day: number;
  timeSlot: string;
  slotHour: number;
  slotMinute: number;
  classes: TimetableClass[];
  onAddYearGroup: (yearGroup: any) => void;
  onAddNonCurriculum: () => void;
  onEdit: (cls: TimetableClass) => void;
  onDelete: (id: string) => void;
  onSelect: () => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'year-group',
    drop: (item: any) => {
      onAddYearGroup(item.yearGroup);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [day, timeSlot, onAddYearGroup]);

  // Find classes that start at this exact time slot
  const startingClasses = classes.filter(cls => {
    const startHour = parseInt(cls.startTime.split(':')[0]);
    const startMinute = parseInt(cls.startTime.split(':')[1] || '0');
    return startHour === slotHour && startMinute === slotMinute;
  });

  return (
    <td
      ref={drop as unknown as React.Ref<HTMLTableDataCellElement>}
      className={`border-r border-gray-200 relative min-h-[60px] ${
        isOver ? 'bg-[#E9E6FF] border-2 border-[#bcb7f4]' : 'bg-white hover:bg-gray-50'
      } transition-colors cursor-pointer`}
      onClick={onSelect}
    >
      {/* Render class blocks that start at this time slot */}
      {startingClasses.map((cls) => {
        const startHour = parseInt(cls.startTime.split(':')[0]);
        const startMinute = parseInt(cls.startTime.split(':')[1] || '0');
        const endHour = parseInt(cls.endTime.split(':')[0]);
        const endMinute = parseInt(cls.endTime.split(':')[1] || '0');
        
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        const heightPx = (durationMinutes / 60) * 60; // Each hour is 60px
        
        return (
          <div
            key={cls.id}
            className="absolute left-0 right-0 rounded px-2 py-1 text-xs font-medium text-white cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between z-10"
            style={{
              backgroundColor: cls.color,
              top: '2px',
              height: `${heightPx - 4}px`,
              minHeight: '58px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(cls);
            }}
            title={`${cls.className} (${cls.startTime} - ${cls.endTime})`}
          >
            <span className="truncate flex-1">{cls.className}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(cls.id);
              }}
              className="ml-2 opacity-0 hover:opacity-100 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
      
      {/* Show drop indicator when dragging */}
      {classes.length === 0 && (
        <div className="h-full min-h-[60px] flex items-center justify-center">
          {isOver ? (
            <div className="text-xs text-[#4338E8] font-medium">Drop here</div>
          ) : (
            <div className="text-xs text-gray-300 opacity-0 hover:opacity-100 transition-opacity">Drop here</div>
          )}
        </div>
      )}
    </td>
  );
}

// Normalize time to HH:MM for <input type="time"> (e.g. "9:0" -> "09:00")
function normalizeTimeForInput(time: string | undefined): string {
  if (!time) return '09:00';
  const [h, m] = time.split(':').map(s => parseInt(s, 10) || 0);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Edit Modal Component
function EditTimetableClassModal({
  class: cls,
  onSave,
  onClose,
  onDelete,
  yearGroups,
  theme,
  isNew = false
}: {
  class: TimetableClass;
  onSave: (cls: TimetableClass) => void;
  onClose: () => void;
  onDelete: () => void;
  yearGroups: any[];
  theme: any;
  isNew?: boolean;
}) {
  const [editedClass, setEditedClass] = useState<TimetableClass>(() => ({
    ...cls,
    startTime: normalizeTimeForInput(cls.startTime) || '09:00',
    endTime: normalizeTimeForInput(cls.endTime) || '10:00'
  }));

  // Always default form to the class being edited (what shows on the timetable)
  useEffect(() => {
    setEditedClass({
      ...cls,
      startTime: normalizeTimeForInput(cls.startTime) || '09:00',
      endTime: normalizeTimeForInput(cls.endTime) || '10:00'
    });
  }, [cls.id, cls.startTime, cls.endTime, cls.className, cls.day, cls.type, cls.location, cls.color]);

  const handleSave = () => {
    if (!editedClass.className.trim()) {
      alert('Please enter a class name');
      return;
    }
    
    if (isNew) {
      // Generate new ID for new classes
      editedClass.id = `class-${Date.now()}`;
    }
    
    onSave(editedClass);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{isNew ? 'Add' : 'Edit'} Timetable Entry</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              value={editedClass.className}
              onChange={(e) => setEditedClass({ ...editedClass, className: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8]"
              placeholder="e.g., Reception Music"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={editedClass.type}
              onChange={(e) => setEditedClass({ ...editedClass, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8]"
            >
              <option value="curriculum">Curriculum</option>
              <option value="non-curriculum">Non-Curriculum</option>
              <option value="club">Club</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              value={editedClass.day}
              onChange={(e) => setEditedClass({ ...editedClass, day: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8]"
            >
              {DAY_NAMES.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={normalizeTimeForInput(editedClass.startTime)}
                onChange={(e) => setEditedClass({ ...editedClass, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={normalizeTimeForInput(editedClass.endTime)}
                onChange={(e) => setEditedClass({ ...editedClass, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={editedClass.location}
              onChange={(e) => setEditedClass({ ...editedClass, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4338E8]"
              placeholder="e.g., Music Room"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <ColorPickerWithFavorites
              value={editedClass.color}
              onChange={(color) => setEditedClass({ ...editedClass, color })}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          {!isNew && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
          <div className="space-x-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#4338E8] hover:bg-[#3529d1] text-white rounded-lg transition-colors"
            >
              {isNew ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
