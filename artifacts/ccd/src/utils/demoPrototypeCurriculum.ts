/**
 * Featured prototype / demo curriculum content for the timetable.
 *
 * First-class demo seed: written into the prototype session store + demo-db by
 * seedDemoData(). Cleared on logout then restored on the next prototype entry.
 * Never written as permanent cloud data for a real user account.
 *
 * Featured packs (4 Chords, Blood Brothers, OCR Film/Computer) are seeded via
 * their setup* modules so partner-hub Add and demo share one source of truth.
 */

export type DemoCurriculumType = 'EYFS' | 'CUSTOM';

export interface DemoGenActivity {
  activity: string;
  description: string;
  time: number;
  category: string;
  level: string;
  unitName: string;
  link?: string;
  resourceLink?: string;
}

export interface DemoGenLesson {
  number: string;
  title: string;
  unit: string;
  term: string;
  activities: DemoGenActivity[];
  /** Custom objective IDs (stable demo-* or snapshot IDs). */
  customObjectives?: string[];
  curriculumType?: DemoCurriculumType;
  /** EYFS statement texts when curriculumType is EYFS. */
  lessonStandards?: string[];
}

export interface DemoGenSheet {
  sheet: string;
  color: string;
  /** Section preset: eyfs | ks1 | ks2 | ks3 | ks4 | ks5 | other */
  sectionId: string;
  lessons: DemoGenLesson[];
}

export interface DemoObjectiveDef {
  id: string;
  code: string;
  text: string;
  description?: string;
}

export interface DemoAreaDef {
  id: string;
  section: string;
  name: string;
  description?: string;
  objectives: DemoObjectiveDef[];
}

export interface DemoObjectiveYearGroupDef {
  id: string;
  name: string;
  description: string;
  color: string;
  linked_year_groups: string[];
  areas: DemoAreaDef[];
}

/** Public PDF paths (served from artifacts/ccd/public/examples). */
export function demoResourceUrl(filename: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
  return `${base}examples/${filename}`;
}

export const DEMO_PDFS = {
  fourChordsChart: 'ks3-four-chords-chord-chart.pdf',
  fourChordsGuide: 'ks3-four-chords-lesson-guide.pdf',
  bloodBrothersPack: 'gcse-drama-blood-brothers-aqa-pack.pdf',
  bloodBrothersScenes: 'gcse-drama-blood-brothers-scene-notes.pdf',
  ocrFilmOverview: 'ocr-music-film-computer-overview.pdf',
  ocrFilmBrief: 'ocr-music-film-computer-composition-brief.pdf',
} as const;

function act(
  activity: string,
  description: string,
  time: number,
  category: string,
  level: string,
  unitName: string,
  opts: { link?: string; resourceLink?: string } = {},
): DemoGenActivity {
  return {
    activity,
    description,
    time,
    category,
    level,
    unitName,
    link: opts.link || '',
    resourceLink: opts.resourceLink || '',
  };
}

// ---------- Objective banks (demo-only, stable IDs) ----------

export const DEMO_EXTRA_OBJECTIVE_BANKS: DemoObjectiveYearGroupDef[] = [
  {
    id: 'demo-yg-ks3-music',
    name: 'KS3 Music',
    description: 'Key Stage 3 Music — National Curriculum performing, composing and listening',
    color: '#0EA5E9',
    linked_year_groups: ['Year 7 Music', 'Year 8 Music', 'Year 9 Music'],
    areas: [
      {
        id: 'demo-area-ks3-perf',
        section: 'Perform',
        name: 'Ensemble Performance',
        description: 'Play and sing with others',
        objectives: [
          {
            id: 'demo-ks3-m-p1',
            code: 'KS3-MU-P1',
            text: 'Play and perform confidently in a range of solo and ensemble contexts using voice, instruments and technology',
            description: 'Ensemble performance',
          },
          {
            id: 'demo-ks3-m-p2',
            code: 'KS3-MU-P2',
            text: 'Maintain an independent part (chords, bass, rhythm or melody) within a classroom band groove',
            description: 'Independent part',
          },
        ],
      },
      {
        id: 'demo-area-ks3-comp',
        section: 'Compose',
        name: 'Improvisation and Composition',
        objectives: [
          {
            id: 'demo-ks3-m-c1',
            code: 'KS3-MU-C1',
            text: 'Improvise and compose music using chords, riffs and simple song structures',
            description: 'Compose with chords',
          },
          {
            id: 'demo-ks3-m-c2',
            code: 'KS3-MU-C2',
            text: 'Develop and refine musical ideas in response to feedback',
            description: 'Refine ideas',
          },
        ],
      },
      {
        id: 'demo-area-ks3-listen',
        section: 'Listen',
        name: 'Critical Listening',
        objectives: [
          {
            id: 'demo-ks3-m-l1',
            code: 'KS3-MU-L1',
            text: 'Listen with increasing discrimination to a wide range of music from great composers and musicians, including popular song',
            description: 'Discriminating listening',
          },
          {
            id: 'demo-ks3-m-l2',
            code: 'KS3-MU-L2',
            text: 'Identify how harmony, structure and instrumentation create style in four-chord pop songs',
            description: 'Harmony and style',
          },
        ],
      },
    ],
  },
  {
    id: 'demo-yg-ocr-music',
    name: 'OCR GCSE Music',
    description: 'OCR GCSE Music (J536) — Area of Study 4 Film Music (film, TV and computer games)',
    color: '#6366F1',
    linked_year_groups: ['Year 10 Music (OCR)', 'Year 10 Music (GCSE)', 'Year 11 Music (GCSE)'],
    areas: [
      {
        id: 'demo-area-ocr-aos4',
        section: 'Area of Study 4',
        name: 'Film and Computer Game Music',
        objectives: [
          {
            id: 'demo-ocr-m-f1',
            code: 'OCR-AoS4-1',
            text: 'Identify how film and computer game music uses leitmotif, underscore and hit points to support narrative',
            description: 'Leitmotif and narrative',
          },
          {
            id: 'demo-ocr-m-f2',
            code: 'OCR-AoS4-2',
            text: 'Describe diegetic and non-diegetic sound and how musical elements create atmosphere and character',
            description: 'Diegetic / atmosphere',
          },
          {
            id: 'demo-ocr-m-f3',
            code: 'OCR-AoS4-3',
            text: 'Compose a short film or game cue using sequencing/technology, developing a clear musical idea',
            description: 'Cue composition',
          },
        ],
      },
      {
        id: 'demo-area-ocr-appraising',
        section: 'Appraising',
        name: 'Listening and Appraising',
        objectives: [
          {
            id: 'demo-ocr-m-a1',
            code: 'OCR-APP-1',
            text: 'Use OCR subject terminology accurately when analysing unfamiliar film and game music extracts',
            description: 'Subject terminology',
          },
        ],
      },
    ],
  },
  {
    id: 'demo-yg-aqa-drama',
    name: 'AQA GCSE Drama',
    description: 'AQA GCSE Drama (8261) — set text, devising and live theatre study',
    color: '#DC2626',
    linked_year_groups: ['Year 10 Drama (GCSE)', 'Year 11 Drama (GCSE)', 'Year 10 Drama', 'Year 11 Drama'],
    areas: [
      {
        id: 'demo-area-aqa-c3',
        section: 'Component 3',
        name: 'Texts in Practice / Set Text Study',
        objectives: [
          {
            id: 'demo-aqa-dr-c3-1',
            code: 'AQA-C3-1',
            text: 'Interpret a set text (Blood Brothers) showing understanding of character, context and theatrical style',
            description: 'Set text interpretation',
          },
          {
            id: 'demo-aqa-dr-c3-2',
            code: 'AQA-C3-2',
            text: 'Explain how vocal, physical and proxemic choices communicate meaning for a named character',
            description: 'Performer skills',
          },
          {
            id: 'demo-aqa-dr-c3-3',
            code: 'AQA-C3-3',
            text: 'Analyse how social class, nature vs nurture and 1980s Liverpool context shape Blood Brothers',
            description: 'Context and themes',
          },
        ],
      },
      {
        id: 'demo-area-aqa-live',
        section: 'Component 1 / Live Theatre',
        name: 'Live Theatre Evaluation',
        objectives: [
          {
            id: 'demo-aqa-dr-lt-1',
            code: 'AQA-LT-1',
            text: 'Analyse and evaluate live theatre using AQA subject terminology (performer and design)',
            description: 'Live theatre analysis',
          },
        ],
      },
    ],
  },
];

/** Snapshot EYFS ELG IDs used for early-years demo lessons. */
export const EYFS_MUSIC_DRAMA_OBJECTIVE_IDS = [
  'eyfs-ead-bie-2', // Sing a range of well-known nursery rhymes and songs
  'eyfs-ead-bie-3', // Perform songs, rhymes, poems and stories with others
  'eyfs-psed-br-1', // Work and play cooperatively and take turns
];

export const EYFS_ELG_TEXTS = [
  'Sing a range of well-known nursery rhymes and songs.',
  'Perform songs, rhymes, poems and stories with others, and (when appropriate) try to move in time with music.',
  'Work and play cooperatively and take turns with others.',
];

/** Year 6 Music snapshot objective IDs (Model Music Curriculum style). */
export const YEAR6_MUSIC_OBJECTIVE_IDS = ['y6m-sbrc-1', 'y6m-sbrc-2', 'y6m-lku-1'];

/** Snapshot Year 9 / 10 / 11 Drama objective IDs. */
export const Y9_DRAMA_OBJECTIVE_IDS = [
  '9bcde098-13b4-4d3a-b9c9-25a52aca9d31', // Y9-DR-D1
  '639adb6f-b36b-460f-a2bd-afb8a071bbce', // Y9-DR-P1
  '95b5a2fd-c513-4ba9-84d1-28baaff44922', // Y9-DR-U1
];

export const Y10_DRAMA_OBJECTIVE_IDS = [
  '76ccf44f-88f2-4e7d-bc4d-9c6dedc1b6cc', // Y10-DR-D1
  '95a0eba4-00eb-4fc0-b376-c8423255d663', // Y10-DR-P1
  'd9f90287-35a8-44de-8ccc-46816bfb5004', // Y10-DR-U1
];

export const Y11_DRAMA_OBJECTIVE_IDS = [
  '299d2808-a0ef-436f-b664-2040bbee2669', // Y11-DR-P1
  '1d099f92-e128-4591-89bc-b4393116501e', // Y11-DR-U1
  'bc2e97c1-78fa-4a93-9a2f-0c2979ba6159', // Y11-DR-U2
];

const FOUR_CHORD_OBJECTIVES = ['demo-ks3-m-p1', 'demo-ks3-m-p2', 'demo-ks3-m-c1', 'demo-ks3-m-l2'];
const OCR_FILM_OBJECTIVES = ['demo-ocr-m-f1', 'demo-ocr-m-f2', 'demo-ocr-m-f3', 'demo-ocr-m-a1'];
const AQA_BLOOD_BROTHERS_OBJECTIVES = [
  'demo-aqa-dr-c3-1',
  'demo-aqa-dr-c3-2',
  'demo-aqa-dr-c3-3',
  ...Y11_DRAMA_OBJECTIVE_IDS,
];

/**
 * Featured prototype sheets (plus enriched KS3/KS4 examples) for the demo timetable.
 * Blood Brothers is AQA GCSE Drama; Film/Computer is OCR AoS4; Four Chords is KS3.
 */
export const FEATURED_PROTOTYPE_SHEETS: DemoGenSheet[] = [
  {
    sheet: 'Year 8 Music',
    color: '#0284C7',
    sectionId: 'ks3',
    lessons: [
      {
        number: '1',
        title: 'Four Chords: The Pop Progression',
        unit: 'Four Chords',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: FOUR_CHORD_OBJECTIVES,
        activities: [
          act(
            'Pulse & Chord Shape Warm-up',
            '<p>Whole-class pulse on knees, then map the <strong>I–V–vi–IV</strong> progression (Axis of Awesome / Musical Futures style). In G major: <strong>G – D – Em – C</strong>. Students say chord names in time before touching instruments. Open the chord chart PDF from Web Resources.</p>',
            10,
            'Vocal Warmups',
            'KS3',
            'Four Chords',
            { resourceLink: demoResourceUrl(DEMO_PDFS.fourChordsChart) },
          ),
          act(
            'Classroom Band: Four-Chord Groove',
            '<p>Musical Futures informal learning: groups of 4–5 form a classroom band (ukulele/guitar or keyboard chords, bass root notes, drum kit/body percussion, optional vocals). Loop eight bars of I–V–vi–IV at a steady tempo. Success criteria: secure chord changes on beat 1; balanced ensemble volume; everyone keeps going if someone slips.</p>',
            25,
            'Teaching Units',
            'KS3',
            'Four Chords',
            { resourceLink: demoResourceUrl(DEMO_PDFS.fourChordsGuide) },
          ),
          act(
            'Sing Over the Loop',
            '<p>Layer a known pop melody (classroom-safe repertoire) over the four-chord loop. Discuss why so many hits share this harmony: familiarity, emotional contour (major lift then relative minor). Students note verse vs chorus energy while the chords stay the same.</p>',
            15,
            'Teaching Units',
            'KS3',
            'Four Chords',
          ),
        ],
      },
      {
        number: '2',
        title: 'Four Chords: Compose a Hook',
        unit: 'Four Chords',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: FOUR_CHORD_OBJECTIVES,
        activities: [
          act(
            'Listening Spot: Same Chords, Different Songs',
            '<p>Play short excerpts of contrasting four-chord songs. Students identify what changes (tempo, instrumentation, melody, lyrics) while harmony stays constant. Link to KS3 listening: discriminating features of popular song.</p>',
            10,
            'Teaching Units',
            'KS3',
            'Four Chords',
            { resourceLink: demoResourceUrl(DEMO_PDFS.fourChordsGuide) },
          ),
          act(
            'Compose an 8-Bar Hook',
            '<p>Over the I–V–vi–IV loop, pairs compose a memorable 8-bar vocal or instrumental hook. Criteria: clear rhythmic identity, mostly stepwise melody, repeats with one variation. Notate simply (letter names, TAB, or DAW MIDI).</p>',
            25,
            'Teaching Units',
            'KS3',
            'Four Chords',
            { resourceLink: demoResourceUrl(DEMO_PDFS.fourChordsChart) },
          ),
          act(
            'Band Share & Peer Feedback',
            '<p>Each group performs 16 bars (groove + hook). Peers give two stars and one wish focused on ensemble timing, chord accuracy, or hook memorability. Capture a quick recording for next lesson.</p>',
            15,
            'Teaching Units',
            'KS3',
            'Four Chords',
          ),
        ],
      },
    ],
  },
  {
    sheet: 'Year 11 Drama (GCSE)',
    color: '#DC2626',
    sectionId: 'ks4',
    lessons: [
      {
        number: '1',
        title: 'AQA Set Text: Blood Brothers — Context & Character',
        unit: 'AQA Component 3: Blood Brothers',
        term: 'SP1',
        curriculumType: 'CUSTOM',
        customObjectives: AQA_BLOOD_BROTHERS_OBJECTIVES,
        activities: [
          act(
            'Context Carousel: 1980s Liverpool',
            '<p><strong>AQA GCSE Drama (8261)</strong> set-text study. Five stations: unemployment & class divide; superstition; Willy Russell’s intentions; original staging conventions; Marilyn Monroe motif. Students collect one usable exam point per station. Open the AQA pack PDF for revision notes.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Blood Brothers',
            { resourceLink: demoResourceUrl(DEMO_PDFS.bloodBrothersPack) },
          ),
          act(
            'Staging the Mickey/Eddie Reunion',
            '<p>In groups, block the reunion showing the class gap through <strong>proximics, levels and contrasting physicality</strong>. Trial in-the-round vs proscenium. Link choices to AQA performer criteria (vocal, physical, spatial). Use scene notes PDF.</p>',
            25,
            'KS1 Drama',
            'KS4 GCSE',
            'Blood Brothers',
            { resourceLink: demoResourceUrl(DEMO_PDFS.bloodBrothersScenes) },
          ),
          act(
            'Exam Question Deconstruction (Performer)',
            '<p>Model a 20-mark AQA-style performer response: highlight where marks are won (vocal, physical, proxemic, audience effect). Students write a timed paragraph for Mrs Johnstone or Mrs Lyons and self-check against band language.</p>',
            20,
            'Teaching Units',
            'KS4 GCSE',
            'Blood Brothers',
            { resourceLink: demoResourceUrl(DEMO_PDFS.bloodBrothersPack) },
          ),
        ],
      },
      {
        number: '2',
        title: 'Blood Brothers — Design & Climax',
        unit: 'AQA Component 3: Blood Brothers',
        term: 'SP1',
        curriculumType: 'CUSTOM',
        customObjectives: AQA_BLOOD_BROTHERS_OBJECTIVES,
        activities: [
          act(
            'Design Pitch: Final Scene',
            '<p>In design pairs, pitch lighting, costume or sound for the final shooting. Justify how design communicates fate, class and tragedy — AQA design vocabulary linked to intention and audience effect.</p>',
            20,
            'Teaching Units',
            'KS4 GCSE',
            'Blood Brothers',
            { resourceLink: demoResourceUrl(DEMO_PDFS.bloodBrothersScenes) },
          ),
          act(
            'Narrator & Direct Address Workshop',
            '<p>Explore the Narrator’s prologue: direct address, foreshadowing, and how breaking the fourth wall shapes audience tension. Rehearse opening 16 lines with clear vocal contrast to naturalistic scenes.</p>',
            20,
            'KS1 Drama',
            'KS4 GCSE',
            'Blood Brothers',
          ),
          act(
            'Timed 12-Mark Context Response',
            '<p>Timed answer: how social and historical context influences a key moment in Blood Brothers. Peer-mark for specific textual/staging reference + clear audience effect (AQA analytical habit).</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Blood Brothers',
            { resourceLink: demoResourceUrl(DEMO_PDFS.bloodBrothersPack) },
          ),
        ],
      },
      {
        number: '3',
        title: 'Live Theatre Evaluation Masterclass',
        unit: 'AQA Live Theatre',
        term: 'SP2',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-aqa-dr-lt-1', ...Y11_DRAMA_OBJECTIVE_IDS],
        activities: [
          act(
            'Memory Retrieval Grid',
            '<p>From a live production seen this term, complete a retrieval grid: three striking design moments, three performance choices, audience reaction to each. First pass without notes.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Live Theatre',
          ),
          act(
            'Analyse vs Evaluate Sorting',
            '<p>Sort sample sentences into describes / analyses / evaluates, then upgrade three into evaluative AQA-style judgements (because–effect–judgement).</p>',
            15,
            'IWB Games',
            'KS4 GCSE',
            'Live Theatre',
          ),
          act(
            'Timed 14-Mark Response',
            '<p>Full timed answer on how one performer created tension. Peer-mark with band descriptors.</p>',
            25,
            'Teaching Units',
            'KS4 GCSE',
            'Live Theatre',
          ),
        ],
      },
    ],
  },
  {
    sheet: 'Year 10 Music (OCR)',
    color: '#4F46E5',
    sectionId: 'ks4',
    lessons: [
      {
        number: '1',
        title: 'OCR AoS4: Film Music Language',
        unit: 'OCR Film & Computer Game Music',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: OCR_FILM_OBJECTIVES,
        activities: [
          act(
            'Leitmotif Detective',
            '<p><strong>OCR GCSE Music (J536) Area of Study 4: Film Music</strong> (includes television and computer game music). Listen to short cues; students spot recurring <strong>leitmotifs</strong> and link them to character or place. Introduce diegetic vs non-diegetic. Open the AoS4 overview PDF.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Film & Computer Music',
            { resourceLink: demoResourceUrl(DEMO_PDFS.ocrFilmOverview) },
          ),
          act(
            'Hit Points & Underscore Workshop',
            '<p>Watch a silent 45-second clip. In pairs, clap proposed <strong>hit points</strong>, then sketch an underscore plan: texture, dynamics, and one dissonance cluster for tension. Compare plans as a class using OCR vocabulary.</p>',
            25,
            'Teaching Units',
            'KS4 GCSE',
            'Film & Computer Music',
            { resourceLink: demoResourceUrl(DEMO_PDFS.ocrFilmOverview) },
          ),
          act(
            'Appraising Drill: Unfamiliar Extract',
            '<p>Low-stakes OCR-style listening: identify tempo, tonality, texture change and how elements create atmosphere in an unfamiliar film/game extract.</p>',
            15,
            'IWB Games',
            'KS4 GCSE',
            'Film & Computer Music',
          ),
        ],
      },
      {
        number: '2',
        title: 'OCR AoS4: Compose a Game/Film Cue',
        unit: 'OCR Film & Computer Game Music',
        term: 'A2',
        curriculumType: 'CUSTOM',
        customObjectives: OCR_FILM_OBJECTIVES,
        activities: [
          act(
            'Brief & Success Criteria',
            '<p>Share the composition brief PDF: 45–60 second cue for a silent film or game moment with a clear leitmotif, one hit-point change, and documented technology use (DAW/sequencer).</p>',
            10,
            'Teaching Units',
            'KS4 GCSE',
            'Film & Computer Music',
            { resourceLink: demoResourceUrl(DEMO_PDFS.ocrFilmBrief) },
          ),
          act(
            'DAW Cue Drafting',
            '<p>Students draft in a DAW: establish leitmotif (4–8 bars), add underscore layers, place a dynamic/texture hit. Teacher circulates for OCR composing criteria — coherence, development, technical control, expressive intent.</p>',
            30,
            'Teaching Units',
            'KS4 GCSE',
            'Film & Computer Music',
            { resourceLink: demoResourceUrl(DEMO_PDFS.ocrFilmBrief) },
          ),
          act(
            'Playback Sync Check',
            '<p>Play cues against the silent clip. Peers check: is the leitmotif audible? Does the hit land? One improvement target logged for homework.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Film & Computer Music',
          ),
        ],
      },
    ],
  },
];

/** Additional KS3/KS4 sheets that keep the broader demo timetable rich. */
export const SUPPORTING_KS3_KS4_SHEETS: DemoGenSheet[] = [
  {
    sheet: 'Year 9 Music',
    color: '#0EA5E9',
    sectionId: 'ks3',
    lessons: [
      {
        number: '1',
        title: 'Hooks & Riffs: Building Blocks of Pop',
        unit: 'Hooks & Riffs',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-ks3-m-c1', 'demo-ks3-m-l1', 'demo-ks3-m-p1'],
        activities: [
          act(
            'Riff Recognition Warm-up',
            '<p>Play short excerpts of well-known riffs. Students identify the instrument carrying the riff and describe its shape. Introduce <strong>hook</strong>, <strong>riff</strong> and <strong>ostinato</strong>.</p>',
            10,
            'Vocal Warmups',
            'KS3',
            'Hooks & Riffs',
          ),
          act(
            'Keyboard Riff Workshop',
            '<p>In pairs at keyboards, learn a riff by ear, then transpose up a tone. Extension: rhythmic variation at 92bpm.</p>',
            25,
            'Teaching Units',
            'KS3',
            'Hooks & Riffs',
          ),
          act(
            'Compose a 4-Bar Hook',
            '<p>Using the pentatonic scale on A, compose and notate a 4-bar hook. Perform to another pair for structured feedback.</p>',
            20,
            'Teaching Units',
            'KS3',
            'Hooks & Riffs',
          ),
        ],
      },
      {
        number: '2',
        title: 'Layering Riffs into a Groove',
        unit: 'Hooks & Riffs',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-ks3-m-p1', 'demo-ks3-m-p2', 'demo-ks3-m-c2'],
        activities: [
          act(
            'Body Percussion Groove',
            '<p>Layered body percussion: pulse, off-beat clap, syncopated riff rhythm. Discuss texture.</p>',
            10,
            'Percussion Games',
            'KS3',
            'Hooks & Riffs',
          ),
          act(
            'Band Skills: Layered Riff Piece',
            '<p>Groups of 4 build a 16-bar piece from last lesson’s hooks. Record a rough take.</p>',
            30,
            'Teaching Units',
            'KS3',
            'Hooks & Riffs',
          ),
          act(
            'Listening: Ostinato & Minimalism',
            '<p>Compare sustained ostinato textures. Students note two techniques and improve their group piece.</p>',
            15,
            'Teaching Units',
            'KS3',
            'Hooks & Riffs',
          ),
        ],
      },
    ],
  },
  {
    sheet: 'Year 10 Music (GCSE)',
    color: '#6366F1',
    sectionId: 'ks4',
    lessons: [
      {
        number: '1',
        title: 'Musical Language Foundations',
        unit: 'GCSE Musical Language',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-ocr-m-a1'],
        activities: [
          act(
            'Elements Audit',
            '<p>Recap dynamics, rhythm, structure, melody, instrumentation, texture, harmony using a short dictation extract.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Musical Language',
          ),
          act(
            'Cadence Aural Drill',
            '<p>Identify perfect, plagal, imperfect and interrupted cadences; harmonise an 8-bar melody two ways.</p>',
            20,
            'Teaching Units',
            'KS4 GCSE',
            'Musical Language',
          ),
          act(
            'Motif Development Sketchbook',
            '<p>Develop a 2-bar motif using sequence, inversion, augmentation and fragmentation.</p>',
            25,
            'Teaching Units',
            'KS4 GCSE',
            'Musical Language',
          ),
        ],
      },
      {
        number: '2',
        title: 'Performance Workshop: Solo Pieces',
        unit: 'GCSE Performing',
        term: 'A2',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-ocr-m-a1'],
        activities: [
          act(
            'Technical Warm-up Circuit',
            '<p>Instrument-specific warm-ups and a 60-second mental rehearsal of the opening phrase.</p>',
            10,
            'Vocal Warmups',
            'KS4 GCSE',
            'Performing',
          ),
          act(
            'Recorded Run-through & Self-Assessment',
            '<p>Record a full run; mark against accuracy, technical control, expression and interpretation.</p>',
            30,
            'Teaching Units',
            'KS4 GCSE',
            'Performing',
          ),
          act(
            'Peer Feedback Panels',
            '<p>Trios give structured feedback: one strength, one actionable target.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Performing',
          ),
        ],
      },
    ],
  },
  {
    sheet: 'Year 11 Music (GCSE)',
    color: '#8B5CF6',
    sectionId: 'ks4',
    lessons: [
      {
        number: '1',
        title: 'Set Work Revision Clinic',
        unit: 'GCSE Revision: Set Works',
        term: 'SP1',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-ocr-m-a1'],
        activities: [
          act(
            'Score Speed-Dating',
            '<p>Stations with short score extracts and exam-style questions. Two minutes per station.</p>',
            20,
            'Teaching Units',
            'KS4 GCSE',
            'Set Works',
          ),
          act(
            'Essay Planning',
            '<p>Plan and write a short timed response on contrast between sections using element vocabulary.</p>',
            25,
            'Teaching Units',
            'KS4 GCSE',
            'Set Works',
          ),
          act(
            'Aural Recall Quiz',
            '<p>Quick-fire aural questions mixing set works with unfamiliar listening.</p>',
            10,
            'IWB Games',
            'KS4 GCSE',
            'Set Works',
          ),
        ],
      },
      {
        number: '2',
        title: 'Free Composition: Final Drafting',
        unit: 'GCSE Composing',
        term: 'SP1',
        curriculumType: 'CUSTOM',
        customObjectives: ['demo-ocr-m-f3'],
        activities: [
          act(
            'Structure Health-Check',
            '<p>Map structure on paper; identify any section that repeats without development.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Composing',
          ),
          act(
            'Drafting Session with Milestones',
            '<p>Focused drafting with timed milestones and a dated export.</p>',
            30,
            'Teaching Units',
            'KS4 GCSE',
            'Composing',
          ),
          act(
            'Programme Note Draft',
            '<p>Write a short programme note; peer-check that claims are audible in the draft.</p>',
            10,
            'Teaching Units',
            'KS4 GCSE',
            'Composing',
          ),
        ],
      },
    ],
  },
  {
    sheet: 'Year 9 Drama',
    color: '#F59E0B',
    sectionId: 'ks3',
    lessons: [
      {
        number: '1',
        title: 'Devising from Stimulus: The Empty Chair',
        unit: 'Devising Theatre',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: Y9_DRAMA_OBJECTIVE_IDS,
        activities: [
          act(
            'Ensemble Energy: Zip Zap Boing',
            '<p>Fast-paced circle game to sharpen focus. Sets the ensemble tone for devising (KS3 ages 11–14).</p>',
            8,
            'Drama Games',
            'KS3',
            'Devising Theatre',
          ),
          act(
            'Stimulus Response Carousel',
            '<p>Groups rotate around stimuli and improvise 30-second moments. Capture strongest ideas.</p>',
            22,
            'Drama Games',
            'KS3',
            'Devising Theatre',
          ),
          act(
            'Marking the Moment',
            '<p>Build a 2-minute devised scene and mark the moment of greatest tension (freeze, slow motion, or direct address).</p>',
            20,
            'KS1 Drama',
            'KS3',
            'Devising Theatre',
          ),
        ],
      },
      {
        number: '2',
        title: 'Physical Theatre: Ensemble Basics',
        unit: 'Devising Theatre',
        term: 'A2',
        curriculumType: 'CUSTOM',
        customObjectives: Y9_DRAMA_OBJECTIVE_IDS,
        activities: [
          act(
            'Push Hands Warm-up',
            '<p>Paired balance-and-counterbalance for trust and body awareness.</p>',
            10,
            'Drama Games',
            'KS3',
            'Physical Theatre',
          ),
          act(
            'Chair Duets',
            '<p>Pairs build a movement sequence around a chair; set to contrasting music and observe meaning change.</p>',
            25,
            'KS1 Drama',
            'KS3',
            'Physical Theatre',
          ),
          act(
            'Travelling Ensemble Sequence',
            '<p>Trios create a travelling sequence and layer one line of text each.</p>',
            15,
            'KS1 Drama',
            'KS3',
            'Physical Theatre',
          ),
        ],
      },
    ],
  },
  {
    sheet: 'Year 10 Drama (GCSE)',
    color: '#EF4444',
    sectionId: 'ks4',
    lessons: [
      {
        number: '1',
        title: 'AQA Component 1: Devising Log Foundations',
        unit: 'GCSE Component 1: Devising',
        term: 'A1',
        curriculumType: 'CUSTOM',
        customObjectives: [...Y10_DRAMA_OBJECTIVE_IDS, 'demo-aqa-dr-lt-1'],
        activities: [
          act(
            'Practitioner Speed Briefing',
            '<p>Stations on Stanislavski, Brecht and Artaud (practitioner packs ages 14–18 / KS4). Students choose an approach for devising intentions and justify in the log.</p>',
            15,
            'Teaching Units',
            'KS4 GCSE',
            'Devising',
          ),
          act(
            'Devising Workshop: Structure & Style',
            '<p>Apply chosen practitioner to the exam stimulus; rehearse the opening two minutes.</p>',
            30,
            'KS1 Drama',
            'KS4 GCSE',
            'Devising',
          ),
          act(
            'Portfolio Entry: Initial Response',
            '<p>Timed write-up for devising log Section 1 with one annotated rehearsal photo.</p>',
            20,
            'Teaching Units',
            'KS4 GCSE',
            'Devising',
          ),
        ],
      },
      {
        number: '2',
        title: 'Rehearsal & Refinement: Scene Transitions',
        unit: 'GCSE Component 1: Devising',
        term: 'A2',
        curriculumType: 'CUSTOM',
        customObjectives: Y10_DRAMA_OBJECTIVE_IDS,
        activities: [
          act(
            'Vocal & Physical Warm-up',
            '<p>Articulation drills and ensemble energy build from stillness to full movement.</p>',
            10,
            'Vocal Warmups',
            'KS4 GCSE',
            'Devising',
          ),
          act(
            'Transitions Clinic',
            '<p>Rebuild the weakest scene change three ways; keep the strongest and log the decision.</p>',
            25,
            'KS1 Drama',
            'KS4 GCSE',
            'Devising',
          ),
          act(
            'Mock Moderation',
            '<p>Perform current 5 minutes; mark against devising criteria bands and set two priorities.</p>',
            20,
            'Teaching Units',
            'KS4 GCSE',
            'Devising',
          ),
        ],
      },
    ],
  },
];

/**
 * Timetable filler sheets only. Featured prototypes (4 Chords, Blood Brothers,
 * OCR Film/Computer) are seeded via setupKS3FourChords / setupWTDBloodBrothers /
 * setupOCRFilmComputerMusic so partner-hub and demo share one source of truth.
 */
export const ALL_GENERATED_SHEETS: DemoGenSheet[] = SUPPORTING_KS3_KS4_SHEETS.filter(
  (s) =>
    s.sheet !== 'Year 10 Music (GCSE)' &&
    s.sheet !== 'Year 10 Drama (GCSE)' &&
    s.sheet !== 'Year 8 Music',
);

/** Sheets whose EYFS lessons should get Early Learning Goals pre-attached. */
export const EYFS_DEMO_SHEETS = new Set([
  'LKG',
  'UKG',
  'Reception',
  'Lower Kindergarten Music',
  'Upper Kindergarten Music',
  'Lower Kindergarten',
  'Upper Kindergarten',
  'Reception Music',
  'Reception Drama',
]);

export function flattenDemoObjectiveRows(banks: DemoObjectiveYearGroupDef[] = DEMO_EXTRA_OBJECTIVE_BANKS) {
  const yearGroups: Record<string, unknown>[] = [];
  const areas: Record<string, unknown>[] = [];
  const objectives: Record<string, unknown>[] = [];
  const now = new Date().toISOString();

  banks.forEach((yg, ygIndex) => {
    yearGroups.push({
      id: yg.id,
      name: yg.name,
      description: yg.description,
      color: yg.color,
      sort_order: 200 + ygIndex,
      linked_year_groups: yg.linked_year_groups,
      created_at: now,
      updated_at: now,
    });
    yg.areas.forEach((area, areaIndex) => {
      areas.push({
        id: area.id,
        year_group_id: yg.id,
        section: area.section,
        name: area.name,
        description: area.description || '',
        sort_order: areaIndex,
        created_at: now,
        updated_at: now,
      });
      area.objectives.forEach((obj, objIndex) => {
        objectives.push({
          id: obj.id,
          area_id: area.id,
          objective_code: obj.code,
          objective_text: obj.text,
          description: obj.description || '',
          sort_order: objIndex,
          created_at: now,
          updated_at: now,
        });
      });
    });
  });

  return { yearGroups, areas, objectives };
}
