/**
 * Merge school (Layer 1) + personal (Layer 2) planner curriculum.
 * Personal overrides / hides / adds never mutate the school set.
 */
import type {
  CurriculumFramework,
  CurriculumStatement,
  CurriculumStrand,
  MergedCurriculumStatement,
  PersonalCurriculumData,
  PlannerCurriculumState,
} from '../../types/plannerCurriculum';

export type MergedPlannerCurriculum = {
  frameworks: CurriculumFramework[];
  strands: CurriculumStrand[];
  statements: MergedCurriculumStatement[];
  sectionTypes: PlannerCurriculumState['sectionTypes'];
  planTemplates: PlannerCurriculumState['planTemplates'];
  terms: PlannerCurriculumState['terms'];
};

const EMPTY_PERSONAL: PersonalCurriculumData = {
  frameworks: [],
  strands: [],
  statements: [],
  overrides: {},
  hiddenIds: [],
};

const EMPTY_SCHOOL: PlannerCurriculumState = {
  frameworks: [],
  strands: [],
  statements: [],
  sectionTypes: [],
  planTemplates: [],
  terms: [],
};

export function parsePersonalCurriculum(raw: unknown): PersonalCurriculumData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PERSONAL, overrides: {}, hiddenIds: [] };
  const parsed = raw as Partial<PersonalCurriculumData>;
  const overrides =
    parsed.overrides && typeof parsed.overrides === 'object' && !Array.isArray(parsed.overrides)
      ? Object.fromEntries(
          Object.entries(parsed.overrides).filter(
            ([, v]) => v && typeof v === 'object' && typeof (v as { text?: unknown }).text === 'string',
          ),
        )
      : {};
  return {
    frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : [],
    strands: Array.isArray(parsed.strands) ? parsed.strands : [],
    statements: Array.isArray(parsed.statements) ? parsed.statements : [],
    overrides: overrides as Record<string, { text: string }>,
    hiddenIds: Array.isArray(parsed.hiddenIds)
      ? parsed.hiddenIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [],
  };
}

export function personalCurriculumIsEmpty(personal: PersonalCurriculumData): boolean {
  return (
    personal.frameworks.length === 0 &&
    personal.strands.length === 0 &&
    personal.statements.length === 0 &&
    personal.hiddenIds.length === 0 &&
    Object.keys(personal.overrides).length === 0
  );
}

/**
 * One-time import of legacy localStorage school-shaped curriculum into a
 * personal layer (treat everything as teacher-owned adds).
 */
export function personalFromLegacySchoolState(
  legacy: PlannerCurriculumState,
): PersonalCurriculumData {
  return {
    frameworks: [...(legacy.frameworks || [])],
    strands: [...(legacy.strands || [])],
    statements: [...(legacy.statements || [])],
    overrides: {},
    hiddenIds: [],
  };
}

function normStatementText(text: string | undefined | null): string {
  return (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Drop personal statements/frameworks/strands that are identical to the school
 * set (same id or same normalised text). Prevents school curriculum leaking
 * into "Mine" after a mistaken import.
 */
export function stripSchoolDuplicatesFromPersonal(
  personal: PersonalCurriculumData,
  school: PlannerCurriculumState | null | undefined,
): PersonalCurriculumData {
  const s = school || EMPTY_SCHOOL;
  const schoolStatementIds = new Set((s.statements || []).map((st) => st.id));
  const schoolStatementTexts = new Set(
    (s.statements || []).map((st) => normStatementText(st.text)).filter(Boolean),
  );
  const schoolFrameworkIds = new Set((s.frameworks || []).map((f) => f.id));
  const schoolStrandIds = new Set((s.strands || []).map((st) => st.id));

  return {
    frameworks: (personal.frameworks || []).filter((f) => !schoolFrameworkIds.has(f.id)),
    strands: (personal.strands || []).filter((st) => !schoolStrandIds.has(st.id)),
    statements: (personal.statements || []).filter((st) => {
      if (schoolStatementIds.has(st.id)) return false;
      const text = normStatementText(st.text);
      if (text && schoolStatementTexts.has(text)) return false;
      return true;
    }),
    // Overrides / hides are personal choices about school rows — keep them.
    overrides: { ...(personal.overrides || {}) },
    hiddenIds: [...(personal.hiddenIds || [])],
  };
}

/** Merge school + personal into one list for the panel / AI / Activity Library. */
export function mergePlannerCurriculum(
  school: PlannerCurriculumState | null | undefined,
  personal: PersonalCurriculumData | null | undefined,
): MergedPlannerCurriculum {
  const s = school || EMPTY_SCHOOL;
  const p = personal || EMPTY_PERSONAL;
  const hidden = new Set(p.hiddenIds || []);

  const schoolStatements: MergedCurriculumStatement[] = (s.statements || [])
    .filter((st) => !hidden.has(st.id))
    .map((st) => {
      const override = p.overrides?.[st.id];
      if (override && typeof override.text === 'string') {
        return {
          ...st,
          text: override.text,
          source: 'mine' as const,
          overridden: true,
          schoolText: st.text,
        };
      }
      return { ...st, source: 'school' as const };
    });

  const schoolIds = new Set((s.statements || []).map((st) => st.id));
  const personalStatements: MergedCurriculumStatement[] = (p.statements || [])
    .filter((st) => !schoolIds.has(st.id))
    .map((st) => ({ ...st, source: 'mine' as const }));

  // Prefer school frameworks/strands; append personal-only by id.
  const frameworks = mergeById(s.frameworks || [], p.frameworks || []);
  const strands = mergeById(s.strands || [], p.strands || []);

  return {
    frameworks,
    strands,
    statements: [...schoolStatements, ...personalStatements],
    sectionTypes: s.sectionTypes || [],
    planTemplates: s.planTemplates || [],
    terms: s.terms || [],
  };
}

function mergeById<T extends { id: string }>(school: T[], personal: T[]): T[] {
  const seen = new Set(school.map((x) => x.id));
  return [...school, ...personal.filter((x) => !seen.has(x.id))];
}

/** Flatten merged view back to PlannerCurriculumState (IDs from merged list only). */
export function mergedToPlannerState(merged: MergedPlannerCurriculum): PlannerCurriculumState {
  return {
    frameworks: merged.frameworks,
    strands: merged.strands,
    statements: merged.statements.map(
      ({ id, strandId, text }): CurriculumStatement => ({ id, strandId, text }),
    ),
    sectionTypes: merged.sectionTypes,
    planTemplates: merged.planTemplates,
    terms: merged.terms,
  };
}

/** Statements selector for AI fill-in / Activity Library — IDs only from the merge. */
export function selectMergedCurriculumStatements(
  school: PlannerCurriculumState | null | undefined,
  personal: PersonalCurriculumData | null | undefined,
): MergedCurriculumStatement[] {
  return mergePlannerCurriculum(school, personal).statements;
}

/** Override a school (or already-overridden) statement text in the personal layer. */
export function personalOverrideStatement(
  personal: PersonalCurriculumData,
  statementId: string,
  text: string,
): PersonalCurriculumData {
  return {
    ...personal,
    overrides: { ...personal.overrides, [statementId]: { text } },
    // If it was a personal add, update that row too
    statements: personal.statements.map((st) =>
      st.id === statementId ? { ...st, text } : st,
    ),
  };
}

/** Hide a school statement for this teacher only. */
export function personalHideStatement(
  personal: PersonalCurriculumData,
  statementId: string,
): PersonalCurriculumData {
  if (personal.hiddenIds.includes(statementId)) return personal;
  const { [statementId]: _removed, ...overrides } = personal.overrides;
  return {
    ...personal,
    hiddenIds: [...personal.hiddenIds, statementId],
    overrides,
    statements: personal.statements.filter((st) => st.id !== statementId),
  };
}

/** Reset a school statement override / unhide — remove personal overlay for that id. */
export function personalResetToSchool(
  personal: PersonalCurriculumData,
  statementId: string,
): PersonalCurriculumData {
  const { [statementId]: _removed, ...overrides } = personal.overrides;
  return {
    ...personal,
    overrides,
    hiddenIds: personal.hiddenIds.filter((id) => id !== statementId),
  };
}

/** Add a teacher-owned statement (and ensure strand exists in personal if needed). */
export function personalAddStatement(
  personal: PersonalCurriculumData,
  statement: CurriculumStatement,
  strand?: CurriculumStrand,
  framework?: CurriculumFramework,
): PersonalCurriculumData {
  let frameworks = personal.frameworks;
  let strands = personal.strands;
  if (framework && !frameworks.some((f) => f.id === framework.id)) {
    frameworks = [...frameworks, framework];
  }
  if (strand && !strands.some((s) => s.id === strand.id)) {
    strands = [...strands, strand];
  }
  const statements = personal.statements.some((st) => st.id === statement.id)
    ? personal.statements.map((st) => (st.id === statement.id ? statement : st))
    : [...personal.statements, statement];
  return { ...personal, frameworks, strands, statements };
}
