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
import { supabase, TABLES } from '../../config/supabase';
import { resolveOrganisationId } from '../../config/api';
import { isDemoModeActive } from '../demoMode';

export const STORAGE_KEY = 'ccd-planner-curriculum-v1';
const IMPORT_FLAG_PREFIX = 'ccd-planner-curriculum-imported-v1:';

/** Table name for per-org planner curriculum JSON. */
export const PLANNER_CURRICULUM_TABLE = TABLES.PLANNER_CURRICULUM;

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

export function parsePlannerCurriculum(raw: unknown): PlannerCurriculumState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PLANNER_CURRICULUM };
  const parsed = raw as Partial<PlannerCurriculumState>;
  return {
    frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
    strands: Array.isArray(parsed.strands) ? parsed.strands : [],
    statements: Array.isArray(parsed.statements) ? parsed.statements : [],
    sectionTypes: Array.isArray(parsed.sectionTypes) ? parsed.sectionTypes : [],
    planTemplates: Array.isArray(parsed.planTemplates) ? parsed.planTemplates : [],
    terms: Array.isArray(parsed.terms) ? parsed.terms : [],
  };
}

function readLocalPlannerCurriculum(): PlannerCurriculumState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PLANNER_CURRICULUM };
    return parsePlannerCurriculum(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PLANNER_CURRICULUM };
  }
}

function writeLocalPlannerCurriculum(state: PlannerCurriculumState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

function importFlagKey(organisationId: string): string {
  return `${IMPORT_FLAG_PREFIX}${organisationId}`;
}

function hasImportedLocalForOrg(organisationId: string): boolean {
  try {
    return localStorage.getItem(importFlagKey(organisationId)) === '1';
  } catch {
    return false;
  }
}

function markImportedLocalForOrg(organisationId: string): void {
  try {
    localStorage.setItem(importFlagKey(organisationId), '1');
  } catch {
    /* ignore */
  }
}

function curriculumIsEmpty(state: PlannerCurriculumState): boolean {
  return (
    state.frameworks.length === 0 &&
    state.strands.length === 0 &&
    state.statements.length === 0 &&
    state.sectionTypes.length === 0 &&
    state.planTemplates.length === 0 &&
    state.terms.length === 0
  );
}

let memoryCache: PlannerCurriculumState | null = null;

function emitUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ccd:planner-curriculum-updated'));
  }
}

/**
 * Synchronous read for UI first paint.
 * Demo / offline: localStorage. Live: last in-memory cache, else localStorage
 * (remote hydrate via loadPlannerCurriculumAsync).
 */
export function loadPlannerCurriculum(): PlannerCurriculumState {
  if (memoryCache) return memoryCache;
  const local = readLocalPlannerCurriculum();
  memoryCache = local;
  return local;
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

/**
 * Load per-organisation curriculum from Supabase.
 * One-time import of existing localStorage data when the org row is empty.
 * Demo mode / missing org / table: localStorage fallback.
 */
export async function loadPlannerCurriculumAsync(): Promise<PlannerCurriculumState> {
  if (isDemoModeActive()) {
    const local = readLocalPlannerCurriculum();
    memoryCache = local;
    return local;
  }

  const organisationId = await resolveOrganisationId();
  if (!organisationId) {
    const local = readLocalPlannerCurriculum();
    memoryCache = local;
    return local;
  }

  try {
    const { data, error } = await supabase
      .from(PLANNER_CURRICULUM_TABLE)
      .select('data')
      .eq('organisation_id', organisationId)
      .maybeSingle();

    if (error) {
      // Table missing / RLS / network → keep local fallback.
      const local = readLocalPlannerCurriculum();
      memoryCache = local;
      return local;
    }

    if (data?.data != null) {
      const remote = parsePlannerCurriculum(data.data);
      memoryCache = remote;
      writeLocalPlannerCurriculum(remote);
      emitUpdated();
      return remote;
    }

    // No org row yet: one-time import from localStorage if present.
    const local = readLocalPlannerCurriculum();
    if (!curriculumIsEmpty(local) && !hasImportedLocalForOrg(organisationId)) {
      const { error: upsertError } = await supabase.from(PLANNER_CURRICULUM_TABLE).upsert(
        {
          organisation_id: organisationId,
          data: local,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organisation_id' },
      );
      if (!upsertError) {
        markImportedLocalForOrg(organisationId);
      }
      // Import may fail for teachers (write = org admin); still use local.
      memoryCache = local;
      return local;
    }

    memoryCache = local;
    return local;
  } catch {
    const local = readLocalPlannerCurriculum();
    memoryCache = local;
    return local;
  }
}

/**
 * Persist curriculum. Always writes localStorage (demo + offline cache).
 * Live orgs also upsert Supabase when the caller can write (org admin / super).
 */
export function savePlannerCurriculum(state: PlannerCurriculumState): void {
  memoryCache = state;
  writeLocalPlannerCurriculum(state);
  emitUpdated();

  if (isDemoModeActive()) return;

  void (async () => {
    try {
      const organisationId = await resolveOrganisationId();
      if (!organisationId) return;
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from(PLANNER_CURRICULUM_TABLE).upsert(
        {
          organisation_id: organisationId,
          data: state,
          updated_at: new Date().toISOString(),
          updated_by: auth.user?.id ?? null,
        },
        { onConflict: 'organisation_id' },
      );
      if (error && import.meta.env.DEV) {
        console.warn('planner_curriculum upsert failed (local kept):', error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('planner_curriculum upsert threw (local kept):', err);
      }
    }
  })();
}

/** Test helper — clear in-memory cache between cases. */
export function __resetPlannerCurriculumCacheForTests(): void {
  memoryCache = null;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
