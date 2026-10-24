import type { MisApprovalStepDef, MisApprovalStepId } from './types';

/** Six UI checklist steps matching the Settings mockup. */
export const MIS_APPROVAL_STEPS: readonly MisApprovalStepDef[] = [
  {
    id: 'docs_reviewed',
    step: 1,
    label: "Provider's official technical documentation reviewed",
  },
  {
    id: 'api_commercial',
    step: 2,
    label: 'API access and commercial terms confirmed',
  },
  {
    id: 'school_authorised',
    step: 3,
    label: 'School / organisation has authorised the integration',
  },
  {
    id: 'data_protection',
    step: 4,
    label: 'Data protection and security requirements addressed',
  },
  {
    id: 'categories_configured',
    step: 5,
    label: 'Permitted data categories and app access configured',
  },
  {
    id: 'tested',
    step: 6,
    label: 'Tested with appropriate test data',
  },
] as const;

/** Finer DB gate ids (migration) mapped into the six UI steps. */
export const MIS_DB_GATES_BY_UI_STEP: Record<MisApprovalStepId, readonly string[]> = {
  docs_reviewed: ['docs_reviewed'],
  api_commercial: [
    'api_access_confirmed',
    'commercial_terms_confirmed',
    'provider_approval_confirmed',
  ],
  school_authorised: ['school_authorised'],
  data_protection: ['data_protection_addressed'],
  categories_configured: ['permitted_categories_configured', 'app_access_configured'],
  tested: ['tested_with_test_data'],
};

export type MisStepProgress = 'not_started' | 'in_progress' | 'complete';

export function stepProgressLabel(progress: MisStepProgress): string {
  switch (progress) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    default:
      return 'Not started';
  }
}

/** Until gates are met in the database, every step is not started. Never invent completion. */
export function defaultApprovalProgress(): Record<MisApprovalStepId, MisStepProgress> {
  return {
    docs_reviewed: 'not_started',
    api_commercial: 'not_started',
    school_authorised: 'not_started',
    data_protection: 'not_started',
    categories_configured: 'not_started',
    tested: 'not_started',
  };
}

export function allApprovalStepsComplete(
  progress: Record<MisApprovalStepId, MisStepProgress>,
): boolean {
  return MIS_APPROVAL_STEPS.every((s) => progress[s.id] === 'complete');
}
