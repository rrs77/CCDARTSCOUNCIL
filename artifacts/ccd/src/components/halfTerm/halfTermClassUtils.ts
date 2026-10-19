import { getDefaultSectionIdForYearGroup } from '../../utils/yearGroupSectionOrder';
import { HALF_TERMS } from './halfTermConstants';
import type { StackedLesson } from '../../hooks/useLessonStacks';

export type ClassSubject = 'Music' | 'Drama' | 'Dance' | 'Art' | 'Other';

export type ClassRef = {
  id: string;
  name: string;
  color?: string;
};

export type HalfTermRecord = {
  id: string;
  name: string;
  months: string;
  lessons: string[];
  stacks: string[];
  isComplete?: boolean;
};

const SUBJECTS: ClassSubject[] = ['Music', 'Drama', 'Dance', 'Art'];

const SUBJECT_COLORS: Record<ClassSubject, string> = {
  Music: '#0B6B5F',
  Drama: '#8B5CF6',
  Dance: '#DB2777',
  Art: '#EA580C',
  Other: '#5C5878',
};

const STAGE_SORT: Record<string, number> = {
  eyfs: 0,
  ks1: 1,
  ks2: 2,
  ks3: 3,
  ks4: 4,
  ks5: 5,
  other: 9,
};

export function inferClassSubject(name: string, id = ''): ClassSubject {
  const hay = `${name} ${id}`.toLowerCase();
  for (const s of SUBJECTS) {
    if (hay.includes(s.toLowerCase())) return s;
  }
  return 'Other';
}

export function subjectAccent(subject: ClassSubject): string {
  return SUBJECT_COLORS[subject];
}

export function classDisplayColor(cls: ClassRef): string {
  if (cls.color) return cls.color;
  return subjectAccent(inferClassSubject(cls.name, cls.id));
}

/** Year number for sorting (Reception/Kindergarten → 0). */
export function inferYearRank(name: string, id = ''): number {
  const hay = `${name} ${id}`.toLowerCase();
  if (/\b(lkg|ukg|reception|kindergarten)\b/.test(hay)) return 0;
  const m = hay.match(/\byear\s*(\d{1,2})\b/) || hay.match(/\by(\d{1,2})\b/);
  if (m) return Number(m[1]);
  return 50;
}

export function sortClassesForHalfTermBoard<T extends ClassRef>(
  classes: T[],
  stageIdFor: (cls: T) => string,
): T[] {
  const subjectRank = (s: ClassSubject) => {
    const i = SUBJECTS.indexOf(s as (typeof SUBJECTS)[number]);
    return i >= 0 ? i : SUBJECTS.length;
  };
  return [...classes].sort((a, b) => {
    const sa = STAGE_SORT[stageIdFor(a)] ?? 9;
    const sb = STAGE_SORT[stageIdFor(b)] ?? 9;
    if (sa !== sb) return sa - sb;
    const ya = inferYearRank(a.name, a.id);
    const yb = inferYearRank(b.name, b.id);
    if (ya !== yb) return ya - yb;
    const suba = subjectRank(inferClassSubject(a.name, a.id));
    const subb = subjectRank(inferClassSubject(b.name, b.id));
    if (suba !== subb) return suba - subb;
    return a.name.localeCompare(b.name);
  });
}

export function emptyHalfTermRecords(): HalfTermRecord[] {
  return HALF_TERMS.map((t) => ({
    id: t.id,
    name: t.name,
    months: t.months,
    lessons: [],
    stacks: [],
    isComplete: false,
  }));
}

export function readClassHalfTerms(classId: string, academicYear: string): HalfTermRecord[] {
  try {
    const raw = localStorage.getItem(`half-terms-${classId}-${academicYear}`);
    if (!raw) return emptyHalfTermRecords();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return emptyHalfTermRecords();
    const byId = new Map(parsed.map((t: HalfTermRecord) => [t.id, t]));
    return HALF_TERMS.map((meta) => {
      const existing = byId.get(meta.id);
      return {
        id: meta.id,
        name: existing?.name || meta.name,
        months: existing?.months || meta.months,
        lessons: Array.isArray(existing?.lessons) ? existing!.lessons : [],
        stacks: Array.isArray(existing?.stacks) ? existing!.stacks : [],
        isComplete: !!existing?.isComplete,
      };
    });
  } catch {
    return emptyHalfTermRecords();
  }
}

function lessonsForStacks(stacks: StackedLesson[], stackIds: string[]): string[] {
  const out: string[] = [];
  for (const id of stackIds) {
    const stack = stacks.find((s) => s.id === id);
    if (stack?.lessons?.length) out.push(...stack.lessons);
  }
  return [...new Set(out)];
}

/** Persist stacks for one class × half-term without requiring DataContext sheet switch. */
export function writeClassHalfTermStacks(
  classId: string,
  academicYear: string,
  halfTermId: string,
  nextStackIds: string[],
  stacks: StackedLesson[],
): HalfTermRecord[] {
  const terms = readClassHalfTerms(classId, academicYear);
  const stackLessons = lessonsForStacks(stacks, nextStackIds);
  const next = terms.map((t) =>
    t.id === halfTermId
      ? {
          ...t,
          stacks: [...new Set(nextStackIds)],
          lessons: stackLessons,
        }
      : t,
  );
  localStorage.setItem(`half-terms-${classId}-${academicYear}`, JSON.stringify(next));
  return next;
}

export function getStageIdForClass(
  cls: ClassRef,
  sections: { id: string; yearGroupIds: string[] }[],
  allClasses: ClassRef[],
): string {
  for (const section of sections) {
    if (section.id === 'other') continue;
    for (const token of section.yearGroupIds || []) {
      const t = (token || '').trim().toLowerCase();
      if (!t) continue;
      if (t === cls.id.toLowerCase() || t === cls.name.toLowerCase()) return section.id;
    }
  }
  return getDefaultSectionIdForYearGroup(cls.id, cls.name);
}

export const CLASS_SUBJECT_FILTERS: ClassSubject[] = ['Music', 'Drama', 'Dance', 'Art'];
