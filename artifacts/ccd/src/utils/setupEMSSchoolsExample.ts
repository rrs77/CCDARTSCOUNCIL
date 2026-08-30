/**
 * Essex Music Service — local-only schools brochure planner stubs.
 * Activities/lessons link to the official Music Service Schools digital brochure PDF.
 * Register partner planning only when called with registerPartnerPlanning: true (hub Add).
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
  EMS_CURRICULUM_PAGE,
  EMS_FOLDER_NAME,
  EMS_SCHOOLS_BROCHURE_PDF,
  EMS_SCHOOLS_BROCHURE_TITLE,
  EMS_SITE,
  EMS_YOUTUBE,
} from './emsBranding';

const SHEET_ID = 'Year 7 Music';
const UNIT = 'EMS Schools Provision';
const STACK_NAME = 'Essex Music Service — Schools brochure';
const LEVEL = 'KS3';
const YEAR_GROUPS = ['Year 7 Music', 'Year 8 Music', 'Year 7', 'Year 8'];
const MARKER_KEY = 'ccd-ems-schools-seeded-v1';
const STACK_ID_KEY = 'ccd-ems-schools-stack-id';
const LESSON_KEYS_KEY = 'ccd-ems-schools-lesson-keys';
const SEED_NOTE = 'EMS_SEED:SchoolsBrochure';
const COLOR = '#330968';

const CAT = {
  explore: 'EMS — Explore brochure',
  curriculum: 'EMS — Curriculum platforms',
  workshops: 'EMS — Workshops & CPD',
} as const;
const ALL_CATEGORIES = Object.values(CAT);

function isOwnedCategory(name: string) {
  return name.startsWith('EMS —') || name.startsWith('EMS ');
}
function isOwnedActivity(a: Activity) {
  return (
    String((a as any)?.notes || '').includes('EMS_SEED') ||
    isOwnedCategory(String(a?.category || ''))
  );
}

const SEED_ACTIVITIES: Omit<Activity, 'id'>[] = [
  {
    activity: 'Browse Music Service Schools brochure',
    description:
      'Open the Essex Music Service Schools digital brochure and note provision options relevant to your school (Play-It!, curriculum resources, workshops, CPD).',
    activityText: 'Scan brochure sections; list three offers to discuss with your music lead.',
    time: 20,
    category: CAT.explore,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '1',
    link: EMS_SITE,
    resourceLink: EMS_SCHOOLS_BROCHURE_PDF,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Map curriculum platforms (Charanga / YuStudio / Focus on Sound)',
    description:
      'From the curriculum & CPD page and brochure, identify which digital platforms fit your key stages.',
    activityText: 'Tick platforms for Primary / Secondary / SEND; open EMS curriculum page for current offer.',
    time: 25,
    category: CAT.curriculum,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '2',
    link: EMS_CURRICULUM_PAGE,
    resourceLink: EMS_SCHOOLS_BROCHURE_PDF,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Plan a workshop or CPD next step',
    description:
      'Use brochure workshop and School Music CPD sections to draft one booking enquiry for EMS.',
    activityText: 'Draft enquiry notes; watch EMS YouTube channel for flavour of delivery.',
    time: 20,
    category: CAT.workshops,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '3',
    link: EMS_YOUTUBE,
    resourceLink: EMS_SCHOOLS_BROCHURE_PDF,
    videoLink: 'https://youtu.be/vu2oe0_OBT0',
    notes: SEED_NOTE,
  } as any,
];

function buildLessons(
  activities: Activity[],
  lessonNumbers: string[],
): Record<string, LessonData> {
  const byLesson = (n: number) =>
    activities.filter((a) => String(a.lessonNumber) === String(n) || (a as any).unitLesson === n);
  const titles = [
    'Explore the schools brochure',
    'Curriculum resource platforms',
    'Workshops, CPD and next steps',
  ];
  const lessons: Record<string, LessonData> = {};
  lessonNumbers.forEach((num, i) => {
    const n = i + 1;
    const acts = byLesson(n);
    lessons[num] = {
      title: titles[i] || `EMS lesson ${n}`,
      lessonName: titles[i],
      unitName: UNIT,
      teachingUnit: UNIT,
      activities: acts,
      duration: acts.reduce((s, a) => s + (a.time || 0), 0),
      notes: `${SEED_NOTE}. Prototype planner linking to ${EMS_SCHOOLS_BROCHURE_TITLE}. Not official EMS content.`,
      resourceLink: EMS_SCHOOLS_BROCHURE_PDF,
      link: EMS_CURRICULUM_PAGE,
    } as any;
  });
  return lessons;
}

function registerEmsPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.ems;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'ems-schools-brochure',
    projectTitle: EMS_SCHOOLS_BROCHURE_TITLE,
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export async function setupEMSSchoolsExample(options?: {
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
        registerEmsPlanning(existing, readJson<string[]>(LESSON_KEYS_KEY, []));
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
    id: newStackId('ems-schools'),
    name: STACK_NAME,
    description: `Local prototype planner for ${EMS_FOLDER_NAME}. Links to the official schools digital brochure PDF.`,
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
    source: 'ems-schools-seed',
    markerKey: MARKER_KEY,
  });

  if (shouldRegister) {
    registerEmsPlanning(activities, lessonPayload.writtenNumbers);
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
  (window as any).setupEMSSchoolsExample = setupEMSSchoolsExample;
}
