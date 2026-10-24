/**
 * Flexible lesson plan sections (planner). Additive on LessonData.
 * No hard-coded curriculum — frameworks/strands/statements live in Settings.
 */

import type { Activity } from '../contexts/DataContext';

/** Built-in kinds (Health and safety intentionally omitted — product lock). */
export type LessonSectionKind =
  | 'activity'
  | 'free_text'
  | 'differentiation'
  | 'vocabulary'
  | 'afl'
  | 'homework'
  | 'custom';

export interface LessonSection {
  id: string;
  kind: LessonSectionKind;
  customTypeId?: string;
  title: string;
  bodyHtml?: string;
  activity?: Activity;
  durationMins?: number;
  collapsed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastWrittenBy?: 'teacher' | 'ai';
}

export interface LessonAiPromptTurn {
  id: string;
  createdAt: string;
  scope: 'whole_plan' | { sectionId: string };
  instruction: string;
  snapshotBefore: {
    sections: LessonSection[];
    learningOutcome?: string;
    successCriteria?: string;
  };
  snapshotAfter: {
    sections: LessonSection[];
    learningOutcome?: string;
    successCriteria?: string;
  };
  teacherDirtySectionIds: string[];
  applyMode: 'overwrite_all' | 'fill_empty_only' | 'overwrite_selected';
  selectedSectionIds?: string[];
}

export interface LessonAiFleshOutState {
  history: LessonAiPromptTurn[];
  historyIndex: number;
}

export interface PlanTemplateBlueprint {
  kind: LessonSectionKind;
  title: string;
  customTypeId?: string;
}

export interface PlanTemplate {
  id: string;
  keyStageId: string;
  name: string;
  description?: string;
  defaultSectionBlueprints: PlanTemplateBlueprint[];
}

export interface LessonSectionTypeSetting {
  id: string;
  label: string;
  builtIn: boolean;
  enabled: boolean;
  kind: LessonSectionKind;
}

/** Labels for built-in insert menu (no health & safety). */
export const BUILTIN_SECTION_TYPES: LessonSectionTypeSetting[] = [
  { id: 'free_text', label: 'Free text', builtIn: true, enabled: true, kind: 'free_text' },
  { id: 'differentiation', label: 'Differentiation', builtIn: true, enabled: true, kind: 'differentiation' },
  { id: 'vocabulary', label: 'Vocabulary', builtIn: true, enabled: true, kind: 'vocabulary' },
  { id: 'afl', label: 'Assessment for learning', builtIn: true, enabled: true, kind: 'afl' },
  { id: 'homework', label: 'Homework', builtIn: true, enabled: true, kind: 'homework' },
];
