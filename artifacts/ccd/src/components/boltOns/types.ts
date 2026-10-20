/** Bolt-on product ids used in nav, routes, and entitlement stubs. */
export type BoltOnId = 'assessify' | 'perifeedback';

/** Catalogue + product detail page keys. */
export type BoltOnsPageId = 'bolt-ons' | BoltOnId;

export type BoltOnTier = 'free' | 'premium' | 'school';

/**
 * Proposed Assessify entitlements (illustrative — no live billing/backend yet).
 * Server-side checks are planned-not-implemented; UI must not invent Premium access.
 */
export type AssessifyEntitlements = {
  maxClasses: number | null;
  maxPupils: number | null;
  canUseAI: boolean;
  canCustomizeRubrics: boolean;
  canViewProgressAnalytics: boolean;
  canExportReports: boolean;
};

/**
 * Proposed PeriFeedback entitlements.
 * Parent communication flags must stay false until a real server gate exists.
 */
export type PeriFeedbackEntitlements = {
  maxPupils: number | null;
  maxLessonEntriesPerMonth: number | null;
  maxActivePracticeGoalsPerPupil: number | null;
  canContactParents: boolean;
  canSendFeedback: boolean;
  canCreateParentShareLinks: boolean;
  canGenerateTermlyReports: boolean;
  canManageSchoolTutors: boolean;
};

export type FeatureStatus = 'available' | 'proposed' | 'roadmap' | 'core-upgrade' | 'limit';
