/**
 * iCompose — local-only “How to Compose a Fanfare” showcase seed.
 * Links out to the official paid course; register partner planning on explicit Add.
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
import { highlightPaidHubActivities } from './recentlyAddedActivities';
import { ICC_COURSES, ICC_FANFARE_PDF, ICC_SITE } from './iccBranding';

const SHEET_ID = 'Year 9 Music';
const UNIT = 'How to Compose a Fanfare';
const STACK_NAME = 'iCompose — Fanfare';
const LEVEL = 'KS3';
const YEAR_GROUPS = ['Year 9 Music', 'Year 8 Music', 'Year 9', 'Year 8', 'Year 10 Music'];
const MARKER_KEY = 'ccd-icc-fanfare-seeded-v1';
const STACK_ID_KEY = 'ccd-icc-fanfare-stack-id';
const LESSON_KEYS_KEY = 'ccd-icc-fanfare-lesson-keys';
const SEED_NOTE = 'ICC_SEED:Fanfare';
const COLOR = '#0a1628';
const COURSE_URL = 'https://www.icancompose.com/course/how-to-compose-a-fanfare/';

const CAT = {
  listen: 'iCompose Fanfare — Listen',
  explore: 'iCompose Fanfare — Explore',
  compose: 'iCompose Fanfare — Compose',
  reflect: 'iCompose Fanfare — Reflect',
} as const;
const ALL_CATEGORIES = Object.values(CAT);

function isOwnedCategory(name: string) {
  return name.startsWith('iCompose Fanfare —');
}
function isOwnedActivity(a: Activity) {
  return (
    String((a as any)?.notes || '').includes(SEED_NOTE) ||
    isOwnedCategory(String(a?.category || ''))
  );
}

const SEED_ACTIVITIES: Omit<Activity, 'id'>[] = [
  {
    activity: 'What makes a fanfare?',
    description:
      'Open the iCompose “How to Compose a Fanfare” course overview and list ceremonial features (brass colour, dotted rhythms, leaps, bold dynamics).',
    activityText: 'Skim course landing page; note instruments, rhythm and pitch traits of fanfares.',
    time: 12,
    category: CAT.listen,
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
    activity: 'Fanfare listening detective',
    description:
      'Listen to a short public-domain / teacher-chosen fanfare extract. Mark rhythm snap, open intervals and dynamic contrast.',
    activityText: 'Partner share: one rhythmic feature + one pitch feature you heard.',
    time: 15,
    category: CAT.listen,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '1',
    link: COURSE_URL,
    resourceLink: ICC_FANFARE_PDF,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Compose a fanfare rhythm',
    description:
      'Draft a 4–8 bar fanfare rhythm using dotted notes, rests and repeated short motifs (original CCDesigner outline; course content stays on iCompose).',
    activityText: 'Clap → notate → refine for ceremonial “snap”.',
    time: 18,
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
    activity: 'Add pitch — leaps and repeated notes',
    description:
      'Set the rhythm with bold leaps and repeated notes typical of ceremonial fanfares. Keep range practical for classroom instruments / DAW.',
    activityText: 'Compose 4–8 bars; play/share; tweak leaps for clarity.',
    time: 20,
    category: CAT.compose,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '1',
    link: ICC_SITE,
    resourceLink: COURSE_URL,
    notes: SEED_NOTE,
  } as any,
  {
    activity: 'Perform, peer feedback, next steps',
    description:
      'Share drafts. Two stars and a wish focused on rhythm snap and bold intervals. Signpost full Fanfare course pathway on iCompose.',
    activityText: 'Gallery listen; exit ticket: one fanfare feature to improve next lesson.',
    time: 10,
    category: CAT.reflect,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: '1',
    link: ICC_COURSES,
    resourceLink: ICC_FANFARE_PDF,
    notes: SEED_NOTE,
  } as any,
];

function buildShowcaseLesson(activities: Activity[]): LessonData {
  return {
    title: 'How to Compose a Fanfare',
    lessonName: 'KS3 showcase lesson · iCompose',
    unitName: UNIT,
    teachingUnit: UNIT,
    activities,
    duration: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    orderedActivities: activities,
    categoryOrder: ALL_CATEGORIES,
    grouped: Object.fromEntries(
      ALL_CATEGORIES.map((c) => [c, activities.filter((a) => a.category === c)]),
    ),
    academicYear: '2026-2027',
    customHeader: 'iCompose — CCDesigner prototype showcase',
    customFooter:
      'Demo lesson plan — original CCDesigner outline linking to icancompose.com (Fanfare course)',
    learningOutcome:
      'Pupils identify ceremonial fanfare features and compose a short rhythm-then-pitch fanfare idea.',
    successCriteria:
      'We can name at least two fanfare features.\nWe notate a clear 4–8 bar rhythm with snap.\nWe add pitch using leaps and/or repeated notes.\nWe give useful peer feedback.',
    introduction:
      'Hook with ceremonial fanfare listening. Agree features: brass colour, dotted rhythm, leaps, bold dynamics. Open official course page for pathway context.',
    mainActivity:
      'Listening detective → compose fanfare rhythm → add pitch with leaps/repeated notes → short share.',
    plenary:
      'Peer feedback (two stars and a wish); exit ticket; signpost full How to Compose a Fanfare course on iCompose.',
    vocabulary:
      'Fanfare · ceremonial · dotted rhythm · leap · interval · dynamics · motif · brass',
    keyQuestions:
      'What makes this sound ceremonial?\nWhere is the rhythmic snap?\nWhich leaps feel bold but singable?\nWhat would you add next (intro, contrast, ending)?',
    resources:
      'Classroom instruments or DAW · manuscript / notation app · whiteboard · timer · access to icancompose.com Fanfare course',
    differentiation:
      'Support: given rhythm cell bank; limited pitch set.\nChallenge: add intro/ending or contrasting section.\nEAL: gesture + listening first; bilingual vocabulary cards.',
    assessment:
      'Formative observation of rhythm and pitch choices; peer feedback quality; exit ticket.',
    resourceLink: COURSE_URL,
    additionalLinks: `${ICC_FANFARE_PDF}\n${ICC_COURSES}`,
    notes: `${SEED_NOTE}. Prototype inspired by iCompose public Fanfare course listing — not a copy of paid course content.`,
  } as any;
}

function registerFanfarePlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.icompose;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'how-to-compose-a-fanfare',
    projectTitle: 'How to Compose a Fanfare',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export const ICC_FANFARE_SHOWCASE = {
  title: 'How to Compose a Fanfare',
  productUrl: COURSE_URL,
  pdfUrl: ICC_FANFARE_PDF,
  agesLabel: 'KS3 / GCSE · Beginner–Intermediate',
  durationLabel: '≈ 75 minutes (showcase)',
  summary:
    'Full CCDesigner lesson demo inspired by the paid iCompose Fanfare course — timed activities ready for Lesson Library and PDF export.',
};

export async function setupICCFanfare(options?: {
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
        registerFanfarePlanning(existing, readJson<string[]>(LESSON_KEYS_KEY, []));
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

  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(1, existingLessonData.lessonNumbers || []);
  const lessonNum = lessonNumbers[0];

  const seeded = SEED_ACTIVITIES.map(
    (a) =>
      ({
        ...a,
        lessonNumber: String(lessonNum),
        unitLesson: 1,
        notes: SEED_NOTE,
        level: LEVEL,
      }) as any,
  );
  const activities = mergeActivitiesLocal(seeded, isOwnedActivity);

  const lessons = { [lessonNum]: buildShowcaseLesson(activities) };
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('icc-fanfare'),
    name: STACK_NAME,
    description:
      'Local prototype for iCompose How to Compose a Fanfare — links to official ICC pages only.',
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
    source: 'icc-fanfare-seed',
    markerKey: MARKER_KEY,
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: 'icompose',
    partnerLabel: 'iCompose',
    pickTitles: [
      'What makes a fanfare?',
      'Compose a fanfare rhythm',
      'Add pitch — leaps and repeated notes',
      'Perform, peer feedback, next steps',
    ],
    fallbackCount: 4,
    categories: ALL_CATEGORIES,
  });

  if (shouldRegister) {
    registerFanfarePlanning(activities, lessonPayload.writtenNumbers);
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
  (window as any).setupICCFanfare = setupICCFanfare;
}
