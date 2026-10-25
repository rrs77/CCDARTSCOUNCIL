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
  stripSchoolDuplicatesFromPersonal,
  selectMergedCurriculumStatements,
  type MergedPlannerCurriculum,
} from './mergePlannerCurriculum';
import {
  STORAGE_KEY,
  PERSONAL_STORAGE_KEY,
  hasFullCurriculumScope,
  readPersonalLegacyBlob,
  readScopedOrMigrateLegacy,
  writeScopedLocal,
} from './plannerCurriculumLocalCache';
import {
  ensurePlannerCurriculumCacheScope,
  getPlannerCurriculumCacheScope,
  resetPlannerCurriculumCacheScope,
} from './plannerCurriculumCacheScope';
import toast from 'react-hot-toast';

export { STORAGE_KEY, PERSONAL_STORAGE_KEY } from './plannerCurriculumLocalCache';
const IMPORT_FLAG_PREFIX = 'ccd-planner-curriculum-imported-v1:';
const PERSONAL_IMPORT_FLAG_PREFIX = 'ccd-planner-curriculum-personal-imported-v1:';

function notifyCurriculumSaveFailed(layer: 'school' | 'personal', detail?: string): void {
  if (detail) console.warn(`planner_curriculum ${layer} save failed:`, detail);
  try {
    toast.error(
      layer === 'school'
        ? 'Could not save the school curriculum. Your changes are kept on this device only.'
        : 'Could not save your personal curriculum. Your changes are kept on this device only.',
    );
  } catch {
    /* toast may be unavailable outside React */
  }
}

/** True when the caller may write school-layer curriculum (org admin / super). */
async function callerIsSchoolCurriculumAdmin(): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return false;
    try {
      const raw = localStorage.getItem('rhythmstix_profile_cache');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          userId?: string;
          profile?: { role?: string | null; can_manage_users?: boolean | null; status?: string | null; anonymised_at?: string | null };
        };
        if (parsed.userId === uid && parsed.profile) {
          const p = parsed.profile;
          if (p.status === 'suspended' || p.anonymised_at) return false;
          const role = String(p.role || '').toLowerCase();
          if (role === 'admin' || role === 'super_admin' || role === 'superuser' || p.can_manage_users === true) {
            return true;
          }
          return false;
        }
      }
    } catch {
      /* fall through to network */
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('role, can_manage_users, status, anonymised_at')
      .eq('id', uid)
      .maybeSingle();
    if (error || !data) return false;
    if (data.status === 'suspended' || data.anonymised_at) return false;
    const role = String(data.role || '').toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'superuser' || data.can_manage_users === true;
  } catch {
    return false;
  }
}

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

function resolveLocalIdentity(
  organisationId?: string | null,
  userId?: string | null,
): { organisationId: string | null; userId: string | null } {
  let org = organisationId != null ? String(organisationId).trim() : '';
  let user = userId != null ? String(userId).trim() : '';
  try {
    if (!org) org = localStorage.getItem('rhythmstix_organisation_id') || '';
    if (!user) user = localStorage.getItem('rhythmstix_user_id') || '';
  } catch {
    /* ignore */
  }
  return { organisationId: org || null, userId: user || null };
}

function readLocalPlannerCurriculum(
  organisationId?: string | null,
  userId?: string | null,
): PlannerCurriculumState {
  try {
    const id = resolveLocalIdentity(organisationId, userId);
    const raw = readScopedOrMigrateLegacy(STORAGE_KEY, id.organisationId, id.userId);
    if (!raw) return { ...EMPTY_PLANNER_CURRICULUM };
    return parsePlannerCurriculum(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PLANNER_CURRICULUM };
  }
}

function writeLocalPlannerCurriculum(
  state: PlannerCurriculumState,
  organisationId?: string | null,
  userId?: string | null,
): void {
  const id = resolveLocalIdentity(organisationId, userId);
  writeScopedLocal(STORAGE_KEY, JSON.stringify(state), id.organisationId, id.userId);
}

function readLocalPersonalCurriculum(
  organisationId?: string | null,
  userId?: string | null,
): PersonalCurriculumData {
  try {
    const id = resolveLocalIdentity(organisationId, userId);
    const raw = readScopedOrMigrateLegacy(PERSONAL_STORAGE_KEY, id.organisationId, id.userId);
    if (!raw) return { ...EMPTY_PERSONAL_CURRICULUM, overrides: {}, hiddenIds: [] };
    return parsePersonalCurriculum(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PERSONAL_CURRICULUM, overrides: {}, hiddenIds: [] };
  }
}

function writeLocalPersonalCurriculum(
  personal: PersonalCurriculumData,
  organisationId?: string | null,
  userId?: string | null,
): void {
  const id = resolveLocalIdentity(organisationId, userId);
  writeScopedLocal(PERSONAL_STORAGE_KEY, JSON.stringify(personal), id.organisationId, id.userId);
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

/**
 * Clear in-memory school/personal/merged caches.
 * Call on sign-out and whenever the signed-in user or organisation changes.
 */
export function resetPlannerCurriculumCaches(): void {
  schoolCache = null;
  personalCache = null;
  mergedCache = null;
  resetPlannerCurriculumCacheScope();
}

function ensureCacheMatchesIdentity(
  organisationId?: string | null,
  userId?: string | null,
): void {
  const id = resolveLocalIdentity(organisationId, userId);
  ensurePlannerCurriculumCacheScope(id.organisationId, id.userId, () => {
    schoolCache = null;
    personalCache = null;
    mergedCache = null;
  });
}

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
  ensureCacheMatchesIdentity();
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
  ensureCacheMatchesIdentity();
  if (schoolCache) return schoolCache;
  schoolCache = readLocalPlannerCurriculum();
  return schoolCache;
}

export function loadPersonalPlannerCurriculum(): PersonalCurriculumData {
  ensureCacheMatchesIdentity();
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
    ensureCacheMatchesIdentity();
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
    ensureCacheMatchesIdentity(null, null);
    schoolCache = readLocalPlannerCurriculum();
    personalCache = readLocalPersonalCurriculum();
    return rebuildMerged();
  }

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;
    ensureCacheMatchesIdentity(organisationId, userId);

    const schoolRes = await supabase
      .from(PLANNER_CURRICULUM_TABLE)
      .select('data')
      .eq('organisation_id', organisationId)
      .maybeSingle();

    if (!schoolRes.error && schoolRes.data?.data != null) {
      // Never overwrite an existing server copy with local-only data.
      schoolCache = parsePlannerCurriculum(schoolRes.data.data);
      writeLocalPlannerCurriculum(schoolCache, organisationId, userId);
    } else {
      // Only import scoped local cache for THIS org+user into an empty server row.
      // Teachers cannot write school curriculum — skip upsert to avoid toast spam.
      schoolCache = readLocalPlannerCurriculum(organisationId, userId);
      if (
        !schoolRes.error &&
        curriculumIsEmpty(schoolCache) === false &&
        !hasImportedLocalForOrg(organisationId) &&
        (await callerIsSchoolCurriculumAdmin())
      ) {
        const { error: upsertError } = await supabase.from(PLANNER_CURRICULUM_TABLE).upsert(
          {
            organisation_id: organisationId,
            data: schoolCache,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organisation_id' },
        );
        if (upsertError) {
          notifyCurriculumSaveFailed('school', upsertError.message);
        } else {
          markImportedLocalForOrg(organisationId);
        }
      }
      // Non-admins: keep local for display only — never attempt school upsert (avoids toast spam).
    }

    personalCache = readLocalPersonalCurriculum(organisationId, userId);
    if (userId && hasFullCurriculumScope(organisationId, userId)) {
      const personalRes = await supabase
        .from(PLANNER_CURRICULUM_USER_TABLE)
        .select('data')
        .eq('organisation_id', organisationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!personalRes.error && personalRes.data?.data != null) {
        // Existing personal server copy wins — never silent overwrite from local.
        personalCache = parsePersonalCurriculum(personalRes.data.data);
        writeLocalPersonalCurriculum(personalCache, organisationId, userId);
      } else if (
        !personalRes.error &&
        personalCurriculumIsEmpty(personalCache) &&
        !hasImportedPersonal(organisationId, userId)
      ) {
        // One-time import: ONLY the user's personal legacy blob — never school
        // cache / server-loaded school data (would reappear as "Mine").
        const legacyRaw = readPersonalLegacyBlob(organisationId, userId);
        let imported = legacyRaw
          ? parsePersonalCurriculum(JSON.parse(legacyRaw))
          : { ...EMPTY_PERSONAL_CURRICULUM, overrides: {}, hiddenIds: [] };
        // Safety: drop anything identical to the school set.
        imported = stripSchoolDuplicatesFromPersonal(imported, schoolCache);
        if (!personalCurriculumIsEmpty(imported)) {
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
          if (upsertError) {
            notifyCurriculumSaveFailed('personal', upsertError.message);
          } else {
            personalCache = imported;
            writeLocalPersonalCurriculum(imported, organisationId, userId);
            markImportedPersonal(organisationId, userId);
          }
        } else {
          // Nothing personal to import — leave personal empty; do not create a row.
          personalCache = { ...EMPTY_PERSONAL_CURRICULUM, overrides: {}, hiddenIds: [] };
          markImportedPersonal(organisationId, userId);
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
  ensureCacheMatchesIdentity();
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
      writeLocalPlannerCurriculum(state, organisationId, auth.user?.id ?? null);
      const { error } = await supabase.from(PLANNER_CURRICULUM_TABLE).upsert(
        {
          organisation_id: organisationId,
          data: state,
          updated_at: new Date().toISOString(),
          updated_by: auth.user?.id ?? null,
        },
        { onConflict: 'organisation_id' },
      );
      if (error) {
        notifyCurriculumSaveFailed('school', error.message);
      }
    } catch (err) {
      notifyCurriculumSaveFailed('school', err instanceof Error ? err.message : String(err));
    }
  })();
}

/**
 * Persist the teacher's personal (Layer 2) curriculum. Owner-only via RLS.
 * Used by CurriculumStatementsPanel — never mutates the school set.
 */
export function savePersonalPlannerCurriculum(personal: PersonalCurriculumData): void {
  ensureCacheMatchesIdentity();
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
      writeLocalPersonalCurriculum(personal, organisationId, userId);
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
      if (error) {
        notifyCurriculumSaveFailed('personal', error.message);
      }
    } catch (err) {
      notifyCurriculumSaveFailed('personal', err instanceof Error ? err.message : String(err));
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
  resetPlannerCurriculumCaches();
}

/** Test helper — current cache scope token (org:user). */
export function __plannerCurriculumCacheScopeForTests(): string | null {
  return getPlannerCurriculumCacheScope();
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
