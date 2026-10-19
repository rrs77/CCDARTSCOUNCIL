import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useData, type LessonData, type LessonPlan } from '../../contexts/DataContext';
import { useSettings } from '../../contexts/SettingsContextNew';
import { useAuth } from '../../hooks/useAuth';
import { halfTermsApi, lessonsApi } from '../../config/api';
import { filterLessonEntries, sortedLessonNumbers } from '../../utils/lessonEntries';
import { readSlotsForClass } from '../../utils/timetableStorage';
import { plannerApi } from './plannerApi';
import {
  CLASS_PALETTE,
  DEFAULT_PREFS,
  type PlannerClass,
  type PlannerEvent,
  type PlannerFolder,
  type PlannerPrefs,
  type PlannerReflection,
  type TimetableSlot,
} from './plannerModel';

const norm = (v?: string | null) => (v || '').trim().toLowerCase();

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export interface ClassLessons {
  lessons: Record<string, LessonData>;
  lessonNumbers: string[];
  halfTerms: { id: string; lessons: string[] }[];
}

export function usePlannerData(range: { from: Date; to: Date }) {
  const { user } = useAuth();
  const { customYearGroups, yearGroupSections } = useSettings();
  const { currentSheetInfo, currentAcademicYear, reloadUserLessonPlans } = useData();

  const [prefs, setPrefs] = useState<PlannerPrefs>(DEFAULT_PREFS);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [reflections, setReflections] = useState<Record<string, PlannerReflection>>({});
  const [lessonCache, setLessonCache] = useState<Record<string, ClassLessons | 'loading'>>({});
  const [storageTick, setStorageTick] = useState(0);
  const requested = useRef(new Set<string>());

  useEffect(() => {
    void plannerApi.prefs().then(setPrefs);
  }, []);

  const updatePrefs = useCallback((next: Partial<PlannerPrefs>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next };
      void plannerApi.savePrefs(merged);
      return merged;
    });
  }, []);

  /** Classes come from Settings → Year groups; folders from Settings → Year-group sections. */
  const { classes, folders } = useMemo(() => {
    const allowed = user?.profile?.allowed_year_groups ?? null;
    const groups = allowed && allowed.length
      ? customYearGroups.filter((g) => allowed.includes(g.id) || allowed.includes(g.name))
      : customYearGroups;
    const byToken = new Map<string, (typeof groups)[number]>();
    groups.forEach((g) => {
      byToken.set(norm(g.id), g);
      byToken.set(norm(g.name), g);
    });
    const seen = new Set<string>();
    const out: PlannerFolder[] = [];
    const make = (g: (typeof groups)[number], folderId: string, folderName: string, i: number): PlannerClass => ({
      id: g.id,
      name: g.name,
      color: prefs.classColors[g.id] || g.color || CLASS_PALETTE[i % CLASS_PALETTE.length],
      folderId,
      folderName,
      hidden: prefs.hiddenClasses.includes(g.id),
    });
    let i = 0;
    [...yearGroupSections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((section) => {
        const list: PlannerClass[] = [];
        section.yearGroupIds.forEach((token) => {
          const g = byToken.get(norm(token));
          if (!g || seen.has(g.id)) return;
          seen.add(g.id);
          list.push(make(g, section.id, section.label, i++));
        });
        if (list.length) out.push({ id: section.id, name: section.label, classes: list });
      });
    const rest = groups.filter((g) => !seen.has(g.id)).map((g) => make(g, 'other', 'Other classes', i++));
    if (rest.length) out.push({ id: 'other', name: 'Other classes', classes: rest });
    return { folders: out, classes: out.flatMap((f) => f.classes) };
  }, [customYearGroups, yearGroupSections, prefs, user?.profile?.allowed_year_groups]);

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  /** Recurring slots come from the teacher-level timetable (sliced per My class). */
  const { slots, events } = useMemo(() => {
    void storageTick;
    const s: TimetableSlot[] = [];
    const e: PlannerEvent[] = [];
    const seenEvents = new Set<string>();
    classes.forEach((c) => {
      readSlotsForClass({ id: c.id, name: c.name }).forEach((slot) =>
        s.push({
          id: `${c.id}:${slot.id}`,
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          className: c.id,
          location: slot.location || '',
          color: slot.color || '',
        }),
      );
      readJson<Record<string, any>[]>(`calendar-events-${c.id}`, []).forEach((ev) => {
        const key = `${ev.title}|${ev.startDate}`;
        if (seenEvents.has(key)) return;
        seenEvents.add(key);
        e.push({ ...ev, startDate: new Date(ev.startDate), endDate: new Date(ev.endDate) } as PlannerEvent);
      });
    });
    return { slots: s, events: e };
  }, [classes, storageTick]);

  const refreshStorage = useCallback(() => setStorageTick((t) => t + 1), []);

  const fromKey = range.from.getTime();
  const toKey = range.to.getTime();

  const loadPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const list = await plannerApi.plansInRange(new Date(fromKey), new Date(toKey));
      setPlans(list);
      setReflections(await plannerApi.reflections(list.map((p) => p.id)));
    } catch (err) {
      console.error('Planner: failed to load lessons', err);
      toast.error('Could not load your scheduled lessons.');
    } finally {
      setLoadingPlans(false);
    }
  }, [fromKey, toKey]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  /** Saves plans, refreshes the view, and keeps the classic views in step for the selected class. */
  const savePlans = useCallback(
    async (changed: LessonPlan[], message?: string) => {
      setPlans((prev) => {
        const byId = new Map(prev.map((p) => [p.id, p]));
        changed.forEach((p) => byId.set(p.id, p));
        return [...byId.values()];
      });
      try {
        await plannerApi.savePlans(changed);
        if (changed.some((p) => p.className === currentSheetInfo.sheet)) reloadUserLessonPlans();
        if (message) toast.success(message);
      } catch (err) {
        console.error('Planner: save failed', err);
        toast.error('That change could not be saved. Please try again.');
        void loadPlans();
      }
    },
    [currentSheetInfo.sheet, reloadUserLessonPlans, loadPlans],
  );

  const saveReflection = useCallback(async (r: PlannerReflection) => {
    setReflections((prev) => ({ ...prev, [r.lessonPlanId]: r }));
    try {
      await plannerApi.saveReflection(r);
      toast.success('Reflection saved — only you can see it.');
    } catch (err) {
      console.error('Planner: reflection save failed', err);
      toast.error('Reflection could not be saved.');
    }
  }, []);

  /** Cache key: the class id for the app's current academic year, `class@year` for any other year. */
  const lessonKey = useCallback(
    (classId: string, year = currentAcademicYear) => (year === currentAcademicYear ? classId : `${classId}@${year}`),
    [currentAcademicYear],
  );

  /** Lesson content for a class, read-only (titles, picker, unit sequences). */
  const ensureLessons = useCallback(
    (classId: string, year = currentAcademicYear) => {
      const key = lessonKey(classId, year);
      if (requested.current.has(key)) return;
      requested.current.add(key);
      setLessonCache((prev) => ({ ...prev, [key]: 'loading' }));
      void (async () => {
        try {
          const [sheet, terms] = await Promise.all([
            lessonsApi.getBySheet(classId, year).catch(() => null),
            halfTermsApi.getBySheet(classId, year).catch(() => []),
          ]);
          const local =
            year === currentAcademicYear
              ? readJson<{ allLessonsData?: Record<string, LessonData>; lessonNumbers?: string[] }>(`lesson-data-${classId}`, {})
              : {};
          // Strip sheet-metadata keys that may have been nested into the lessons map
          // (e.g. demo DB rows that once stored { lesson1, allLessonsData, lessonStandards }).
          const lessons = filterLessonEntries(sheet?.allLessonsData || local.allLessonsData || {});
          // Prefer the full library for the class — never truncate to a short lessonNumbers list.
          const lessonNumbers = [
            ...new Set([
              ...(sheet?.lessonNumbers || []),
              ...(local.lessonNumbers || []),
              ...Object.keys(lessons),
              ...(terms || []).flatMap((t: { lessons?: string[] }) => t.lessons || []),
            ]),
          ]
            .filter((n) => !!lessons[n])
            .sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)));
          // Keep order stable even when explicit lessonNumbers lists are empty.
          const numbers = lessonNumbers.length ? lessonNumbers : sortedLessonNumbers(lessons);
          setLessonCache((prev) => ({
            ...prev,
            [key]: {
              lessons,
              lessonNumbers: numbers,
              halfTerms: (terms || []).map((t: { id: string; lessons: string[] }) => ({ id: t.id, lessons: t.lessons || [] })),
            },
          }));
        } catch (err) {
          console.warn('Planner: lessons unavailable for', classId, err);
          setLessonCache((prev) => ({ ...prev, [key]: { lessons: {}, lessonNumbers: [], halfTerms: [] } }));
        }
      })();
    },
    [currentAcademicYear, lessonKey],
  );

  useEffect(() => {
    requested.current.clear();
    setLessonCache({});
  }, [currentAcademicYear]);

  return {
    prefs,
    updatePrefs,
    classes,
    folders,
    classById,
    slots,
    events,
    refreshStorage,
    plans,
    loadingPlans,
    reloadPlans: loadPlans,
    savePlans,
    reflections,
    saveReflection,
    lessonCache,
    lessonKey,
    ensureLessons,
  };
}

export type PlannerData = ReturnType<typeof usePlannerData>;
