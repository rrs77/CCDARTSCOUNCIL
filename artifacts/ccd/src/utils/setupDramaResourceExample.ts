/**
 * Drama Resource (David Farmer) — local showcase seed for Partner Hub demos.
 *
 * Seeds a full lesson plan (outcomes, criteria, intro/main/plenary, vocabulary,
 * differentiation, assessment, timed activities) so PDF export demonstrates
 * CCDesigner capability. Links out to dramaresource.com; paid PDFs are never copied.
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
  seedLocalCurriculumObjectives,
  type LocalObjectiveSeed,
} from './prototypeLocalSeed';
import { getActivityStarKey } from './activityStars';
import {
  PARTNER_PLANNING_ORGS,
  registerPartnerPlanningPack,
} from './partnerPlanning';
import {
  DR_DRAMA_GAMES,
  DR_JUST_ADD_DRAMA,
  DR_SITE,
  DR_STRATEGIES,
  DR_TEN_SECOND_OBJECTS,
} from './dramaResourceBranding';
import { highlightPaidHubActivities } from './recentlyAddedActivities';

const SHEET_ID = 'Year 5 Drama';
const UNIT = 'Ten Second Objects → Story Shapes';
const STACK_NAME = 'Drama Resource — Showcase Lesson';
const YEAR_GROUPS = ['Year 5 Drama', 'Year 6 Drama', 'Year 5', 'Year 6', 'Year 4 Drama', 'Year 4'];
const MARKER_KEY = 'ccd-dr-ten-second-objects-seeded-v2';
const STACK_ID_KEY = 'ccd-dr-ten-second-objects-stack-id';
const LESSON_KEYS_KEY = 'ccd-dr-ten-second-objects-lesson-keys';
const SEED_NOTE = 'DR_SEED:TenSecondObjectsShowcase';
const COLOR = '#0F3D2E';
const LEVEL = 'KS2';

const PDF_OVERVIEW = '/partners/dramaresource/dr-ten-second-objects-lesson-plan.pdf';

const CAT = {
  warmUp: 'Drama Resource — Warm-ups',
  explore: 'Drama Resource — Explore',
  create: 'Drama Resource — Create',
  reflect: 'Drama Resource — Reflect',
} as const;
const ALL_CATEGORIES = Object.values(CAT);

const OBJ = {
  ygId: 'proto-dr-ks2-drama',
  collab: 'proto-dr-ks2-c1',
  physical: 'proto-dr-ks2-p1',
  invent: 'proto-dr-ks2-d1',
  speak: 'proto-dr-ks2-s1',
};

const CURRICULUM: LocalObjectiveSeed = {
  yearGroupId: OBJ.ygId,
  yearGroupName: 'KS2 Drama — Drama Resource (prototype)',
  color: COLOR,
  linkedYearGroups: YEAR_GROUPS,
  areas: [
    {
      id: 'proto-dr-area-creating',
      name: 'Creating and Performing',
      objectives: [
        {
          id: OBJ.collab,
          code: 'KS2-DR-C1',
          text: 'Collaborate quickly in a small group to invent a shared physical image',
          description: 'Ensemble cooperation under time pressure',
        },
        {
          id: OBJ.physical,
          code: 'KS2-DR-P1',
          text: 'Use levels (high / medium / low) and clear shapes so an audience can recognise an object or idea',
          description: 'Physical theatre / mime clarity',
        },
        {
          id: OBJ.invent,
          code: 'KS2-DR-D1',
          text: 'Invent and refine drama ideas linked to a story, theme or location',
          description: 'Creative response to stimulus',
        },
      ],
    },
    {
      id: 'proto-dr-area-speaking',
      name: 'Speaking and Reflecting',
      objectives: [
        {
          id: OBJ.speak,
          code: 'KS2-DR-S1',
          text: 'Explain choices using simple drama vocabulary (freeze-frame, levels, ensemble, stimulus)',
          description: 'Oracy and evaluation',
        },
      ],
    },
  ],
};

const ALL_OBJ_IDS = [OBJ.collab, OBJ.physical, OBJ.invent, OBJ.speak];

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
    activity: 'Focus circle & learning goals',
    category: CAT.warmUp,
    time: 5,
    activityText: 'Gather · share outcomes · set success criteria in child-friendly language',
    description: [
      'Sit or stand in a circle. Share today’s goal: work as a team to make clear body shapes in ten seconds, then turn the best images into a tiny story.',
      'Success check (hold up fingers 1–3): we listen; we use high/medium/low levels; everyone helps.',
      'Safety: no climbing on furniture; freeze safely; respect personal space.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: DR_TEN_SECOND_OBJECTS,
    link: DR_SITE,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: ALL_OBJ_IDS,
  } as any,
  {
    activity: 'Ten Second Objects — practice round',
    category: CAT.warmUp,
    time: 10,
    activityText: 'Groups of 4–6 · countdown 10 → 0 · everyday objects',
    description: [
      'Inspired by David Farmer’s Ten Second Objects (101 Drama Games and Activities) — free game page on dramaresource.com.',
      'Divide into groups of 4–6. Call a simple object first (e.g. car). Count down slowly from ten to zero while groups sculpt the shape with their bodies.',
      'Practice list: washing machine · volcano · pencil sharpener · cuckoo clock · bowl of spaghetti.',
      'Director tip: push for different levels (high / medium / low). Celebrate unique solutions.',
      'Teacher note: keep energy high; spotlight 1–2 groups briefly without long waiting.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: DR_TEN_SECOND_OBJECTS,
    link: DR_DRAMA_GAMES,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.collab, OBJ.physical],
  } as any,
  {
    activity: 'Theme location sculpt',
    category: CAT.explore,
    time: 12,
    activityText: 'Fairground / rainforest / castle · objects that belong there',
    description: [
      'Choose one location (fairground, rainforest, or castle). Each group makes an object that could be found there — still on a ten-second countdown.',
      'Extension from Farmer’s “More Ideas”: letter of the alphabet challenge; objects that change (hatching egg, melting candle); modes of transport.',
      'Add optional sound or micro-movement once the freeze is secure.',
      'Link: use as a physical-theatre idea generator for a topic or story you are teaching.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: DR_TEN_SECOND_OBJECTS,
    link: DR_STRATEGIES,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.physical, OBJ.invent],
  } as any,
  {
    activity: 'Guess our object → freeze gallery',
    category: CAT.explore,
    time: 8,
    activityText: 'Groups invent an object for others to guess · Action Clip optional',
    description: [
      'Groups secretly invent an object; others guess. Optional: Action Clip (clap to bring a freeze-frame briefly to life — see Drama Resource strategies).',
      'Use Spotlight to share without long sits: one group freezes while others watch for 10 seconds.',
      'Collect three “best bits” — clear shape, clever level, funny detail.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: DR_STRATEGIES,
    link: DR_TEN_SECOND_OBJECTS,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.collab, OBJ.speak],
  } as any,
  {
    activity: 'Story shapes sequence',
    category: CAT.create,
    time: 15,
    activityText: 'Three linked freezes: Beginning · Problem · Resolution (+ thought-track)',
    description: [
      'Turn favourite images into a three-frame story: Beginning → Problem → Resolution.',
      'Use Open and Close / freeze-frame sequencing ideas from Drama Resource strategies.',
      'On a signal, thought-track one character in each freeze (one spoken thought).',
      'Optional literacy bridge: write one caption or speech bubble per frame (Drama for Writing).',
      "Support: give sentence starters ('I feel...', 'I want...', 'I am worried that...').",
      'Challenge: add a cross-cut — two groups show parallel scenes that switch on a clap.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: DR_STRATEGIES,
    link: DR_JUST_ADD_DRAMA,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: ALL_OBJ_IDS,
  } as any,
  {
    activity: 'Perform, evaluate, next steps',
    category: CAT.reflect,
    time: 10,
    activityText: 'Gallery share · two stars and a wish · browse related games',
    description: [
      'Half the class watches; half performs their three-frame story (rotate).',
      'Peer feedback with drama vocabulary: ensemble, levels, freeze-frame, clarity, stimulus.',
      'Exit ticket (sticky note or book): one thing that helped the group work quickly; one object or story idea for next lesson.',
      'Teacher follow-up on dramaresource.com: related games (Family Portraits, Imaginarium, Sculptor and Statue) or Just Add Drama toolkit modules.',
    ].join('\n'),
    lessonNumber: 1,
    unitLesson: 1,
    unitName: UNIT,
    teachingUnit: UNIT,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    resourceLink: DR_DRAMA_GAMES,
    link: DR_JUST_ADD_DRAMA,
    notes: SEED_NOTE,
    curriculumType: 'CUSTOM',
    customObjectives: [OBJ.speak],
  } as any,
];

function buildShowcaseLesson(activities: Activity[], lessonNumber: string): LessonData {
  return {
    title: 'Ten Second Objects → Story Shapes',
    lessonName: 'KS2 showcase lesson · Drama Resource (David Farmer)',
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
    curriculumType: 'CUSTOM',
    customObjectives: ALL_OBJ_IDS,
    academicYear: '2026-2027',
    customHeader: 'Drama Resource · David Farmer — CCDesigner prototype showcase',
    customFooter: 'Demo lesson plan — original CCDesigner outline linking to dramaresource.com',
    learningOutcome:
      'Pupils collaborate to create clear physical images in ten seconds and sequence three freeze-frames into a short story, explaining choices with simple drama vocabulary.',
    successCriteria:
      'We work as a team without talking over each other.\nWe use high, medium and low levels so the shape is clear.\nWe can explain what our object or story moment shows.\nEveryone contributes to at least one freeze.',
    introduction:
      'Share the Ten Second Objects challenge (from David Farmer’s 101 Drama Games and Activities). Model one object with volunteers. Agree safety and success criteria. Warm up with a simple car shape before harder objects.',
    mainActivity:
      'Practice round with Farmer’s classic object list → themed location sculpt → invent-and-guess gallery → build a Beginning / Problem / Resolution story sequence with optional thought-tracking and literacy captions.',
    plenary:
      'Perform story shapes to a rotating audience. Peer feedback using drama vocabulary. Exit ticket naming one teamwork skill and one idea for next lesson. Signpost Just Add Drama / related games on dramaresource.com.',
    vocabulary:
      'Freeze-frame · ensemble · levels (high / medium / low) · mime · stimulus · thought-tracking · physical theatre · collaboration',
    keyQuestions:
      'What made your shape easy to recognise?\nHow did levels help?\nWhere did your group decide fastest — and why?\nHow could this game help a story or topic we are studying?',
    resources:
      'Clear space · optional mats · whiteboard for object list · timer/countdown · sticky notes for exit tickets · access to dramaresource.com/ten-second-objects (teacher device)',
    differentiation:
      'Support: smaller groups, pre-agreed roles (base / middle / top), picture prompts, sentence starters for reflection.\nChallenge: changing objects, alphabet objects, cross-cutting between two groups, add sound/movement, write captions.\nEAL: demonstrate visually first; allow mother-tongue planning whisper then perform in English labels.',
    assessment:
      'Formative observation of collaboration and shape clarity; thought-track quality; exit ticket; optional photo of best freeze for floor book / Seesaw (school policy).',
    assessmentObjectives: [
      'KS2-DR-C1 Collaborate to invent a shared physical image',
      'KS2-DR-P1 Use levels and clear shapes for an audience',
      'KS2-DR-D1 Invent and refine ideas from a stimulus',
      'KS2-DR-S1 Explain choices with drama vocabulary',
    ],
    resourceLink: DR_TEN_SECOND_OBJECTS,
    additionalLinks: `${DR_DRAMA_GAMES}\n${DR_STRATEGIES}\n${DR_JUST_ADD_DRAMA}\n${PDF_OVERVIEW}`,
    notes: `${SEED_NOTE}. Full showcase lesson for PDF export. Inspired by public Drama Resource listings (Ten Second Objects, strategies, Just Add Drama) — not a copy of paid course PDFs or books.`,
  } as any;
}

function registerDrPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.dramaresource;
  registerPartnerPlanningPack({
    ...org,
    projectId: 'ten-second-objects-showcase',
    projectTitle: 'Ten Second Objects → Story Shapes',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export const DR_SHOWCASE = {
  title: 'Ten Second Objects → Story Shapes',
  productUrl: DR_TEN_SECOND_OBJECTS,
  justAddDramaUrl: DR_JUST_ADD_DRAMA,
  pdfUrl: PDF_OVERVIEW,
  agesLabel: 'Ages 6+ · KS2 showcase (adaptable)',
  durationLabel: '≈ 60 minutes',
  summary:
    'Full CCDesigner lesson plan demo inspired by David Farmer’s Ten Second Objects — timed activities, outcomes, differentiation and assessment ready for PDF export.',
};

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

  seedLocalCurriculumObjectives(CURRICULUM);
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
        curriculumType: 'CUSTOM',
        level: LEVEL,
      }) as any,
  );
  const activities = mergeActivitiesLocal(seeded, isOwnedActivity);

  const lessons = {
    [lessonNum]: buildShowcaseLesson(activities, lessonNum),
  };
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('dr-tso'),
    name: STACK_NAME,
    description:
      'Full showcase lesson for Drama Resource (David Farmer) — export to PDF to demonstrate CCDesigner lesson-plan depth.',
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
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: 'dramaresource',
    partnerLabel: 'Drama Resource',
    pickTitles: [
      'Ten Second Objects — practice round',
      'Theme location sculpt',
      'Story shapes sequence',
      'Perform, evaluate, next steps',
    ],
    fallbackCount: 4,
    categories: ALL_CATEGORIES,
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
