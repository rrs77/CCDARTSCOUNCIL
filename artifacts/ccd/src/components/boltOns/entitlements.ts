/**
 * Front-end entitlement stubs — always Free until billing exists.
 * Free limits match owner-approved mockups (careful trial).
 */

import type {
  AssessifyEntitlements,
  BoltOnTier,
  PeriFeedbackEntitlements,
} from './types';

/** Free: rubrics + progress + export summary — no AI, limited classes. */
export const ASSESSIFY_FREE: AssessifyEntitlements = {
  maxClasses: 1,
  maxPupils: 10,
  canUseAI: false,
  canCustomizeRubrics: false,
  canViewProgressAnalytics: true,
  canExportReports: true,
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

export function getBoltOnTier(_product: 'assessify' | 'perifeedback'): BoltOnTier {
  return 'free';
}

export function getAssessifyEntitlements(): AssessifyEntitlements {
  return ASSESSIFY_FREE;
}

export function getPeriFeedbackEntitlements(): PeriFeedbackEntitlements {
  return PERIFEEDBACK_FREE;
}

export function periFeedbackAllowsParentContact(): boolean {
  return getPeriFeedbackEntitlements().canContactParents === true;
}
