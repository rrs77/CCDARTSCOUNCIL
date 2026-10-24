/**
 * Single source of truth for Assessify / PeriFeedback Free vs Full offerings.
 *
 * ⚠️ ROB REVIEW FLAG — adjust these lists before marketing or billing launch.
 * Defaults are deliberately conservative: Free is a limited trial of basics only
 * (no AI, no parent updates, capped classes/pupils). Full is the paid unlock.
 *
 * CTAs do not charge yet; they route to the placeholder contact/concept flow.
 */

import type {
  AssessifyEntitlements,
  BoltOnId,
  PeriFeedbackEntitlements,
} from './types';

export type AddonPlanTier = 'free' | 'full';

export type AddonPlanFeature = {
  id: string;
  label: string;
  /** When true, shown as included on this tier */
  included: boolean;
};

export type AddonPlanDefinition = {
  id: BoltOnId;
  name: string;
  /** Short benefit headline for the sales card */
  benefitHeadline: string;
  tagline: string;
  /** 3–4 sales bullets (not pupil/mock data) */
  featureBullets: string[];
  accent: {
    /** Primary brand colour for this bolt-on */
    primary: string;
    soft: string;
    border: string;
    ring: string;
  };
  free: {
    title: string;
    summary: string;
    features: AddonPlanFeature[];
    cta: string;
  };
  full: {
    title: string;
    summary: string;
    features: AddonPlanFeature[];
    cta: string;
  };
  /** Entitlement stubs used by UI gates until a real billing backend exists */
  entitlements: {
    free: AssessifyEntitlements | PeriFeedbackEntitlements;
    full: AssessifyEntitlements | PeriFeedbackEntitlements;
  };
};

/**
 * Conservative Free defaults — flag for Rob to tighten or loosen.
 * Free: basic features only · no AI · no parent updates · limited classes/pupils.
 */
export const ADDON_PLANS: Record<BoltOnId, AddonPlanDefinition> = {
  assessify: {
    id: 'assessify',
    name: 'Assessify',
    benefitHeadline: 'Assessment without the paperwork.',
    tagline: 'Every step of progress, made visible.',
    featureBullets: [
      'Subject-specific rubrics for creative subjects',
      'Meaningful pupil feedback and next steps',
      'Clear view of creative progression',
      'Optional AI wording help on Full',
    ],
    accent: {
      primary: '#4338E8',
      soft: '#EFEDFF',
      border: '#D9D4FF',
      ring: '#E9E6FF',
    },
    free: {
      title: 'Free',
      summary: 'Try the basics with one small teaching group.',
      features: [
        { id: 'a-free-1', label: '1 class · up to 10 pupils', included: true },
        { id: 'a-free-2', label: 'Manual assessment against subject criteria', included: true },
        { id: 'a-free-3', label: 'Simple pupil notes and next-step targets', included: true },
        { id: 'a-free-4', label: 'One basic rubric template per subject', included: true },
        { id: 'a-free-ai', label: 'AI assistance or personalised AI reports', included: false },
        { id: 'a-free-export', label: 'Bulk reporting, graphs or Excel export', included: false },
      ],
      cta: 'Add free version',
    },
    full: {
      title: 'Full',
      summary: 'Unlock AI help, every class, and richer progress tools.',
      features: [
        { id: 'a-full-1', label: 'Multiple classes and pupils (fair use)', included: true },
        { id: 'a-full-2', label: 'AI-assisted comments and next steps (teacher review)', included: true },
        { id: 'a-full-3', label: 'Customisable criteria, rubrics and milestones', included: true },
        { id: 'a-full-4', label: 'Progress visualisations and report drafts', included: true },
        { id: 'a-full-5', label: 'Excel/PDF exports and year-group summaries', included: true },
      ],
      cta: 'Get full version',
    },
    entitlements: {
      free: {
        maxClasses: 1,
        maxPupils: 10,
        canUseAI: false,
        canCustomizeRubrics: false,
        canViewProgressAnalytics: false,
        canExportReports: false,
      } satisfies AssessifyEntitlements,
      full: {
        maxClasses: null,
        maxPupils: null,
        canUseAI: true,
        canCustomizeRubrics: true,
        canViewProgressAnalytics: true,
        canExportReports: true,
      } satisfies AssessifyEntitlements,
    },
  },
  perifeedback: {
    id: 'perifeedback',
    name: 'PeriFeedback',
    benefitHeadline: 'From a great lesson to a great update.',
    tagline: 'Better lessons. Clearer communication.',
    featureBullets: [
      'Record what happened in each visiting lesson',
      'Set clear practice goals as you go',
      'Keep a private teaching notebook on Free',
      'Parent-ready updates only on Full',
    ],
    accent: {
      primary: '#138E88',
      soft: '#E9F8F5',
      border: '#BFE8E1',
      ring: '#D5F3EA',
    },
    free: {
      title: 'Free',
      summary: 'A personal notebook — not a parent communication tool.',
      features: [
        { id: 'p-free-1', label: 'Up to 3 pupil profiles', included: true },
        { id: 'p-free-2', label: 'Up to 10 lesson entries per month', included: true },
        { id: 'p-free-3', label: 'Manual lesson notes', included: true },
        { id: 'p-free-4', label: 'One practice target per pupil', included: true },
        { id: 'p-free-parent', label: 'Parent updates, emails or share links', included: false },
        { id: 'p-free-bulk', label: 'Automated reports or bulk exports', included: false },
      ],
      cta: 'Add free version',
    },
    full: {
      title: 'Full',
      summary: 'Turn weekly notes into approved parent communication.',
      features: [
        { id: 'p-full-1', label: 'Send approved lesson updates to parents', included: true },
        { id: 'p-full-2', label: 'Professional, branded weekly feedback', included: true },
        { id: 'p-full-3', label: 'Reusable achievement and practice templates', included: true },
        { id: 'p-full-4', label: 'More pupil profiles and lesson entries', included: true },
        { id: 'p-full-5', label: 'Termly summaries and PDF reports', included: true },
      ],
      cta: 'Get full version',
    },
    entitlements: {
      free: {
        maxPupils: 3,
        maxLessonEntriesPerMonth: 10,
        maxActivePracticeGoalsPerPupil: 1,
        canContactParents: false,
        canSendFeedback: false,
        canCreateParentShareLinks: false,
        canGenerateTermlyReports: false,
        canManageSchoolTutors: false,
      } satisfies PeriFeedbackEntitlements,
      full: {
        maxPupils: null,
        maxLessonEntriesPerMonth: null,
        maxActivePracticeGoalsPerPupil: null,
        canContactParents: true,
        canSendFeedback: true,
        canCreateParentShareLinks: true,
        canGenerateTermlyReports: true,
        canManageSchoolTutors: true,
      } satisfies PeriFeedbackEntitlements,
    },
  },
};

export function getAddonPlan(id: BoltOnId): AddonPlanDefinition {
  return ADDON_PLANS[id];
}

export const ADDON_PLAN_IDS = Object.keys(ADDON_PLANS) as BoltOnId[];
