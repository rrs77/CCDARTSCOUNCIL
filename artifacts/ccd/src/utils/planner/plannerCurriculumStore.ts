import {
  EMPTY_PLANNER_CURRICULUM,
  type PlannerCurriculumState,
} from '../../types/plannerCurriculum';

const STORAGE_KEY = 'ccd-planner-curriculum-v1';

export function loadPlannerCurriculum(): PlannerCurriculumState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PLANNER_CURRICULUM };
    const parsed = JSON.parse(raw) as Partial<PlannerCurriculumState>;
    return {
      frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
      strands: Array.isArray(parsed.strands) ? parsed.strands : [],
      statements: Array.isArray(parsed.statements) ? parsed.statements : [],
      sectionTypes: Array.isArray(parsed.sectionTypes) ? parsed.sectionTypes : [],
      planTemplates: Array.isArray(parsed.planTemplates) ? parsed.planTemplates : [],
    };
  } catch {
    return { ...EMPTY_PLANNER_CURRICULUM };
  }
}

export function savePlannerCurriculum(state: PlannerCurriculumState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('ccd:planner-curriculum-updated'));
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
