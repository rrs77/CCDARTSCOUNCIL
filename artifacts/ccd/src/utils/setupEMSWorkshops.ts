/**
 * Essex Music Service — DJ Workshop & Rap-It! showcase seeds.
 * Full lesson-plan fields for PDF export demos. Links to official EMS workshop pages;
 * mock course-note PDFs are original CCDesigner outlines only.
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
  EMS_DJ_COURSE_NOTES_PDF,
  EMS_DJ_WORKSHOP_PAGE,
  EMS_RAP_IT_COURSE_NOTES_PDF,
  EMS_RAP_IT_WORKSHOP_PAGE,
  EMS_WORKSHOPS_PAGE,
} from './emsBranding';
import { highlightPaidHubActivities } from './recentlyAddedActivities';

export type EmsWorkshopId = 'dj' | 'rap-it';

type WorkshopDef = {
  id: EmsWorkshopId;
  title: string;
  unit: string;
  stackName: string;
  sheetId: string;
  yearGroups: string[];
  level: string;
  agesLabel: string;
  durationLabel: string;
  color: string;
  productUrl: string;
  pdfUrl: string;
  seedNote: string;
  markerKey: string;
  stackIdKey: string;
  lessonKeysKey: string;
  projectId: string;
  curriculum: LocalObjectiveSeed;
  pickTitles: string[];
  summary: string;
  learningOutcome: string;
  successCriteria: string;
  introduction: string;
  mainActivity: string;
  plenary: string;
  vocabulary: string;
  keyQuestions: string;
  resources: string;
  differentiation: string;
  assessment: string;
  assessmentObjectives: string[];
  activities: Partial<Activity>[];
};

const ACADEMIC_YEAR = '2026-2027';

const DJ_OBJ = {
  ygId: 'proto-ems-dj-ks2',
  listen: 'proto-ems-dj-l1',
  tech: 'proto-ems-dj-t1',
  create: 'proto-ems-dj-c1',
  collab: 'proto-ems-dj-g1',
};

const RAP_OBJ = {
  ygId: 'proto-ems-rap-ks2',
  voice: 'proto-ems-rap-v1',
  lyric: 'proto-ems-rap-w1',
  rhythm: 'proto-ems-rap-r1',
  conf: 'proto-ems-rap-c1',
};

const WORKSHOPS: Record<EmsWorkshopId, WorkshopDef> = {
  dj: {
    id: 'dj',
    title: 'DJ Workshop',
    unit: 'EMS — DJ Workshop',
    stackName: 'Essex Music Service — DJ Workshop',
    sheetId: 'Year 6 Music',
    yearGroups: ['Year 6 Music', 'Year 5 Music', 'Year 7 Music', 'Year 5', 'Year 6', 'Year 7'],
    level: 'KS2–KS3',
    agesLabel: 'EYFS–KS3 & SEND (public listing) · showcase KS2/3',
    durationLabel: 'Full day workshop · £250/day (EMS public price)',
    color: '#330968',
    productUrl: EMS_DJ_WORKSHOP_PAGE,
    pdfUrl: EMS_DJ_COURSE_NOTES_PDF,
    seedNote: 'EMS_SEED:DJWorkshop',
    markerKey: 'ccd-ems-dj-workshop-seeded-v1',
    stackIdKey: 'ccd-ems-dj-workshop-stack-id',
    lessonKeysKey: 'ccd-ems-dj-workshop-lesson-keys',
    projectId: 'ems-dj-workshop',
    summary:
      'Hands-on introduction to DJ decks and music production — tailored to your school. Prototype course notes + full CCDesigner lesson for PDF export.',
    curriculum: {
      yearGroupId: DJ_OBJ.ygId,
      yearGroupName: 'EMS DJ Workshop (prototype)',
      color: '#330968',
      linkedYearGroups: ['Year 5 Music', 'Year 6 Music', 'Year 7 Music', 'Year 5', 'Year 6', 'Year 7'],
      areas: [
        {
          id: 'proto-ems-dj-area-listen',
          name: 'Listening and responding',
          objectives: [
            {
              id: DJ_OBJ.listen,
              code: 'EMS-DJ-L1',
              text: 'Identify pulse, groove and structure in a DJ mix (intro / drop / outro)',
            },
          ],
        },
        {
          id: 'proto-ems-dj-area-tech',
          name: 'Music technology',
          objectives: [
            {
              id: DJ_OBJ.tech,
              code: 'EMS-DJ-T1',
              text: 'Use DJ controls safely (crossfader, EQ, cue) with adult support as needed',
            },
            {
              id: DJ_OBJ.create,
              code: 'EMS-DJ-C1',
              text: 'Create a short mix or beat sketch showing clear start, build and finish',
            },
            {
              id: DJ_OBJ.collab,
              code: 'EMS-DJ-G1',
              text: 'Collaborate in small groups, taking turns and giving constructive feedback',
            },
          ],
        },
      ],
    },
    pickTitles: [
      'Deck tour & safety',
      'Beat matching basics',
      'Build a mini mix',
      'Share and reflect',
    ],
    learningOutcome:
      'Pupils explore DJ equipment and production ideas, creating a short collaborative mix that shows pulse awareness, turn-taking and a clear musical shape.',
    successCriteria:
      'We handle equipment carefully and take turns.\nWe keep a steady pulse when cueing or looping.\nOur mini mix has a clear start, middle and end.\nWe can name one control we used (crossfader / EQ / cue).',
    introduction:
      'Welcome from the EMS tutor model (prototype). Share the day aim: try DJ skills in small groups. Agree studio rules, volume limits and how to ask for help. Listen to a short demo mix and spot intro / drop / outro.',
    mainActivity:
      'Rotating stations: deck tour → cue and crossfade practice → simple EQ / filter colour → group mini-mix planning → record or perform a 45–60 second sketch. Teacher circulates with EMS specialist support notes.',
    plenary:
      'Each group shares their mini mix. Peer feedback using pulse / structure / teamwork language. Exit ticket: one skill to practise next and one question for the EMS tutor. Signpost booking via Essex Music Service workshops page.',
    vocabulary:
      'Deck · crossfader · cue · EQ · beat matching · loop · drop · mix · production · pulse · groove',
    keyQuestions:
      'What makes a mix feel smooth?\nHow does EQ change the mood?\nHow did your group share roles fairly?\nWhere would this fit in a school performance or disco?',
    resources:
      'DJ decks / controller (EMS brings kit on booking) · headphones · clear space · timer · whiteboard for station rota · access to EMS workshops page for booking',
    differentiation:
      'Support: paired roles (driver / navigator), larger cue markers, pre-set loops.\nChallenge: longer mix, two-track blend, spoken intro as MC.\nSEND: quieter station, visual step cards, optional listening-only pathway with DJ vocabulary cards.',
    assessment:
      'Observation of safe equipment use and collaboration; mini-mix structure checklist; exit ticket; optional audio capture for school portfolio (policy permitting).',
    assessmentObjectives: [
      'EMS-DJ-L1 Identify pulse and structure in a mix',
      'EMS-DJ-T1 Use DJ controls safely',
      'EMS-DJ-C1 Create a short mix with clear shape',
      'EMS-DJ-G1 Collaborate and give feedback',
    ],
    activities: [
      {
        activity: 'Deck tour & safety',
        time: 15,
        activityText: 'Studio rules · controls map · listen to a demo mix',
        description: [
          'Inspired by Essex Music Service DJ Workshops — tutors introduce DJ and music production, tailored to the school (public workshop listing).',
          'Map the deck: headphones cue, crossfader, EQ, filter. Practise “hands off when the tutor speaks”.',
          'Listen: clap the pulse; raise hands on the drop.',
        ].join('\n'),
      },
      {
        activity: 'Beat matching basics',
        time: 20,
        activityText: 'Small groups · cue track A · match pulse on track B',
        description: [
          'In groups of 3–4, rotate driver / navigator / feedback roles every 5 minutes.',
          'Focus on steady pulse and clean crossfades — quality over speed.',
          'Teacher note: keep volumes safe; celebrate careful listening.',
        ].join('\n'),
      },
      {
        activity: 'Build a mini mix',
        time: 25,
        activityText: 'Plan intro → groove → finish · 45–60 seconds',
        description: [
          'Groups sketch a mini mix structure on paper, then try it on the decks.',
          'Optional: add a filter sweep or EQ change for colour.',
          'Capture one take if recording is available; otherwise perform live to the class.',
        ].join('\n'),
      },
      {
        activity: 'Share and reflect',
        time: 15,
        activityText: 'Perform · two stars and a wish · exit ticket',
        description: [
          'Share mixes. Feedback must name one control and one teamwork strength.',
          'Exit ticket: skill to practise + question for EMS.',
          'Next step: book via Essex Music Service curriculum enhancement workshops (£250/day on public page).',
        ].join('\n'),
      },
    ],
  },
  'rap-it': {
    id: 'rap-it',
    title: 'Rap-It! Workshop',
    unit: 'EMS — Rap-It! Workshop',
    stackName: 'Essex Music Service — Rap-It!',
    sheetId: 'Year 6 Music',
    yearGroups: ['Year 6 Music', 'Year 7 Music', 'Year 8 Music', 'Year 6', 'Year 7', 'Year 8'],
    level: 'KS2–KS4',
    agesLabel: 'KS2–KS4 (public listing) · literacy-linked',
    durationLabel: 'Full day workshop · £250/day (EMS public price)',
    color: '#7a00df',
    productUrl: EMS_RAP_IT_WORKSHOP_PAGE,
    pdfUrl: EMS_RAP_IT_COURSE_NOTES_PDF,
    seedNote: 'EMS_SEED:RapItWorkshop',
    markerKey: 'ccd-ems-rap-it-seeded-v1',
    stackIdKey: 'ccd-ems-rap-it-stack-id',
    lessonKeysKey: 'ccd-ems-rap-it-lesson-keys',
    projectId: 'ems-rap-it-workshop',
    summary:
      'Rap, hip-hop, grime and spoken word to build confidence and link music with English/literacy. Prototype course notes + full CCDesigner lesson for PDF export.',
    curriculum: {
      yearGroupId: RAP_OBJ.ygId,
      yearGroupName: 'EMS Rap-It! Workshop (prototype)',
      color: '#7a00df',
      linkedYearGroups: ['Year 6 Music', 'Year 7 Music', 'Year 8 Music', 'Year 6', 'Year 7', 'Year 8'],
      areas: [
        {
          id: 'proto-ems-rap-area-voice',
          name: 'Performing and oracy',
          objectives: [
            {
              id: RAP_OBJ.voice,
              code: 'EMS-RAP-V1',
              text: 'Perform lyrics with clear diction, confident projection and audience awareness',
            },
            {
              id: RAP_OBJ.conf,
              code: 'EMS-RAP-C1',
              text: 'Show growing confidence when sharing ideas and performing to peers',
            },
          ],
        },
        {
          id: 'proto-ems-rap-area-create',
          name: 'Creating and literacy',
          objectives: [
            {
              id: RAP_OBJ.lyric,
              code: 'EMS-RAP-W1',
              text: 'Write a short verse using rhyme, rhythm and purposeful word choice',
            },
            {
              id: RAP_OBJ.rhythm,
              code: 'EMS-RAP-R1',
              text: 'Fit lyrics to a beat, keeping pulse and using rests for effect',
            },
          ],
        },
      ],
    },
    pickTitles: [
      'Pulse, rhyme and respect',
      'Lyric lab',
      'Flow rehearsal',
      'Cipher share',
    ],
    learningOutcome:
      'Pupils create and perform a short original verse in a rap / spoken-word style, linking rhythm, rhyme and clear delivery, with growing confidence.',
    successCriteria:
      'Our lyrics fit the beat.\nWe use rhyme or strong word choice on purpose.\nWe perform with clear words and respectful listening.\nEveryone contributes ideas to the verse.',
    introduction:
      'EMS Rap-It! style welcome (prototype). Agree community rules: respect voices, no put-downs, support risk-taking. Clap pulse games; call-and-response rhythm phrases. Listen to a short age-appropriate excerpt (teacher-chosen) and spot rhyme / flow.',
    mainActivity:
      'Lyric lab in pairs/groups → draft 4–8 bars on a school-friendly theme (belonging, friendship, our town) → flow rehearsal over a backing loop → optional grime/hip-hop stylistic features (energy, punchlines) kept appropriate for age.',
    plenary:
      'Cipher share: each group performs; audience gives one literacy strength (rhyme / imagery) and one music strength (pulse / clarity). Reflect how Rap-It! links English and music. Next step: book EMS workshop.',
    vocabulary:
      'Rap · hip-hop · grime · spoken word · bar · rhyme · flow · pulse · cipher · punchline · verse · hook',
    keyQuestions:
      'Which words carry the strongest meaning?\nHow does the beat change how we speak?\nWhat makes a performance respectful and confident?\nHow could this support a literacy unit?',
    resources:
      'Backing loop / speaker · lyric sheets · whiteboards · timer · optional mic · EMS workshops booking page',
    differentiation:
      'Support: rhyme banks, sentence starters, shorter 2-bar challenge, teacher scribe.\nChallenge: write a hook + verse, call-and-response between two voices, figurative language.\nEAL: mother-tongue brainstorm then English performance lines; gesture-supported rehearsal.',
    assessment:
      'Lyric draft quality (rhyme/rhythm); performance diction and confidence; peer feedback notes; optional filmed take for literacy/music portfolio.',
    assessmentObjectives: [
      'EMS-RAP-V1 Perform with clear diction and confidence',
      'EMS-RAP-W1 Write a short verse with rhyme and purpose',
      'EMS-RAP-R1 Fit lyrics to a beat',
      'EMS-RAP-C1 Show confidence when sharing',
    ],
    activities: [
      {
        activity: 'Pulse, rhyme and respect',
        time: 15,
        activityText: 'Community rules · pulse games · spot rhyme in a short model',
        description: [
          'Inspired by Essex Music Service Rap-It! — rap, hip-hop, grime and spoken word linked to confidence, music and literacy (public listing).',
          'Establish cipher etiquette. Play pulse pass and rhyme-chain warm-ups.',
        ].join('\n'),
      },
      {
        activity: 'Lyric lab',
        time: 25,
        activityText: 'Theme bank · draft 4–8 bars · peer edit for clarity',
        description: [
          'Choose a positive school theme. Draft bars; swap for a “clarity edit” (one stronger verb / one clearer rhyme).',
          'Keep content age-appropriate; tutor redirects any unsafe language immediately.',
        ].join('\n'),
      },
      {
        activity: 'Flow rehearsal',
        time: 20,
        activityText: 'Fit lyrics to loop · mark breaths · optional call-and-response',
        description: [
          'Rehearse over a backing loop. Mark rests. Practise projection without shouting.',
          'Optional: one call-and-response line between two performers.',
        ].join('\n'),
      },
      {
        activity: 'Cipher share',
        time: 15,
        activityText: 'Perform · literacy + music feedback · exit ticket',
        description: [
          'Perform to the group. Feedback: one literacy strength, one music strength.',
          'Exit ticket: favourite line + one link to English/literacy.',
          'Booking: Essex Music Service workshops page (public price £250/day).',
        ].join('\n'),
      },
    ],
  },
};

function catsFor(prefix: string) {
  return {
    warm: `${prefix} — Warm-up`,
    explore: `${prefix} — Explore`,
    create: `${prefix} — Create`,
    share: `${prefix} — Share`,
  } as const;
}

function isOwned(seedNote: string, catPrefix: string) {
  return {
    isOwnedCategory: (name: string) => name.startsWith(catPrefix) || name.startsWith('EMS —'),
    isOwnedActivity: (a: Activity) =>
      String((a as any)?.notes || '').includes(seedNote) ||
      String(a?.category || '').startsWith(catPrefix),
  };
}

function buildLesson(
  pack: WorkshopDef,
  activities: Activity[],
  cats: string[],
): LessonData {
  const objIds = pack.curriculum.areas.flatMap((a) => a.objectives.map((o) => o.id));
  return {
    title: pack.title,
    lessonName: `${pack.agesLabel} · Essex Music Service showcase`,
    unitName: pack.unit,
    teachingUnit: pack.unit,
    activities,
    duration: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    orderedActivities: activities,
    categoryOrder: cats,
    grouped: Object.fromEntries(cats.map((c) => [c, activities.filter((a) => a.category === c)])),
    curriculumType: 'CUSTOM',
    customObjectives: objIds,
    academicYear: ACADEMIC_YEAR,
    customHeader: 'Essex Music Service — CCDesigner prototype workshop notes',
    customFooter: 'Demo course notes — book via essexmusicservice.org.uk',
    learningOutcome: pack.learningOutcome,
    successCriteria: pack.successCriteria,
    introduction: pack.introduction,
    mainActivity: pack.mainActivity,
    plenary: pack.plenary,
    vocabulary: pack.vocabulary,
    keyQuestions: pack.keyQuestions,
    resources: pack.resources,
    differentiation: pack.differentiation,
    assessment: pack.assessment,
    assessmentObjectives: pack.assessmentObjectives,
    resourceLink: pack.pdfUrl,
    additionalLinks: `${pack.productUrl}\n${EMS_WORKSHOPS_PAGE}\n${pack.pdfUrl}`,
    notes: `${pack.seedNote}. Showcase lesson for PDF export. Inspired by public EMS workshop listings — not official EMS course materials.`,
  } as any;
}

export const EMS_WORKSHOP_SHOWCASES = {
  dj: {
    id: 'dj' as const,
    title: WORKSHOPS.dj.title,
    productUrl: WORKSHOPS.dj.productUrl,
    pdfUrl: WORKSHOPS.dj.pdfUrl,
    agesLabel: WORKSHOPS.dj.agesLabel,
    durationLabel: WORKSHOPS.dj.durationLabel,
    summary: WORKSHOPS.dj.summary,
  },
  'rap-it': {
    id: 'rap-it' as const,
    title: WORKSHOPS['rap-it'].title,
    productUrl: WORKSHOPS['rap-it'].productUrl,
    pdfUrl: WORKSHOPS['rap-it'].pdfUrl,
    agesLabel: WORKSHOPS['rap-it'].agesLabel,
    durationLabel: WORKSHOPS['rap-it'].durationLabel,
    summary: WORKSHOPS['rap-it'].summary,
  },
};

export function listEmsWorkshopShowcases() {
  return [EMS_WORKSHOP_SHOWCASES.dj, EMS_WORKSHOP_SHOWCASES['rap-it']];
}

export async function setupEMSWorkshop(
  workshopId: EmsWorkshopId,
  options?: { force?: boolean; registerPartnerPlanning?: boolean },
) {
  const pack = WORKSHOPS[workshopId];
  if (!pack) throw new Error(`Unknown EMS workshop: ${workshopId}`);

  const force = Boolean(options?.force);
  const shouldRegister = Boolean(options?.registerPartnerPlanning);
  const catMap = catsFor(pack.id === 'dj' ? 'EMS DJ' : 'EMS Rap-It');
  const catList = Object.values(catMap);
  const { isOwnedCategory, isOwnedActivity } = isOwned(pack.seedNote, catList[0].split(' —')[0]);

  if (!force && localStorage.getItem(pack.markerKey) === '1') {
    if (shouldRegister) {
      try {
        const existing = readJson<Activity[]>('library-activities', []).filter(isOwnedActivity);
        registerPartnerPlanningPack({
          ...PARTNER_PLANNING_ORGS.ems,
          projectId: pack.projectId,
          projectTitle: pack.title,
          sheetId: pack.sheetId,
          activityIds: existing.map((a) => getActivityStarKey(a)),
          lessonKeys: readJson<string[]>(pack.lessonKeysKey, []),
        });
      } catch {
        /* ignore */
      }
    }
    return { skipped: true as const, sheetId: pack.sheetId, workshopId };
  }

  seedLocalCurriculumObjectives(pack.curriculum);
  ensureLocalYearGroup(pack.sheetId, pack.sheetId, pack.color);
  const categoryMerge = mergeCategoriesLocal(
    catList.map((name) => ({
      name,
      color: pack.color,
      yearGroups: Object.fromEntries(pack.yearGroups.map((y) => [y, true])),
    })),
    isOwnedCategory,
  );

  const existingLessonData = readJson<any>(`lesson-data-${pack.sheetId}`, { lessonNumbers: [] });
  const lessonNumbers = allocateLessonNumbers(1, existingLessonData.lessonNumbers || []);
  const lessonNum = lessonNumbers[0];
  const objIds = pack.curriculum.areas.flatMap((a) => a.objectives.map((o) => o.id));

  const catOrder = [catMap.warm, catMap.explore, catMap.create, catMap.share];
  const seeded = pack.activities.map((a, i) => ({
    ...a,
    category: catOrder[i] || catMap.explore,
    lessonNumber: String(lessonNum),
    unitLesson: 1,
    unitName: pack.unit,
    teachingUnit: pack.unit,
    level: pack.level,
    yearGroups: pack.yearGroups,
    notes: pack.seedNote,
    curriculumType: 'CUSTOM' as const,
    customObjectives: objIds,
    resourceLink: pack.pdfUrl,
    link: pack.productUrl,
  }));

  const activities = mergeActivitiesLocal(seeded as any, isOwnedActivity);
  const lessons = { [lessonNum]: buildLesson(pack, activities, catList) };
  const lessonPayload = mergeLessonsLocal(
    pack.sheetId,
    lessons,
    pack.seedNote,
    pack.lessonKeysKey,
    pack.unit,
  );

  const lessonStack: StackedLesson = {
    id: newStackId(`ems-${pack.id}`),
    name: pack.stackName,
    description: pack.summary,
    color: pack.color,
    lessons: lessonPayload.writtenNumbers,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    totalActivities: activities.length,
    created_at: new Date().toISOString(),
  };
  mergeStackLocal(lessonStack, pack.stackIdKey, pack.stackName);

  finishPrototypeSeed({
    activities,
    categories: catList,
    categoryMerge,
    source: `ems-${pack.id}-workshop-seed`,
    markerKey: pack.markerKey,
    starActivities: false,
  });

  highlightPaidHubActivities(activities, {
    partnerSlug: 'ems',
    partnerLabel: 'Essex Music Service',
    pickTitles: pack.pickTitles,
    fallbackCount: 4,
    categories: catList,
  });

  if (shouldRegister) {
    registerPartnerPlanningPack({
      ...PARTNER_PLANNING_ORGS.ems,
      projectId: pack.projectId,
      projectTitle: pack.title,
      sheetId: pack.sheetId,
      activityIds: activities.map((a) => getActivityStarKey(a)),
      lessonKeys: lessonPayload.writtenNumbers,
    });
  }

  return {
    skipped: false as const,
    workshopId,
    activities: activities.length,
    lessons: lessonPayload.writtenNumbers.length,
    stackId: lessonStack.id,
    sheetId: pack.sheetId,
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupEMSWorkshop = setupEMSWorkshop;
}
