/**
 * Shared Partner Hub → CCDesigner library seeder.
 *
 * Any hub can define a {@link PartnerHubPackCatalog} (lessons + standalone
 * activities with resource / lesson / audio links) and call
 * {@link addPartnerPackToLibrary} or {@link addPartnerPacksToLibrary}.
 * Reuses the same local prototype stores as LSO / ROH / Jazz North seeds.
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { getActivityStarKey } from './activityStars';
import {
  PARTNER_PLANNING_ORGS,
  registerPartnerPlanningPack,
} from './partnerPlanning';

type PartnerPlanningOrgId = keyof typeof PARTNER_PLANNING_ORGS;
import {
  allocateLessonNumbers,
  ensureLocalYearGroup,
  finishPrototypeSeed,
  mergeActivitiesLocal,
  mergeCategoriesLocal,
  mergeLessonsLocal,
  mergeStackLocal,
  newStackId,
  readJson,
} from './prototypeLocalSeed';
import { highlightPaidHubActivities, type PaidHubPartnerSlug } from './recentlyAddedActivities';

export type PartnerHubActivityDef = {
  /** Stable id fragment used in `_id` / ownership. */
  id: string;
  title: string;
  category: string;
  time?: number;
  description?: string;
  activityText?: string;
  /** Activity / worksheet PDF (or primary classroom file). */
  resourceLink?: string;
  /** Related lesson material (score, guide, or lesson page). */
  lessonLink?: string;
  /** Matching audio ZIP when the activity uses audio. */
  audioLink?: string;
  backingLink?: string;
  videoLink?: string;
  level?: string;
};

export type PartnerHubLessonDef = {
  title: string;
  lessonName?: string;
  unitName: string;
  /** Catalog activity ids included in this lesson plan. */
  activityIds: string[];
  learningOutcome?: string;
  successCriteria?: string;
  introduction?: string;
  mainActivity?: string;
  plenary?: string;
  vocabulary?: string;
  resources?: string;
  differentiation?: string;
  assessment?: string;
  /** Primary lesson resource (often the score / guide PDF). */
  resourceLink?: string;
  additionalLinks?: string;
};

export type PartnerHubPackCatalog = {
  partnerSlug: PaidHubPartnerSlug | string;
  partnerLabel: string;
  packId: string;
  sheetId: string;
  yearGroups: string[];
  color: string;
  level: string;
  seedNote: string;
  markerKey: string;
  stackIdKey: string;
  lessonKeysKey: string;
  stackName: string;
  stackDescription?: string;
  categories: string[];
  activities: PartnerHubActivityDef[];
  lessons: PartnerHubLessonDef[];
  /** Optional partner-planning registration (org must exist in PARTNER_PLANNING_ORGS). */
  planningOrgId?: PartnerPlanningOrgId;
  planningProjectId?: string;
  planningProjectTitle?: string;
  highlightTitles?: string[];
  highlightFallbackCount?: number;
};

export type AddPartnerPackResult =
  | { skipped: true; sheetId: string; packId: string }
  | {
      skipped: false;
      sheetId: string;
      packId: string;
      activities: number;
      lessons: number;
      stackId: string;
    };

function activityFromDef(
  def: PartnerHubActivityDef,
  ctx: {
    unitName: string;
    lessonNumber: string;
    unitLesson: number;
    yearGroups: string[];
    level: string;
    seedNote: string;
  },
): Omit<Activity, 'id'> {
  return {
    activity: def.title,
    category: def.category,
    time: def.time ?? 10,
    activityText: def.activityText || def.title,
    description:
      def.description ||
      [
        def.resourceLink ? `Worksheet / score: ${def.resourceLink}` : null,
        def.lessonLink ? `Related lesson material: ${def.lessonLink}` : null,
        def.audioLink ? `Audio pack: ${def.audioLink}` : null,
      ]
        .filter(Boolean)
        .join('\n') ||
      def.title,
    lessonNumber: ctx.lessonNumber,
    unitLesson: ctx.unitLesson,
    unitName: ctx.unitName,
    teachingUnit: ctx.unitName,
    level: def.level || ctx.level,
    yearGroups: ctx.yearGroups,
    resourceLink: def.resourceLink || '',
    link: def.lessonLink || '',
    musicLink: def.audioLink || '',
    backingLink: def.backingLink || '',
    videoLink: def.videoLink || '',
    vocalsLink: '',
    imageLink: '',
    notes: ctx.seedNote,
    curriculumType: 'CUSTOM',
    _id: `proto-pack-${ctx.seedNote.replace(/\W+/g, '-').toLowerCase()}-${def.id}`,
  } as any;
}

function buildLessonData(
  lesson: PartnerHubLessonDef,
  activities: Activity[],
  categories: string[],
  seedNote: string,
  partnerLabel: string,
): LessonData {
  const categoryOrder = categories.filter((c) => activities.some((a) => a.category === c));
  const ordered =
    categoryOrder.length > 0
      ? categoryOrder
      : [...new Set(activities.map((a) => a.category).filter(Boolean))];
  return {
    title: lesson.title,
    lessonName: lesson.lessonName || lesson.title,
    unitName: lesson.unitName,
    teachingUnit: lesson.unitName,
    activities,
    duration: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    orderedActivities: activities,
    categoryOrder: ordered,
    grouped: Object.fromEntries(ordered.map((c) => [c, activities.filter((a) => a.category === c)])),
    curriculumType: 'CUSTOM',
    academicYear: '2026-2027',
    customHeader: `${partnerLabel} — CCDesigner hub pack`,
    customFooter: `Demo lesson plan seeded from ${partnerLabel} Partner Hub`,
    learningOutcome: lesson.learningOutcome || '',
    successCriteria: lesson.successCriteria || '',
    introduction: lesson.introduction || '',
    mainActivity: lesson.mainActivity || '',
    plenary: lesson.plenary || '',
    vocabulary: lesson.vocabulary || '',
    resources: lesson.resources || '',
    differentiation: lesson.differentiation || '',
    assessment: lesson.assessment || '',
    resourceLink: lesson.resourceLink || '',
    additionalLinks: lesson.additionalLinks || '',
    notes: `${seedNote}. Hub pack lesson for Lesson Library / PDF export.`,
  } as any;
}

/**
 * Seed one partner pack into Activity Library + Lesson Library (local prototype store).
 */
export async function addPartnerPackToLibrary(
  catalog: PartnerHubPackCatalog,
  options?: { force?: boolean; registerPartnerPlanning?: boolean },
): Promise<AddPartnerPackResult> {
  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);

  const isOwned = (a: Activity) =>
    String((a as any)?.notes || '').includes(catalog.seedNote) ||
    String((a as any)?._id || '').includes(`proto-pack-${catalog.seedNote.replace(/\W+/g, '-').toLowerCase()}`);

  const isOwnedCategory = (name: string) => catalog.categories.includes(name);

  if (!force && localStorage.getItem(catalog.markerKey) === '1') {
    if (shouldRegister && catalog.planningOrgId && catalog.planningProjectId) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter(isOwned);
        const org = PARTNER_PLANNING_ORGS[catalog.planningOrgId];
        if (org) {
          registerPartnerPlanningPack({
            ...org,
            projectId: catalog.planningProjectId,
            projectTitle: catalog.planningProjectTitle || catalog.stackName,
            sheetId: catalog.sheetId,
            activityIds: existing.map((a) => getActivityStarKey(a)),
            lessonKeys: readJson<string[]>(catalog.lessonKeysKey, []),
          });
        }
      } catch {
        /* ignore */
      }
    }
    return { skipped: true, sheetId: catalog.sheetId, packId: catalog.packId };
  }

  ensureLocalYearGroup(catalog.sheetId, catalog.sheetId, catalog.color);
  const categoryMerge = mergeCategoriesLocal(
    catalog.categories.map((name) => ({
      name,
      color: catalog.color,
      yearGroups: Object.fromEntries(catalog.yearGroups.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const byId = new Map(catalog.activities.map((a) => [a.id, a]));
  const existingLessonData = readJson<any>(`lesson-data-${catalog.sheetId}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(
    catalog.lessons.length,
    existingLessonData.lessonNumbers || [],
  );

  const seededActivities: Omit<Activity, 'id'>[] = [];
  const lessonsPayload: Record<string, LessonData> = {};
  let unitLesson = 1;

  catalog.lessons.forEach((lesson, idx) => {
    const lessonNum = lessonNumbers[idx];
    const lessonActivityDefs = lesson.activityIds
      .map((id) => byId.get(id))
      .filter(Boolean) as PartnerHubActivityDef[];

    const lessonActs = lessonActivityDefs.map((def) =>
      activityFromDef(def, {
        unitName: lesson.unitName,
        lessonNumber: lessonNum,
        unitLesson,
        yearGroups: catalog.yearGroups,
        level: catalog.level,
        seedNote: catalog.seedNote,
      }),
    );
    unitLesson += 1;

    // Standalone library copies (same links) so Activity Library lists each resource.
    for (const def of lessonActivityDefs) {
      seededActivities.push(
        activityFromDef(def, {
          unitName: lesson.unitName,
          lessonNumber: lessonNum,
          unitLesson: 1,
          yearGroups: catalog.yearGroups,
          level: catalog.level,
          seedNote: catalog.seedNote,
        }),
      );
    }

    const stampedForLesson = lessonActs.map(
      (a, i) =>
        ({
          ...a,
          _id: `${(a as any)._id}-in-lesson-${lessonNum}-${i}`,
          id: `${(a as any)._id}-in-lesson-${lessonNum}-${i}`,
        }) as Activity,
    );

    lessonsPayload[lessonNum] = buildLessonData(
      lesson,
      stampedForLesson,
      catalog.categories,
      catalog.seedNote,
      catalog.partnerLabel,
    );
  });

  // Also seed any catalog activities not referenced by a lesson (rare).
  const referenced = new Set(catalog.lessons.flatMap((l) => l.activityIds));
  for (const def of catalog.activities) {
    if (referenced.has(def.id)) continue;
    seededActivities.push(
      activityFromDef(def, {
        unitName: catalog.lessons[0]?.unitName || catalog.stackName,
        lessonNumber: lessonNumbers[0] || '1',
        unitLesson: 1,
        yearGroups: catalog.yearGroups,
        level: catalog.level,
        seedNote: catalog.seedNote,
      }),
    );
  }

  const activities = mergeActivitiesLocal(seededActivities as any, isOwned);
  const primaryUnit = catalog.lessons[0]?.unitName || catalog.stackName;
  const lessonPayload = mergeLessonsLocal(
    catalog.sheetId,
    lessonsPayload,
    catalog.seedNote,
    catalog.lessonKeysKey,
    primaryUnit,
  );

  const lessonStack: StackedLesson = {
    id: newStackId(`pack-${catalog.packId}`),
    name: catalog.stackName,
    description:
      catalog.stackDescription ||
      `${catalog.partnerLabel} hub pack — lessons + activities for Lesson Library / Activity Library.`,
    color: catalog.color,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, catalog.stackIdKey, catalog.stackName);

  finishPrototypeSeed({
    activities,
    categories: catalog.categories,
    categoryMerge,
    source: `partner-pack-${catalog.partnerSlug}-${catalog.packId}`,
    markerKey: catalog.markerKey,
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: catalog.partnerSlug as PaidHubPartnerSlug,
    partnerLabel: catalog.partnerLabel,
    pickTitles: catalog.highlightTitles || [],
    fallbackCount: catalog.highlightFallbackCount ?? 4,
    categories: catalog.categories,
  });

  if (shouldRegister && catalog.planningOrgId && catalog.planningProjectId) {
    const org = PARTNER_PLANNING_ORGS[catalog.planningOrgId];
    if (org) {
      registerPartnerPlanningPack({
        ...org,
        projectId: catalog.planningProjectId,
        projectTitle: catalog.planningProjectTitle || catalog.stackName,
        sheetId: catalog.sheetId,
        activityIds: activities.map((a) => getActivityStarKey(a)),
        lessonKeys: lessonPayload.writtenNumbers,
      });
    }
  }

  return {
    skipped: false,
    sheetId: catalog.sheetId,
    packId: catalog.packId,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
  };
}

/**
 * Seed multiple packs (e.g. “Add all lessons and activities”).
 * Uses a shared marker when `combinedMarkerKey` is provided so repeat clicks skip.
 */
export async function addPartnerPacksToLibrary(
  catalogs: PartnerHubPackCatalog[],
  options?: {
    force?: boolean;
    registerPartnerPlanning?: boolean;
    combinedMarkerKey?: string;
  },
): Promise<{
  skipped: boolean;
  packs: AddPartnerPackResult[];
  activities: number;
  lessons: number;
  sheetIds: string[];
}> {
  const combinedKey = options?.combinedMarkerKey;
  if (!options?.force && combinedKey && localStorage.getItem(combinedKey) === '1') {
    return {
      skipped: true,
      packs: catalogs.map((c) => ({ skipped: true as const, sheetId: c.sheetId, packId: c.packId })),
      activities: 0,
      lessons: 0,
      sheetIds: [...new Set(catalogs.map((c) => c.sheetId))],
    };
  }

  const packs: AddPartnerPackResult[] = [];
  let activities = 0;
  let lessons = 0;
  for (const catalog of catalogs) {
    const result = await addPartnerPackToLibrary(catalog, {
      force: true,
      registerPartnerPlanning: options?.registerPartnerPlanning,
    });
    packs.push(result);
    if (!result.skipped) {
      activities += result.activities;
      lessons += result.lessons;
    }
  }

  if (combinedKey) {
    localStorage.setItem(combinedKey, '1');
  }

  return {
    skipped: false,
    packs,
    activities,
    lessons,
    sheetIds: [...new Set(catalogs.map((c) => c.sheetId))],
  };
}
