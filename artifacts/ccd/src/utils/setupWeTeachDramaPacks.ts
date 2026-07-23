/**
 * We Teach Drama partner hub packs (cover, design, practitioners).
 *
 * Each pack seeds demo-session activities/lessons with curriculumType CUSTOM and
 * pre-set customObjectives for the correct key stage / exam fit (hub Add).
 * Original CCDesigner outlines only — not paid/copyrighted pack content.
 * Never written to the production Supabase account.
 *
 * Usage: await setupWeTeachDramaPack('cover', { force: true })
 */

import type { Activity, LessonData } from '../contexts/DataContext';
import type { StackedLesson } from '../hooks/useLessonStacks';
import { WTD_LOGO_SRC, WTD_SITE } from './wtdBranding';
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

export type WtdPackId =
  | 'cover'
  | 'designer'
  | 'mats'
  | 'mitchell'
  | 'complicite'
  | 'practitioners';

type PackDef = {
  id: WtdPackId;
  title: string;
  projectId: string;
  /** Official shop URL */
  productUrl: string;
  agesLabel: string;
  /** Key-stage badge for UI */
  keyStage: 'KS3' | 'KS4' | 'KS4/KS5' | 'KS3–KS5';
  level: string;
  sheetId: string;
  yearGroups: string[];
  color: string;
  pdf: string;
  seedNote: string;
  markerKey: string;
  stackIdKey: string;
  lessonKeysKey: string;
  catPrefix: string;
  curriculum: LocalObjectiveSeed;
  lessons: {
    title: string;
    outcome: string;
    objectiveIds: string[];
    activities: { categorySuffix: string; activity: string; description: string; time: number }[];
  }[];
};

const ACADEMIC_YEAR = '2026-2027';

/** Snapshot secondary drama IDs (Year 7–9 / 10–11) used by demo timetable. */
const Y8 = {
  d1: 'y8-dr-d1-proto',
  p1: 'y8-dr-p1-proto',
  u1: 'y8-dr-u1-proto',
};
const Y10 = {
  /** Snapshot secondary drama — Y10-DR-P1 */
  p1: '95a0eba4-00eb-4fc0-b376-c8423255d663',
  /** Snapshot secondary drama — Y10-DR-U1 */
  u1: 'd9f90287-35a8-44de-8ccc-46816bfb5004',
  d3: 'y10-dr-d3-proto',
  x1: 'y10-dr-x1-proto',
};
const Y11 = {
  p1: '299d2808-a0ef-436f-b664-2040bbee2669',
  u1: '1d099f92-e128-4591-89bc-b4393116501e',
  u2: 'bc2e97c1-78fa-4a93-9a2f-0c2979ba6159',
};
const KS5 = {
  p1: 'proto-ks5-dr-p1',
  u1: 'proto-ks5-dr-u1',
  d1: 'proto-ks5-dr-d1',
};

const PACKS: Record<WtdPackId, PackDef> = {
  cover: {
    id: 'cover',
    title: 'Drama Cover Lesson Pack (Ages 11–14)',
    projectId: 'drama-cover-11-14',
    productUrl: 'https://www.weteachdrama.com/product-page/drama-cover-lesson-pack-ages-11-to-14',
    agesLabel: 'Ages 11–14 · KS3',
    keyStage: 'KS3',
    level: 'KS3',
    sheetId: 'Year 8 Drama',
    yearGroups: ['Year 8 Drama', 'Year 7 Drama', 'Year 9 Drama', 'Year 7', 'Year 8', 'Year 9'],
    color: '#7C3AED',
    pdf: '/partners/weteachdrama/wtd-drama-cover-ks3-overview.pdf',
    seedNote: 'WTD_SEED:Drama Cover Lesson Pack',
    markerKey: 'ccd-wtd-cover-seeded-v1',
    stackIdKey: 'ccd-wtd-cover-stack-id',
    lessonKeysKey: 'ccd-wtd-cover-lesson-keys',
    catPrefix: 'WTD Cover',
    curriculum: {
      yearGroupId: 'proto-wtd-ks3-cover',
      yearGroupName: 'KS3 Drama — Cover Pack (prototype)',
      color: '#7C3AED',
      linkedYearGroups: ['Year 7 Drama', 'Year 8 Drama', 'Year 9 Drama', 'Year 7', 'Year 8', 'Year 9'],
      areas: [
        {
          id: 'proto-wtd-cover-create',
          name: 'Creating and Devising',
          objectives: [
            {
              id: Y8.d1,
              code: 'Y8-DR-D1',
              text: 'Use a range of devising techniques to explore themes and issues',
              description: 'Aligned with Secondary Drama Y8 Devising',
            },
            {
              id: 'proto-wtd-cover-d2',
              code: 'Y8-DR-D4',
              text: 'Use dramatic conventions (e.g. freeze-frame, thought-tracking) purposefully',
            },
          ],
        },
        {
          id: 'proto-wtd-cover-perform',
          name: 'Performance Skills',
          objectives: [
            {
              id: Y8.p1,
              code: 'Y8-DR-P1',
              text: 'Perform with confidence and commitment to an audience',
            },
          ],
        },
        {
          id: 'proto-wtd-cover-appreciate',
          name: 'Drama and Theatre Appreciation',
          objectives: [
            {
              id: Y8.u1,
              code: 'Y8-DR-U1',
              text: 'Analyse how drama techniques are used to create meaning and effect',
            },
          ],
        },
      ],
    },
    lessons: [
      {
        title: 'Character & expression (Y7–8 cover)',
        outcome: 'Create a clear character using facial expression, voice and a short written scene (KS3).',
        objectiveIds: [Y8.d1, Y8.p1],
        activities: [
          {
            categorySuffix: 'Create',
            activity: 'Creating a Character worksheet sprint',
            description:
              '<p>KS3 cover-style task: build a character from a given stimulus using vocabulary banks and sentence starters (prototype outline).</p>',
            time: 20,
          },
          {
            categorySuffix: 'Perform',
            activity: 'Facial Expressions gallery',
            description: '<p>Show emotion through freeze-frames; peers identify intention.</p>',
            time: 15,
          },
        ],
      },
      {
        title: 'Design & practitioners intro (Y9 cover)',
        outcome: 'Explore basic costume/set/sound ideas and an introduction to Stanislavski/Brecht language (KS3 Year 9).',
        objectiveIds: [Y8.u1, 'proto-wtd-cover-d2'],
        activities: [
          {
            categorySuffix: 'Explore',
            activity: 'Mini design choices',
            description: '<p>Choose costume or set ideas for a short scene and justify one choice.</p>',
            time: 18,
          },
          {
            categorySuffix: 'Create',
            activity: 'Stanislavski vs Brecht snapshot',
            description: '<p>Apply one technique from each practitioner to the same stimulus.</p>',
            time: 20,
          },
        ],
      },
    ],
  },

  designer: {
    id: 'designer',
    title: 'Think Like a Designer — Complete Collection',
    projectId: 'think-like-a-designer',
    productUrl:
      'https://www.weteachdrama.com/product-page/the-complete-collection-think-like-a-designer-student-workbooks',
    agesLabel: 'Ages 13+ · KS3/KS4 design',
    keyStage: 'KS3–KS5',
    level: 'KS3/KS4',
    sheetId: 'Year 9 Drama',
    yearGroups: [
      'Year 9 Drama',
      'Year 10 Drama (GCSE)',
      'Year 10 Drama',
      'Year 9',
      'Year 10',
    ],
    color: '#0D9488',
    pdf: '/partners/weteachdrama/wtd-think-like-a-designer-overview.pdf',
    seedNote: 'WTD_SEED:Think Like a Designer',
    markerKey: 'ccd-wtd-designer-seeded-v1',
    stackIdKey: 'ccd-wtd-designer-stack-id',
    lessonKeysKey: 'ccd-wtd-designer-lesson-keys',
    catPrefix: 'WTD Designer',
    curriculum: {
      yearGroupId: 'proto-wtd-designer',
      yearGroupName: 'Drama Design — Think Like a Designer (prototype)',
      color: '#0D9488',
      linkedYearGroups: ['Year 9 Drama', 'Year 10 Drama (GCSE)', 'Year 10 Drama', 'Year 9', 'Year 10'],
      areas: [
        {
          id: 'proto-wtd-des-area',
          name: 'Design Skills',
          objectives: [
            {
              id: Y10.x1,
              code: 'Y10-DR-X1',
              text: 'Use set, costume, lighting or sound to support meaning and atmosphere',
            },
            {
              id: 'proto-wtd-des-x2',
              code: 'Y10-DR-X2',
              text: 'Make and justify design choices in relation to text or theme',
            },
            {
              id: 'proto-wtd-des-y9',
              code: 'Y9-DR-U1',
              text: 'Analyse how performers, designers and directors create meaning',
            },
          ],
        },
      ],
    },
    lessons: [
      {
        title: 'Think like a set & costume designer',
        outcome: 'Apply set and costume design vocabulary to a short extract (ages 13+).',
        objectiveIds: [Y10.x1, 'proto-wtd-des-y9'],
        activities: [
          {
            categorySuffix: 'Set',
            activity: 'Set mood board pitch',
            description: '<p>Prototype workbook-style task: propose a set concept linked to atmosphere.</p>',
            time: 20,
          },
          {
            categorySuffix: 'Costume',
            activity: 'Costume silhouette for status',
            description: '<p>Show status/class through silhouette and colour without over-literal costume.</p>',
            time: 18,
          },
        ],
      },
      {
        title: 'Lighting & sound for meaning',
        outcome: 'Justify lighting and sound choices with audience-effect language (KS3/KS4).',
        objectiveIds: ['proto-wtd-des-x2', Y10.x1],
        activities: [
          {
            categorySuffix: 'Lighting',
            activity: 'Lighting state storyboard',
            description: '<p>Three lighting states for establish / conflict / resolve.</p>',
            time: 20,
          },
          {
            categorySuffix: 'Sound',
            activity: 'Soundscape underscore',
            description: '<p>Layer diegetic and non-diegetic sound for one scene transition.</p>',
            time: 18,
          },
        ],
      },
    ],
  },

  mats: {
    id: 'mats',
    title: 'Theatre Design Challenge Mats',
    projectId: 'theatre-design-challenge-mats',
    productUrl: 'https://www.weteachdrama.com/product-page/theatre-design-challenge-mats',
    agesLabel: 'KS3, KS4 & KS5',
    keyStage: 'KS3–KS5',
    level: 'KS3/KS4/KS5',
    sheetId: 'Year 10 Drama (GCSE)',
    yearGroups: [
      'Year 10 Drama (GCSE)',
      'Year 9 Drama',
      'Year 11 Drama (GCSE)',
      'Year 12 Drama',
      'Year 9',
      'Year 10',
      'Year 11',
      'Year 12',
    ],
    color: '#EA580C',
    pdf: '/partners/weteachdrama/wtd-theatre-design-challenge-mats-overview.pdf',
    seedNote: 'WTD_SEED:Theatre Design Challenge Mats',
    markerKey: 'ccd-wtd-mats-seeded-v1',
    stackIdKey: 'ccd-wtd-mats-stack-id',
    lessonKeysKey: 'ccd-wtd-mats-lesson-keys',
    catPrefix: 'WTD Challenge Mats',
    curriculum: {
      yearGroupId: 'proto-wtd-mats',
      yearGroupName: 'Theatre Design Challenge Mats (KS3–5 prototype)',
      color: '#EA580C',
      linkedYearGroups: [
        'Year 9 Drama',
        'Year 10 Drama (GCSE)',
        'Year 11 Drama (GCSE)',
        'Year 12 Drama',
      ],
      areas: [
        {
          id: 'proto-wtd-mats-area',
          name: 'Design Skills',
          objectives: [
            {
              id: 'proto-wtd-mats-1',
              code: 'Y10-DR-X1',
              text: 'Use set, costume, lighting or sound to support meaning and atmosphere',
            },
            {
              id: 'proto-wtd-mats-2',
              code: 'Y11-DR-X1',
              text: 'Create design concepts that enhance and clarify meaning in performance',
            },
            {
              id: KS5.d1,
              code: 'KS5-DR-D1',
              text: 'Develop sophisticated design concepts appropriate to A-level / KS5 study',
            },
          ],
        },
      ],
    },
    lessons: [
      {
        title: 'Set & costume challenge mats',
        outcome: 'Complete timed design challenges for set and costume (KS3–5 stretch).',
        objectiveIds: ['proto-wtd-mats-1', 'proto-wtd-mats-2'],
        activities: [
          {
            categorySuffix: 'Set',
            activity: 'Set challenge mat sprint',
            description: '<p>Prototype: five timed set challenges; justify one answer with audience effect.</p>',
            time: 22,
          },
          {
            categorySuffix: 'Costume',
            activity: 'Costume challenge mat sprint',
            description: '<p>Prototype: costume tasks covering period, status and character arc.</p>',
            time: 20,
          },
        ],
      },
      {
        title: 'Lighting & sound challenge mats',
        outcome: 'Apply lighting and sound challenge tasks with teacher-note style answers (prototype).',
        objectiveIds: ['proto-wtd-mats-2', KS5.d1],
        activities: [
          {
            categorySuffix: 'Lighting',
            activity: 'Lighting challenge mat',
            description: '<p>Match lighting states to dramatic intention; stretch for KS5 vocabulary.</p>',
            time: 20,
          },
          {
            categorySuffix: 'Sound',
            activity: 'Sound challenge mat',
            description: '<p>Design a cue list for atmosphere, transition and climax.</p>',
            time: 20,
          },
        ],
      },
    ],
  },

  mitchell: {
    id: 'mitchell',
    title: 'Explore Katie Mitchell: Complete Teaching & CPD Pack',
    projectId: 'explore-katie-mitchell',
    productUrl:
      'https://www.weteachdrama.com/product-page/explore-katie-mitchell-complete-teaching-cpd-pack',
    agesLabel: 'Ages 14–18 · GCSE & A-Level',
    keyStage: 'KS4/KS5',
    level: 'KS4/KS5',
    sheetId: 'Year 11 Drama (GCSE)',
    yearGroups: [
      'Year 11 Drama (GCSE)',
      'Year 10 Drama (GCSE)',
      'Year 12 Drama',
      'Year 13 Drama',
      'Year 10',
      'Year 11',
      'Year 12',
      'Year 13',
    ],
    color: '#4F46E5',
    pdf: '/partners/weteachdrama/wtd-explore-katie-mitchell-overview.pdf',
    seedNote: 'WTD_SEED:Explore Katie Mitchell',
    markerKey: 'ccd-wtd-mitchell-seeded-v1',
    stackIdKey: 'ccd-wtd-mitchell-stack-id',
    lessonKeysKey: 'ccd-wtd-mitchell-lesson-keys',
    catPrefix: 'WTD Katie Mitchell',
    curriculum: {
      yearGroupId: 'proto-wtd-mitchell',
      yearGroupName: 'Katie Mitchell — GCSE/A-Level practitioners (prototype)',
      color: '#4F46E5',
      linkedYearGroups: [
        'Year 10 Drama (GCSE)',
        'Year 11 Drama (GCSE)',
        'Year 12 Drama',
        'Year 13 Drama',
      ],
      areas: [
        {
          id: 'proto-wtd-km-area',
          name: 'Contemporary Practitioners',
          objectives: [
            {
              id: Y11.u2,
              code: 'Y11-DR-U2',
              text: 'Explain how performance and design elements create meaning and effect',
            },
            {
              id: Y11.p1,
              code: 'Y11-DR-P1',
              text: 'Perform with consistency, control and clear artistic choices',
            },
            {
              id: KS5.p1,
              code: 'KS5-DR-P1',
              text: 'Apply naturalistic and Live Cinema techniques with critical awareness (A-level stretch)',
            },
            {
              id: KS5.u1,
              code: 'KS5-DR-U1',
              text: 'Evaluate Mitchell’s directing methods in relation to intention and audience',
            },
          ],
        },
      ],
    },
    lessons: [
      {
        title: 'Naturalism & given circumstances',
        outcome: 'Apply Mitchell-influenced naturalistic detail to a short scene (GCSE/A-Level).',
        objectiveIds: [Y11.p1, KS5.p1],
        activities: [
          {
            categorySuffix: 'Explore',
            activity: 'Given circumstances deep dive',
            description: '<p>Prototype workshop: research and embody detailed given circumstances.</p>',
            time: 25,
          },
          {
            categorySuffix: 'Create',
            activity: 'Hyper-naturalistic moment',
            description: '<p>Stage 60 seconds of precise naturalistic action with clear intention.</p>',
            time: 20,
          },
        ],
      },
      {
        title: 'Live Cinema staging sketch',
        outcome: 'Explore Live Cinema / multi-media staging ideas and evaluate audience effect (KS4/KS5).',
        objectiveIds: [Y11.u2, KS5.u1],
        activities: [
          {
            categorySuffix: 'Create',
            activity: 'Camera + stage split',
            description: '<p>Prototype: one group performs; another “frames” for a projected Live Cinema idea.</p>',
            time: 25,
          },
          {
            categorySuffix: 'Evaluate',
            activity: 'Practitioner evaluation',
            description: '<p>Write/speak how Mitchell’s methods shape meaning vs purely naturalistic staging.</p>',
            time: 15,
          },
        ],
      },
    ],
  },

  complicite: {
    id: 'complicite',
    title: 'Explore Complicité: Complete Teaching & CPD Pack',
    projectId: 'explore-complicite',
    productUrl:
      'https://www.weteachdrama.com/product-page/explore-complicite-complete-teaching-cpd-pack',
    agesLabel: 'Ages 14–18 · GCSE & A-Level',
    keyStage: 'KS4/KS5',
    level: 'KS4/KS5',
    sheetId: 'Year 11 Drama (GCSE)',
    yearGroups: [
      'Year 11 Drama (GCSE)',
      'Year 10 Drama (GCSE)',
      'Year 12 Drama',
      'Year 13 Drama',
      'Year 10',
      'Year 11',
      'Year 12',
      'Year 13',
    ],
    color: '#BE123C',
    pdf: '/partners/weteachdrama/wtd-explore-complicite-overview.pdf',
    seedNote: 'WTD_SEED:Explore Complicite',
    markerKey: 'ccd-wtd-complicite-seeded-v1',
    stackIdKey: 'ccd-wtd-complicite-stack-id',
    lessonKeysKey: 'ccd-wtd-complicite-lesson-keys',
    catPrefix: 'WTD Complicite',
    curriculum: {
      yearGroupId: 'proto-wtd-complicite',
      yearGroupName: 'Complicité — GCSE/A-Level practitioners (prototype)',
      color: '#BE123C',
      linkedYearGroups: [
        'Year 10 Drama (GCSE)',
        'Year 11 Drama (GCSE)',
        'Year 12 Drama',
        'Year 13 Drama',
      ],
      areas: [
        {
          id: 'proto-wtd-comp-area',
          name: 'Physical Ensemble / Devising',
          objectives: [
            {
              id: Y11.p1,
              code: 'Y11-DR-P1',
              text: 'Perform with consistency, control and clear artistic choices',
            },
            {
              id: 'proto-wtd-comp-d',
              code: 'Y11-DR-D1',
              text: 'Devise coherent drama that communicates complex ideas to an audience',
            },
            {
              id: KS5.p1,
              code: 'KS5-DR-P2',
              text: 'Use ensemble, physical storytelling and collaborative devising with A-level rigour',
            },
            {
              id: KS5.u1,
              code: 'KS5-DR-U2',
              text: 'Analyse Complicité’s rehearsal processes and influences on contemporary devising',
            },
          ],
        },
      ],
    },
    lessons: [
      {
        title: 'Ensemble & physical storytelling',
        outcome: 'Build ensemble trust and physical narrative without relying on text (GCSE/A-Level).',
        objectiveIds: [Y11.p1, KS5.p1],
        activities: [
          {
            categorySuffix: 'Warm-up',
            activity: 'Ensemble pulse & flocking',
            description: '<p>Prototype Complicité-style ensemble warm-up focusing on shared impulse.</p>',
            time: 12,
          },
          {
            categorySuffix: 'Create',
            activity: 'Object transformation story',
            description: '<p>Transform a simple object through ensemble physical storytelling.</p>',
            time: 25,
          },
        ],
      },
      {
        title: 'Text into physical theatre',
        outcome: 'Integrate text with physical devising and evaluate stylistic choices (KS4/KS5).',
        objectiveIds: ['proto-wtd-comp-d', KS5.u1],
        activities: [
          {
            categorySuffix: 'Create',
            activity: 'Chorus + fragment text',
            description: '<p>Layer spoken fragments over physical chorus work.</p>',
            time: 25,
          },
          {
            categorySuffix: 'Evaluate',
            activity: 'Style evaluation',
            description: '<p>Peer evaluate: where did physical storytelling clarify meaning?</p>',
            time: 15,
          },
        ],
      },
    ],
  },

  practitioners: {
    id: 'practitioners',
    title: 'Explore Practitioners: Complete Lesson & CPD Bundle',
    projectId: 'explore-practitioners-bundle',
    productUrl:
      'https://www.weteachdrama.com/product-page/explore-practitioners-complete-lesson-cpd-bundle',
    agesLabel: 'Ages 14–18 · GCSE & A-Level',
    keyStage: 'KS4/KS5',
    level: 'KS4/KS5',
    sheetId: 'Year 10 Drama (GCSE)',
    yearGroups: [
      'Year 10 Drama (GCSE)',
      'Year 11 Drama (GCSE)',
      'Year 12 Drama',
      'Year 10',
      'Year 11',
      'Year 12',
    ],
    color: '#9333EA',
    pdf: '/partners/weteachdrama/wtd-explore-practitioners-bundle-overview.pdf',
    seedNote: 'WTD_SEED:Explore Practitioners Bundle',
    markerKey: 'ccd-wtd-practitioners-seeded-v1',
    stackIdKey: 'ccd-wtd-practitioners-stack-id',
    lessonKeysKey: 'ccd-wtd-practitioners-lesson-keys',
    catPrefix: 'WTD Practitioners',
    curriculum: {
      yearGroupId: 'proto-wtd-practitioners',
      yearGroupName: 'Theatre Practitioners Bundle (GCSE/A-Level prototype)',
      color: '#9333EA',
      linkedYearGroups: ['Year 10 Drama (GCSE)', 'Year 11 Drama (GCSE)', 'Year 12 Drama'],
      areas: [
        {
          id: 'proto-wtd-prac-area',
          name: 'Practitioner Methods',
          objectives: [
            {
              id: Y10.u1,
              code: 'Y10-DR-U1',
              text: 'Analyse and evaluate live theatre using subject terminology',
            },
            {
              id: Y10.d3,
              code: 'Y10-DR-D3',
              text: 'Use genre, style and convention purposefully to communicate meaning',
            },
            {
              id: 'y10-dr-u2-proto',
              code: 'Y10-DR-U2',
              text: 'Understand the roles of performer, designer and director',
            },
            {
              id: Y11.u1,
              code: 'Y11-DR-U1',
              text: 'Analyse and evaluate live theatre with detailed use of subject terminology',
            },
            {
              id: KS5.u1,
              code: 'KS5-DR-U3',
              text: 'Compare practitioner approaches (Stanislavski, Brecht, Berkoff, Craig) for devising',
            },
          ],
        },
      ],
    },
    lessons: [
      {
        title: 'Stanislavski & Brecht contrast',
        outcome: 'Apply and contrast Stanislavski and Brecht techniques on one stimulus (GCSE/A-Level).',
        objectiveIds: [Y10.d3, Y10.p1, 'y10-dr-u2-proto'],
        activities: [
          {
            categorySuffix: 'Explore',
            activity: 'Stanislavski given circumstances',
            description: '<p>Prototype: build inner life then perform a naturalistic beat.</p>',
            time: 20,
          },
          {
            categorySuffix: 'Create',
            activity: 'Brechtian verfremdung remix',
            description: '<p>Restage the same beat with placards, narration or gestus.</p>',
            time: 20,
          },
        ],
      },
      {
        title: 'Berkoff & Craig studio stations',
        outcome: 'Explore Berkoff physical style and Craig design/directing ideas (KS4/KS5).',
        objectiveIds: [Y10.u1, Y11.u1, KS5.u1],
        activities: [
          {
            categorySuffix: 'Create',
            activity: 'Berkoff chorus machine',
            description: '<p>Build a stylised chorus with heightened physical vocabulary.</p>',
            time: 22,
          },
          {
            categorySuffix: 'Design',
            activity: 'Craig scenic idea',
            description: '<p>Propose a symbolic scenic/lighting concept inspired by Craig.</p>',
            time: 18,
          },
        ],
      },
    ],
  },
};

function categoriesFor(pack: PackDef): string[] {
  const suffixes = new Set<string>();
  for (const lesson of pack.lessons) {
    for (const a of lesson.activities) suffixes.add(a.categorySuffix);
  }
  return [...suffixes].map((s) => `${pack.catPrefix} — ${s}`);
}

function isOwnedCategory(pack: PackDef, name: string) {
  return name.startsWith(`${pack.catPrefix} —`) || name.startsWith(pack.seedNote);
}

function isOwnedActivity(pack: PackDef, a: Activity) {
  return (
    String((a as any).notes || '').includes(pack.seedNote) ||
    isOwnedCategory(pack, String(a.category || ''))
  );
}

function buildLessons(pack: PackDef, activities: Activity[], lessonNumbers: string[]) {
  const cats = categoriesFor(pack);
  const lessons: Record<string, LessonData> = {};
  pack.lessons.forEach((meta, idx) => {
    const key = lessonNumbers[idx];
    const lessonActs = activities.filter((a) => String(a.lessonNumber) === String(idx + 1));
    const categoriesInLesson = cats.filter((c) => lessonActs.some((a) => a.category === c));
    const grouped: Record<string, Activity[]> = {};
    categoriesInLesson.forEach((c) => {
      grouped[c] = lessonActs.filter((a) => a.category === c);
    });
    lessons[key] = {
      title: meta.title,
      lessonName: `${pack.title} — ${meta.title}`,
      grouped,
      categoryOrder: categoriesInLesson,
      orderedActivities: lessonActs,
      totalTime: lessonActs.reduce((sum, a) => sum + (a.time || 0), 0),
      learningOutcome: meta.outcome,
      successCriteria: `I can evidence the ${pack.keyStage} objectives linked to this lesson.`,
      introduction: `${pack.agesLabel}. Prototype outline inspired by the public We Teach Drama product listing.`,
      mainActivity: meta.activities.map((a) => a.activity).join(' → '),
      plenary: 'Reflect against linked curriculum objectives.',
      vocabulary: pack.keyStage,
      keyQuestions: `How does this work meet ${pack.keyStage} expectations?`,
      resources: pack.pdf,
      notes: `${pack.seedNote}. Demo only — not paid pack content. Official: ${pack.productUrl}`,
      resourceLink: pack.pdf,
      additionalLinks: JSON.stringify([
        { label: 'We Teach Drama product', url: pack.productUrl },
        { label: 'Prototype overview PDF', url: pack.pdf },
        { label: 'We Teach Drama', url: WTD_SITE },
      ]) as unknown as string,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
      curriculumType: 'CUSTOM',
      customObjectives: meta.objectiveIds,
    };
  });
  return lessons;
}

function registerPackPlanning(pack: PackDef, activities: Activity[], lessonKeys: string[]) {
  const org = PARTNER_PLANNING_ORGS.weteachdrama;
  registerPartnerPlanningPack({
    ...org,
    logoSrc: WTD_LOGO_SRC,
    projectId: pack.projectId,
    projectTitle: pack.title,
    sheetId: pack.sheetId,
    activityIds: activities.map((a) => getActivityStarKey(a)),
    lessonKeys,
  });
}

export function getWeTeachDramaPack(id: WtdPackId): PackDef {
  return PACKS[id];
}

export function listWeTeachDramaPacks(): PackDef[] {
  return Object.values(PACKS);
}

export async function setupWeTeachDramaPack(
  packId: WtdPackId,
  options?: { force?: boolean; registerPartnerPlanning?: boolean },
) {
  const pack = PACKS[packId];
  if (!pack) throw new Error(`Unknown We Teach Drama pack: ${packId}`);

  const force = Boolean(options?.force);
  const shouldRegister = options?.registerPartnerPlanning !== false;

  if (!force && localStorage.getItem(pack.markerKey) === '1') {
    if (shouldRegister) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter((a) =>
          isOwnedActivity(pack, a),
        );
        const lessonKeys = readJson<string[]>(pack.lessonKeysKey, []);
        registerPackPlanning(pack, existing, lessonKeys);
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: pack.sheetId, packId };
  }

  seedLocalCurriculumObjectives(pack.curriculum);
  ensureLocalYearGroup(pack.sheetId, pack.sheetId, pack.color);
  for (const yg of pack.yearGroups) {
    if (yg !== pack.sheetId && /Drama|Year \d+$/.test(yg)) {
      ensureLocalYearGroup(yg, yg, pack.color);
    }
  }

  const cats = categoriesFor(pack);
  const categoryMerge = mergeCategoriesLocal(
    cats.map((name) => ({
      name,
      color: pack.color,
      yearGroups: Object.fromEntries(pack.yearGroups.map((y) => [y, true])),
    })),
    (name) => isOwnedCategory(pack, name),
  );

  const seedActs: Omit<Activity, 'id'>[] = [];
  pack.lessons.forEach((lesson, li) => {
    lesson.activities.forEach((a) => {
      seedActs.push({
        activity: a.activity,
        description: a.description,
        activityText: `<p>${a.description.replace(/<\/?p>/g, '')}</p>`,
        time: a.time,
        category: `${pack.catPrefix} — ${a.categorySuffix}`,
        level: pack.level,
        yearGroups: pack.yearGroups,
        teachingUnit: pack.title,
        unitName: pack.title,
        lessonNumber: String(li + 1),
        link: pack.productUrl,
        resourceLink: pack.pdf,
        imageLink: WTD_LOGO_SRC,
        videoLink: '',
        musicLink: '',
        backingLink: '',
        vocalsLink: '',
        descriptionHeading: 'Introduction/Context',
        activityHeading: 'Activity',
        linkHeading: 'We Teach Drama / prototype',
        notes: pack.seedNote,
      } as any);
    });
  });

  const activities = mergeActivitiesLocal(seedActs, (a) => isOwnedActivity(pack, a));
  const existingLessonData = readJson<any>(`lesson-data-${pack.sheetId}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(pack.lessons.length, existingLessonData.lessonNumbers || []);
  const lessons = buildLessons(pack, activities, lessonNumbers);
  const lessonPayload = mergeLessonsLocal(
    pack.sheetId,
    lessons,
    pack.seedNote,
    pack.lessonKeysKey,
    pack.title,
  );

  const allObjIds = [...new Set(pack.lessons.flatMap((l) => l.objectiveIds))];
  const lessonStack: StackedLesson = {
    id: newStackId(`wtd-${pack.id}`),
    name: `${pack.title} (WTD prototype)`,
    description: `${pack.keyStage} prototype for ${pack.agesLabel}. Official listing: ${pack.productUrl}`,
    color: pack.color,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    customObjectives: allObjIds,
    curriculumType: 'CUSTOM',
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, pack.stackIdKey, lessonStack.name);

  finishPrototypeSeed({
    activities,
    categories: cats,
    categoryMerge,
    source: `wtd-${pack.id}-seed`,
    markerKey: pack.markerKey,
  });

  if (shouldRegister) {
    registerPackPlanning(pack, activities, lessonPayload.writtenNumbers);
  }

  return {
    skipped: false as const,
    packId,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: pack.sheetId,
    keyStage: pack.keyStage,
    objectiveIds: allObjIds,
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupWeTeachDramaPack = setupWeTeachDramaPack;
}
