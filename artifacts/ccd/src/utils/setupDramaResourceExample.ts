/**
 * Drama Resource — local-only “Ten Second Objects” planning stubs.
 * Links out to official Drama Resource pages; register partner planning only on explicit Add.
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
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
import { getActivityStarKey } from './activityStars';
import {
  PARTNER_PLANNING_ORGS,
  registerPartnerPlanningPack,
} from './partnerPlanning';
import {
  DR_DRAMA_GAMES,
  DR_SITE,
  DR_TEN_SECOND_OBJECTS,
} from './dramaResourceBranding';

const SHEET_ID = 'Year 5 Drama';
const UNIT = 'Drama Games — Ten Second Objects';
const STACK_NAME = 'Drama Resource — Ten Second Objects';
const YEAR_GROUPS = ['Year 5 Drama', 'Year 6 Drama', 'Year 5', 'Year 6'];
const MARKER_KEY = 'ccd-dr-ten-second-objects-seeded-v1';
const STACK_ID_KEY = 'ccd-dr-ten-second-objects-stack-id';
const LESSON_KEYS_KEY = 'ccd-dr-ten-second-objects-lesson-keys';
const SEED_NOTE = 'DR_SEED:TenSecondObjects';
const COLOR = '#0F3D2E';

const CAT = {
  warmUp: 'Drama Resource — Warm-ups',
  explore: 'Drama Resource — Explore',
  reflect: 'Drama Resource — Reflect',
} as const;
const ALL_CATEGORIES = Object.values(CAT);

function isOwnedCategory(name: string) {
  return name.startsWith('Drama Resource —') || name.startsWith('DR ');
}
function isOwnedActivity(a: Activity) {
  return (
    String((a as any)?.notes || '').includes('DR_SEED') ||
    isOwnedCategory(String(a.category || ''))
  );
}

const SEED_ACTIVITIES: Partial<Activity>[] = [
  {
    activity: 'Introduce Ten Second Objects',
    category: CAT.warmUp,
    time: 10,
    description:
      'Open the free Drama Resource Ten Second Objects page and note how groups sculpt an object with their bodies in ten seconds.',
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    resourceLink: DR_TEN_SECOND_OBJECTS,
    link: DR_TEN_SECOND_OBJECTS,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Play: round one objects',
    category: CAT.explore,
    time: 15,
    description:
      'In small groups, make everyday objects on a count of ten. Share one freeze and discuss clarity of shape.',
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    resourceLink: DR_TEN_SECOND_OBJECTS,
    link: DR_DRAMA_GAMES,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Theme variations',
    category: CAT.explore,
    time: 15,
    description:
      'Repeat with a curriculum or story theme (e.g. rainforest, castle, vehicle). Link to literacy or topic work.',
    lessonNumber: 2,
    unitLesson: 2,
    unitName: UNIT,
    teachingUnit: UNIT,
    yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    resourceLink: DR_TEN_SECOND_OBJECTS,
    link: DR_SITE,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Reflect and extend',
    category: CAT.reflect,
    time: 10,
    description:
      'Discuss collaboration and quick decision-making. Browse related Drama Resource games for the next lesson.',
    lessonNumber: 2,
    unitLesson: 2,
    unitName: UNIT,
    teachingUnit: UNIT,
    yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    resourceLink: DR_DRAMA_GAMES,
    link: DR_SITE,
    notes: SEED_NOTE,
  } as any,
];

function buildLessons(
  activities: Activity[],
  lessonNumbers: string[],
): Record<string, LessonData> {
  const titles = ['Meet Ten Second Objects', 'Theme and extend'];
  const lessons: Record<string, LessonData> = {};
  lessonNumbers.forEach((num, i) => {
    const n = i + 1;
    const acts = activities.filter(
      (a) => String(a.lessonNumber) === String(n) || (a as any).unitLesson === n,
    );
    lessons[num] = {
      title: titles[i] || `Drama Resource lesson ${n}`,
      lessonName: titles[i],
      unitName: UNIT,
      teachingUnit: UNIT,
      activities: acts,
      duration: acts.reduce((s, a) => s + (a.time || 0), 0),
      notes: `${SEED_NOTE}. Prototype inspired by Drama Resource public game listings — not a copy of paid PDFs.`,
      resourceLink: DR_TEN_SECOND_OBJECTS,
      link: DR_DRAMA_GAMES,
    } as any;
  });
  return lessons;
}

function registerDrPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.dramaresource;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'ten-second-objects',
    projectTitle: 'Ten Second Objects',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export async function setupDramaResourceExample(options?: {
  force?: boolean;
  registerPartnerPlanning?: boolean;
}) {
  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);

  if (!force && localStorage.getItem(MARKER_KEY) === '1') {
    if (shouldRegister) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter((a) =>
          isOwnedActivity(a),
        );
        registerDrPlanning(existing, readJson<string[]>(LESSON_KEYS_KEY, []));
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: SHEET_ID };
  }

  ensureLocalYearGroup(SHEET_ID, SHEET_ID, COLOR);
  const categoryMerge = mergeCategoriesLocal(
    ALL_CATEGORIES.map((name) => ({
      name,
      color: COLOR,
      yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const activities = mergeActivitiesLocal(
    SEED_ACTIVITIES.map((a) => ({ ...a, notes: SEED_NOTE }) as any),
    isOwnedActivity,
  );

  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(2, existingLessonData.lessonNumbers || []);
  const lessons = buildLessons(activities, lessonNumbers);
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('dr-tso'),
    name: STACK_NAME,
    description:
      'Local prototype for Drama Resource Ten Second Objects — links to official dramaresource.com pages only.',
    color: COLOR,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, STACK_ID_KEY, STACK_NAME);

  finishPrototypeSeed({
    activities,
    categories: ALL_CATEGORIES,
    categoryMerge,
    source: 'drama-resource-ten-second-objects-seed',
    markerKey: MARKER_KEY,
  });

  if (shouldRegister) {
    registerDrPlanning(activities, lessonPayload.writtenNumbers);
  }

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: SHEET_ID,
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupDramaResourceExample = setupDramaResourceExample;
}
