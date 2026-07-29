export const PROTOTYPE_NOTICE =
  'CCDesigner Prototype v0.1 — early interactive demo for Arts Council funding and sector consultation.';

export const PARTNER_DISCLAIMER_FRAMING =
  'For partners and funding';

export const PARTNER_DISCLAIMER =
  'Organisation logos are for demonstration only — not an endorsement or partnership. Trademarks remain with their owners.';

export const ABOUT_PROTOTYPE_TITLE = 'About this prototype';

export const ABOUT_PROTOTYPE_BODY =
  'CCDesigner is an early interactive prototype for funding discussions and arts-sector feedback.\n\nSome features and content are illustrative. Organisation logos are for demonstration only.';

export const WELCOME_PROTOTYPE_TITLE = 'Welcome to the prototype';

export const WELCOME_PROTOTYPE_BODY =
  'This is a working prototype — some settings are limited.\n\nOpen Partner Hubs to explore partner pages.\n\nUse the Contact Us button at the top of the site to message rob@rhythmstix.co.uk for a full teacher login so you can make changes.';

export const WELCOME_PROTOTYPE_CONTACT_EMAIL = 'rob@rhythmstix.co.uk';

export const WELCOME_PROTOTYPE_PARTNER_HUBS_CTA = 'Open Partner Hubs';

export const WELCOME_PROTOTYPE_CONTACT_US_CTA = 'Contact Us';

export const WELCOME_PROTOTYPE_CONTINUE_CTA = 'I understand — continue';

/** Bump when welcome copy changes so returning visitors see the updated notice. */
export const WELCOME_PROTOTYPE_STORAGE_KEY = 'ccd-prototype-welcome-seen-v3';

/** Session-scoped key for the partners/funding start popup.
 * Bump suffix when the first-open flow changes so returning visitors see it again. */
export const PARTNERS_FUNDING_VIDEO_STORAGE_KEY = 'ccd-partners-funding-walkthrough-seen-v3';

/** Title for the first-open start popup. */
export const PARTNERS_FUNDING_START_TITLE = 'Welcome to the prototype';

/** Title for the archived in-app feature demo video modal (kept for optional replay). */
export const PARTNERS_FUNDING_VIDEO_TITLE = 'Archived feature demo';

export const PARTNERS_FUNDING_VIDEO_INTRO =
  'A short animated walkthrough of Partner Hubs, planning, key dates, and paid partners in CCDesigner.';

/** Shortened org/logo notice for the partners/funding start popup. */
export const PARTNERS_FUNDING_VIDEO_NOTICE =
  'Organisation logos are for demonstration only — not an endorsement or partnership.';

/** Clear prototype awareness before the user continues. */
export const PARTNERS_FUNDING_VIDEO_PROTOTYPE_AWARENESS =
  'This is an early prototype.';

/** Primary CTA opens the animated Feature Walkthrough (ccd-pitch) in the old video-modal slot. */
export const PARTNERS_FUNDING_VIDEO_CTA = 'Watch walkthrough';

export const PARTNERS_FUNDING_CONTINUE_CTA = 'Continue to sign in';

/** Public player page served from `public/feature-demo/` (archived — not primary CTA). */
export const FEATURE_DEMO_PATH = '/feature-demo/';

/** In-app modal video sources under `public/feature-demo/` (archived). */
export const FEATURE_DEMO_VIDEO_MP4 = 'feature-demo/ccdesigner-feature-demo.mp4';
export const FEATURE_DEMO_VIDEO_WEBM = 'feature-demo/ccdesigner-feature-demo.webm';
export const FEATURE_DEMO_VIDEO_POSTER = 'feature-demo/frames/04-disclaimer.png';

export const ACTIVITY_LIBRARY_WELCOME_TITLE = 'About these activities';

export const ACTIVITY_LIBRARY_WELCOME_BODY =
  'Example activities — customise them in Settings, and share with colleagues.';

export const ACTIVITY_LIBRARY_WELCOME_STORAGE_KEY = 'ccd-activity-library-welcome-seen';

/** Bump when tabs explainer copy changes so returning demo visitors see it again. */
export const TABS_EXPLAINER_STORAGE_KEY = 'ccd-tabs-explainer-seen-v1';

export const TABS_EXPLAINER_TITLE = 'Your Dashboard tabs';

export const TABS_EXPLAINER_INTRO =
  'A quick tour of the seven tabs along the top — tap a name to jump there.';

export const TABS_EXPLAINER_CTA = 'Got it';

export type TabsExplainerTabId =
  | 'unit-viewer'
  | 'lesson-library'
  | 'lesson-builder'
  | 'activity-library'
  | 'calendar'
  | 'our-partners'
  | 'contact-us';

export const TABS_EXPLAINER_ITEMS: ReadonlyArray<{
  id: TabsExplainerTabId;
  label: string;
  description: string;
}> = [
  {
    id: 'unit-viewer',
    label: 'Planner Overview',
    description: 'See your term plan and units at a glance.',
  },
  {
    id: 'lesson-library',
    label: 'Lesson Library',
    description: 'Browse and open your saved lesson plans.',
  },
  {
    id: 'lesson-builder',
    label: 'Lesson Builder',
    description: 'Build and edit lessons from activities.',
  },
  {
    id: 'activity-library',
    label: 'Activity Library',
    description:
      "Where a teacher's personal activities live, plus any they've selected or added from Partner Hubs.",
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Schedule lessons and keep track of key dates.',
  },
  {
    id: 'our-partners',
    label: 'Partner Hubs',
    description: 'Explore partner pages and add resources into your library.',
  },
  {
    id: 'contact-us',
    label: 'Contact Us',
    description: 'Get in touch or request a full teacher login.',
  },
];
