/**
 * Free vs Premium (Full) offerings for bolt-ons — keep Free deliberately limited.
 * Prices are placeholders until billing exists. Owner-approved mockup limits.
 */

export type BoltOnPlanId = 'assessify' | 'perifeedback';

export const ADDON_PLANS = {
  assessify: {
    id: 'assessify' as const,
    name: 'Assessify',
    tagline: 'Assessment for creative subjects',
    benefitHeadline: 'Assessment without the paperwork.',
    lede: 'Rubrics, evidence and progression for music, drama, dance and art — in one calm view.',
    free: {
      title: 'Everything you need to start',
      features: [
        'Subject rubrics for creative subjects',
        'Progress view for your classes',
        'Export a class summary',
      ],
    },
    premium: {
      title: 'Everything in Free, plus',
      features: [
        'AI-suggested next steps per pupil',
        'Unlimited classes and history',
        'School-wide progress reports',
      ],
    },
  },
  perifeedback: {
    id: 'perifeedback' as const,
    name: 'PeriFeedback',
    tagline: 'Notes for visiting music tutors',
    benefitHeadline: 'Better lessons. Clearer communication.',
    lede: 'Lesson notes and practice goals for visiting music tutors — with parent updates when you need them.',
    free: {
      title: 'Everything you need to start',
      features: [
        'Lesson notes for every pupil',
        'Practice goals and recent history',
        'Works on phone between lessons',
      ],
    },
    premium: {
      title: 'Everything in Free, plus',
      features: [
        'Parent updates by email',
        'Termly progress summaries',
        'Full note history',
      ],
    },
  },
} as const;

/** Comparison table rows for the Explore page (careful Free limits). */
export const EXPLORE_COMPARE = {
  assessify: [
    { feature: 'Subject rubrics and progress view', free: 'yes' as const, premium: 'yes' as const },
    { feature: 'Classes tracked', free: 'limited' as const, premium: 'Unlimited' },
    { feature: 'AI-suggested next steps', free: 'no' as const, premium: 'yes' as const },
  ],
  perifeedback: [
    { feature: 'Lesson notes and practice goals', free: 'yes' as const, premium: 'yes' as const },
    { feature: 'Note history', free: 'limited' as const, premium: 'Full' },
    { feature: 'Parent updates by email', free: 'no' as const, premium: 'yes' as const },
  ],
};
