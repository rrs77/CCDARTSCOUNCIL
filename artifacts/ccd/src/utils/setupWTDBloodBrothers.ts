/**
 * GCSE Drama — Blood Brothers (We Teach Drama–inspired prototype).
 *
 * Original CCDesigner outlines inspired by publicly described We Teach Drama
 * “Revise Blood Brothers” scheme / CPD positioning for AQA GCSE Drama.
 * Does NOT include paid/copyrighted pack content.
 *
 * Paid hub pack: only seeds / registers / stars when the user clicks
 * “Add to CCDesigner” on /weteachdrama (registerPartnerPlanning: true).
 * Not auto-seeded on demo activate.
 *
 * Usage: await setupWTDBloodBrothers({ force: true, registerPartnerPlanning: true })
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { WTD_BB_PREFIX, WTD_LOGO_SRC, WTD_SITE } from './wtdBranding';
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
} from './prototypeLocalSeed';
import { getActivityStarKey } from './activityStars';
import {
  PARTNER_PLANNING_ORGS,
  registerPartnerPlanningPack,
} from './partnerPlanning';
import { highlightPaidHubActivities } from './recentlyAddedActivities';

/** Curated subset surfaced in Activity Library → Recently added (with star). */
const WTD_BB_FEATURED_TITLES = [
  'Status continuum',
  'Class divide freeze-frames',
  'Twin mirror / contrast',
  'Design mood boards',
  'Timed performer response',
];

const SHEET_ID = 'Year 11 Drama (GCSE)';
const UNIT = 'Blood Brothers';
const STACK_NAME = 'Blood Brothers (WTD GCSE Drama)';
const LEVEL = 'KS4 GCSE';
const YEAR_GROUPS = ['Year 11 Drama (GCSE)', 'Year 10 Drama (GCSE)', 'Year 10', 'Year 11'];
const MARKER_KEY = 'ccd-wtd-bb-seeded-v3';
const STACK_ID_KEY = 'ccd-wtd-bb-lesson-stack-id';
const LESSON_KEYS_KEY = 'ccd-wtd-bb-lesson-keys';
const ACADEMIC_YEAR = '2026-2027';
const SEED_NOTE = 'WTD_BB_SEED:Blood Brothers';
const PDF = '/examples/gcse-drama-blood-brothers-aqa-pack.pdf';
const PDF_SCENES = '/examples/gcse-drama-blood-brothers-scene-notes.pdf';
const SHOP_IMG = '/partners/weteachdrama/shop-catalogue.png';

const CAT = {
  warmup: `${WTD_BB_PREFIX} — Warm-up`,
  explore: `${WTD_BB_PREFIX} — Explore`,
  create: `${WTD_BB_PREFIX} — Create`,
  perform: `${WTD_BB_PREFIX} — Perform / Evaluate`,
} as const;

const ALL_CATEGORIES = Object.values(CAT);

/**
 * Stable IDs aligned with demoPrototypeCurriculum AQA bank + secondary Y11 drama
 * snapshot IDs so hub seed and timetable prototype share the same standards.
 */
const OBJ = {
  ygId: 'demo-yg-aqa-drama',
  /** demo-aqa-dr-c3-1 */
  interpret: 'demo-aqa-dr-c3-1',
  /** demo-aqa-dr-c3-2 */
  performerSkills: 'demo-aqa-dr-c3-2',
  /** demo-aqa-dr-c3-3 */
  contextThemes: 'demo-aqa-dr-c3-3',
  /** demo-aqa-dr-lt-1 */
  liveTheatre: 'demo-aqa-dr-lt-1',
  design1: 'proto-bb-d1',
  /** Y11 Drama secondary bank (snapshot) — KS4 alignment */
  y11p1: '299d2808-a0ef-436f-b664-2040bbee2669',
  y11u1: '1d099f92-e128-4591-89bc-b4393116501e',
  y11u2: 'bc2e97c1-78fa-4a93-9a2f-0c2979ba6159',
};

const ALL_BB_OBJECTIVES = [
  OBJ.interpret,
  OBJ.performerSkills,
  OBJ.contextThemes,
  OBJ.liveTheatre,
  OBJ.design1,
  OBJ.y11p1,
  OBJ.y11u1,
  OBJ.y11u2,
];

const CURRICULUM = {
  yearGroupId: OBJ.ygId,
  yearGroupName: 'AQA GCSE Drama',
  color: '#DC2626',
  linkedYearGroups: [
    ...YEAR_GROUPS,
    'Year 10 Drama',
    'Year 11 Drama',
  ],
  areas: [
    {
      id: 'demo-area-aqa-c3',
      name: 'Texts in Practice / Set Text Study',
      objectives: [
        {
          id: OBJ.interpret,
          code: 'AQA-C3-1',
          text: 'Interpret a set text (Blood Brothers) showing understanding of character, context and theatrical style',
          description: 'Set text interpretation',
        },
        {
          id: OBJ.performerSkills,
          code: 'AQA-C3-2',
          text: 'Explain how vocal, physical and proxemic choices communicate meaning for a named character',
          description: 'Performer skills',
        },
        {
          id: OBJ.contextThemes,
          code: 'AQA-C3-3',
          text: 'Analyse how social class, nature vs nurture and 1980s Liverpool context shape Blood Brothers',
          description: 'Context and themes',
        },
        {
          id: OBJ.design1,
          code: 'AQA-C3-X1',
          text: 'Propose costume, set or lighting ideas that clarify class divide and atmosphere',
          description: 'Design concepts',
        },
      ],
    },
    {
      id: 'demo-area-aqa-live',
      name: 'Live Theatre Evaluation',
      objectives: [
        {
          id: OBJ.liveTheatre,
          code: 'AQA-LT-1',
          text: 'Analyse and evaluate live theatre using AQA subject terminology (performer and design)',
          description: 'Live theatre analysis',
        },
      ],
    },
  ],
};

type SeedActivity = Omit<
  Activity,
  'id' | '_id' | 'videoLink' | 'musicLink' | 'backingLink' | 'vocalsLink' | 'imageLink' | 'resourceLink'
> & {
  videoLink?: string;
  musicLink?: string;
  backingLink?: string;
  vocalsLink?: string;
  imageLink?: string;
  resourceLink?: string;
  unitLesson: number;
};

function act(
  partial: Omit<SeedActivity, 'level' | 'yearGroups' | 'teachingUnit' | 'unitName' | 'link' | 'lessonNumber'> & {
    link?: string;
    category: string;
    unitLesson: number;
  },
): SeedActivity {
  return {
    ...partial,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: String(partial.unitLesson),
    link: partial.link ?? WTD_SITE,
    videoLink: partial.videoLink || '',
    musicLink: partial.musicLink || '',
    backingLink: '',
    resourceLink: partial.resourceLink || PDF,
    vocalsLink: '',
    imageLink: partial.imageLink || WTD_LOGO_SRC,
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'We Teach Drama / prototype resources',
  };
}

const LESSON_META: Record<
  number,
  {
    title: string;
    learningOutcome: string;
    successCriteria: string;
    introduction: string;
    mainActivity: string;
    plenary: string;
    vocabulary: string;
    keyQuestions: string;
    resources: string;
    objectiveIds: string[];
  }
> = {
  1: {
    title: 'Context & class — 1980s Liverpool',
    learningOutcome:
      'To place Blood Brothers in social/historical context and identify how class shapes character and conflict (AQA Component 3 set text).',
    successCriteria:
      'I can explain at least three contextual factors; I can link class to a staging or performance choice.',
    introduction: 'Map 1980s Liverpool: unemployment, housing, education divide, Russell’s intentions.',
    mainActivity: 'Context carousel → status continuum with Mrs Johnstone / Mrs Lyons → freeze-frame gallery.',
    plenary: 'Exit ticket: one exam-ready point linking context to a scene.',
    vocabulary: 'class, status, naturalism, narrator, dramatic irony, social realism, Willy Russell',
    keyQuestions: 'How does Russell use the twins’ upbringing to criticise social inequality?',
    resources: 'Prototype overview PDF; We Teach Drama shop link (Revise Blood Brothers scheme — paid resource on their site)',
    objectiveIds: [OBJ.contextThemes, OBJ.interpret, OBJ.y11u1],
  },
  2: {
    title: 'Narrator, omen and dramatic irony',
    learningOutcome:
      'To explore the Narrator’s function and how superstition / foreshadowing create tension for an audience.',
    successCriteria:
      'I can stage a Narrator intervention; I can explain audience effect using subject terminology.',
    introduction: 'Recap omen motifs (shoes on the table, Marilyn Monroe, the devil’s got your number).',
    mainActivity: 'Narrator voice workshop → omen tableau sequence → irony hot-seating.',
    plenary: 'Peer evaluate: where did irony land most clearly?',
    vocabulary: 'foreshadowing, omen, direct address, tension, audience, motif',
    keyQuestions: 'What does the Narrator know that the characters do not — and how do we show that?',
    resources: PDF,
    objectiveIds: [OBJ.interpret, OBJ.liveTheatre, OBJ.y11u2],
  },
  3: {
    title: 'Mickey & Eddie — vocal/physical contrast',
    learningOutcome:
      'To communicate class difference through contrasting vocal and physical characterisation across the twins’ lives.',
    successCriteria:
      'I can sustain two contrasting physicalities; I can justify vocal choices for a named age/scene.',
    introduction: 'Watch/read a short extract of childhood games vs adult reunion (text only — no paid pack).',
    mainActivity: 'Childhood playground duet → adult reunion proxemics → film-and-feedback.',
    plenary: 'Two stars and a wish against AQA performance language.',
    vocabulary: 'proxemics, gait, register, accent, tempo, status, characterisation',
    keyQuestions: 'Which physical detail most clearly signals class without dialogue?',
    resources: PDF,
    objectiveIds: [OBJ.performerSkills, OBJ.interpret, OBJ.y11p1],
  },
  4: {
    title: 'Design for meaning — class on stage',
    learningOutcome:
      'To propose design concepts (costume/set/lighting) that clarify the Johnstone–Lyons divide and atmosphere.',
    successCriteria:
      'I can present a justified design idea linked to a scene and audience effect.',
    introduction: 'Mood boards: council house vs Lyons home; colour, texture, lighting states.',
    mainActivity: 'Design pitch in groups → apply one idea to a 60-second staging.',
    plenary: 'Vote: which design choice most clearly communicates theme?',
    vocabulary: 'costume, silhouette, lighting state, set, symbolism, atmosphere',
    keyQuestions: 'How can design reinforce Russell’s message without over-literal staging?',
    resources: `${PDF}; ${SHOP_IMG}`,
    objectiveIds: [OBJ.design1, OBJ.liveTheatre, OBJ.y11u2],
  },
  5: {
    title: 'Exam rehearsal — performer question',
    learningOutcome:
      'To practise an AQA-style performer response: intention → skill → moment → audience effect.',
    successCriteria:
      'I can write/speak a structured paragraph using performance vocabulary at GCSE standard.',
    introduction: 'Model a top-band sentence frame; deconstruct a weak vs strong paragraph.',
    mainActivity: 'Rehearse a key moment → timed 12-minute written response → peer band marking.',
    plenary: 'Upgrade one sentence using because–effect–judgement.',
    vocabulary: 'intention, skill, moment, effect, evaluate, band descriptors',
    keyQuestions: 'Where does your answer move from description into evaluation?',
    resources: PDF,
    objectiveIds: [OBJ.performerSkills, OBJ.liveTheatre, OBJ.y11p1],
  },
};

const SEED_ACTIVITIES: SeedActivity[] = [
  act({
    unitLesson: 1,
    category: CAT.warmup,
    activity: 'Status continuum',
    description: '<p>Warm-up exploring high/low status bodies before Blood Brothers context work.</p>',
    activityText:
      '<ol><li>Walk the room; on cue shift between high-status and low-status physicality.</li><li>Freeze as Mrs Lyons or Mrs Johnstone; peers guess who.</li></ol>',
    time: 8,
  }),
  act({
    unitLesson: 1,
    category: CAT.explore,
    activity: '1980s Liverpool context carousel',
    description: '<p>Stations on unemployment, housing, education, superstition, Russell’s intentions.</p>',
    activityText:
      '<ol><li>Rotate for 3 minutes per station.</li><li>Collect one exam-ready fact per station on sticky notes.</li></ol>',
    time: 18,
    resourceLink: PDF,
  }),
  act({
    unitLesson: 1,
    category: CAT.create,
    activity: 'Class divide freeze-frames',
    description: '<p>Create three still images showing the Johnstone–Lyons class gap.</p>',
    activityText:
      '<ol><li>Image 1: homes; Image 2: schooling; Image 3: adult futures.</li><li>Thought-track one character per image.</li></ol>',
    time: 15,
  }),
  act({
    unitLesson: 2,
    category: CAT.warmup,
    activity: 'Narrator echo circle',
    description: '<p>Ensemble echo of omen phrases to find Narrator energy and rhythm.</p>',
    activityText: '<p>Pass a whispered omen around the circle; build to full direct address.</p>',
    time: 8,
  }),
  act({
    unitLesson: 2,
    category: CAT.explore,
    activity: 'Omen tableau sequence',
    description: '<p>Stage a sequence of superstition motifs that foreshadow the ending.</p>',
    activityText:
      '<ol><li>Select three omen moments from the text.</li><li>Link with Narrator transitions.</li></ol>',
    time: 20,
  }),
  act({
    unitLesson: 2,
    category: CAT.perform,
    activity: 'Irony audience check',
    description: '<p>Perform omen sequence; audience identifies where dramatic irony is clearest.</p>',
    activityText: '<p>Peer feedback using: technique → moment → audience effect.</p>',
    time: 12,
  }),
  act({
    unitLesson: 3,
    category: CAT.warmup,
    activity: 'Twin mirror / contrast',
    description: '<p>Paired mirroring that breaks into contrasting class physicalities.</p>',
    activityText: '<p>Start in unison; on clap, split into Mickey vs Eddie energy.</p>',
    time: 8,
  }),
  act({
    unitLesson: 3,
    category: CAT.create,
    activity: 'Childhood to reunion duet',
    description: '<p>Build a duet contrasting childhood friendship with adult class divide.</p>',
    activityText:
      '<ol><li>30 seconds childhood games.</li><li>Transition.</li><li>45 seconds adult reunion with clear proxemics.</li></ol>',
    time: 22,
    resourceLink: PDF_SCENES,
  }),
  act({
    unitLesson: 3,
    category: CAT.perform,
    activity: 'Film and feedback',
    description: '<p>Record duets; mark against vocal/physical GCSE criteria.</p>',
    activityText: '<p>One strength + one actionable target per performer.</p>',
    time: 12,
  }),
  act({
    unitLesson: 4,
    category: CAT.explore,
    activity: 'Design mood boards',
    description: '<p>Costume/set/lighting boards for Johnstone vs Lyons worlds.</p>',
    activityText: '<p>Each group pitches one design concept linked to a scene.</p>',
    time: 18,
    imageLink: SHOP_IMG,
  }),
  act({
    unitLesson: 4,
    category: CAT.create,
    activity: 'Apply design to 60-second staging',
    description: '<p>Restage a short extract using the chosen design focus (costume OR lighting OR set).</p>',
    activityText: '<p>Justify choices with audience effect language.</p>',
    time: 20,
  }),
  act({
    unitLesson: 5,
    category: CAT.explore,
    activity: 'Model paragraph surgery',
    description: '<p>Compare weak vs strong AQA-style performer paragraphs.</p>',
    activityText: '<p>Highlight intention, skill, moment, effect in the strong model.</p>',
    time: 12,
    resourceLink: PDF,
  }),
  act({
    unitLesson: 5,
    category: CAT.perform,
    activity: 'Timed performer response',
    description: '<p>Rehearse then write a timed response on a key Blood Brothers moment.</p>',
    activityText: '<p>12 minutes writing; peer band-mark; upgrade one evaluative sentence.</p>',
    time: 25,
  }),
];

function isOwnedCategory(name: string) {
  return ALL_CATEGORIES.includes(name as any) || name.startsWith(`${WTD_BB_PREFIX} —`);
}

function isOwnedActivity(a: Activity) {
  return (
    String((a as any).notes || '').includes(SEED_NOTE) ||
    isOwnedCategory(String(a.category || ''))
  );
}

function buildLessons(activities: Activity[], lessonNumbers: string[]): Record<string, LessonData> {
  const lessons: Record<string, LessonData> = {};
  for (let i = 1; i <= 5; i++) {
    const key = lessonNumbers[i - 1];
    const meta = LESSON_META[i];
    const lessonActs = activities.filter((a) => String(a.lessonNumber) === String(i));
    const categoriesInLesson = ALL_CATEGORIES.filter((c) => lessonActs.some((a) => a.category === c));
    const grouped: Record<string, Activity[]> = {};
    categoriesInLesson.forEach((c) => {
      grouped[c] = lessonActs.filter((a) => a.category === c);
    });
    lessons[key] = {
      title: meta.title,
      lessonName: `${UNIT} — ${meta.title}`,
      grouped,
      categoryOrder: categoriesInLesson,
      orderedActivities: lessonActs,
      totalTime: lessonActs.reduce((sum, a) => sum + (a.time || 0), 0),
      learningOutcome: meta.learningOutcome,
      successCriteria: meta.successCriteria,
      introduction: meta.introduction,
      mainActivity: meta.mainActivity,
      plenary: meta.plenary,
      vocabulary: meta.vocabulary,
      keyQuestions: meta.keyQuestions,
      resources: meta.resources,
      notes: `${SEED_NOTE}. Prototype demo inspired by We Teach Drama public product descriptions — not a copy of paid PDFs. Open ${WTD_SITE} for official resources.`,
      resourceLink: PDF,
      additionalLinks: JSON.stringify([
        { label: 'We Teach Drama', url: WTD_SITE },
        { label: 'Prototype overview PDF', url: PDF },
      ]) as unknown as string,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
      curriculumType: 'CUSTOM',
      customObjectives: meta.objectiveIds,
    };
  }
  return lessons;
}

function registerWtdBloodBrothersPlanning(activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.weteachdrama;
  registerPartnerPlanningPack({
    ...org,
    logoSrc: WTD_LOGO_SRC,
    projectId: 'blood-brothers',
    projectTitle: 'Blood Brothers',
    sheetId: SHEET_ID,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
    thumbSrc: '/partners/weteachdrama/blood-brothers-cover.png',
  });
}

function highlightWtdBloodBrothers(activities: Activity[]) {
  highlightPaidHubActivities(activities, {
    partnerSlug: 'weteachdrama',
    partnerLabel: 'We Teach Drama',
    pickTitles: WTD_BB_FEATURED_TITLES,
    fallbackCount: 5,
    categories: ALL_CATEGORIES,
  });
}

export async function setupWTDBloodBrothers(options?: {
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
        const lessonKeys = readJson<string[]>(LESSON_KEYS_KEY, []);
        registerWtdBloodBrothersPlanning(existing, lessonKeys);
        highlightWtdBloodBrothers(existing);
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: SHEET_ID };
  }

  seedLocalCurriculumObjectives(CURRICULUM);
  ensureLocalYearGroup(SHEET_ID, SHEET_ID, '#6D28D9');

  const categoryMerge = mergeCategoriesLocal(
    ALL_CATEGORIES.map((name) => ({
      name,
      color: '#6D28D9',
      yearGroups: Object.fromEntries(YEAR_GROUPS.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const activities = mergeActivitiesLocal(
    SEED_ACTIVITIES.map((a) => ({ ...a, notes: SEED_NOTE }) as any),
    isOwnedActivity,
  );

  const existingLessonData = readJson<any>(`lesson-data-${SHEET_ID}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(5, existingLessonData.lessonNumbers || []);
  const lessons = buildLessons(activities, lessonNumbers);
  const lessonPayload = mergeLessonsLocal(SHEET_ID, lessons, SEED_NOTE, LESSON_KEYS_KEY, UNIT);

  const lessonStack: StackedLesson = {
    id: newStackId('wtd-bb'),
    name: STACK_NAME,
    description:
      'GCSE Drama (AQA-flavoured) Blood Brothers prototype — five lessons with demo-seeded activities. Inspired by We Teach Drama’s publicly listed Revise Blood Brothers scheme; original CCDesigner outlines only.',
    color: '#5B21B6',
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    customObjectives: ALL_BB_OBJECTIVES,
    curriculumType: 'CUSTOM',
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, STACK_ID_KEY, STACK_NAME);

  finishPrototypeSeed({
    activities,
    categories: ALL_CATEGORIES,
    categoryMerge,
    source: 'wtd-bb-seed',
    markerKey: MARKER_KEY,
    // Paid hub: star only curated picks after explicit Add (not all activities).
    starActivities: false,
  });

  if (shouldRegister) {
    registerWtdBloodBrothersPlanning(activities, lessonPayload.writtenNumbers);
    highlightWtdBloodBrothers(activities);
  }

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: SHEET_ID,
  };
}

export const WTD_BB_COURSE = {
  title: 'GCSE Drama — Blood Brothers',
  siteUrl: WTD_SITE,
  productUrl: 'https://www.weteachdrama.com/product-page/revise-blood-brothers-scheme-of-learning',
  pdfUrl: PDF,
  shopImage: '/partners/weteachdrama/blood-brothers-cover.png',
  level: LEVEL,
  sheetId: SHEET_ID,
  keyStage: 'KS4',
  curriculumLabel: 'AQA GCSE Drama (demo-aqa-dr-* + Y11 Drama)',
  learningObjectives: CURRICULUM.areas.flatMap((a) => a.objectives.map((o) => o.text)),
  lessons: Object.entries(LESSON_META).map(([num, m]) => ({
    number: Number(num),
    title: m.title,
    summary: m.learningOutcome,
  })),
} as const;

if (typeof window !== 'undefined') {
  (window as any).setupWTDBloodBrothers = setupWTDBloodBrothers;
}
