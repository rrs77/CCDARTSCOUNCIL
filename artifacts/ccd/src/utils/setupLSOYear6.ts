/**
 * Year 6 Music — How to Build an Orchestra (LSO / Hachette example pack).
 *
 * Sources (project packs with classroom media):
 *  - https://www.hachette.co.uk/wp-content/uploads/2020/05/How_to_Build_an_Orchestra_KS2-Project-Pack.pdf
 *  - https://www.hachette.co.uk/wp-content/uploads/2020/05/Beethoven_Bolero_KS2-3-Project-Pack.pdf
 *
 * Seeds for Year 6 (sheet id Year6):
 *  - Category "LSO" (folder KS2 Music) assigned to Year 6
 *  - Activities tagged Year6 / Year 6
 *  - ONE primary activity stack: "How to Build an Orchestra" (full unit)
 *  - Lesson plans on lesson-data-Year6
 *
 * Usage: await setupLSOYear6Example()  |  await setupLSOYear6Example({ force: true })
 */

import { activitiesApi, lessonsApi, customCategoriesApi } from '../config/api';
import { activityStacksApi } from '../config/activityStacksApi';
import { isSupabaseConfigured } from '../config/supabase';
import type { Activity, ActivityStack, LessonData } from '../contexts/DataContext';

/** Official Hachette / LSO classroom project packs (primary sources). */
const HTBAO_PACK_PDF =
  'https://www.hachette.co.uk/wp-content/uploads/2020/05/How_to_Build_an_Orchestra_KS2-Project-Pack.pdf';
const BEETHOVEN_BOLERO_PACK_PDF =
  'https://www.hachette.co.uk/wp-content/uploads/2020/05/Beethoven_Bolero_KS2-3-Project-Pack.pdf';

/** Supporting media linked from / alongside the packs. */
const LSO_HTBAO_PAGE =
  'https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/how-to-build-an-orchestra/';
const LSO_PLAY_HOME = 'https://play.lso.co.uk/';
const LSO_PLAY_BOLERO =
  'https://play.lso.co.uk/performances/Ravels-Bolero/explore/masterclasses/m7/watch';
const LSO_BOOK_URL = 'https://lsolive.lso.co.uk/products/how-to-build-an-orchestra';

const SHEET_ID = 'Year6';
const SHEET_NAME = 'Year 6';
const CATEGORY = 'LSO';
const FOLDER = 'KS2 Music';
const UNIT = 'How to Build an Orchestra';
const STACK_NAME = 'How to Build an Orchestra';
const STACK_ID = 'lso-y6-stack-how-to-build-an-orchestra';
const LEVEL = 'KS2';
const YEAR_GROUPS = [SHEET_ID, SHEET_NAME];
const MARKER_KEY = 'ccd-lso-year6-seeded-v3';
const ACADEMIC_YEAR = '2026-2027';

function htmlLink(url: string, label: string): string {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer"><strong>${label}</strong></a> — <span>${url}</span>`;
}

function resourcesHtml(items: { label: string; url: string }[]): string {
  const lis = items.map((i) => `<li>${htmlLink(i.url, i.label)}</li>`).join('');
  return `<p><strong>Project pack &amp; media links:</strong></p><ul>${lis}</ul>`;
}

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
  lessonNumber: string;
};

function act(
  partial: Omit<SeedActivity, 'category' | 'level' | 'yearGroups' | 'teachingUnit' | 'unitName' | 'link'> & {
    link?: string;
    teachingUnit?: string;
  },
): SeedActivity {
  return {
    ...partial,
    category: CATEGORY,
    level: LEVEL,
    yearGroups: YEAR_GROUPS,
    teachingUnit: partial.teachingUnit || UNIT,
    unitName: UNIT,
    link: partial.link ?? HTBAO_PACK_PDF,
    videoLink: partial.videoLink || '',
    musicLink: partial.musicLink || '',
    backingLink: partial.backingLink || '',
    resourceLink: partial.resourceLink || HTBAO_PACK_PDF,
    vocalsLink: partial.vocalsLink || '',
    imageLink: partial.imageLink || '',
    descriptionHeading: 'Introduction/Context',
    activityHeading: 'Activity',
    linkHeading: 'Project pack / media',
  };
}

/**
 * Activities follow the Hachette KS2 packs as taught:
 * Intro → Beethoven Storm (listen/score/compose) → Boléro (listen/compose/LSO Play).
 */
const SEED_ACTIVITIES: SeedActivity[] = [
  // —— Lesson 1: Pack intro & book / film ——
  act({
    lessonNumber: '1',
    activity: 'How to Build an Orchestra — Project Pack & Film',
    description: `<p>Start with the official <strong>How to Build an Orchestra</strong> KS2 Online Project Pack (Rachel Leach / LSO / Hachette). Follow conductor Simon through the book and classroom film.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'How to Build an Orchestra KS2 Project Pack (PDF)')}</p>
<p>${htmlLink(LSO_HTBAO_PAGE, 'LSO page — classroom film, family videos, sing-along')}</p>
<p>${htmlLink(LSO_BOOK_URL, 'How to Build an Orchestra book (LSO Live)')}</p>`,
    activityText:
      'Open the Hachette KS2 project pack and the LSO How to Build an Orchestra page. Preview the film (Sir Simon Rattle & Rachel Leach), family videos and Orchestra sing-along before teaching.',
    time: 15,
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_BOOK_URL,
  }),
  act({
    lessonNumber: '1',
    activity: 'Classroom Instrument Rules & Warm-Up Setup',
    description: `<p>From the pack introduction: demonstrate each instrument, use correct names and holding, signal for silence, and try children’s ideas as they suggest them.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Project Pack — Introduction (classroom rules)')}</p>`,
    activityText:
      'Establish instrument care, naming, and a silence signal. Pass instruments around so children can make informed composing choices later.',
    time: 10,
    resourceLink: HTBAO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 2: Beethoven’s Storm listening ——
  act({
    lessonNumber: '2',
    activity: "Beethoven’s Storm — Motifs & Listening",
    description: `<p><strong>Project 1 – Beethoven’s Storm</strong> (Pastoral Symphony, movement 4). Motifs: wind (swirling scales), rain (next-door notes), thunder (rumbles), lightning (low then high).</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'How to Build an Orchestra KS2 Pack — Project 1')}</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Ravel KS2/3 Project Pack (Storm listening)')}</p>`,
    activityText:
      'Discuss storm elements. Invent coloured symbols for wind, rain, thunder and lightning. Listen and count ~14 lightning flashes.',
    time: 20,
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    musicLink: BEETHOVEN_BOLERO_PACK_PDF,
  }),
  act({
    lessonNumber: '2',
    activity: 'Storm Graphic Score Artwork',
    description: `<p>Landscape paper: left = start of storm, right = end. Layer lightning, then thunder, then wind and rain to match the music’s peak and calm ending. Add Beethoven’s flute upward scale at the end.</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro pack — Storm artwork / score')}</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'HTBAO KS2 Pack — listening task pages')}</p>`,
    activityText:
      'Build a storm picture/score across the page. Optional: fold a second sheet into quarters for movements 1, 2, 3 and 5 (finish the Pastoral story).',
    time: 25,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 3: Compose a Musical Storm ——
  act({
    lessonNumber: '3',
    activity: 'Five Facts Warm-Up (Beethoven)',
    description: `<p>Rachel Leach’s <strong>five facts</strong> warm-up from the pack: Beethoven / born 250 years ago / 6th symphony / tells a story / genius — with body taps and gestures.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Project Pack — Five facts warm-up (video in pack)')}</p>`,
    activityText:
      'Stand in a circle. Tap head → shoulders → tummy → knees → feet with the five facts and chosen gestures, then perform all together.',
    time: 10,
    videoLink: HTBAO_PACK_PDF,
    resourceLink: HTBAO_PACK_PDF,
    link: HTBAO_PACK_PDF,
  }),
  act({
    lessonNumber: '3',
    activity: 'Compose a Musical Storm',
    description: `<p>Classroom composition using Beethoven’s motif shapes: rain (stepwise short notes), thunder (low rumble/crescendo), lightning (low→high jump), wind (swirling scales/glissandos). Body-percussion versions included in the pack.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Pack — Classroom composition: Musical Storm')}</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro pack — Storm motifs')}</p>`,
    activityText:
      'Four groups (wind, rain, thunder, lightning). Fix each motif. Conduct Soft–Crescendo–Loud–Diminuendo–Soft; add final slow raindrops.',
    time: 25,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),
  act({
    lessonNumber: '3',
    activity: 'Rainbow Scale & Sunshine Melody',
    description: `<p>Taking it further: flute rising scale as a “rainbow”; sunshine tune on three notes (F, A, C in Beethoven). Invent a class rainbow scale and three-note sunshine theme. Make a graphic score of the final storm piece.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Pack — Rainbow and the sun')}</p>`,
    activityText:
      'After the storm, add rainbow scale + three-note sunshine motif. Create a class graphic score of your storm piece.',
    time: 15,
    resourceLink: HTBAO_PACK_PDF,
    link: HTBAO_PACK_PDF,
    videoLink: LSO_HTBAO_PAGE,
  }),

  // —— Lesson 4: Boléro listening ——
  act({
    lessonNumber: '4',
    activity: "Ravel’s Boléro — Three Ingredients",
    description: `<p><strong>Project 2 – Ravel’s Bolero</strong>: repeating bassline, snare ostinato, wandering melody, and one long crescendo.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'How to Build an Orchestra KS2 Pack — Project 2 Bolero')}</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro KS2/3 Pack')}</p>
<p>${htmlLink(LSO_PLAY_BOLERO, 'LSO Play — Boléro masterclass / watch')}</p>`,
    activityText:
      'Listen and spot bassline, ostinato and tune. Assign colours: one for bass, one for ostinato, many for the melody journey.',
    time: 20,
    videoLink: LSO_PLAY_BOLERO,
    musicLink: LSO_PLAY_HOME,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    link: HTBAO_PACK_PDF,
  }),
  act({
    lessonNumber: '4',
    activity: 'Boléro Colour Score (Melody Through the Orchestra)',
    description: `<p>Large paper start→finish. Draw the flute tune, then add new colours as the melody moves (clarinet, bassoon, saxophones, trombone, full orchestra, key change, coda) as listed in the pack.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Pack — Bolero listening / colour score (instrument timeline)')}</p>
<p>${htmlLink(LSO_PLAY_HOME, 'LSO Play — watch Boléro (play.lso.co.uk)')}</p>`,
    activityText:
      'Draw continuous melody shapes left to right. Add bassline along the bottom and ostinato; mark the coda at the far right.',
    time: 25,
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    link: LSO_PLAY_BOLERO,
  }),

  // —— Lesson 5: Compose Class Boléro ——
  act({
    lessonNumber: '5',
    activity: 'Boléro Bassline (C, High G, Low G)',
    description: `<p>Teach the bassline with body percussion (knees/hands/feet), then on xylophone using C, high G and low G — as in both project packs.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Pack — Make your own Bolero (bassline)')}</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro pack — Bolero at Home bassline')}</p>
<p>${htmlLink(LSO_PLAY_BOLERO, 'Play along — LSO Play Boléro')}</p>`,
    activityText:
      'Learn body-percussion bassline, then transfer to pitched instruments (C / high G / low G). Play along with LSO Play when ready.',
    time: 15,
    videoLink: LSO_PLAY_BOLERO,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
    musicLink: LSO_PLAY_HOME,
  }),
  act({
    lessonNumber: '5',
    activity: 'Boléro Ostinato (Square & Triangle Score)',
    description: `<p>Learn Ravel’s ostinato with the pack’s square/triangle score; clap squares, say or play “tri-an-gle” on triangles; transfer to drum + shaker.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Pack — Ostinato rhythm score')}</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro pack — ostinato')}</p>`,
    activityText:
      'Point through the symbol score. Split: Group 1 bassline (Cs & Gs), Group 2 ostinato. Begin pp and crescendo together.',
    time: 20,
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
  }),
  act({
    lessonNumber: '5',
    activity: 'Boléro Melody, Transposition & Coda',
    description: `<p>Melody group: next-door notes, begin/end on C, short and repeatable. Optional transposition up. Add Ravel’s coda (swoops, clashy chord, fall to C) with big percussion.</p>
<p>${htmlLink(HTBAO_PACK_PDF, 'KS2 Pack — Melody, transposition, coda')}</p>
<p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro pack — coda / play along')}</p>
<p>${htmlLink(LSO_PLAY_HOME, 'LSO Play — Boléro performance &amp; angles')}</p>`,
    activityText:
      'Layer melody over bass + ostinato. Signal transposition if used. Finish with conducted coda. Watch/explore on LSO Play (Google LSO Play → Ravel).',
    time: 20,
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    link: BEETHOVEN_BOLERO_PACK_PDF,
    musicLink: LSO_PLAY_BOLERO,
  }),
];

const LESSON_META: Record<
  string,
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
    videoLink: string;
    resourceLink: string;
    extraLinks: { label: string; url: string }[];
  }
> = {
  '1': {
    title: 'How to Build an Orchestra — Pack & Film',
    learningOutcome:
      'Pupils and teacher know the official project pack and LSO film/resources that drive this unit.',
    successCriteria:
      'I can open the Hachette KS2 pack; I know where the LSO film and family videos live; I can follow classroom instrument rules.',
    introduction: `<p>Introduce Mary Auld’s book with the LSO and the KS2 Online Project Pack.</p><p>${htmlLink(HTBAO_PACK_PDF, 'Open KS2 Project Pack PDF')}</p>`,
    mainActivity:
      'Explore pack introduction, LSO classroom film page, and set instrument/listening routines.',
    plenary: 'Bookmark pack + LSO page. Preview next: Beethoven’s Storm.',
    vocabulary: 'orchestra, conductor, LSO Discovery, project pack',
    keyQuestions: 'What will we learn from How to Build an Orchestra? How do we care for instruments?',
    resources: resourcesHtml([
      { label: 'How to Build an Orchestra KS2 Project Pack (PDF)', url: HTBAO_PACK_PDF },
      { label: 'LSO — film, families, sing-along', url: LSO_HTBAO_PAGE },
      { label: 'Book (LSO Live)', url: LSO_BOOK_URL },
    ]),
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: HTBAO_PACK_PDF,
    extraLinks: [{ label: 'Beethoven & Boléro KS2/3 Pack (PDF)', url: BEETHOVEN_BOLERO_PACK_PDF }],
  },
  '2': {
    title: "Beethoven’s Storm — Listening & Score",
    learningOutcome:
      'Pupils identify wind, rain, thunder and lightning motifs and map them onto a graphic score/artwork.',
    successCriteria:
      'I can name Beethoven’s storm motifs; I can place symbols in time across a landscape page; I notice the flute scale at the end.',
    introduction: `<p>Project 1 from the packs — Pastoral Symphony movement 4.</p><p>${htmlLink(BEETHOVEN_BOLERO_PACK_PDF, 'Beethoven &amp; Boléro pack')}</p>`,
    mainActivity: 'Symbol key; listen for lightning (~14); build layered storm artwork/score; optional Pastoral movements 1–3 & 5.',
    plenary: 'Compare scores. What happens after the storm?',
    vocabulary: 'motif, Pastoral, movement, graphic score, dynamics',
    keyQuestions: 'Where is the peak of the storm? What might the flute scale represent?',
    resources: resourcesHtml([
      { label: 'HTBAO KS2 Pack — Project 1 Storm', url: HTBAO_PACK_PDF },
      { label: 'Beethoven & Boléro KS2/3 Pack', url: BEETHOVEN_BOLERO_PACK_PDF },
    ]),
    videoLink: LSO_HTBAO_PAGE,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    extraLinks: [{ label: 'HTBAO KS2 Pack PDF', url: HTBAO_PACK_PDF }],
  },
  '3': {
    title: 'Compose a Musical Storm',
    learningOutcome:
      'Pupils compose and conduct a storm piece using Beethoven’s motif shapes and Soft–Crescendo–Loud–Diminuendo–Soft.',
    successCriteria:
      'I can perform my weather motif; I can follow a conductor; I can add rainbow/sunshine ideas and a graphic score.',
    introduction: `<p>Five facts warm-up, then classroom storm composition from the KS2 pack.</p><p>${htmlLink(HTBAO_PACK_PDF, 'Open composition pages in KS2 Pack')}</p>`,
    mainActivity: 'Warm-up; four motif groups; structure with dynamics; rainbow & sunshine extension; graphic score.',
    plenary: 'Perform and reflect. Link forward to Ravel’s Boléro.',
    vocabulary: 'crescendo, diminuendo, glissando, conductor, structure',
    keyQuestions: 'Does our storm pass overhead? Can we hear every weather layer?',
    resources: resourcesHtml([
      { label: 'HTBAO KS2 Pack — compose a storm', url: HTBAO_PACK_PDF },
      { label: 'Beethoven & Boléro Pack', url: BEETHOVEN_BOLERO_PACK_PDF },
    ]),
    videoLink: HTBAO_PACK_PDF,
    resourceLink: HTBAO_PACK_PDF,
    extraLinks: [{ label: 'Beethoven & Boléro Pack PDF', url: BEETHOVEN_BOLERO_PACK_PDF }],
  },
  '4': {
    title: "Ravel’s Boléro — Listening",
    learningOutcome:
      'Pupils hear bassline, ostinato and melody, and track orchestration/crescendo in Boléro.',
    successCriteria:
      'I can spot the three ingredients; I can follow the melody’s colours; I can use LSO Play to watch Boléro.',
    introduction: `<p>Project 2 — Boléro. Use pack audio/video and LSO Play.</p><p>${htmlLink(LSO_PLAY_BOLERO, 'LSO Play Boléro masterclass')}</p>`,
    mainActivity: 'Three-ingredient listen; large colour score with instrument timeline; mark key change and coda.',
    plenary: 'Share scores. Next lesson: build Our Class Boléro.',
    vocabulary: 'ostinato, bassline, crescendo, coda, orchestration',
    keyQuestions: 'What repeats? What changes? How does the crescendo work?',
    resources: resourcesHtml([
      { label: 'HTBAO KS2 Pack — Project 2 Bolero', url: HTBAO_PACK_PDF },
      { label: 'Beethoven & Boléro Pack', url: BEETHOVEN_BOLERO_PACK_PDF },
      { label: 'LSO Play — Boléro', url: LSO_PLAY_HOME },
      { label: 'LSO Play masterclass / watch', url: LSO_PLAY_BOLERO },
    ]),
    videoLink: LSO_PLAY_BOLERO,
    resourceLink: BEETHOVEN_BOLERO_PACK_PDF,
    extraLinks: [
      { label: 'HTBAO KS2 Pack PDF', url: HTBAO_PACK_PDF },
      { label: 'LSO Play home', url: LSO_PLAY_HOME },
    ],
  },
  '5': {
    title: 'Our Class Boléro',
    learningOutcome:
      'Pupils perform a layered Boléro with bassline, ostinato, melody, crescendo and coda, supported by LSO Play.',
    successCriteria:
      'I can keep the C/G bassline or ostinato; I can enter on cue; I can help shape a coda and play along with LSO Play.',
    introduction: `<p>Step-by-step Boléro from both packs; play along on LSO Play.</p><p>${htmlLink(LSO_PLAY_HOME, 'play.lso.co.uk → Ravel')}</p>`,
    mainActivity: 'Bassline → ostinato → combine with crescendo → melody → optional transposition → coda. Watch LSO Play.',
    plenary: 'Final performance. Optional: share with @londonsymphony as the pack suggests.',
    vocabulary: 'transposition, coda, ensemble, pizzicato, snare',
    keyQuestions: 'Can we crescendo together? Does our coda contrast the ostinato?',
    resources: resourcesHtml([
      { label: 'HTBAO KS2 Pack — make your own Bolero', url: HTBAO_PACK_PDF },
      { label: 'Beethoven & Boléro Pack — Bolero at Home', url: BEETHOVEN_BOLERO_PACK_PDF },
      { label: 'LSO Play Boléro', url: LSO_PLAY_HOME },
      { label: 'Boléro masterclass media', url: LSO_PLAY_BOLERO },
    ]),
    videoLink: LSO_PLAY_HOME,
    resourceLink: HTBAO_PACK_PDF,
    extraLinks: [
      { label: 'Beethoven & Boléro Pack PDF', url: BEETHOVEN_BOLERO_PACK_PDF },
      { label: 'LSO Play Boléro watch', url: LSO_PLAY_BOLERO },
    ],
  },
};

function blankMedia(a: SeedActivity): Activity {
  const { ...rest } = a;
  return {
    ...rest,
    videoLink: rest.videoLink || '',
    musicLink: rest.musicLink || '',
    backingLink: rest.backingLink || '',
    resourceLink: rest.resourceLink || HTBAO_PACK_PDF,
    vocalsLink: rest.vocalsLink || '',
    imageLink: rest.imageLink || '',
    eyfsStandards: [],
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mergeCategoryIntoLocalStorage() {
  const existing = readJson<any[]>('saved-categories', []);
  const without = existing.filter((c) => c?.name !== CATEGORY);
  const lsoCategory = {
    name: CATEGORY,
    color: '#1e3a8a',
    position: Math.max(0, ...without.map((c) => Number(c.position) || 0), 0) + 1,
    group: FOLDER,
    groups: [FOLDER],
    yearGroups: { [SHEET_ID]: true, [SHEET_NAME]: true },
  };
  localStorage.setItem('saved-categories', JSON.stringify([...without, lsoCategory]));

  const folders = readJson<any[]>('category-folders', []);
  if (!folders.some((f) => f?.name === FOLDER)) {
    folders.push({
      id: 'folder-ks2-music',
      name: FOLDER,
      color: '#0f766e',
      position: folders.length,
    });
    localStorage.setItem('category-folders', JSON.stringify(folders));
  }
  return lsoCategory;
}

function mergeActivitiesIntoLocalStorage(activities: Activity[]) {
  const existing = readJson<any[]>('library-activities', []);
  const names = new Set(activities.map((a) => a.activity));
  // Also drop previous LSO seed titles that we renamed away
  const kept = existing.filter((a) => {
    if (names.has(a.activity)) return false;
    if (a?.category === CATEGORY && String(a?.unitName || '') === UNIT) return false;
    if (typeof a?.activity === 'string' && a.activity.startsWith('LSO')) return false;
    return true;
  });
  const withIds = activities.map((a, i) => ({
    ...a,
    _id: a._id || `lso-y6-${i}-${String(a.activity).replace(/\W+/g, '-').slice(0, 48)}`,
  }));
  localStorage.setItem('library-activities', JSON.stringify([...kept, ...withIds]));
  return withIds;
}

/** Keep one primary unit stack; remove older fragmented LSO stacks. */
function mergePrimaryStackIntoLocalStorage(stack: ActivityStack) {
  const existing = readJson<any[]>('activity-stacks', []);
  const cleaned = existing.filter((s) => {
    if (!s) return false;
    if (s.id === STACK_ID || s.id === stack.id) return false;
    if (s.name === STACK_NAME) return false;
    const id = String(s.id || '');
    const name = String(s.name || '');
    if (id.startsWith('lso-y6-stack-')) return false;
    if (name.startsWith('LSO L') || name.startsWith('LSO:')) return false;
    return true;
  });
  localStorage.setItem('activity-stacks', JSON.stringify([...cleaned, stack]));
}

function buildLessons(activities: Activity[]): Record<string, LessonData> {
  const byLesson: Record<string, Activity[]> = {};
  activities.forEach((a, i) => {
    const num = SEED_ACTIVITIES[i]?.lessonNumber || a.lessonNumber || '1';
    if (!byLesson[num]) byLesson[num] = [];
    byLesson[num].push(a);
  });

  const lessons: Record<string, LessonData> = {};
  for (const [num, meta] of Object.entries(LESSON_META)) {
    const lessonActs = byLesson[num] || [];
    const additionalLinks = [
      { label: 'How to Build an Orchestra KS2 Project Pack (PDF)', url: HTBAO_PACK_PDF },
      { label: 'Beethoven & Boléro KS2/3 Project Pack (PDF)', url: BEETHOVEN_BOLERO_PACK_PDF },
      ...meta.extraLinks,
    ];
    lessons[num] = {
      title: meta.title,
      lessonName: `How to Build an Orchestra — ${meta.title}`,
      grouped: { [CATEGORY]: lessonActs },
      categoryOrder: [CATEGORY],
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
      notes:
        'Year 6 Music unit from the Hachette/LSO How to Build an Orchestra project packs. Open Links & Resources and each activity’s Web Resources for pack PDFs and media.',
      videoLink: meta.videoLink,
      resourceLink: meta.resourceLink,
      additionalLinks: additionalLinks as unknown as string,
      isUserCreated: true,
      academicYear: ACADEMIC_YEAR,
    };
  }
  return lessons;
}

function mergeLessonsIntoLocalStorage(lessons: Record<string, LessonData>) {
  const key = `lesson-data-${SHEET_ID}`;
  const existing = readJson<any>(key, {
    allLessonsData: {},
    lessonNumbers: [],
    teachingUnits: [],
  });
  const allLessonsData = { ...(existing.allLessonsData || {}) };

  const usePrefixed = ['1', '2', '3', '4', '5'].some((n) => {
    const cur = allLessonsData[n];
    const label = String(cur?.lessonName || cur?.title || '');
    return cur && !label.includes('How to Build an Orchestra') && !label.includes('LSO');
  });

  // Drop previous LSO* keys from older seeds
  for (const k of Object.keys(allLessonsData)) {
    if (/^LSO\d+$/i.test(k)) delete allLessonsData[k];
    const label = String(allLessonsData[k]?.lessonName || allLessonsData[k]?.title || '');
    if (label.includes('LSO —') && !label.includes('How to Build an Orchestra')) {
      // replace old LSO-titled lessons when we write numbered keys
    }
  }

  const writtenNumbers: string[] = [];
  for (const [num, lesson] of Object.entries(lessons)) {
    const keyNum = usePrefixed ? `HTBAO${num}` : num;
    allLessonsData[keyNum] = lesson;
    writtenNumbers.push(keyNum);
  }

  const lessonNumbers = [
    ...new Set(
      [...(existing.lessonNumbers || []), ...writtenNumbers].filter((n) => !/^LSO\d+$/i.test(String(n))),
    ),
  ].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  const teachingUnits = [...new Set([...(existing.teachingUnits || []), UNIT])];
  const payload = {
    ...existing,
    allLessonsData,
    lessonNumbers,
    teachingUnits,
    notes: existing.notes || '',
  };
  localStorage.setItem(key, JSON.stringify(payload));
  return { payload, writtenNumbers };
}

async function tryCloudSync(
  category: ReturnType<typeof mergeCategoryIntoLocalStorage>,
  activities: Activity[],
  stack: ActivityStack,
  lessonPayload: any,
) {
  if (!isSupabaseConfigured()) return;

  try {
    const existingCats = await customCategoriesApi.getAll();
    const without = (existingCats || []).filter((c: any) => c.name !== CATEGORY);
    await customCategoriesApi.upsert([...without, category]);
  } catch (e) {
    console.warn('LSO seed: category cloud sync skipped', e);
  }

  for (const activity of activities) {
    try {
      await activitiesApi.create(activity as any);
    } catch (e: any) {
      if (e?.code !== '23505') {
        console.warn(`LSO seed: activity cloud create skipped (${activity.activity})`, e);
      }
    }
  }

  try {
    // Replace previous fragmented stacks in cloud if present
    const existingStacks = await activityStacksApi.getAll();
    for (const s of existingStacks) {
      const id = String(s.id || '');
      const name = String(s.name || '');
      if (
        id.startsWith('lso-y6-stack-') ||
        name === STACK_NAME ||
        name.startsWith('LSO L') ||
        name.startsWith('LSO:')
      ) {
        try {
          await activityStacksApi.delete(s.id);
        } catch {
          /* ignore */
        }
      }
    }
    await activityStacksApi.create(stack);
  } catch (e) {
    console.warn('LSO seed: stack cloud sync skipped', e);
  }

  try {
    await lessonsApi.updateSheet(
      SHEET_ID,
      {
        allLessonsData: lessonPayload.allLessonsData,
        lessonNumbers: lessonPayload.lessonNumbers,
        teachingUnits: lessonPayload.teachingUnits,
        notes: lessonPayload.notes || '',
      },
      ACADEMIC_YEAR,
    );
  } catch (e) {
    console.warn('LSO seed: lessons cloud sync skipped', e);
  }
}

export async function setupLSOYear6Example(options?: { force?: boolean }) {
  if (!options?.force && localStorage.getItem(MARKER_KEY) === '1') {
    console.log('ℹ️ How to Build an Orchestra (Year 6) already seeded (pass { force: true } to re-seed)');
    return { success: true, skipped: true };
  }

  console.log('🚀 Seeding Year 6 stack: How to Build an Orchestra...');

  const category = mergeCategoryIntoLocalStorage();
  const prepared = SEED_ACTIVITIES.map(blankMedia);
  const activities = mergeActivitiesIntoLocalStorage(prepared);

  const stack: ActivityStack = {
    id: STACK_ID,
    name: STACK_NAME,
    description:
      'Full Year 6 unit from the Hachette/LSO How to Build an Orchestra KS2 packs (Beethoven Storm + Ravel Boléro), with pack PDFs and LSO Play media links.',
    activities,
    category: CATEGORY,
    totalTime: activities.reduce((s, a) => s + (a.time || 0), 0),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mergePrimaryStackIntoLocalStorage(stack);

  const lessons = buildLessons(activities);
  const { payload, writtenNumbers } = mergeLessonsIntoLocalStorage(lessons);

  await tryCloudSync(category, activities, stack, payload);

  localStorage.setItem(MARKER_KEY, '1');
  // Clear older markers so we don't leave confusing state
  localStorage.removeItem('ccd-lso-year6-seeded-v1');
  localStorage.removeItem('ccd-lso-year6-seeded-v2');

  console.log('✅ Year 6 — How to Build an Orchestra ready');
  console.log(`   Stack: "${STACK_NAME}" (${activities.length} activities)`);
  console.log(`   Category: ${CATEGORY} → ${SHEET_NAME} (${SHEET_ID})`);
  console.log(`   Lessons: ${writtenNumbers.join(', ')} on lesson-data-${SHEET_ID}`);
  console.log(`   Packs: ${HTBAO_PACK_PDF}`);
  console.log(`          ${BEETHOVEN_BOLERO_PACK_PDF}`);

  return {
    success: true,
    stackName: STACK_NAME,
    stackId: STACK_ID,
    category,
    activityCount: activities.length,
    stackCount: 1,
    lessonNumbers: writtenNumbers,
  };
}

if (typeof window !== 'undefined') {
  (window as any).setupLSOYear6Example = setupLSOYear6Example;
  try {
    if (localStorage.getItem(MARKER_KEY) !== '1') {
      void setupLSOYear6Example();
    }
  } catch (e) {
    console.warn('LSO Year 6 auto-seed failed', e);
  }
}
