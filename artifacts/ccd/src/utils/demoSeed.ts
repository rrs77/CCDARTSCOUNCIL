/**
 * Prototype / demo seeding from a snapshot of the owner's real account.
 *
 * `demoSnapshot.json` is a build-time copy (see scripts/fetch-demo-snapshot.mjs)
 * of every content table in the live account — activities, lessons, plans,
 * stacks, year groups, categories, objectives, half terms. At demo activation
 * we copy it into:
 *   1. `demo-db-<table>` localStorage tables served by the mock Supabase
 *      client (utils/demoDb.ts) — no request ever reaches the live database.
 *   2. The legacy localStorage keys DataContext reads directly in demo mode
 *      (library-activities, lesson-data-<sheet>, half-terms-…, planner plans).
 *
 * Seeding is idempotent per browser session (guarded by DEMO_SEED_MARKER_KEY)
 * and re-runs from the pristine snapshot on every new session, so visitor
 * edits are temporary and never duplicated.
 *
 * It also appends generated Secondary / KS4 Music & Drama example content and
 * populates the planner across days, subjects and year groups.
 */

import { DEMO_SEED_MARKER_KEY, clearDemoLocalStorage } from './demoMode';
import { writeDemoTable } from './demoDb';

type Row = Record<string, any>;

const CURRENT_ACADEMIC_YEAR = '2026-2027';
const SNAPSHOT_ACADEMIC_YEARS = ['2025-2026', '2026-2027'];

/** Lesson sheets in the snapshot that are junk/test rows we don't surface. */
const SKIP_SHEETS = new Set(['0', '1', '2', '3', 'DEMO', 'Reception Music', 'Year 2 Music']);

// ---------- snapshot transforms ----------

function mediaUrl(link: string | null | undefined): string {
  if (!link) return '';
  if (link.startsWith('__DEMO_MEDIA__/')) {
    return `${import.meta.env.BASE_URL}demo-media/${link.slice('__DEMO_MEDIA__/'.length)}`;
  }
  return link;
}

/** snake_case DB activity row -> camelCase Activity used by the frontend. */
function toCamelActivity(item: Row): Row {
  return {
    _id: item.id,
    activity: item.activity,
    description: item.description || '',
    activityText: item.activity_text || '',
    descriptionHeading: item.description_heading || 'Introduction/Context',
    activityHeading: item.activity_heading || 'Activity',
    linkHeading: item.link_heading || 'Additional Link',
    time: item.time ?? 0,
    videoLink: item.video_link || '',
    musicLink: item.music_link || '',
    backingLink: item.backing_link || '',
    resourceLink: item.resource_link || '',
    link: item.link || '',
    vocalsLink: item.vocals_link || '',
    imageLink: mediaUrl(item.image_link),
    canvaLink: item.canva_link || '',
    teachingUnit: item.teaching_unit || '',
    category: item.category || '',
    level: item.level || '',
    unitName: item.unit_name || '',
    lessonNumber: item.lesson_number || '',
    eyfsStandards: item.eyfs_standards || [],
    yearGroups: item.yeargroups || item.year_groups || [],
  };
}

const HALF_TERM_DEFS = [
  { id: 'A1', name: 'Autumn 1', months: 'Sep-Oct' },
  { id: 'A2', name: 'Autumn 2', months: 'Nov-Dec' },
  { id: 'SP1', name: 'Spring 1', months: 'Jan-Feb' },
  { id: 'SP2', name: 'Spring 2', months: 'Feb-Mar' },
  { id: 'SM1', name: 'Summer 1', months: 'Apr-May' },
  { id: 'SM2', name: 'Summer 2', months: 'Jun-Jul' },
];

// ---------- generated Secondary / KS4 supplement ----------

interface GenActivity {
  activity: string;
  description: string;
  time: number;
  category: string;
  level: string;
  unitName: string;
  link?: string;
}

interface GenLesson {
  number: string;
  title: string;
  unit: string;
  term: string;
  activities: GenActivity[];
}

interface GenSheet {
  sheet: string;
  color: string;
  lessons: GenLesson[];
}

function act(
  activity: string,
  description: string,
  time: number,
  category: string,
  level: string,
  unitName: string,
  link = '',
): GenActivity {
  return { activity, description, time, category, level, unitName, link };
}

const KS3_KS4_SHEETS: GenSheet[] = [
  {
    sheet: 'Year 9 Music',
    color: '#0EA5E9',
    lessons: [
      {
        number: '1',
        title: 'Hooks & Riffs: Building Blocks of Pop',
        unit: 'Hooks & Riffs',
        term: 'A1',
        activities: [
          act('Riff Recognition Warm-up', '<p>Play short excerpts of well-known riffs (Seven Nation Army, Smoke on the Water, Sweet Child O\' Mine). Students identify the instrument carrying the riff and describe its shape — ascending, descending, static. Introduce the terms <strong>hook</strong>, <strong>riff</strong> and <strong>ostinato</strong> and how they differ.</p>', 10, 'Vocal Warmups', 'KS3', 'Hooks & Riffs'),
          act('Keyboard Riff Workshop', '<p>In pairs at keyboards, students learn the Seven Nation Army riff by ear, then transpose it up a tone. Extension: add a rhythmic variation while keeping the pitch contour. Focus on accurate rhythm against a drum backing at 92bpm.</p>', 25, 'Teaching Units', 'KS3', 'Hooks & Riffs'),
          act('Compose a 4-Bar Hook', '<p>Using the pentatonic scale on A, compose and notate a 4-bar hook that could open a pop song. Success criteria: memorable contour, clear rhythmic identity, repeats with one variation. Perform to another pair for structured feedback.</p>', 20, 'Teaching Units', 'KS3', 'Hooks & Riffs'),
        ],
      },
      {
        number: '2',
        title: 'Layering Riffs into a Groove',
        unit: 'Hooks & Riffs',
        term: 'A1',
        activities: [
          act('Body Percussion Groove', '<p>Whole-class layered body percussion: group 1 keeps a pulse, group 2 adds an off-beat clap, group 3 performs a syncopated riff rhythm. Swap roles every 8 bars. Discuss how layering creates texture.</p>', 10, 'Percussion Games', 'KS3', 'Hooks & Riffs'),
          act('Band Skills: Layered Riff Piece', '<p>In groups of 4 (keyboard, bass, drums/percussion, voice or second keyboard), build a 16-bar piece from last lesson\'s hooks. Each layer enters every 4 bars. Record a rough take at the end for review next lesson.</p>', 30, 'Teaching Units', 'KS3', 'Hooks & Riffs'),
          act('Listening: Bolero & Minimalism', '<p>Compare Ravel\'s Bolero opening with Steve Reich\'s Clapping Music. How do composers sustain interest when material repeats? Students note two techniques and suggest one improvement to their own group piece.</p>', 15, 'Teaching Units', 'KS3', 'Hooks & Riffs'),
        ],
      },
    ],
  },
  {
    sheet: 'Year 10 Music (GCSE)',
    color: '#6366F1',
    lessons: [
      {
        number: '1',
        title: 'AoS1: Elements of Musical Language',
        unit: 'GCSE Component 1: Musical Language',
        term: 'A1',
        activities: [
          act('DR SMITH Elements Audit', '<p>Recap the elements framework (Dynamics, Rhythm, Structure, Melody, Instrumentation, Texture, Harmony) using a 90-second dictation from Bach\'s Badinerie. Students annotate a skeleton score with three observations per element group.</p>', 15, 'Teaching Units', 'KS4 GCSE', 'Musical Language'),
          act('Cadence Aural Drill', '<p>Aural identification of perfect, plagal, imperfect and interrupted cadences at the keyboard. Students then harmonise a given 8-bar melody ending with two different cadence choices and justify the effect of each.</p>', 20, 'Teaching Units', 'KS4 GCSE', 'Musical Language'),
          act('Composition Sketchbook: Motif Development', '<p>Develop a 2-bar motif using sequence, inversion, augmentation and fragmentation. Produce four one-line sketches in notation software; select the strongest for the coursework portfolio and log the decision in the composition diary.</p>', 25, 'Teaching Units', 'KS4 GCSE', 'Musical Language'),
        ],
      },
      {
        number: '2',
        title: 'Performance Workshop: Solo Pieces',
        unit: 'GCSE Component 2: Performing',
        term: 'A2',
        activities: [
          act('Technical Warm-up Circuit', '<p>Instrument-specific warm-ups: scales at three dynamics, slow-practice spot bars, and a 60-second mental rehearsal of the opening phrase. Vocalists: sirens, lip trills and mapped breathing points.</p>', 10, 'Vocal Warmups', 'KS4 GCSE', 'Performing'),
          act('Recorded Run-through & Self-Assessment', '<p>Each student records a full run of their solo piece. Using the GCSE performing criteria (accuracy, technical control, expression and interpretation), they mark their own recording and set two practice targets for the fortnight.</p>', 30, 'Teaching Units', 'KS4 GCSE', 'Performing'),
          act('Peer Feedback Panels', '<p>In trios, students play back recordings and give structured feedback: one strength tied to a criterion, one specific, actionable target. Teacher models the language of the top band first.</p>', 15, 'Teaching Units', 'KS4 GCSE', 'Performing'),
        ],
      },
    ],
  },
  {
    sheet: 'Year 11 Music (GCSE)',
    color: '#8B5CF6',
    lessons: [
      {
        number: '1',
        title: 'Set Work Revision: Africa — Toto',
        unit: 'GCSE Revision: Set Works',
        term: 'SP1',
        activities: [
          act('Score Speed-Dating', '<p>Eight numbered stations, each with a short extract of the set work score and one exam-style question (instrumentation of the intro, kalimba/synth timbre, chord loop of the chorus, vocal texture in the bridge). Two minutes per station, whole-class review after.</p>', 20, 'Teaching Units', 'KS4 GCSE', 'Set Works'),
          act('10-Mark Essay Planning', '<p>Model then co-construct a plan for: "Evaluate how the elements of music are used to create contrast between the verse and chorus." Students write the response in timed conditions (12 minutes) and self-mark against the band descriptors.</p>', 25, 'Teaching Units', 'KS4 GCSE', 'Set Works'),
          act('Aural Recall Quiz', '<p>Low-stakes retrieval: 10 quick-fire aural questions from all four areas of study, mixing this set work with unfamiliar listening in the same style. Track scores in the revision log.</p>', 10, 'IWB Games', 'KS4 GCSE', 'Set Works'),
        ],
      },
      {
        number: '2',
        title: 'Free Composition: Final Drafting',
        unit: 'GCSE Component 3: Composing',
        term: 'SP1',
        activities: [
          act('Structure Health-Check', '<p>Students map their composition\'s structure on paper (bars, sections, keys, texture changes) and check it against the brief. Identify any section that repeats without development and plan one intervention.</p>', 15, 'Teaching Units', 'KS4 GCSE', 'Composing'),
          act('Drafting Session with Milestones', '<p>Focused drafting in notation/DAW software with three timed milestones: complete the transition into the final section, balance the mix/dynamics, and export a dated draft to the coursework folder.</p>', 30, 'Teaching Units', 'KS4 GCSE', 'Composing'),
          act('Programme Note Draft', '<p>Write the 150-word programme note: influences, intended mood, key compositional decisions. Peer-check that every claim in the note is audible in the draft recording.</p>', 10, 'Teaching Units', 'KS4 GCSE', 'Composing'),
        ],
      },
    ],
  },
  {
    sheet: 'Year 9 Drama',
    color: '#F59E0B',
    lessons: [
      {
        number: '1',
        title: 'Devising from Stimulus: The Empty Chair',
        unit: 'Devising Theatre',
        term: 'A1',
        activities: [
          act('Ensemble Energy: Zip Zap Boing', '<p>Fast-paced circle game to sharpen focus and reaction. Add a physical flourish rule in round two — any player may replace their word with a gesture the group must echo. Sets the ensemble tone for devising.</p>', 8, 'Drama Games', 'KS3', 'Devising Theatre'),
          act('Stimulus Response Carousel', '<p>Groups rotate around four stimuli (a photograph of an empty chair, a news headline, a 4-line poem, a 20-second soundscape). At each station they improvise a 30-second moment. Capture the strongest idea from each rotation on the devising wall.</p>', 22, 'Drama Games', 'KS3', 'Devising Theatre'),
          act('Marking the Moment', '<p>Each group builds a 2-minute devised scene from their chosen stimulus and "marks the moment" of greatest tension using a chosen technique: freeze, slow motion, direct address, or lighting shift (torch). Peer audiences identify the marked moment and the technique.</p>', 20, 'KS1 Drama', 'KS3', 'Devising Theatre'),
        ],
      },
      {
        number: '2',
        title: 'Physical Theatre: Frantic Assembly Basics',
        unit: 'Devising Theatre',
        term: 'A2',
        activities: [
          act('Push Hands Warm-up', '<p>Paired balance-and-counterbalance sequence: palm-to-palm pressure, shifting weight without losing contact. Builds the trust and body awareness needed for lifts and contact work.</p>', 10, 'Drama Games', 'KS3', 'Physical Theatre'),
          act('Chair Duets', '<p>Using the Frantic Assembly chair duet method, pairs build a movement sequence of sits, swaps, leans and blocks around a single chair, then set it to contrasting music tracks and observe how meaning changes.</p>', 25, 'KS1 Drama', 'KS3', 'Physical Theatre'),
          act('Round-by-Through Sequences', '<p>Trios create a travelling sequence using the round/by/through vocabulary, then layer in one line of text each from the stimulus poem. Share half-way versions for a two-star-and-a-wish response.</p>', 15, 'KS1 Drama', 'KS3', 'Physical Theatre'),
        ],
      },
    ],
  },
  {
    sheet: 'Year 10 Drama (GCSE)',
    color: '#EF4444',
    lessons: [
      {
        number: '1',
        title: 'Component 1: Devising Log Foundations',
        unit: 'GCSE Component 1: Devising',
        term: 'A1',
        activities: [
          act('Practitioner Speed Briefing', '<p>Three-station recap of Stanislavski, Brecht and Artaud: key aims, three signature techniques, one famous production each. Students choose the practitioner whose approach best fits their devising intentions and justify the choice in their log.</p>', 15, 'Teaching Units', 'KS4 GCSE', 'Devising'),
          act('Devising Workshop: Structure & Style', '<p>Groups apply their chosen practitioner to the exam stimulus: Brechtian groups add placards/narration, Stanislavskian groups build given circumstances, Artaudian groups score a movement-and-sound sequence. Rehearse the opening two minutes.</p>', 30, 'KS1 Drama', 'KS4 GCSE', 'Devising'),
          act('Portfolio Entry: Initial Response', '<p>Timed 20-minute write-up for the devising log Section 1: response to stimulus, research directions, dramatic intentions and style decisions, with one annotated photo of today\'s rehearsal.</p>', 20, 'Teaching Units', 'KS4 GCSE', 'Devising'),
        ],
      },
      {
        number: '2',
        title: 'Rehearsal & Refinement: Scene Transitions',
        unit: 'GCSE Component 1: Devising',
        term: 'A2',
        activities: [
          act('Vocal & Physical Warm-up', '<p>Articulation drills (unique New York, red leather yellow leather), resonance humming, then a whole-group energy build from stillness to full ensemble movement in 8 counts.</p>', 10, 'Vocal Warmups', 'KS4 GCSE', 'Devising'),
          act('Transitions Clinic', '<p>Groups identify their weakest scene change and rebuild it three ways: a snap blackout convention, a choreographed transition in role, and an underscored fluid transition. Keep the strongest and record the decision in the log.</p>', 25, 'KS1 Drama', 'KS4 GCSE', 'Devising'),
          act('Mock Moderation', '<p>Perform the current 5 minutes to another group who mark against the devising criteria bands. Discuss the gap between current and target band and set two rehearsal priorities.</p>', 20, 'Teaching Units', 'KS4 GCSE', 'Devising'),
        ],
      },
    ],
  },
  {
    sheet: 'Year 11 Drama (GCSE)',
    color: '#DC2626',
    lessons: [
      {
        number: '1',
        title: 'Set Text in Practice: Blood Brothers',
        unit: 'GCSE Component 3: Set Text',
        term: 'SP1',
        activities: [
          act('Context Carousel', '<p>Five-minute stations on 1980s Liverpool: unemployment, class divide, superstition, Willy Russell\'s intentions, and original staging conventions. Students collect one usable exam point per station.</p>', 15, 'Teaching Units', 'KS4 GCSE', 'Set Text'),
          act('Staging the Reunion Scene', '<p>In groups, block the Mickey/Eddie reunion showing the class gap through proxemics, levels and contrasting physicality. Trial two different stage configurations (in-the-round vs proscenium) and evaluate the impact of each.</p>', 25, 'KS1 Drama', 'KS4 GCSE', 'Set Text'),
          act('Exam Question Deconstruction', '<p>Model answer surgery on a 20-mark performer question: highlight where marks are won (vocal, physical, proxemic, audience effect), then students write their own response for a different character in timed conditions.</p>', 20, 'Teaching Units', 'KS4 GCSE', 'Set Text'),
        ],
      },
      {
        number: '2',
        title: 'Live Theatre Evaluation Masterclass',
        unit: 'GCSE Component 3: Live Theatre',
        term: 'SP2',
        activities: [
          act('Memory Retrieval Grid', '<p>From the live production seen this term, students complete a retrieval grid: three moments of striking design, three performance choices, the audience reaction to each. No notes for the first pass; then improve answers with notes.</p>', 15, 'Teaching Units', 'KS4 GCSE', 'Live Theatre'),
          act('Analyse vs Evaluate Sorting', '<p>Sort 12 sample sentences into "describes", "analyses" and "evaluates", then upgrade three describing sentences into evaluative ones using the because–effect–judgement frame.</p>', 15, 'IWB Games', 'KS4 GCSE', 'Live Theatre'),
          act('Timed 14-Mark Response', '<p>Full timed answer on how one performer created tension in a key scene. Peer-mark with the band descriptors, identifying the exact sentence where the answer moves up or drops a band.</p>', 25, 'Teaching Units', 'KS4 GCSE', 'Live Theatre'),
        ],
      },
    ],
  },
];

// ---------- seeding ----------

function buildGeneratedSheetData(sheet: GenSheet) {
  const allLessonsData: Row = {};
  const activities: Row[] = [];
  const teachingUnits = new Set<string>();

  for (const lesson of sheet.lessons) {
    teachingUnits.add(lesson.unit);
    const orderedActivities = lesson.activities.map((a, i) => {
      const row = {
        _id: `demo-gen-${sheet.sheet}-${lesson.number}-${i}`.replace(/\s+/g, '-').toLowerCase(),
        activity: a.activity,
        description: a.description,
        activityText: '',
        descriptionHeading: 'Introduction/Context',
        activityHeading: 'Activity',
        linkHeading: 'Additional Link',
        time: a.time,
        videoLink: '',
        musicLink: '',
        backingLink: '',
        resourceLink: '',
        link: a.link || '',
        vocalsLink: '',
        imageLink: '',
        canvaLink: '',
        teachingUnit: a.unitName,
        category: a.category,
        level: a.level,
        unitName: a.unitName,
        lessonNumber: lesson.number,
        eyfsStandards: [],
        yearGroups: [sheet.sheet],
      };
      activities.push(row);
      return row;
    });

    const grouped: Row = {};
    const categoryOrder: string[] = [];
    for (const a of orderedActivities) {
      if (!grouped[a.category]) {
        grouped[a.category] = [];
        categoryOrder.push(a.category);
      }
      grouped[a.category].push(a);
    }

    allLessonsData[lesson.number] = {
      grouped,
      categoryOrder,
      totalTime: lesson.activities.reduce((sum, a) => sum + a.time, 0),
      title: lesson.title,
      lessonName: lesson.unit,
      academicYear: CURRENT_ACADEMIC_YEAR,
      orderedActivities,
      isUserCreated: false,
    };
  }

  return { allLessonsData, activities, teachingUnits: [...teachingUnits] };
}

function nextWeekday(base: Date, offsetDays: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
  if (day === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
  return d;
}

function atTime(d: Date, hours: number, minutes: number): Date {
  const out = new Date(d);
  out.setHours(hours, minutes, 0, 0);
  return out;
}

/**
 * Populate the demo. Async because the ~1.3MB snapshot is code-split and
 * loaded on demand. Idempotent per session; each new session reseeds from
 * the pristine snapshot (restoring the original demonstration data).
 */
export async function seedDemoData(): Promise<void> {
  try {
    if (sessionStorage.getItem(DEMO_SEED_MARKER_KEY) === '1') return;

    // Start pristine: remove any demo-owned keys left behind by a previous
    // session that ended without an explicit logout, so a new session never
    // sees stale visitor edits or orphaned per-sheet keys.
    clearDemoLocalStorage();

    const { default: snapshot } = await import('../data/demoSnapshot.json');
    const tables: Record<string, Row[]> = (snapshot as any).tables || {};

    // ---- 1. Activities (snapshot + generated Secondary/KS4 examples) ----
    const snapshotActivities = (tables.activities || []).map(toCamelActivity);
    const generatedPerSheet = KS3_KS4_SHEETS.map((s) => ({ sheet: s, data: buildGeneratedSheetData(s) }));
    const generatedActivities = generatedPerSheet.flatMap((g) => g.data.activities);
    const allActivities = [...snapshotActivities, ...generatedActivities];
    localStorage.setItem('library-activities', JSON.stringify(allActivities));

    // Mock-DB copy in snake_case so activitiesApi reads/writes work in demo.
    const dbActivities = [
      ...(tables.activities || []).map((r) => ({ ...r, image_link: mediaUrl(r.image_link) })),
      ...generatedActivities.map((a) => ({
        id: a._id,
        activity: a.activity,
        description: a.description,
        activity_text: a.activityText,
        time: a.time,
        category: a.category,
        level: a.level,
        unit_name: a.unitName,
        teaching_unit: a.teachingUnit,
        lesson_number: a.lessonNumber,
        link: a.link,
        yeargroups: a.yearGroups,
      })),
    ];
    writeDemoTable('activities', dbActivities);

    // ---- 2. Lessons per sheet ----
    const sheetNames: { sheet: string; color?: string }[] = [];
    const dbLessons: Row[] = [];

    for (const row of tables.lessons || []) {
      if (SKIP_SHEETS.has(row.sheet_name)) continue;
      const raw = row.data || {};
      const allLessonsData: Row = raw.allLessonsData ?? raw;
      if (!allLessonsData || Object.keys(allLessonsData).length === 0) continue;

      const bundle = {
        allLessonsData,
        lessonNumbers: row.lesson_numbers || Object.keys(allLessonsData),
        teachingUnits: raw.teachingUnits || row.teaching_units || [],
        lessonStandards: raw.lessonStandards || {},
      };
      localStorage.setItem(`lesson-data-${row.sheet_name}`, JSON.stringify(bundle));
      sheetNames.push({ sheet: row.sheet_name });
      dbLessons.push(row);
    }

    for (const { sheet, data } of generatedPerSheet) {
      const bundle = {
        allLessonsData: data.allLessonsData,
        lessonNumbers: Object.keys(data.allLessonsData),
        teachingUnits: data.teachingUnits,
        lessonStandards: {},
      };
      localStorage.setItem(`lesson-data-${sheet.sheet}`, JSON.stringify(bundle));
      sheetNames.push({ sheet: sheet.sheet, color: sheet.color });
      dbLessons.push({
        sheet_name: sheet.sheet,
        data: data.allLessonsData,
        lesson_numbers: Object.keys(data.allLessonsData),
        teaching_units: data.teachingUnits,
        academic_year: CURRENT_ACADEMIC_YEAR,
      });
    }
    writeDemoTable('lessons', dbLessons);

    // ---- 3. Half terms ----
    const validTermIds = new Set(HALF_TERM_DEFS.map((t) => t.id));
    const bySheet: Record<string, Record<string, string[]>> = {};
    for (const ht of tables.half_terms || []) {
      if (!validTermIds.has(ht.term_id)) continue;
      if (SKIP_SHEETS.has(ht.sheet_name)) continue;
      bySheet[ht.sheet_name] = bySheet[ht.sheet_name] || {};
      bySheet[ht.sheet_name][ht.term_id] = ht.lessons || [];
    }
    for (const { sheet: gen, data } of generatedPerSheet) {
      const map: Record<string, string[]> = {};
      for (const lesson of gen.lessons) {
        map[lesson.term] = [...(map[lesson.term] || []), lesson.number];
      }
      bySheet[gen.sheet] = map;
    }

    const now = new Date().toISOString();
    for (const { sheet } of sheetNames) {
      const lessonsByTerm = bySheet[sheet] || {};
      const halfTerms = HALF_TERM_DEFS.map((t) => ({
        id: t.id,
        name: t.name,
        months: t.months,
        lessons: lessonsByTerm[t.id] || [],
        stacks: [],
        isComplete: false,
        createdAt: now,
        updatedAt: now,
      }));
      for (const year of SNAPSHOT_ACADEMIC_YEARS) {
        localStorage.setItem(`half-terms-${sheet}-${year}`, JSON.stringify(halfTerms));
      }
    }
    writeDemoTable('half_terms', (tables.half_terms || []).filter((h) => validTermIds.has(h.term_id)));

    // ---- 4. Year groups / sheets selector ----
    const palette = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1', '#EC4899'];
    const snapshotNames = new Set((tables.year_groups || []).map((y) => y.name));
    // Use sheet name as the id so the class selector maps 1:1 onto seeded
    // lesson-data-<sheet> keys.
    const yearGroups: Row[] = [];
    let colorIdx = 0;
    for (const { sheet, color } of sheetNames) {
      const snapRow = (tables.year_groups || []).find((y) => y.name === sheet);
      yearGroups.push({
        id: sheet,
        name: sheet,
        color: color || snapRow?.color || palette[colorIdx++ % palette.length],
        sort_order: yearGroups.length,
      });
    }
    // Include remaining snapshot year groups (e.g. Assembly Songs, Warmups)
    // that have no lesson sheet yet, so library filters match the account.
    for (const y of tables.year_groups || []) {
      if (!yearGroups.some((g) => g.name === y.name)) {
        yearGroups.push({ id: y.name, name: y.name, color: y.color, sort_order: yearGroups.length });
      }
    }
    void snapshotNames;
    writeDemoTable('year_groups', yearGroups);
    localStorage.setItem(
      'custom-year-groups',
      JSON.stringify(yearGroups.map((g) => ({ id: g.id, name: g.name, color: g.color }))),
    );

    // ---- 5. Categories, groups, objectives (served by the mock client) ----
    writeDemoTable('custom_categories', tables.custom_categories || []);
    writeDemoTable('category_groups', tables.category_groups || []);
    writeDemoTable('custom_objective_year_groups', tables.custom_objective_year_groups || []);
    writeDemoTable('custom_objective_areas', tables.custom_objective_areas || []);
    writeDemoTable('custom_objectives', tables.custom_objectives || []);
    writeDemoTable('activity_custom_objectives', tables.activity_custom_objectives || []);
    writeDemoTable('eyfs_statements', tables.eyfs_statements || []);
    writeDemoTable('branding_settings', []);
    writeDemoTable('timetable_classes', []);
    writeDemoTable('profiles', []);

    // Categories also live in localStorage for the settings UI fallback.
    const savedCategories = (tables.custom_categories || []).map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      color: cat.color || '#6B7280',
      position: cat.position ?? i,
      yearGroups: cat.year_groups || cat.yearGroups || {},
      groups: cat.groups || [],
      group: cat.group ?? null,
    }));
    localStorage.setItem('saved-categories', JSON.stringify(savedCategories));

    // ---- 6. Stacks ----
    writeDemoTable('lesson_stacks', tables.lesson_stacks || []);
    writeDemoTable('activity_stacks', tables.activity_stacks || []);
    const activityStacks = (tables.activity_stacks || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      color: s.color || '#3B82F6',
      activities: s.activities || [],
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
    localStorage.setItem('activity-stacks', JSON.stringify(activityStacks));

    // ---- 7. Planner: snapshot plans + representative generated schedule ----
    const plans: Row[] = [];
    for (const p of tables.lesson_plans || []) {
      plans.push({
        id: p.id,
        date: p.date,
        week: p.week ?? 1,
        className: p.class_name || 'LKG',
        activities: p.activities || [],
        duration: p.duration ?? 60,
        notes: p.notes || '',
        status: p.status || 'planned',
        unitId: p.unit_id || '',
        unitName: p.unit_name || '',
        lessonNumber: p.lesson_number || '',
        title: p.title || '',
        term: p.term || '',
        time: p.time || '09:00',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      });
    }

    // A representative timetable for the current two weeks: different days,
    // times, subjects, year groups and key stages, openable from the calendar.
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // this week's Monday
    const scheduleSpec: { dayOffset: number; hour: number; minute: number; sheet: string; lessonNumber: string }[] = [
      { dayOffset: 0, hour: 9, minute: 0, sheet: 'LKG', lessonNumber: '1' },
      { dayOffset: 0, hour: 11, minute: 0, sheet: 'Year 9 Music', lessonNumber: '1' },
      { dayOffset: 0, hour: 13, minute: 30, sheet: 'Year 10 Drama (GCSE)', lessonNumber: '1' },
      { dayOffset: 1, hour: 9, minute: 30, sheet: 'Reception Drama', lessonNumber: '1' },
      { dayOffset: 1, hour: 11, minute: 15, sheet: 'Year 6 Music', lessonNumber: '1' },
      { dayOffset: 1, hour: 14, minute: 0, sheet: 'Year 11 Music (GCSE)', lessonNumber: '1' },
      { dayOffset: 2, hour: 9, minute: 0, sheet: 'Lower Kindergarten Music', lessonNumber: '3' },
      { dayOffset: 2, hour: 10, minute: 30, sheet: 'Year 1 Drama', lessonNumber: '1' },
      { dayOffset: 2, hour: 13, minute: 0, sheet: 'Year 9 Drama', lessonNumber: '1' },
      { dayOffset: 3, hour: 9, minute: 45, sheet: 'UKG', lessonNumber: '1' },
      { dayOffset: 3, hour: 11, minute: 30, sheet: 'Year 10 Music (GCSE)', lessonNumber: '1' },
      { dayOffset: 3, hour: 14, minute: 15, sheet: 'Year 11 Drama (GCSE)', lessonNumber: '1' },
      { dayOffset: 4, hour: 9, minute: 0, sheet: 'Year 2 Drama', lessonNumber: '1' },
      { dayOffset: 4, hour: 10, minute: 45, sheet: 'Year 9 Music', lessonNumber: '2' },
      { dayOffset: 7, hour: 9, minute: 0, sheet: 'Year 10 Drama (GCSE)', lessonNumber: '2' },
      { dayOffset: 7, hour: 11, minute: 0, sheet: 'Lower Kindergarten Music', lessonNumber: '4' },
      { dayOffset: 8, hour: 10, minute: 0, sheet: 'Year 11 Music (GCSE)', lessonNumber: '2' },
      { dayOffset: 8, hour: 13, minute: 30, sheet: 'Year 9 Drama', lessonNumber: '2' },
      { dayOffset: 9, hour: 9, minute: 30, sheet: 'Reception', lessonNumber: '1' },
      { dayOffset: 9, hour: 14, minute: 0, sheet: 'Year 10 Music (GCSE)', lessonNumber: '2' },
    ];

    const lessonBundleCache: Record<string, Row | null> = {};
    const getLesson = (sheet: string, num: string): Row | null => {
      if (!(sheet in lessonBundleCache)) {
        try {
          const raw = localStorage.getItem(`lesson-data-${sheet}`);
          lessonBundleCache[sheet] = raw ? JSON.parse(raw) : null;
        } catch {
          lessonBundleCache[sheet] = null;
        }
      }
      const bundle = lessonBundleCache[sheet];
      const lesson = bundle?.allLessonsData?.[num];
      if (lesson) return lesson;
      // fall back to the first available lesson on the sheet
      const first = bundle?.allLessonsData ? Object.entries(bundle.allLessonsData)[0] : null;
      return first ? (first[1] as Row) : null;
    };

    let seq = 0;
    for (const spec of scheduleSpec) {
      const lesson = getLesson(spec.sheet, spec.lessonNumber);
      if (!lesson) continue;
      const date = atTime(nextWeekday(monday, spec.dayOffset), spec.hour, spec.minute);
      plans.push({
        id: `demo-plan-${seq++}`,
        date: date.toISOString(),
        week: spec.dayOffset < 7 ? 1 : 2,
        className: spec.sheet,
        activities: lesson.orderedActivities || [],
        duration: Math.max(30, Number(lesson.totalTime) || 45),
        notes: '',
        status: 'planned',
        unitId: '',
        unitName: lesson.lessonName || '',
        lessonNumber: spec.lessonNumber,
        title: lesson.title || `Lesson ${spec.lessonNumber}`,
        term: '',
        time: `${String(spec.hour).padStart(2, '0')}:${String(spec.minute).padStart(2, '0')}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    localStorage.setItem('user-created-lesson-plans', JSON.stringify(plans));
    writeDemoTable(
      'lesson_plans',
      plans.map((p) => ({
        id: p.id,
        date: p.date,
        week: p.week,
        class_name: p.className,
        activities: p.activities,
        duration: p.duration,
        notes: p.notes,
        status: p.status,
        unit_id: p.unitId,
        unit_name: p.unitName,
        lesson_number: p.lessonNumber,
        title: p.title,
        term: p.term,
        time: p.time,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      })),
    );

    // ---- 8. Current sheet ----
    localStorage.setItem(
      'currentSheetInfo',
      JSON.stringify({
        sheet: 'Lower Kindergarten Music',
        display: 'Lower Kindergarten Music',
        eyfs: 'Lower Kindergarten Music Statements',
      }),
    );

    sessionStorage.setItem(DEMO_SEED_MARKER_KEY, '1');
  } catch (err) {
    console.warn('Failed to seed demo data:', err);
  }
}
