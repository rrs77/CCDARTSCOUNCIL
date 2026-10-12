import type { LessonPlan } from '../../contexts/DataContext';

export type PlannerView = 'day' | 'week' | 'month' | 'term' | 'units' | 'classic';

export const PLANNER_VIEWS: { id: Exclude<PlannerView, 'classic'>; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'term', label: 'Term' },
  { id: 'units', label: 'Units' },
];

export const HALF_TERMS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep – Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov – Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan – Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Mar – Apr' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr – May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun – Jul' },
] as const;

export type HalfTermId = (typeof HALF_TERMS)[number]['id'];

/** A class as the Planner sees it: a Settings year group plus Planner-only display preferences. */
export interface PlannerClass {
  id: string;
  name: string;
  color: string;
  folderId: string;
  folderName: string;
  hidden: boolean;
}

export interface PlannerFolder {
  id: string;
  name: string;
  classes: PlannerClass[];
}

/** Recurring timetable slot from the existing calendar (`timetable-{class}` in localStorage). */
export interface TimetableSlot {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  className: string;
  location: string;
  color: string;
}

export interface PlannerEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'holiday' | 'inset' | 'event' | 'key-date';
  color: string;
}

export interface PlannerReflection {
  lessonPlanId: string;
  className: string;
  lessonDate: string | null;
  outcome: 'below' | 'as_planned' | 'exceeded' | null;
  wentWell: string;
  toRevisit: string;
  nextTime: string;
}

export interface PlannerPrefs {
  classColors: Record<string, string>;
  hiddenClasses: string[];
}

export const DEFAULT_PREFS: PlannerPrefs = { classColors: {}, hiddenClasses: [] };

/** One entry in a day: a scheduled lesson, an empty timetable slot, or both matched together. */
export interface DayEntry {
  key: string;
  classId: string;
  time: string;
  endTime?: string;
  location?: string;
  plan?: LessonPlan;
  slot?: TimetableSlot;
}

export const CLASS_PALETTE = [
  '#E11D48', '#D97706', '#CA8A04', '#7C3AED', '#2563EB',
  '#16A34A', '#0D9488', '#4F46E5', '#475569', '#DB2777',
];

export const SERIF = '"Playfair Display", Georgia, serif';

export const pad = (n: number) => String(n).padStart(2, '0');

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d: Date, n: number) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Monday of the week containing `d`. */
export const startOfWeek = (d: Date) => {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7;
  return addDays(x, -dow);
};

export const sameDay = (a: Date, b: Date) => ymd(a) === ymd(b);

export const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const timeToMinutes = (t?: string) => {
  if (!t) return 24 * 60;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const formatRange = (from: Date, to: Date) => {
  const sameMonth = from.getMonth() === to.getMonth();
  const left = from.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' });
  const right = to.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${left} – ${right}`;
};

/** Academic year string ("2026-2027") that contains `d`; years start in September. */
export const academicYearFor = (d: Date) => {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
};

/** Default half-term date ranges for an academic year; schools can override per class via term-time configs. */
export const defaultHalfTermRanges = (academicYear: string) => {
  const start = Number(academicYear.split('-')[0]);
  const r = (y: number, m1: number, d1: number, m2: number, d2: number) => ({
    start: new Date(y, m1, d1),
    end: new Date(y, m2, d2),
  });
  return {
    A1: r(start, 8, 1, 9, 31),
    A2: r(start, 10, 1, 11, 31),
    SP1: r(start + 1, 0, 1, 1, 20),
    SP2: r(start + 1, 1, 21, 3, 10),
    SM1: r(start + 1, 3, 11, 4, 31),
    SM2: r(start + 1, 5, 1, 7, 31),
  } as Record<HalfTermId, { start: Date; end: Date }>;
};

export const halfTermFor = (d: Date): HalfTermId => {
  const ranges = defaultHalfTermRanges(academicYearFor(d));
  const hit = (Object.keys(ranges) as HalfTermId[]).find(
    (id) => d >= ranges[id].start && d <= addDays(ranges[id].end, 1),
  );
  return hit || 'A1';
};

/** Readable text colour on a tinted background of `hex`. */
export const tint = (hex: string, alpha = 0.12) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,45,36,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

/** Darkens a colour until it reaches roughly AA contrast on white, so class labels stay legible. */
export const readableInk = (hex: string) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  let n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#002D24';
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const lum = () => {
    const f = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  for (let i = 0; i < 12 && 1.05 / (lum() + 0.05) < 4.6; i++) {
    r = Math.round(r * 0.85);
    g = Math.round(g * 0.85);
    b = Math.round(b * 0.85);
  }
  n = (r << 16) | (g << 8) | b;
  return `#${n.toString(16).padStart(6, '0')}`;
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const planStatusLabel: Record<LessonPlan['status'], string> = {
  planned: 'Planned',
  completed: 'Taught',
  cancelled: 'Cancelled',
  draft: 'Draft',
};
