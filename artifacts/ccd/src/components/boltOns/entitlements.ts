/**
 * Front-end entitlement stubs for Assessify / PeriFeedback.
 *
 * Investigation (Oct 2026): no Assessify or PeriFeedback product backend,
 * subscription tables, or org entitlement records exist in this repo.
 * Partner Hub resource access (`access_code` / `subscription`) is unrelated.
 *
 * Until server-side entitlement APIs exist, every signed-in teacher is treated
 * as Free for these bolt-ons. Do not trust a client-supplied tier.
 */

import type {
  AssessifyEntitlements,
  BoltOnTier,
  PeriFeedbackEntitlements,
} from './types';

export const ASSESSIFY_FREE: AssessifyEntitlements = {
  maxClasses: 1,
  maxPupils: 10,
  canUseAI: false,
  canCustomizeRubrics: false,
  canViewProgressAnalytics: false,
  canExportReports: false,
};

export const PERIFEEDBACK_FREE: PeriFeedbackEntitlements = {
  maxPupils: 3,
  maxLessonEntriesPerMonth: 10,
  maxActivePracticeGoalsPerPupil: 1,
  canContactParents: false,
  canSendFeedback: false,
  canCreateParentShareLinks: false,
  canGenerateTermlyReports: false,
  canManageSchoolTutors: false,
};

/** Always Free until a real entitlement service is wired. */
export function getBoltOnTier(_product: 'assessify' | 'perifeedback'): BoltOnTier {
  return 'free';
}

export function getAssessifyEntitlements(): AssessifyEntitlements {
  return ASSESSIFY_FREE;
}

export function getPeriFeedbackEntitlements(): PeriFeedbackEntitlements {
  return PERIFEEDBACK_FREE;
}

/** Parent contact must never be enabled from the client alone. */
export function periFeedbackAllowsParentContact(): boolean {
  return getPeriFeedbackEntitlements().canContactParents === true;
}
