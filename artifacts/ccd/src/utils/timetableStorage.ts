/**
 * Teacher-level timetable storage.
 *
 * Historically each calendar/sheet stored its own `timetable-${classId}` (and
 * optional per-term keys). The Timetable Builder is now one teacher timetable
 * covering all Settings → My classes. These helpers migrate legacy keys and
 * keep per-class slices in sync so the Week planner / classic calendar still
 * resolve slots per class.
 */

export const TEACHER_TIMETABLE_SCOPE = 'teacher';
export const TEACHER_TIMETABLE_MIGRATION_KEY = 'timetable-teacher-migrated-v1';

export const TERM_IDS = ['A1', 'A2', 'SP1', 'SP2', 'SM1', 'SM2'] as const;
export type TermId = (typeof TERM_IDS)[number];

export type TimetableEntry = {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  className: string;
  location: string;
  color: string;
  type?: 'curriculum' | 'non-curriculum' | 'club';
  yearGroupId?: string;
  recurringUnitId?: string;
};

export type ClassRef = { id: string; name: string };

export const teacherGlobalKey = () => `timetable-${TEACHER_TIMETABLE_SCOPE}`;
export const teacherTermKey = (termId: string) => `timetable-${TEACHER_TIMETABLE_SCOPE}-${termId}`;
export const teacherGlobalFlagKey = () => `timetable-${TEACHER_TIMETABLE_SCOPE}-global`;
export const teacherTimeConfigKey = (key: string) => `timetable-${TEACHER_TIMETABLE_SCOPE}-${key}`;

const readJsonArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const entryKey = (e: TimetableEntry) =>
  `${e.day}|${e.startTime}|${e.endTime}|${e.yearGroupId || ''}|${e.className}|${e.type || ''}`;

/** Merge entries de-duplicating by day/time/class identity (keep first id). */
export function mergeTimetableEntries(...lists: TimetableEntry[][]): TimetableEntry[] {
  const out: TimetableEntry[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const e of list) {
      if (!e || typeof e !== 'object') continue;
      const k = entryKey(e);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

export function entryMatchesClass(entry: TimetableEntry, cls: ClassRef): boolean {
  if (entry.yearGroupId && (entry.yearGroupId === cls.id || entry.yearGroupId === cls.name)) return true;
  if (entry.className === cls.id || entry.className === cls.name) return true;
  return false;
}

/** Curriculum / class-linked slots for one My-class (excludes breaks unless tagged to that class). */
export function sliceForClass(entries: TimetableEntry[], cls: ClassRef): TimetableEntry[] {
  return entries.filter((e) => entryMatchesClass(e, cls));
}

/**
 * One-time merge of every legacy `timetable-${classId}` (+ per-term) into
 * teacher-level keys. Safe to call repeatedly (guarded by migration flag).
 */
export function migrateLegacyTimetablesToTeacher(classes: ClassRef[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(TEACHER_TIMETABLE_MIGRATION_KEY) === '1') return;

    const tokens = new Set<string>();
    classes.forEach((c) => {
      tokens.add(c.id);
      tokens.add(c.name);
    });
    // Also scan localStorage for any leftover timetable-* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('timetable-')) continue;
      if (key.startsWith(`timetable-${TEACHER_TIMETABLE_SCOPE}`)) continue;
      const rest = key.slice('timetable-'.length);
      if (rest.endsWith('-global') || rest.endsWith('-dayStart') || rest.endsWith('-dayEnd') || rest.endsWith('-slotInterval')) {
        continue;
      }
      const termMatch = rest.match(/^(.*)-(A1|A2|SP1|SP2|SM1|SM2)$/);
      const scope = termMatch ? termMatch[1] : rest;
      if (scope) tokens.add(scope);
    }

    const scopes = [...tokens].filter(Boolean);

    // Global / legacy (no term)
    const globalLists = scopes.map((s) => readJsonArray<TimetableEntry>(`timetable-${s}`));
    const mergedGlobal = mergeTimetableEntries(...globalLists);
    if (mergedGlobal.length > 0 && readJsonArray(teacherGlobalKey()).length === 0) {
      localStorage.setItem(teacherGlobalKey(), JSON.stringify(mergedGlobal));
    }

    // Per-term
    for (const term of TERM_IDS) {
      const lists = scopes.map((s) => readJsonArray<TimetableEntry>(`timetable-${s}-${term}`));
      const merged = mergeTimetableEntries(...lists);
      if (merged.length > 0 && readJsonArray(teacherTermKey(term)).length === 0) {
        localStorage.setItem(teacherTermKey(term), JSON.stringify(merged));
      }
    }

    // Prefer "same for all terms" if any legacy class had it, or if only global data exists
    const anyGlobalFlag = scopes.some((s) => localStorage.getItem(`timetable-${s}-global`) === 'true');
    const hasTermData = TERM_IDS.some((t) => readJsonArray(teacherTermKey(t)).length > 0);
    if (anyGlobalFlag || (mergedGlobal.length > 0 && !hasTermData)) {
      localStorage.setItem(teacherGlobalFlagKey(), 'true');
    }

    // Time config: first found wins
    for (const cfg of ['dayStart', 'dayEnd', 'slotInterval'] as const) {
      if (localStorage.getItem(teacherTimeConfigKey(cfg))) continue;
      for (const s of scopes) {
        const v = localStorage.getItem(`timetable-${s}-${cfg}`);
        if (v) {
          localStorage.setItem(teacherTimeConfigKey(cfg), v);
          break;
        }
      }
    }

    localStorage.setItem(TEACHER_TIMETABLE_MIGRATION_KEY, '1');
  } catch (err) {
    console.warn('Timetable migration skipped:', err);
  }
}

/** Load the active teacher timetable for a term (respects global flag). */
export function loadTeacherTimetable(termId: string): TimetableEntry[] {
  try {
    const useGlobal = localStorage.getItem(teacherGlobalFlagKey()) === 'true';
    if (useGlobal) {
      const g = readJsonArray<TimetableEntry>(teacherGlobalKey());
      if (g.length) return g;
    }
    const term = readJsonArray<TimetableEntry>(teacherTermKey(termId));
    if (term.length) return term;
    // Fall back to global blob even when per-term mode (legacy)
    return readJsonArray<TimetableEntry>(teacherGlobalKey());
  } catch {
    return [];
  }
}

/**
 * Persist teacher timetable and mirror curriculum slices onto each My-class
 * key so Week planner / classic calendar keep working.
 */
export function saveTeacherTimetable(
  entries: TimetableEntry[],
  opts: {
    termId: string;
    useGlobal: boolean;
    classes: ClassRef[];
  },
): void {
  const { termId, useGlobal, classes } = opts;
  if (useGlobal) {
    localStorage.setItem(teacherGlobalKey(), JSON.stringify(entries));
    localStorage.setItem(teacherGlobalFlagKey(), 'true');
  } else {
    localStorage.setItem(teacherTermKey(termId), JSON.stringify(entries));
    localStorage.setItem(teacherGlobalFlagKey(), 'false');
  }

  // Mirror per-class slices (curriculum entries attributed to that class)
  for (const cls of classes) {
    const slice = sliceForClass(entries, cls).map((e) => ({
      ...e,
      // Week planner overwrites className with id; keep yearGroupId for matching
      yearGroupId: e.yearGroupId || cls.id,
    }));
    if (useGlobal) {
      localStorage.setItem(`timetable-${cls.id}`, JSON.stringify(slice));
      if (cls.name !== cls.id) localStorage.setItem(`timetable-${cls.name}`, JSON.stringify(slice));
    } else {
      localStorage.setItem(`timetable-${cls.id}-${termId}`, JSON.stringify(slice));
      if (cls.name !== cls.id) localStorage.setItem(`timetable-${cls.name}-${termId}`, JSON.stringify(slice));
      // Also refresh the unscoped legacy key used by Week planner / calendar loaders
      localStorage.setItem(`timetable-${cls.id}`, JSON.stringify(slice));
      if (cls.name !== cls.id) localStorage.setItem(`timetable-${cls.name}`, JSON.stringify(slice));
    }
  }
}

/**
 * Slots for the Week planner: prefer teacher timetable, fall back to legacy
 * per-class keys. Returns entries with `className` set to the class id.
 */
export function readSlotsForClass(cls: ClassRef, termId = 'A1'): TimetableEntry[] {
  migrateLegacyTimetablesToTeacher([cls]);
  const teacher = loadTeacherTimetable(termId);
  const teacherHasAny = teacher.length > 0;
  const fromTeacher = sliceForClass(teacher, cls);
  if (fromTeacher.length > 0) {
    return fromTeacher.map((e) => ({ ...e, className: cls.id }));
  }
  // Teacher timetable exists (possibly from other classes) — this class truly has no slots
  if (teacherHasAny || localStorage.getItem(TEACHER_TIMETABLE_MIGRATION_KEY) === '1') {
    return [];
  }
  const legacy = readJsonArray<TimetableEntry>(`timetable-${cls.id}`);
  const legacyByName = cls.name !== cls.id ? readJsonArray<TimetableEntry>(`timetable-${cls.name}`) : [];
  return mergeTimetableEntries(legacy, legacyByName).map((e) => ({ ...e, className: cls.id }));
}

/**
 * Replace one class's curriculum slots inside the teacher timetable (keeps
 * other classes and non-matching breaks/clubs). Used by the classic calendar
 * when editing slots for the open sheet.
 */
export function upsertClassSlice(
  cls: ClassRef,
  slice: TimetableEntry[],
  allClasses: ClassRef[],
  termId = 'A1',
): TimetableEntry[] {
  migrateLegacyTimetablesToTeacher(allClasses.length ? allClasses : [cls]);
  const useGlobal = localStorage.getItem(teacherGlobalFlagKey()) === 'true';
  const current = loadTeacherTimetable(termId);
  const kept = current.filter((e) => !entryMatchesClass(e, cls));
  const tagged = slice.map((e) => ({
    ...e,
    yearGroupId: e.yearGroupId || cls.id,
    className: e.className || cls.name,
  }));
  const next = mergeTimetableEntries(kept, tagged);
  saveTeacherTimetable(next, { termId, useGlobal, classes: allClasses.length ? allClasses : [cls] });
  return next;
}
