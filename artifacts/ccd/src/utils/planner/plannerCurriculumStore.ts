import {
  EMPTY_PLANNER_CURRICULUM,
  type PlannerCurriculumState,
  type PlannerTermDates,
} from '../../types/plannerCurriculum';
import {
  HALF_TERMS,
  defaultHalfTermRanges,
  type HalfTermId,
} from '../../components/halfTerm/halfTermConstants';

const STORAGE_KEY = 'ccd-planner-curriculum-v1';

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Default UK half-term windows for an academic year (e.g. "2025-2026"). */
export function defaultPlannerTerms(academicYear: string): PlannerTermDates[] {
  const ranges = defaultHalfTermRanges(academicYear);
  return HALF_TERMS.map((t) => {
    const range = ranges[t.id as HalfTermId];
    return {
      id: t.id,
      name: t.name,
      start: toIsoDate(range.start),
      end: toIsoDate(range.end),
    };
  });
}

function currentAcademicYearGuess(): string {
  const now = new Date();
  const y = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${y + 1}`;
}

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
      terms: Array.isArray(parsed.terms) ? parsed.terms : [],
    };
  } catch {
    return { ...EMPTY_PLANNER_CURRICULUM };
  }
}

/**
 * Terms for My units / Year overview. If Settings has none yet, seed from
 * academic-year defaults (not a hard-coded Autumn–Summer list in the UI).
 */
export function loadPlannerTerms(academicYear?: string): PlannerTermDates[] {
  const stored = loadPlannerCurriculum().terms;
  if (stored.length > 0) return stored;
  return defaultPlannerTerms(academicYear || currentAcademicYearGuess());
}

export function savePlannerCurriculum(state: PlannerCurriculumState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('ccd:planner-curriculum-updated'));
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
