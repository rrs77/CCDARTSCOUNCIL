/**
 * GCSE / OCR Music — Film and Computer Music unit (prototype).
 *
 * Original CCDesigner outlines using public OCR GCSE Music themes
 * (film music / computer & gaming music style listening and composing language).
 *
 * Curated demo seed pack: included by seedDemoData() on prototype activate.
 * Never written to the production Supabase account.
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
} from './prototypeLocalSeed';

const SHEET_ID = 'Year 10 Music (OCR)';
const UNIT = 'Film and Computer Music';
const STACK_NAME = 'Film & Computer Music (OCR GCSE)';
const LEVEL = 'KS4 GCSE';
const YEAR_GROUPS = ['Year 10 Music (OCR)', 'Year 10 Music (GCSE)', 'Year 11 Music (GCSE)', 'Year 10', 'Year 11'];
const MARKER_KEY = 'ccd-ocr-film-comp-seeded-v2';
const STACK_ID_KEY = 'ccd-ocr-film-comp-stack-id';
const LESSON_KEYS_KEY = 'ccd-ocr-film-comp-lesson-keys';
const ACADEMIC_YEAR = '2026-2027';
const SEED_NOTE = 'OCR_FILM_COMP_SEED:Film and Computer Music';
const PDF = '/examples/ocr-music-film-computer-overview.pdf';
const PDF_BRIEF = '/examples/ocr-music-film-computer-composition-brief.pdf';
const OCR_LINK = 'https://www.ocr.org.uk/qualifications/gcse/music-j536-from-2016/';

const CAT = {
  listen: 'Film/Computer Music — Listen',
  tech: 'Film/Computer Music — Technology',
  compose: 'Film/Computer Music — Compose',
  evaluate: 'Film/Computer Music — Evaluate',
} as const;

const ALL_CATEGORIES = Object.values(CAT);

/** Shared demo OCR GCSE Music bank IDs (AoS4 Film / computer game music). */
const OBJ = {
  ygId: 'demo-yg-ocr-music',
  o1: 'demo-ocr-m-f1',
  o2: 'demo-ocr-m-f2',
  o3: 'demo-ocr-m-f3',
  o4: 'demo-ocr-m-a1',
};

const CURRICULUM = {
  yearGroupId: OBJ.ygId,
  yearGroupName: 'OCR GCSE Music',
  color: '#6366F1',
  linkedYearGroups: YEAR_GROUPS,
  areas: [
    {
      id: 'demo-area-ocr-aos4',
      name: 'Film and Computer Game Music',
      objectives: [
        {
          id: OBJ.o1,
          code: 'OCR-AoS4-1',
          text: 'Identify how film and computer game music uses leitmotif, underscore and hit points to support narrative',
        },
        {
          id: OBJ.o2,
          code: 'OCR-AoS4-2',
          text: 'Describe diegetic and non-diegetic sound and how musical elements create atmosphere and character',
        },
        {
          id: OBJ.o3,
          code: 'OCR-AoS4-3',
          text: 'Compose a short film or game cue using sequencing/technology, developing a clear musical idea',
        },
      ],
    },
    {
      id: 'demo-area-ocr-appraising',
      name: 'Listening and Appraising',
      objectives: [
        {
          id: OBJ.o4,
          code: 'OCR-APP-1',
          text: 'Use OCR subject terminology accurately when analysing unfamiliar film and game music extracts',
        },
      ],
    },
  ],
};

type SeedActivity = Omit<Activity, 'id' | '_id'> & { unitLesson: number };

function act(partial: {
  unitLesson: number;
  category: string;
  activity: string;
  description: string;
  activityText?: string;
  time: number;
  link?: string;
  resourceLink?: string;
}): SeedActivity {
  return {
    activity: partial.activity,
    description: partial.description,
    activityText: partial.activityText || '',
    time: partial.time,
    category: partial.category,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: UNIT,
    unitName: UNIT,
    lessonNumber: String(partial.unitLesson),
    unitLesson: partial.unitLesson,
    link: partial.link || OCR_LINK,
    resourceLink: partial.resourceLink || PDF,
    imageLink: '',
    videoLink: '',
    musicLink: '',
    backingLink: '',
    vocalsLink: '',
    canvaLink: '',
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'OCR / prototype resources',
    eyfsStandards: [],
  } as SeedActivity;
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
    title: 'Film music toolkit — elements & mood',
    learningOutcome:
      'To describe how elements of music create mood and narrative in short film cues (OCR appraising language).',
    successCriteria:
      'I can use at least four element terms accurately; I can link a musical feature to on-screen action.',
    introduction: 'Silent clip + contrasting underscore experiments.',
    mainActivity: 'Element audit grid → mood matching → 6-mark style micro-response.',
    plenary: 'Share strongest sentence using because–effect.',
    vocabulary: 'leitmotif, underscore, diegetic, non-diegetic, ostinato, dissonance, pedal',
    keyQuestions: 'Which element change most clearly signals danger on screen?',
    resources: PDF,
    objectiveIds: [OBJ.o1],
  },
  2: {
    title: 'Leitmotif building',
    learningOutcome: 'To create and transform a short leitmotif for a character or place.',
    successCriteria: 'I can play/notate a 2-bar motif; I can show one transformation (sequence, inversion, rhythm change).',
    introduction: 'Famous leitmotif listening (short public examples / teacher choice).',
    mainActivity: 'Compose motif → transform for emotion change → pair share.',
    plenary: 'Class identifies which transformation changed mood most.',
    vocabulary: 'leitmotif, sequence, inversion, augmentation, character',
    keyQuestions: 'How little change is enough for the audience to feel a new emotion?',
    resources: PDF,
    objectiveIds: [OBJ.o1, OBJ.o3],
  },
  3: {
    title: 'Computer & game music textures',
    learningOutcome: 'To explain how synthesis, sampling and looping create computer/game music textures.',
    successCriteria: 'I can name three tech processes; I can describe texture and timbre in a short extract.',
    introduction: 'DAW signal path demo: oscillator → filter → FX → loop.',
    mainActivity: 'Texture listening stations → tech glossary race → exam-style describe question.',
    plenary: 'Exit ticket: one tech term + musical effect.',
    vocabulary: 'synthesis, sample, loop, arpeggiator, sidechain, bitcrush, stem',
    keyQuestions: 'What makes a loop feel “game-like” rather than orchestral?',
    resources: PDF,
    objectiveIds: [OBJ.o2],
  },
  4: {
    title: 'Storyboard cue — compose',
    learningOutcome: 'To compose a 45–60 second cue matching a three-part storyboard.',
    successCriteria: 'I can map sections to picture; I can realise a draft in DAW or notation.',
    introduction: 'Storyboard: establish / conflict / resolve.',
    mainActivity: 'Plan → draft in DAW → checkpoint mix (levels, FX).',
    plenary: 'Export dated draft; note two refinements.',
    vocabulary: 'cue, hit point, sync, structure, mix, stem',
    keyQuestions: 'Where is your clearest hit point — and is it early enough?',
    resources: PDF,
    objectiveIds: [OBJ.o3, OBJ.o4],
  },
  5: {
    title: 'Refine, export, appraise',
    learningOutcome: 'To refine the cue and write a short appraisal using OCR-style vocabulary.',
    successCriteria: 'I can improve one structural or tech choice; I can evaluate my cue against the brief.',
    introduction: 'Listening gallery of drafts (volume-normalised).',
    mainActivity: 'Targeted refinement → final export → 10-mark style self-appraisal.',
    plenary: 'Peer mark: intention vs audible result.',
    vocabulary: 'evaluate, intention, timbre, structure, technology, brief',
    keyQuestions: 'Does every section of the storyboard have a clear musical signal?',
    resources: PDF,
    objectiveIds: [OBJ.o4, OBJ.o1],
  },
};

const SEED_ACTIVITIES: SeedActivity[] = [
  act({
    unitLesson: 1,
    category: CAT.listen,
    activity: 'Silent clip underscore test',
    description: '<p>Watch a silent clip with two contrasting teacher-chosen underscores; note mood shift.</p>',
    activityText: '<p>Complete an elements grid: dynamics, harmony, texture, tempo, timbre.</p>',
    time: 15,
  }),
  act({
    unitLesson: 1,
    category: CAT.evaluate,
    activity: 'Micro 6-mark response',
    description: '<p>Write a short appraising paragraph linking one element to on-screen action.</p>',
    activityText: '<p>Use because–effect; swap and upgrade verbs.</p>',
    time: 15,
  }),
  act({
    unitLesson: 2,
    category: CAT.compose,
    activity: 'Leitmotif draft',
    description: '<p>Compose a 2-bar leitmotif then transform it for a new emotion.</p>',
    activityText: '<p>Document the transformation type used.</p>',
    time: 25,
  }),
  act({
    unitLesson: 3,
    category: CAT.tech,
    activity: 'DAW texture stations',
    description: '<p>Rotate through synth pad, sampled hit, and arpeggiated loop stations.</p>',
    activityText: '<p>Label each with tech process + musical effect.</p>',
    time: 22,
  }),
  act({
    unitLesson: 3,
    category: CAT.listen,
    activity: 'Game-music describe task',
    description: '<p>Describe texture and timbre in a short computer/game extract.</p>',
    activityText: '<p>Exam-style: identify two tech features and their effect.</p>',
    time: 12,
  }),
  act({
    unitLesson: 4,
    category: CAT.compose,
    activity: 'Storyboard cue drafting',
    description: '<p>Compose establish / conflict / resolve sections to picture timings.</p>',
    activityText: '<p>Mark hit points; draft in DAW or notation software. Follow the composition brief PDF.</p>',
    time: 30,
    resourceLink: PDF_BRIEF,
  }),
  act({
    unitLesson: 5,
    category: CAT.compose,
    activity: 'Mix and export',
    description: '<p>Refine levels/FX and export a dated draft.</p>',
    activityText: '<p>Log two changes made and why.</p>',
    time: 18,
  }),
  act({
    unitLesson: 5,
    category: CAT.evaluate,
    activity: 'Self-appraisal write-up',
    description: '<p>Write a short OCR-style appraisal of the cue against the brief.</p>',
    activityText: '<p>Peer check: is every claim audible?</p>',
    time: 15,
    resourceLink: PDF,
  }),
];

function isOwnedCategory(name: string) {
  return ALL_CATEGORIES.includes(name as any) || name.startsWith('Film/Computer Music —');
}

function isOwnedActivity(a: Activity) {
  return isOwnedCategory(String(a.category || '')) || String((a as any).notes || '').includes(SEED_NOTE);
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
      notes: `${SEED_NOTE}. Prototype OCR-style film/computer music unit — original outlines; see OCR specification pages for official detail.`,
      resourceLink: PDF,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
      curriculumType: 'CUSTOM',
      customObjectives: meta.objectiveIds,
    };
  }
  return lessons;
}

export async function setupOCRFilmComputerMusic(options?: { force?: boolean }) {
  const force = Boolean(options?.force);
  if (!force && localStorage.getItem(MARKER_KEY) === '1') {
    return { skipped: true as const, sheetId: SHEET_ID };
  }

  seedLocalCurriculumObjectives(CURRICULUM);
  ensureLocalYearGroup(SHEET_ID, SHEET_ID, '#8B5CF6');

  const categoryMerge = mergeCategoriesLocal(
    ALL_CATEGORIES.map((name) => ({
      name,
      color: '#8B5CF6',
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
    id: newStackId('ocr-fc'),
    name: STACK_NAME,
    description:
      'OCR GCSE Music–style Film and Computer Music prototype unit. Demo seed content with overview PDF.',
    color: '#7C3AED',
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    customObjectives: [OBJ.o1, OBJ.o2, OBJ.o3, OBJ.o4],
    curriculumType: 'CUSTOM',
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, STACK_ID_KEY, STACK_NAME);

  finishPrototypeSeed({
    activities,
    categories: ALL_CATEGORIES,
    categoryMerge,
    source: 'ocr-film-comp-seed',
    markerKey: MARKER_KEY,
  });

  return {
    skipped: false as const,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: SHEET_ID,
  };
}

export const OCR_FILM_COMP_COURSE = {
  title: 'OCR GCSE — Film and Computer Music',
  pdfUrl: PDF,
  level: LEVEL,
  sheetId: SHEET_ID,
  ocrUrl: OCR_LINK,
  lessons: Object.entries(LESSON_META).map(([num, m]) => ({
    number: Number(num),
    title: m.title,
    summary: m.learningOutcome,
  })),
} as const;

if (typeof window !== 'undefined') {
  (window as any).setupOCRFilmComputerMusic = setupOCRFilmComputerMusic;
}
