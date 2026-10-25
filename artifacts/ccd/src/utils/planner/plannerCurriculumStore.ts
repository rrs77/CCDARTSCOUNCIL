import {
  EMPTY_PERSONAL_CURRICULUM,
  EMPTY_PLANNER_CURRICULUM,
  type PersonalCurriculumData,
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
import {
  mergePlannerCurriculum,
  mergedToPlannerState,
  parsePersonalCurriculum,
  personalCurriculumIsEmpty,
  personalFromLegacySchoolState,
  selectMergedCurriculumStatements,
  type MergedPlannerCurriculum,
} from './mergePlannerCurriculum';

export const STORAGE_KEY = 'ccd-planner-curriculum-v1';
const PERSONAL_STORAGE_KEY = 'ccd-planner-curriculum-personal-v1';
const IMPORT_FLAG_PREFIX = 'ccd-planner-curriculum-imported-v1:';
const PERSONAL_IMPORT_FLAG_PREFIX = 'ccd-planner-curriculum-personal-imported-v1:';

/** Layer 1 — school shared curriculum. */
export const PLANNER_CURRICULUM_TABLE = TABLES.PLANNER_CURRICULUM;
/** Layer 2 — teacher personal curriculum. */
export const PLANNER_CURRICULUM_USER_TABLE = TABLES.PLANNER_CURRICULUM_USER;

export {
  mergePlannerCurriculum,
  selectMergedCurriculumStatements,
  mergedToPlannerState,
};
export type { MergedPlannerCurriculum };

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

function readLocalPersonalCurriculum(): PersonalCurriculumData {
  try {
    const raw = localStorage.getItem(PERSONAL_STORAGE_KEY);
    if (!raw) return { ...EMPTY_PERSONAL_CURRICULUM, overrides: {}, hiddenIds: [] };
    return parsePersonalCurriculum(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PERSONAL_CURRICULUM, overrides: {}, hiddenIds: [] };
  }
}

function writeLocalPersonalCurriculum(personal: PersonalCurriculumData): void {
  try {
    localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(personal));
  } catch {
    /* ignore */
  }
}

function importFlagKey(organisationId: string): string {
  return `${IMPORT_FLAG_PREFIX}${organisationId}`;
}

function personalImportFlagKey(organisationId: string, userId: string): string {
  return `${PERSONAL_IMPORT_FLAG_PREFIX}${organisationId}:${userId}`;
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

function hasImportedPersonal(organisationId: string, userId: string): boolean {
  try {
    return localStorage.getItem(personalImportFlagKey(organisationId, userId)) === '1';
  } catch {
    return false;
  }
}

function markImportedPersonal(organisationId: string, userId: string): void {
  try {
    localStorage.setItem(personalImportFlagKey(organisationId, userId), '1');
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

let schoolCache: PlannerCurriculumState | null = null;
let personalCache: PersonalCurriculumData | null = null;
let mergedCache: MergedPlannerCurriculum | null = null;

function rebuildMerged(): MergedPlannerCurriculum {
  mergedCache = mergePlannerCurriculum(
    schoolCache || EMPTY_PLANNER_CURRICULUM,
    personalCache || EMPTY_PERSONAL_CURRICULUM,
  );
  return mergedCache;
}

function emitUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ccd:planner-curriculum-updated'));
  }
}

/**
 * Synchronous merged read for UI first paint (compat shape without source markers).
 * Prefer loadMergedPlannerCurriculum() when School/Mine markers are needed.
 */
export function loadPlannerCurriculum(): PlannerCurriculumState {
  if (mergedCache) return mergedToPlannerState(mergedCache);
  if (!schoolCache) schoolCache = readLocalPlannerCurriculum();
  if (!personalCache) personalCache = readLocalPersonalCurriculum();
  // Legacy: if personal empty but old localStorage has data, treat as personal for demo.
  if (personalCurriculumIsEmpty(personalCache) && !curriculumIsEmpty(schoolCache)) {
    // Keep school local as school; personal stays empty until async import.
  }
  return mergedToPlannerState(rebuildMerged());
}

/** Synchronous merged view with School / Mine markers. */
export function loadMergedPlannerCurriculum(): MergedPlannerCurriculum {
  if (mergedCache) return mergedCache;
  loadPlannerCurriculum();
  return rebuildMerged();
}

export function loadSchoolPlannerCurriculum(): PlannerCurriculumState {
  if (schoolCache) return schoolCache;
  schoolCache = readLocalPlannerCurriculum();
  return schoolCache;
}

export function loadPersonalPlannerCurriculum(): PersonalCurriculumData {
  if (personalCache) return personalCache;
  personalCache = readLocalPersonalCurriculum();
  return personalCache;
}

/**
 * Terms for My units / Year overview. Prefer school terms; else academic-year defaults.
 */
export function loadPlannerTerms(academicYear?: string): PlannerTermDates[] {
  const school = loadSchoolPlannerCurriculum();
  if (school.terms.length > 0) return school.terms;
  const merged = loadPlannerCurriculum();
  if (merged.terms.length > 0) return merged.terms;
  return defaultPlannerTerms(academicYear || currentAcademicYearGuess());
}

/**
 * Hydrate school + personal from Supabase; one-time localStorage → personal import.
 * Demo mode / missing org: local fallback.
 */
export async function loadPlannerCurriculumAsync(): Promise<PlannerCurriculumState> {
  const merged = await loadMergedPlannerCurriculumAsync();
  return mergedToPlannerState(merged);
}

export async function loadMergedPlannerCurriculumAsync(): Promise<MergedPlannerCurriculum> {
  if (isDemoModeActive()) {
    schoolCache = readLocalPlannerCurriculum();
    personalCache = readLocalPersonalCurriculum();
    if (personalCurriculumIsEmpty(personalCache) && !curriculumIsEmpty(schoolCache)) {
      // Demo: migrate legacy single blob into personal so markers work.
      personalCache = personalFromLegacySchoolState(schoolCache);
      writeLocalPersonalCurriculum(personalCache);
    }
    const merged = rebuildMerged();
    emitUpdated();
    return merged;
  }

  const organisationId = await resolveOrganisationId();
  if (!organisationId) {
    schoolCache = readLocalPlannerCurriculum();
    personalCache = readLocalPersonalCurriculum();
    return rebuildMerged();
  }

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;

    const schoolRes = await supabase
      .from(PLANNER_CURRICULUM_TABLE)
      .select('data')
      .eq('organisation_id', organisationId)
      .maybeSingle();

    if (!schoolRes.error && schoolRes.data?.data != null) {
      schoolCache = parsePlannerCurriculum(schoolRes.data.data);
      writeLocalPlannerCurriculum(schoolCache);
    } else {
      schoolCache = readLocalPlannerCurriculum();
      // Admin-only: seed school row from localStorage once if empty.
      if (
        !schoolRes.error &&
        curriculumIsEmpty(schoolCache) === false &&
        !hasImportedLocalForOrg(organisationId)
      ) {
        const { error: upsertError } = await supabase.from(PLANNER_CURRICULUM_TABLE).upsert(
          {
            organisation_id: organisationId,
            data: schoolCache,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organisation_id' },
        );
        if (!upsertError) markImportedLocalForOrg(organisationId);
      }
    }

    personalCache = readLocalPersonalCurriculum();
    if (userId) {
      const personalRes = await supabase
        .from(PLANNER_CURRICULUM_USER_TABLE)
        .select('data')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!personalRes.error && personalRes.data?.data != null) {
        personalCache = parsePersonalCurriculum(personalRes.data.data);
        writeLocalPersonalCurriculum(personalCache);
      } else if (
        !personalRes.error &&
        personalCurriculumIsEmpty(personalCache)
      ) {
        // One-time import: legacy ccd-planner-curriculum-v1 → personal copy.
        const legacy = readLocalPlannerCurriculum();
        if (
          !curriculumIsEmpty(legacy) &&
          !hasImportedPersonal(organisationId, userId)
        ) {
          const imported = personalFromLegacySchoolState(legacy);
          const { error: upsertError } = await supabase
            .from(PLANNER_CURRICULUM_USER_TABLE)
            .upsert(
              {
                user_id: userId,
                organisation_id: organisationId,
                data: imported,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,organisation_id' },
            );
          if (!upsertError) {
            personalCache = imported;
            writeLocalPersonalCurriculum(imported);
            markImportedPersonal(organisationId, userId);
          }
        }
      }
    }

    const merged = rebuildMerged();
    emitUpdated();
    return merged;
  } catch {
    schoolCache = readLocalPlannerCurriculum();
    personalCache = readLocalPersonalCurriculum();
    return rebuildMerged();
  }
}

/**
 * Persist the school (Layer 1) curriculum. Org admins / super admins only via RLS.
 * Used by Settings → Curriculum.
 */
export function saveSchoolPlannerCurriculum(state: PlannerCurriculumState): void {
  schoolCache = state;
  writeLocalPlannerCurriculum(state);
  rebuildMerged();
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

/**
 * Persist the teacher's personal (Layer 2) curriculum. Owner-only via RLS.
 * Used by CurriculumStatementsPanel — never mutates the school set.
 */
export function savePersonalPlannerCurriculum(personal: PersonalCurriculumData): void {
  personalCache = personal;
  writeLocalPersonalCurriculum(personal);
  rebuildMerged();
  emitUpdated();

  if (isDemoModeActive()) return;

  void (async () => {
    try {
      const organisationId = await resolveOrganisationId();
      if (!organisationId) return;
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;
      const { error } = await supabase.from(PLANNER_CURRICULUM_USER_TABLE).upsert(
        {
          user_id: userId,
          organisation_id: organisationId,
          data: personal,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        },
        { onConflict: 'user_id,organisation_id' },
      );
      if (error && import.meta.env.DEV) {
        console.warn('planner_curriculum_user upsert failed (local kept):', error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('planner_curriculum_user upsert threw (local kept):', err);
      }
    }
  })();
}

/**
 * @deprecated Prefer saveSchoolPlannerCurriculum (Settings) or
 * savePersonalPlannerCurriculum (panel). Kept for call-site compatibility —
 * writes the school layer only.
 */
export function savePlannerCurriculum(state: PlannerCurriculumState): void {
  saveSchoolPlannerCurriculum(state);
}

/** Merged statements for AI fill-in / Activity Library — IDs only from this list. */
export function getMergedCurriculumStatementsForConsumers() {
  return selectMergedCurriculumStatements(
    loadSchoolPlannerCurriculum(),
    loadPersonalPlannerCurriculum(),
  );
}

/** Test helper — clear in-memory caches between cases. */
export function __resetPlannerCurriculumCacheForTests(): void {
  schoolCache = null;
  personalCache = null;
  mergedCache = null;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
