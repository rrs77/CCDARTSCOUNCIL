/**
 * Shared helpers for curated prototype / partner-hub seed packs.
 *
 * Packs are first-class demo seed content (same idea as LSO/ROH): written into
 * the prototype session store on activate / “Add to CCDesigner”, starred for
 * Activity Library, and re-seeded on every prototype entry. They must NOT sync
 * to the real Supabase production account.
 *
 * What stays “local / ephemeral” is only visitor edits during a prototype
 * session — those clear on demo logout; packs come back on the next seed.
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { starActivityObjectsLocally } from './activityStars';
import { CCD_CATEGORIES_UPDATED_EVENT } from './setupLSOYear6';
import { notifyHubActivitiesUpdated } from './hubSeedLocal';
import { writeDemoTable, readDemoTable } from './demoDb';
import { isDemoModeActive } from './demoMode';
import { getDefaultSectionIdForYearGroup, mergeSectionsWithYearGroups, resolveYearGroupFromToken } from './yearGroupSectionOrder';

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function allocateLessonNumbers(count: number, existingKeys: string[]): string[] {
  const used = new Set(existingKeys.map(String));
  const out: string[] = [];
  let n = 1;
  while (out.length < count) {
    const key = String(n);
    if (!used.has(key)) {
      out.push(key);
      used.add(key);
    }
    n += 1;
  }
  return out;
}

export type SeedCategoryDef = {
  name: string;
  color: string;
  yearGroups: Record<string, boolean>;
};

export function mergeCategoriesLocal(
  defs: SeedCategoryDef[],
  isOwnedCategory: (name: string) => boolean,
): { merged: any[]; created: any[] } {
  const existing = readJson<any[]>('saved-categories', []);
  const kept = existing.filter((c) => c?.name && !isOwnedCategory(c.name));
  const created: any[] = [];
  for (const def of defs) {
    const prev = existing.find((c) => c?.name === def.name);
    const row = {
      id: prev?.id || `proto-cat-${def.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: def.name,
      color: def.color,
      position: kept.length + created.length,
      yearGroups: { ...(prev?.yearGroups || {}), ...def.yearGroups },
      groups: prev?.groups || [],
      group: prev?.group ?? null,
    };
    created.push(row);
  }
  const merged = [...kept, ...created];
  localStorage.setItem('saved-categories', JSON.stringify(merged));
  return { merged, created };
}

export function mergeActivitiesLocal(
  seed: Omit<Activity, 'id'>[],
  isOwnedActivity: (a: Activity) => boolean,
): Activity[] {
  const existing = readJson<Activity[]>('library-activities', []);
  const kept = existing.filter((a) => !isOwnedActivity(a));
  const stamped: Activity[] = seed.map((a, i) => {
    const id =
      (a as any)._id ||
      `proto-act-${String(a.activity || 'a')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .slice(0, 40)}-${i}`;
    return { ...a, _id: id, id } as Activity;
  });
  localStorage.setItem('library-activities', JSON.stringify([...kept, ...stamped]));

  // Keep demo mock-DB in sync when previewing so APIs see the same rows.
  if (isDemoModeActive()) {
    try {
      const db = readDemoTable('activities') || [];
      const filtered = db.filter((row: any) => {
        const name = String(row.activity || '');
        const cat = String(row.category || '');
        return !stamped.some((s) => s.activity === name && s.category === cat);
      });
      const rows = stamped.map((a) => ({
        id: a._id,
        activity: a.activity,
        description: a.description,
        activity_text: a.activityText,
        time: a.time,
        category: a.category,
        level: a.level,
        unit_name: a.unitName,
        teaching_unit: a.teachingUnit,
        lesson_number: a.lessonNumber,
        link: a.link,
        resource_link: a.resourceLink,
        image_link: a.imageLink,
        yeargroups: a.yearGroups,
      }));
      writeDemoTable('activities', [...filtered, ...rows]);
    } catch {
      /* ignore */
    }
  }

  return stamped;
}

export function mergeLessonsLocal(
  sheetId: string,
  lessons: Record<string, LessonData>,
  seedNote: string,
  lessonKeysStorageKey: string,
  unitName: string,
) {
  const key = `lesson-data-${sheetId}`;
  const existing = readJson<any>(key, { allLessonsData: {}, lessonNumbers: [], teachingUnits: [] });
  const allLessonsData = { ...(existing.allLessonsData || {}) };
  const previousKeys = readJson<string[]>(lessonKeysStorageKey, []);
  for (const k of previousKeys) {
    if (String(allLessonsData[k]?.notes || '').includes(seedNote)) delete allLessonsData[k];
  }
  for (const [num, lesson] of Object.entries(lessons)) {
    allLessonsData[num] = lesson;
  }
  const writtenNumbers = Object.keys(lessons);
  const lessonNumbers = [
    ...new Set([
      ...(existing.lessonNumbers || []).filter((n: string) => allLessonsData[n]),
      ...writtenNumbers,
    ]),
  ].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  const teachingUnits = [...new Set([...(existing.teachingUnits || []), unitName])];
  const payload = {
    ...existing,
    allLessonsData,
    lessonNumbers,
    teachingUnits,
    notes: existing.notes || '',
  };
  localStorage.setItem(key, JSON.stringify(payload));
  localStorage.setItem(lessonKeysStorageKey, JSON.stringify(writtenNumbers));
  return { payload, writtenNumbers };
}

export function mergeStackLocal(stack: StackedLesson, stackIdKey: string, stackName: string) {
  const existing = readJson<any[]>('lesson-stacks', []);
  const oldId = localStorage.getItem(stackIdKey);
  const cleaned = existing.filter((s) => s?.id !== oldId && s?.name !== stackName);
  cleaned.push(stack);
  localStorage.setItem('lesson-stacks', JSON.stringify(cleaned));
  localStorage.setItem(stackIdKey, stack.id);
}

/** Ensure the class appears in the selector (local year groups only). */
export function ensureLocalYearGroup(sheetId: string, displayName: string, color: string) {
  const groups = readJson<any[]>('custom-year-groups', []);
  if (!groups.some((g) => g.id === sheetId || g.name === displayName || g.name === sheetId)) {
    groups.push({ id: sheetId, name: displayName || sheetId, color });
    localStorage.setItem('custom-year-groups', JSON.stringify(groups));
  }
  const bands = readJson<any[]>('year-group-bands', []);
  if (!bands.some((b) => b.id === sheetId || b.name === displayName)) {
    bands.push({
      id: sheetId,
      name: displayName || sheetId,
      color,
      classes: [{ id: sheetId, name: displayName || sheetId }],
    });
    localStorage.setItem('year-group-bands', JSON.stringify(bands));
  }

  // Keep existing EYFS/KS1… presets; nest the new class under the matching
  // key-stage section (or Other). Never wipe year-group-sections when hub-seeding.
  try {
    const sections = readJson<any[]>('year-group-sections', []);
    if (!Array.isArray(sections) || sections.length === 0) return;
    const likeGroups = groups.map((g: any) => ({
      id: String(g.id),
      name: String(g.name || g.id),
      color: g.color,
    }));
    const alreadyPlaced = sections.some((s) =>
      (s.yearGroupIds || []).some(
        (token: string) => resolveYearGroupFromToken(likeGroups, token)?.id === sheetId,
      ),
    );
    let next = sections;
    if (!alreadyPlaced) {
      const targetSectionId = getDefaultSectionIdForYearGroup(sheetId, displayName || sheetId);
      if (next.some((s) => s.id === targetSectionId)) {
        next = next.map((s) =>
          s.id === targetSectionId
            ? { ...s, yearGroupIds: [...(s.yearGroupIds || []), sheetId] }
            : s,
        );
      }
      next = mergeSectionsWithYearGroups(
        next,
        likeGroups.map((g) => g.id),
        likeGroups,
      );
    }
    localStorage.setItem('year-group-sections', JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export type LocalObjectiveSeed = {
  yearGroupId: string;
  yearGroupName: string;
  color: string;
  /** Activity year-group / sheet ids this bank applies to (correct KS nesting). */
  linkedYearGroups?: string[];
  areas: {
    id: string;
    name: string;
    objectives: { id: string; code: string; text: string; description?: string }[];
  }[];
};

/** Seed custom objectives into demo-db (and a local mirror) for curriculumType CUSTOM. */
export function seedLocalCurriculumObjectives(seed: LocalObjectiveSeed) {
  const ygs = readDemoTable('custom_objective_year_groups') || [];
  const areas = readDemoTable('custom_objective_areas') || [];
  const objs = readDemoTable('custom_objectives') || [];

  const yg = {
    id: seed.yearGroupId,
    name: seed.yearGroupName,
    description: `${seed.yearGroupName} (prototype)`,
    color: seed.color,
    sort_order: ygs.length,
    is_locked: false,
    linked_year_groups: seed.linkedYearGroups || [],
  };
  const nextYgs = [...ygs.filter((y: any) => y.id !== seed.yearGroupId), yg];

  const nextAreas = areas.filter((a: any) => a.year_group_id !== seed.yearGroupId);
  const nextObjs = objs.filter(
    (o: any) => !seed.areas.some((ar) => ar.objectives.some((ob) => ob.id === o.id)),
  );

  for (const area of seed.areas) {
    nextAreas.push({
      id: area.id,
      year_group_id: seed.yearGroupId,
      name: area.name,
      description: '',
      sort_order: nextAreas.length,
      section: area.name,
    });
    for (const [i, ob] of area.objectives.entries()) {
      nextObjs.push({
        id: ob.id,
        area_id: area.id,
        objective_code: ob.code,
        objective_text: ob.text,
        description: ob.description || '',
        sort_order: i,
      });
    }
  }

  writeDemoTable('custom_objective_year_groups', nextYgs);
  writeDemoTable('custom_objective_areas', nextAreas);
  writeDemoTable('custom_objectives', nextObjs);

  // Non-demo local mirror so ObjectiveSelector can still find codes in notes.
  try {
    localStorage.setItem(
      `prototype-objectives-${seed.yearGroupId}`,
      JSON.stringify(seed),
    );
  } catch {
    /* ignore */
  }
}

export function finishPrototypeSeed(options: {
  activities: Activity[];
  categories: string[];
  categoryMerge: { merged: any[] };
  source: string;
  markerKey: string;
}) {
  starActivityObjectsLocally(options.activities, {
    enableGlobalStarredFirst: true,
    starredFirstCategories: options.categories,
  });
  localStorage.setItem(options.markerKey, '1');
  window.dispatchEvent(
    new CustomEvent(CCD_CATEGORIES_UPDATED_EVENT, {
      detail: { categories: options.categoryMerge.merged, source: options.source },
    }),
  );
  notifyHubActivitiesUpdated(options.source);
}

export function newStackId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}`;
}
