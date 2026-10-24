export type KeyStage = "EYFS" | "KS1" | "KS2" | "KS3" | "KS4" | "KS5";

export type Screen = "planner" | "year" | "settings";

export interface Subject {
  id: string;
  name: string;
  color: string;
  hidden: boolean;
  icon?: string;
}

export interface TermDates {
  id: string;
  name: string;
  start: string;
  end: string;
}

export interface SectionType {
  id: string;
  label: string;
  builtIn: boolean;
  enabled: boolean;
}

/** User-defined curriculum framework (e.g. National Curriculum). */
export interface CurriculumFramework {
  id: string;
  name: string;
}

/** Strand within a framework, scoped to subject + key stage. */
export interface CurriculumStrand {
  id: string;
  frameworkId: string;
  name: string;
  subjectId: string;
  keyStage: KeyStage;
}

/** Individual statement under a strand — defined in Settings only. */
export interface CurriculumStatement {
  id: string;
  strandId: string;
  text: string;
}

export interface ActivityContent {
  description: string;
  learningOutcome: string;
  howToRun: string;
  resources: string;
  assessment: string;
  curriculumIds: string[];
  grouping: string;
}

export interface Activity {
  id: string;
  title: string;
  subjectId: string;
  keyStages: KeyStage[];
  durationMin: number;
  content: ActivityContent;
}

export type LessonBlockKind = "activity" | "flexible";

export interface LessonBlock {
  id: string;
  kind: LessonBlockKind;
  activityId?: string;
  sectionTypeId?: string;
  title: string;
  body: string;
  subjectId?: string;
  durationMin?: number;
}

export interface Lesson {
  id: string;
  title: string;
  keyStage: KeyStage;
  className: string;
  yearGroup: string;
  targetMin: number;
  termId: string;
  blocks: LessonBlock[];
  learningObjective: string;
  successCriteria: string[];
  curriculumIds: string[];
}

export interface Unit {
  id: string;
  title: string;
  subjectId: string;
  termId: string;
  lessonIds: string[];
  collapsed?: boolean;
}

export interface PlanTemplate {
  id: string;
  name: string;
  keyStage: KeyStage;
  description: string;
  activityIds: string[];
  targetMin: number;
}

export interface AiSuggestion {
  blockId: string;
  proposedTitle?: string;
  proposedBody: string;
  status: "pending" | "accepted" | "rejected";
}

export interface SettingsState {
  subjects: Subject[];
  terms: TermDates[];
  sectionTypes: SectionType[];
  frameworks: CurriculumFramework[];
  strands: CurriculumStrand[];
  curriculum: CurriculumStatement[];
  defaultTargetMin: number;
  className: string;
  yearGroup: string;
}

export interface PlannerState {
  screen: Screen;
  keyStage: KeyStage;
  settings: SettingsState;
  activities: Activity[];
  lessons: Lesson[];
  units: Unit[];
  templates: PlanTemplate[];
  activeLessonId: string | null;
  emptyMode: boolean;
  lastSavedAt: string | null;
  undoStack: string[];
}
