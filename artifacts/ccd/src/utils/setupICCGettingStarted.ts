/**
 * iCompose — local-only “Composition – how to get started!” stubs.
 * Links out to official course pages; register partner planning only on explicit Add.
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
import { ICC_KS3_TRACK, ICC_SITE } from './iccBranding';

const SHEET_ID = 'Year 8 Music';
const UNIT = 'Getting Started with Composition';
const STACK_NAME = 'iCompose — Getting Started';
const LEVEL = 'KS3';
const YEAR_GROUPS = ['Year 8 Music', 'Year 9 Music', 'Year 8', 'Year 9'];
const MARKER_KEY = 'ccd-icc-getting-started-seeded-v1';
const STACK_ID_KEY = 'ccd-icc-getting-started-stack-id';
const LESSON_KEYS_KEY = 'ccd-icc-getting-started-lesson-keys';
const SEED_NOTE = 'ICC_SEED:GettingStarted';
const COLOR = '#1F4B7A';
const COURSE_URL = 'https://www.icancompose.com/course/getting-started-with-composition/';

const CAT = {
  listen: 'iCompose — Listen',
  explore: 'iCompose — Explore',
  compose: 'iCompose — Compose',
} as const;
const ALL_CATEGORIES = Object.values(CAT);

function isOwnedCategory(name: string) {
  return (
    name.startsWith('iCompose —') ||
    name.startsWith('I Can Compose —') ||
    name.startsWith('ICC')
  );
}
function isOwnedActivity(a: Activity) {
  return (
    String((a as any)?.notes || '').includes('ICC_SEED') ||
    isOwnedCategory(String(a?.category || ''))
  );
}

const SEED_ACTIVITIES: Omit<Activity, 'id'>[] = [
  {
    activity: 'Course overview — how to get started',
    description:
      'Open the free iCompose “Composition – how to get started!” course and note the lesson pathway for your class.',
    activityText: 'Skim the course landing page; list which lessons suit your KS3 scheme.',
    time: 15,
    category: CAT.explore,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '1',
    link: COURSE_URL,
    resourceLink: COURSE_URL,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Listening starters from ICC free course',
    description:
      'Use exemplar listening ideas from the Getting Started course (open official materials on iCompose).',
    activityText: 'Pick one listening extract from the course; discuss melody/rhythm/texture with the class.',
    time: 20,
    category: CAT.listen,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '2',
    link: COURSE_URL,
    resourceLink: ICC_KS3_TRACK,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'First composition sketch',
    description:
      'Prototype classroom task inspired by ICC Getting Started — students draft a short melodic idea (original CCDesigner outline; course content stays on ICC).',
    activityText: 'Compose 4–8 bars; share; refine using course success criteria when accessed on ICC.',
    time: 30,
    category: CAT.compose,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '3',
    link: ICC_SITE,
    resourceLink: COURSE_URL,
    notes: SEED_NOTE,
  } as any,
];

function buildLessons(
  activities: Activity[],
  lessonNumbers: string[],
): Record<string, LessonData> {
  const titles = [
    'Meet the Getting Started course',
    'Listening into composing',
    'First sketch and refine',
  ];
  const lessons: Record<string, LessonData> = {};
  lessonNumbers.forEach((num, i) => {
    const n = i + 1;
    const acts = activities.filter(
      (a) => String(a.lessonNumber) === String(n) || (a as any).unitLesson === n,
    );
    lessons[num] = {
      title: titles[i] || `ICC lesson ${n}`,
      lessonName: titles[i],
      unitName: UNIT,
      teachingUnit: UNIT,
      activities: acts,
      duration: acts.reduce((s, a) => s + (a.time || 0), 0),
      notes: `${SEED_NOTE}. Prototype inspired by iCompose public course listings — not a copy of paid content.`,
      resourceLink: COURSE_URL,
      link: ICC_KS3_TRACK,
    } as any;
  });
  return lessons;
}

function registerIccPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.icompose;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'getting-started-composition',
    projectTitle: 'Composition – how to get started!',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export async function setupICCGettingStarted(options?: {
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
        registerIccPlanning(existing, readJson<string[]>(LESSON_KEYS_KEY, []));
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
  const lessonNumbers = allocateLessonNumbers(3, existingLessonData.lessonNumbers || []);
  const lessons = buildLessons(activities, lessonNumbers);
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('icc-start'),
    name: STACK_NAME,
    description:
      'Local prototype for iCompose free Getting Started course — links to official ICC pages only.',
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
    source: 'icc-getting-started-seed',
    markerKey: MARKER_KEY,
  });

  if (shouldRegister) {
    registerIccPlanning(activities, lessonPayload.writtenNumbers);
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
  (window as any).setupICCGettingStarted = setupICCGettingStarted;
}
