/**
 * User-defined curriculum frameworks / strands / statements (Settings only).
 * Nothing hard-coded for lesson plan checklists.
 */

export type PlannerKeyStageId = 'eyfs' | 'ks1' | 'ks2' | 'ks3' | 'ks4' | 'ks5';

export interface CurriculumFramework {
  id: string;
  name: string;
}

/** Strand within a framework, scoped to subject + key stage. */
export interface CurriculumStrand {
  id: string;
  frameworkId: string;
  name: string;
  /** Settings subject/folder name or id */
  subjectId: string;
  keyStage: PlannerKeyStageId;
}

export interface CurriculumStatement {
  id: string;
  strandId: string;
  text: string;
}

/** Where a merged statement came from for UI markers. */
export type CurriculumStatementSource = 'school' | 'mine';

/** Statement after merging school + personal layers. */
export interface MergedCurriculumStatement extends CurriculumStatement {
  source: CurriculumStatementSource;
  /** True when this is a school statement the teacher reworded for themselves. */
  overridden?: boolean;
  /** Original school text when overridden (for reset-to-school). */
  schoolText?: string;
}

/**
 * Layer 2 — teacher's personal copy. Never mutates the school set.
 * - frameworks / strands / statements: teacher-added items
 * - overrides: reword school statements by id
 * - hiddenIds: school statement ids the teacher has hidden
 */
export interface PersonalCurriculumData {
  frameworks: CurriculumFramework[];
  strands: CurriculumStrand[];
  statements: CurriculumStatement[];
  overrides: Record<string, { text: string }>;
  hiddenIds: string[];
}

export const EMPTY_PERSONAL_CURRICULUM: PersonalCurriculumData = {
  frameworks: [],
  strands: [],
  statements: [],
  overrides: {},
  hiddenIds: [],
};

/** Half-term / term dates edited in Settings — drives Year overview + My units. */
export interface PlannerTermDates {
  id: string;
  name: string;
  /** ISO date YYYY-MM-DD */
  start: string;
  /** ISO date YYYY-MM-DD */
  end: string;
}

export interface PlannerCurriculumState {
  frameworks: CurriculumFramework[];
  strands: CurriculumStrand[];
  statements: CurriculumStatement[];
  /** Custom lesson section types from Settings */
  sectionTypes: Array<{ id: string; label: string; enabled: boolean }>;
  /** Plan templates per key stage */
  planTemplates: Array<{
    id: string;
    keyStageId: PlannerKeyStageId | string;
    name: string;
    description?: string;
    defaultSectionBlueprints: Array<{
      kind: string;
      title: string;
      customTypeId?: string;
    }>;
  }>;
  /** Term / half-term dates (Settings). Empty → seeded from academic-year defaults. */
  terms: PlannerTermDates[];
}

export const EMPTY_PLANNER_CURRICULUM: PlannerCurriculumState = {
  frameworks: [],
  strands: [],
  statements: [],
  sectionTypes: [],
  planTemplates: [],
  terms: [],
};

export const PLANNER_KEY_STAGE_OPTIONS: { id: PlannerKeyStageId; label: string }[] = [
  { id: 'eyfs', label: 'EYFS' },
  { id: 'ks1', label: 'KS1' },
  { id: 'ks2', label: 'KS2' },
  { id: 'ks3', label: 'KS3' },
  { id: 'ks4', label: 'KS4' },
  { id: 'ks5', label: 'KS5' },
];
