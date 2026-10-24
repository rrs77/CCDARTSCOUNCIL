import type {
  Activity,
  CurriculumFramework,
  CurriculumStatement,
  CurriculumStrand,
  KeyStage,
  Lesson,
  PlanTemplate,
  SectionType,
  SettingsState,
  Subject,
  TermDates,
  Unit,
} from "./types";
import { uid } from "./lib/utils";

export const KEY_STAGES: KeyStage[] = ["EYFS", "KS1", "KS2", "KS3", "KS4", "KS5"];

export const KEY_STAGE_LABELS: Record<KeyStage, string> = {
  EYFS: "Early Years",
  KS1: "Key Stage 1",
  KS2: "Key Stage 2",
  KS3: "Key Stage 3",
  KS4: "Key Stage 4",
  KS5: "Key Stage 5",
};

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "music", name: "Music", color: "#4338CA", hidden: false },
  { id: "drama", name: "Drama", color: "#7C3AED", hidden: false },
  { id: "dance", name: "Dance", color: "#DB2777", hidden: false },
  { id: "art", name: "Art", color: "#EA580C", hidden: false },
  { id: "english", name: "English", color: "#0D9488", hidden: false },
];

export const DEFAULT_TERMS: TermDates[] = [
  { id: "aut1", name: "Autumn 1", start: "2025-09-02", end: "2025-10-24" },
  { id: "aut2", name: "Autumn 2", start: "2025-11-03", end: "2025-12-19" },
  { id: "spr1", name: "Spring 1", start: "2026-01-06", end: "2026-02-13" },
  { id: "spr2", name: "Spring 2", start: "2026-02-23", end: "2026-04-02" },
  { id: "sum1", name: "Summer 1", start: "2026-04-20", end: "2026-05-22" },
  { id: "sum2", name: "Summer 2", start: "2026-06-01", end: "2026-07-17" },
];

export const DEFAULT_SECTION_TYPES: SectionType[] = [
  { id: "free", label: "Free text", builtIn: true, enabled: true },
  { id: "diff", label: "Differentiation", builtIn: true, enabled: true },
  { id: "vocab", label: "Vocabulary", builtIn: true, enabled: true },
  { id: "afl", label: "Assessment for learning", builtIn: true, enabled: true },
  { id: "hw", label: "Homework", builtIn: true, enabled: true },
  { id: "custom", label: "Custom", builtIn: true, enabled: true },
];

export const DEFAULT_FRAMEWORKS: CurriculumFramework[] = [
  { id: "fw_nc", name: "National Curriculum" },
  { id: "fw_school", name: "School creative framework" },
];

export const DEFAULT_STRANDS: CurriculumStrand[] = [
  {
    id: "st_music_perf",
    frameworkId: "fw_nc",
    name: "Performing",
    subjectId: "music",
    keyStage: "KS2",
  },
  {
    id: "st_music_listen",
    frameworkId: "fw_nc",
    name: "Listening",
    subjectId: "music",
    keyStage: "KS2",
  },
  {
    id: "st_music_compose",
    frameworkId: "fw_nc",
    name: "Composing",
    subjectId: "music",
    keyStage: "KS2",
  },
  {
    id: "st_drama",
    frameworkId: "fw_nc",
    name: "Drama skills",
    subjectId: "drama",
    keyStage: "KS2",
  },
  {
    id: "st_dance",
    frameworkId: "fw_nc",
    name: "Movement & dance",
    subjectId: "dance",
    keyStage: "KS2",
  },
  {
    id: "st_art",
    frameworkId: "fw_nc",
    name: "Recording & reviewing",
    subjectId: "art",
    keyStage: "KS2",
  },
  {
    id: "st_english",
    frameworkId: "fw_school",
    name: "Language & imagination",
    subjectId: "english",
    keyStage: "KS2",
  },
];

export const DEFAULT_CURRICULUM: CurriculumStatement[] = [
  {
    id: "c1",
    strandId: "st_music_perf",
    text: "Pupils should be taught to play and perform in solo and ensemble contexts, using their voices and playing musical instruments with increasing accuracy, fluency, control and expression.",
  },
  {
    id: "c2",
    strandId: "st_music_listen",
    text: "Pupils should be taught to listen with attention to detail and recall sounds with increasing aural memory.",
  },
  {
    id: "c3",
    strandId: "st_music_compose",
    text: "Pupils should be taught to improvise and compose music for a range of purposes using the inter-related dimensions of music.",
  },
  {
    id: "c4",
    strandId: "st_drama",
    text: "Pupils participate in a range of drama activities, including improvisation and scripted performance.",
  },
  {
    id: "c5",
    strandId: "st_dance",
    text: "Pupils perform dances using a range of movement patterns and respond to different stimuli.",
  },
  {
    id: "c6",
    strandId: "st_art",
    text: "Pupils create sketch books to record observations and use them to review and revisit ideas.",
  },
  {
    id: "c7",
    strandId: "st_english",
    text: "Pupils discuss words and phrases that capture the reader's interest and imagination.",
  },
];

function act(
  id: string,
  title: string,
  subjectId: string,
  durationMin: number,
  description: string,
  learningOutcome: string,
  extra?: Partial<Activity>,
): Activity {
  return {
    id,
    title,
    subjectId,
    keyStages: ["KS1", "KS2", "KS3"],
    durationMin,
    content: {
      description,
      learningOutcome,
      howToRun:
        "1. Gather pupils in a circle.\n2. Model the activity once through.\n3. Practise together, then in small groups.\n4. Share and reflect.",
      resources: "• Open space\n• Visual cue cards\n• Timer / pulse track (optional)",
      assessment:
        "Observe pulse accuracy and collaboration. Use thumbs-up check and peer feedback.",
      curriculumIds: subjectId === "music" ? ["c1", "c2"] : [],
      grouping: "Small groups",
    },
    ...extra,
  };
}

export const DEFAULT_ACTIVITIES: Activity[] = [
  act(
    "a1",
    "Rhythm Echo Warm-up with Extended Call Patterns",
    "music",
    5,
    "Call-and-echo clapping patterns that settle the class into a shared pulse.",
    "Pupils can echo a four-beat rhythm accurately.",
  ),
  act(
    "a2",
    "Body Percussion Patterns — Layered Ostinato Build",
    "music",
    10,
    "Explore layered body percussion patterns in small groups, building from a steady pulse to a four-part ostinato.",
    "Pupils can keep a steady pulse and layer a rhythm pattern against it.",
  ),
  act(
    "a3",
    "Call and Response Singing",
    "music",
    10,
    "Short sung phrases traded between leader and group to strengthen pitch matching.",
    "Pupils match pitch and respond in time.",
  ),
  act(
    "a4",
    "Freeze Frame Tableau",
    "drama",
    8,
    "Groups create still images that capture a moment of story or emotion.",
    "Pupils collaborate to communicate meaning through stillness.",
  ),
  act(
    "a5",
    "Emotion Walk",
    "drama",
    7,
    "Pupils travel the space shifting gait and posture as emotion prompts change.",
    "Pupils express emotion through controlled physical choices.",
  ),
  act(
    "a6",
    "Pathway Pathways",
    "dance",
    12,
    "Create travelling phrases that explore curved, zigzag and straight pathways.",
    "Pupils design and perform a short travelling phrase.",
  ),
  act(
    "a7",
    "Pulse Stomp Phrase",
    "dance",
    10,
    "Build a unison stomp phrase locked to a steady pulse, then add levels.",
    "Pupils maintain pulse while varying level and energy.",
  ),
  act(
    "a8",
    "Pattern Print Explorers",
    "art",
    15,
    "Print repeating motifs inspired by rhythm marks and sound waves.",
    "Pupils create a repeating pattern print with intentional rhythm.",
  ),
  act(
    "a9",
    "Colour Pulse Maps",
    "art",
    12,
    "Map loud/soft and fast/slow using colour intensity and mark-making.",
    "Pupils visually represent musical contrast.",
  ),
  act(
    "a10",
    "Rhythm Word Bank",
    "english",
    8,
    "Collect vivid verbs and onomatopoeia for describing rhythm and sound.",
    "Pupils select precise vocabulary for rhythm writing.",
  ),
  act(
    "a11",
    "Poem Pulse Read",
    "english",
    10,
    "Read a short poem aloud, marking the pulse with subtle gestures.",
    "Pupils hear metre in spoken language.",
  ),
];

export const DEFAULT_TEMPLATES: PlanTemplate[] = [
  {
    id: "t1",
    name: "Pulse & Rhythm Foundations",
    keyStage: "KS2",
    description: "Warm-up, body percussion, and a short creative share.",
    activityIds: ["a1", "a2", "a7", "a8"],
    targetMin: 45,
  },
  {
    id: "t2",
    name: "Story in Stillness",
    keyStage: "KS2",
    description: "Drama tableaux with vocabulary and reflection.",
    activityIds: ["a4", "a5", "a10"],
    targetMin: 45,
  },
  {
    id: "t3",
    name: "Moving Pathways",
    keyStage: "KS1",
    description: "Travel, freeze, and mark-make the journey.",
    activityIds: ["a6", "a7", "a9"],
    targetMin: 40,
  },
  {
    id: "t4",
    name: "Sing & Respond",
    keyStage: "KS1",
    description: "Echo warm-up into call-and-response singing.",
    activityIds: ["a1", "a3"],
    targetMin: 30,
  },
  {
    id: "t5",
    name: "GCSE Ensemble Focus",
    keyStage: "KS4",
    description: "Layered percussion with assessment checkpoints.",
    activityIds: ["a2", "a3"],
    targetMin: 60,
  },
  {
    id: "t6",
    name: "EYFS Sound Play",
    keyStage: "EYFS",
    description: "Playful pulse games and colour mark-making.",
    activityIds: ["a1", "a9"],
    targetMin: 25,
  },
];

function lessonFromTemplate(
  title: string,
  activityIds: string[],
  opts: Partial<Lesson> = {},
): Lesson {
  const activities = DEFAULT_ACTIVITIES.filter((a) => activityIds.includes(a.id));
  return {
    id: uid("les"),
    title,
    keyStage: "KS2",
    className: "4B",
    yearGroup: "Year 4",
    targetMin: 45,
    termId: "aut1",
    learningObjective: "To understand and maintain a steady pulse",
    successCriteria: ["Keep a steady beat", "Clap accurately", "Work as a team"],
    curriculumIds: ["c1", "c2"],
    blocks: activities.map((a) => ({
      id: uid("blk"),
      kind: "activity" as const,
      activityId: a.id,
      title: a.title,
      body: a.content.description,
      subjectId: a.subjectId,
      durationMin: a.durationMin,
    })),
    ...opts,
  };
}

export function buildSeedLessons(): Lesson[] {
  const l1 = lessonFromTemplate(
    "Lesson 1 — Pulse and Rhythm Foundations for Ensemble Performance",
    ["a1", "a2", "a7", "a8"],
    { id: "les_1" },
  );
  // Insert a teacher notes flexible section after block 2
  l1.blocks = [
    l1.blocks[0],
    l1.blocks[1],
    {
      id: "blk_notes",
      kind: "flexible",
      sectionTypeId: "free",
      title: "Teacher notes",
      body: "Watch for pupils rushing the pulse in bar 3 — slow the model if needed.",
    },
    l1.blocks[2],
    l1.blocks[3],
  ];

  const l2 = lessonFromTemplate("Lesson 2 — Layering Patterns Across the Ensemble", ["a2", "a3"], {
    id: "les_2",
    learningObjective: "To layer a rhythm ostinato against a steady pulse",
  });
  const l3 = lessonFromTemplate("Lesson 3 — Rhythm in Action", ["a1", "a2", "a6"], {
    id: "les_3",
    learningObjective: "To transfer pulse skills into travelling movement",
  });
  const l4 = lessonFromTemplate("Lesson 1 — Freeze & Feel", ["a4", "a5", "a10"], {
    id: "les_4",
    title: "Lesson 1 — Freeze & Feel",
    learningObjective: "To communicate emotion through tableau",
    curriculumIds: ["c4", "c7"],
  });
  return [l1, l2, l3, l4];
}

export function buildSeedUnits(lessons: Lesson[]): Unit[] {
  return [
    {
      id: "u1",
      title: "Rhythm Explorers — Pulse, Pattern and Performance",
      subjectId: "music",
      termId: "aut1",
      lessonIds: ["les_1", "les_2", "les_3"],
      collapsed: false,
    },
    {
      id: "u2",
      title: "Storytelling",
      subjectId: "drama",
      termId: "aut1",
      lessonIds: ["les_4"],
      collapsed: true,
    },
    {
      id: "u3",
      title: "Colour and Pattern",
      subjectId: "art",
      termId: "aut2",
      lessonIds: [],
      collapsed: true,
    },
    {
      id: "u4",
      title: "Movement Stories",
      subjectId: "dance",
      termId: "spr1",
      lessonIds: [],
      collapsed: true,
    },
  ];
}

export function buildDefaultSettings(): SettingsState {
  return {
    subjects: DEFAULT_SUBJECTS.map((s) => ({ ...s })),
    terms: DEFAULT_TERMS.map((t) => ({ ...t })),
    sectionTypes: DEFAULT_SECTION_TYPES.map((s) => ({ ...s })),
    frameworks: DEFAULT_FRAMEWORKS.map((f) => ({ ...f })),
    strands: DEFAULT_STRANDS.map((s) => ({ ...s })),
    curriculum: DEFAULT_CURRICULUM.map((c) => ({ ...c })),
    defaultTargetMin: 45,
    className: "4B",
    yearGroup: "Year 4",
  };
}

export const AI_FLESH_OUT: Record<string, string> = {
  free: "Remember to leave 2 minutes at the end for an exit pulse check — ask three pupils to lead a 4-beat clap.",
  diff: "Support: provide visual pulse cards and a seated option.\nChallenge: invite confident pupils to lead a group ostinato layer.",
  vocab: "pulse · ostinato · body percussion · unison · layer · tempo",
  afl: "Mini plenary: freeze on the pulse — who can show the beat silently with shoulders?",
  hw: "Practise a 4-beat body percussion pattern at home and teach it to someone in your household.",
  custom: "Extension invitation: record a 20-second group ostinato on a class tablet for next lesson.",
};

export const AI_REPROMPT_RESPONSE =
  "Revised plan emphasis: open with a quieter pulse settle, move Body Percussion earlier, and close with a gallery walk of Pattern Prints so assessment evidence is visible.";

/** Resolve statement metadata via strand (subject + key stage). */
export function statementMeta(
  statementId: string,
  settings: SettingsState,
): { statement: CurriculumStatement; strand: CurriculumStrand; framework?: CurriculumFramework } | null {
  const statement = settings.curriculum.find((c) => c.id === statementId);
  if (!statement) return null;
  const strand = settings.strands.find((s) => s.id === statement.strandId);
  if (!strand) return null;
  const framework = settings.frameworks.find((f) => f.id === strand.frameworkId);
  return { statement, strand, framework };
}

export function statementsForSubjectKeyStage(
  settings: SettingsState,
  subjectId: string,
  keyStage: KeyStage,
): CurriculumStatement[] {
  const strandIds = new Set(
    settings.strands
      .filter((s) => s.subjectId === subjectId && s.keyStage === keyStage)
      .map((s) => s.id),
  );
  return settings.curriculum.filter((c) => strandIds.has(c.strandId));
}
