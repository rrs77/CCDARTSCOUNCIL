/**
 * Help centre content for Creative Curriculum Designer.
 * Keep copy aligned with the live product (Settings, Users, Half-terms, etc.).
 */

export type HelpTopicId =
  | 'activity'
  | 'lesson'
  | 'unit'
  | 'assign'
  | 'halfterms'
  | 'planner'
  | 'slides'
  | 'settings'
  | 'users'
  | 'print'
  | 'share'
  | 'facts'
  | 'account'
  | 'forum'
  | 'partners';

export interface HelpStep {
  title: string;
  body: string;
}

export interface HelpSection {
  id: string;
  title: string;
  intro?: string;
  steps?: HelpStep[];
  tips?: string[];
  /** Path under /help/screenshots/ */
  image?: string;
  imageAlt?: string;
}

export interface HelpTopic {
  id: HelpTopicId;
  title: string;
  blurb: string;
  accent: string;
  tint: string;
  keywords: string[];
  related: HelpTopicId[];
  /** App tab / path to open from “Open in app” */
  openTab?: string;
  sections: HelpSection[];
}

export const HELP_PRODUCT_NAME = 'Creative Curriculum Designer';

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'activity',
    title: 'Activity Library',
    blurb: 'Folders, hierarchy and creating activities',
    accent: '#4338E8',
    tint: '#E9E6FF',
    keywords: ['activity', 'library', 'folders', 'hierarchy', 'create', 'category', 'sticky'],
    related: ['lesson', 'settings', 'halfterms'],
    openTab: 'activity-library',
    sections: [
      {
        id: 'open-library',
        title: 'Open the Activity Library',
        intro:
          'The Activity Library holds every activity for the class selected in the header. Switch class to see that class’s folders.',
        steps: [
          { title: 'Open Activities', body: 'Use the sidebar item Activity Library.' },
          { title: 'Pick a class', body: 'Use the class control in the header so folders match the right year group.' },
          { title: 'Browse folders', body: 'Folders follow the hierarchy set in Settings → Activity folders. Category headers stay sticky while you scroll.' },
        ],
        image: 'activity-library.png',
        imageAlt: 'Activity Library with folder hierarchy',
      },
      {
        id: 'create-activity',
        title: 'Create an activity',
        steps: [
          { title: 'New activity', body: 'Choose Create / New activity and fill in title, description and media.' },
          { title: 'Place it', body: 'Assign a folder (category) so it appears in the right place for that class.' },
          { title: 'Save', body: 'Save — the activity appears in the library ready for Lesson Builder.' },
        ],
        tips: ['Star activities you use often so they float to the top of their folder.'],
      },
    ],
  },
  {
    id: 'lesson',
    title: 'Lesson Builder',
    blurb: 'Assemble activities into lessons',
    accent: '#4338E8',
    tint: '#E9E6FF',
    keywords: ['lesson', 'builder', 'drag', 'save lesson', 'plan'],
    related: ['activity', 'unit', 'halfterms'],
    openTab: 'lesson-builder',
    sections: [
      {
        id: 'build',
        title: 'Build a lesson',
        intro: 'Drag activities from the library into a lesson outline, then save.',
        steps: [
          { title: 'Open Lesson Builder', body: 'Use the sidebar Lesson Builder item.' },
          { title: 'Add activities', body: 'Drag activities into the lesson slots in the order you will teach them.' },
          { title: 'Save Lesson', body: 'Save — the plan appears under Lessons for this class.' },
        ],
        image: 'lesson-builder.png',
        imageAlt: 'Lesson Builder with activities in slots',
        tips: ['Open Lessons from the sidebar to revisit or assign a saved plan into Half-terms.'],
      },
    ],
  },
  {
    id: 'unit',
    title: 'Units & stacks',
    blurb: 'Group lessons into units',
    accent: '#6366F1',
    tint: '#EEF2FF',
    keywords: ['unit', 'stack', 'group lessons'],
    related: ['lesson', 'halfterms'],
    openTab: 'lesson-library',
    sections: [
      {
        id: 'units',
        title: 'Work with units and stacks',
        steps: [
          { title: 'Save lessons first', body: 'Build and save lessons in Lesson Builder.' },
          { title: 'Group them', body: 'Use units or stacks to keep related lessons together for a scheme of work.' },
          { title: 'Assign to terms', body: 'From Lessons or Half-terms, place lessons onto the year board.' },
        ],
        tips: ['Half-terms is usually the clearest place to see how units sit across the year.'],
      },
    ],
  },
  {
    id: 'assign',
    title: 'Calendar & scheduling',
    blurb: 'Place lessons on dates and half-terms',
    accent: '#0EA5E9',
    tint: '#E0F2FE',
    keywords: ['calendar', 'schedule', 'assign', 'date'],
    related: ['planner', 'halfterms'],
    openTab: 'unit-viewer',
    sections: [
      {
        id: 'calendar',
        title: 'Use the planner calendar',
        steps: [
          { title: 'Open Planner', body: 'Sidebar → Planner shows the week view and timetable tools.' },
          { title: 'Add a lesson', body: 'Use Add lesson / Add one-off on a day column, or open Timetable builder.' },
          { title: 'Link schemes', body: 'Lessons assigned on the Half-terms year board feed into weekly planning.' },
        ],
        image: 'planner-week.png',
        imageAlt: 'Week planner with lesson cards',
      },
    ],
  },
  {
    id: 'halfterms',
    title: 'Half-terms',
    blurb: 'Year board and add-scheme picker',
    accent: '#0D9488',
    tint: '#E6F7F4',
    keywords: ['half-term', 'year board', 'scheme', 'add scheme', 'key stage'],
    related: ['planner', 'lesson', 'settings'],
    openTab: 'curriculum',
    sections: [
      {
        id: 'year-board',
        title: 'The year board',
        intro:
          'Half-terms shows Autumn–Summer columns for each class so you can see the year’s schemes at a glance.',
        steps: [
          { title: 'Open Half-terms', body: 'Use the sidebar Half-terms item.' },
          { title: 'Scan the board', body: 'Each cell is a half-term for a class — empty cells invite you to add a scheme.' },
          { title: 'Add a scheme', body: 'Open Add scheme — key stages are laid out in a two-column grid with subject groups; class names are not truncated.' },
        ],
        image: 'halfterms-board.png',
        imageAlt: 'Half-terms year board',
        tips: ['Collapse key-stage groups you are not using to keep the picker compact.'],
      },
    ],
  },
  {
    id: 'planner',
    title: 'Planner',
    blurb: 'Weekly outline slots and timetable',
    accent: '#D97706',
    tint: '#FFF4E5',
    keywords: ['planner', 'week', 'timetable', 'outline', 'slots', 'all classes'],
    related: ['halfterms', 'assign', 'lesson'],
    openTab: 'unit-viewer',
    sections: [
      {
        id: 'week',
        title: 'Week planner',
        intro: 'Plan the teaching week with outline slots per day, or switch to Timetable builder.',
        steps: [
          { title: 'All classes or one', body: 'Toggle All classes / One class in the planner header.' },
          { title: 'Fill slots', body: 'Add lessons into day columns — times and rooms appear on each card.' },
          { title: 'Timetable builder', body: 'Switch to Timetable builder for repeating weekly patterns.' },
        ],
        image: 'planner-week.png',
        imageAlt: 'Planner week view',
        tips: ['Class context in the header still applies when you jump to Library or Builder.'],
      },
    ],
  },
  {
    id: 'slides',
    title: 'Slides',
    blurb: 'Interactive classroom presentations',
    accent: '#7C3AED',
    tint: '#F1E9FF',
    keywords: ['slides', 'interactive', 'presentation', 'viewer', 'editor'],
    related: ['lesson', 'activity'],
    openTab: 'lesson-viewer',
    sections: [
      {
        id: 'present',
        title: 'Present and edit slides',
        steps: [
          { title: 'Open Slides', body: 'Sidebar → Slides opens the Interactive Lesson hub.' },
          { title: 'Present', body: 'Choose a lesson deck and present full-screen to the class.' },
          { title: 'Edit', body: 'Editors can build or adjust slides in the Interactive Lesson Editor.' },
        ],
        image: 'slides.png',
        imageAlt: 'Slides / interactive lesson hub',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    blurb: 'Classes, folders, preferences and school tools',
    accent: '#2A2299',
    tint: '#E9E6FF',
    keywords: ['settings', 'my classes', 'folders', 'objectives', 'preferences', 'school tools'],
    related: ['users', 'activity', 'account'],
    openTab: 'settings',
    sections: [
      {
        id: 'overview',
        title: 'Full-page Settings',
        intro:
          'Settings is a full page (not a modal). Open it from the header gear or More tools. Left nav covers My classes, Activity folders, Learning objectives, Preferences, Downloads, Users (admins) and School tools.',
        steps: [
          { title: 'My classes', body: 'Add and group classes by key stage. Accents and natural year order match the header class picker.' },
          { title: 'Activity folders', body: 'Control which folders each class sees in the Activity Library.' },
          { title: 'Learning objectives', body: 'Manage objectives; groups start collapsed and expand as you need them.' },
          { title: 'Preferences', body: 'School name, button tips and resource tile density.' },
        ],
        image: 'settings-classes.png',
        imageAlt: 'Settings — My classes',
        tips: ['School tools (hubs, branding, data) stay under one section for admins.'],
      },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    blurb: 'Invite, roles, org admins and passwords',
    accent: '#DB2777',
    tint: '#FCE7F3',
    keywords: ['users', 'invite', 'admin', 'organisation', 'hub', 'chelmsford', 'super admin', 'password'],
    related: ['settings', 'account'],
    openTab: 'settings-users',
    sections: [
      {
        id: 'manage',
        title: 'Manage people',
        intro:
          'Admins open Settings → Users to invite people, set roles, assign classes, reset passwords and suspend access.',
        steps: [
          { title: 'Who can manage', body: 'Super admins see everyone. Organisation / hub admins (for example Chelmsford Music Hub) only manage people in their own organisation.' },
          { title: 'Invite', body: 'Use Invite user or Import CSV. Invitees set a password via the email link (/reset-password).' },
          { title: 'Roles & classes', body: 'Assign role and allowed classes so the right library and tools appear.' },
        ],
        image: 'settings-users.png',
        imageAlt: 'Settings — Users list',
        tips: [
          'Live users load from Supabase when the API has a service role key; otherwise a sample roster is shown for demos.',
        ],
      },
    ],
  },
  {
    id: 'print',
    title: 'Print & export',
    blurb: 'Print plans and export files',
    accent: '#64748B',
    tint: '#F1F5F9',
    keywords: ['print', 'export', 'pdf', 'download'],
    related: ['lesson', 'share'],
    sections: [
      {
        id: 'print',
        title: 'Print and export',
        steps: [
          { title: 'Open a lesson or plan', body: 'From Lessons or Planner, open the item you need.' },
          { title: 'Print / export', body: 'Use print or export actions where available to get a classroom-ready copy.' },
        ],
      },
    ],
  },
  {
    id: 'share',
    title: 'Share & multi-class',
    blurb: 'Share plans across classes',
    accent: '#8B5CF6',
    tint: '#F5F3FF',
    keywords: ['share', 'multi-class', 'copy'],
    related: ['lesson', 'settings'],
    sections: [
      {
        id: 'share',
        title: 'Share across classes',
        steps: [
          { title: 'Save the plan', body: 'Keep a clear master lesson or scheme.' },
          { title: 'Apply to other classes', body: 'Use class context and copy/share tools where offered, or assign the same scheme on the Half-terms board.' },
        ],
      },
    ],
  },
  {
    id: 'facts',
    title: 'The Facts',
    blurb: 'Evidence briefing PDF',
    accent: '#059669',
    tint: '#ECFDF5',
    keywords: ['facts', 'evidence', 'briefing', 'pdf', 'research'],
    related: ['partners', 'forum'],
    sections: [
      {
        id: 'facts',
        title: 'Open The Facts',
        intro: 'The Facts is the evidence briefing for Creative Curriculum Designer.',
        steps: [
          { title: 'Find The Facts', body: 'Open it from Partner / resources areas or the briefing link in the product.' },
          { title: 'Read or download', body: 'Use the PDF for governors, SLT or funding conversations.' },
        ],
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & passwords',
    blurb: 'Sign-in, set password, change password, forgot password',
    accent: '#6B7280',
    tint: '#F3F4F6',
    keywords: ['account', 'password', 'forgot', 'sign in', 'sign out', 'reset'],
    related: ['users', 'settings'],
    sections: [
      {
        id: 'passwords',
        title: 'Passwords',
        steps: [
          { title: 'First login after invite', body: 'Open the invite link and choose a password on /reset-password, or complete Choose a new password if prompted after sign-in.' },
          { title: 'Change password', body: 'Open the account menu (your name in the header) → Change password.' },
          { title: 'Forgot password', body: 'On the login screen, use Forgot password to receive a reset email.' },
        ],
        image: 'account-menu.png',
        imageAlt: 'Account menu with Change password',
        tips: ['The header always shows the signed-in person’s name, email and role — never a demo identity over a real session.'],
      },
    ],
  },
  {
    id: 'forum',
    title: 'Forum',
    blurb: 'Community topics and replies',
    accent: '#0D9488',
    tint: '#E6F7F4',
    keywords: ['forum', 'community', 'discussion'],
    related: ['partners', 'account'],
    sections: [
      {
        id: 'forum',
        title: 'Community Forum',
        steps: [
          { title: 'Open Forum', body: 'Use the forum icon in the header (or /forum).' },
          { title: 'Browse and reply', body: 'Read topics, start threads and share classroom practice.' },
        ],
      },
    ],
  },
  {
    id: 'partners',
    title: 'Partner Hubs',
    blurb: 'Hub pages, music hubs and partner resources',
    accent: '#DC2626',
    tint: '#FEECEC',
    keywords: ['partner', 'hub', 'music hub', 'chelmsford', 'resources'],
    related: ['users', 'activity', 'halfterms'],
    openTab: 'our-partners',
    sections: [
      {
        id: 'hubs',
        title: 'Browse Partner Hubs',
        intro: 'Partner Hubs collect resources from arts organisations and music hubs.',
        steps: [
          { title: 'Open Partner Hubs', body: 'Sidebar → Partner Hubs.' },
          { title: 'Pick a partner', body: 'Open a hub page (for example OmniMusic, RSC, Jazz North) and add packs into your library.' },
          { title: 'Music hubs', body: 'Music hub directory pages (for example Chelmsford) can be managed by hub administrators for their organisation’s logins via Settings → Users.' },
        ],
        image: 'partner-hubs.png',
        imageAlt: 'Partner Hubs browse',
      },
    ],
  },
];

const TOPIC_IDS = new Set(HELP_TOPICS.map((t) => t.id));

export function isHelpTopicId(value: string): value is HelpTopicId {
  return TOPIC_IDS.has(value as HelpTopicId);
}

export function getHelpTopic(id: HelpTopicId): HelpTopic | undefined {
  return HELP_TOPICS.find((t) => t.id === id);
}

export interface HelpSearchHit {
  topicId: HelpTopicId;
  topicTitle: string;
  sectionId: string;
  sectionTitle: string;
  snippet: string;
  accent: string;
}

function flattenSearchable(topic: HelpTopic): { sectionId: string; sectionTitle: string; text: string }[] {
  return topic.sections.map((s) => {
    const parts = [
      topic.title,
      topic.blurb,
      ...topic.keywords,
      s.title,
      s.intro || '',
      ...(s.steps || []).flatMap((st) => [st.title, st.body]),
      ...(s.tips || []),
    ];
    return { sectionId: s.id, sectionTitle: s.title, text: parts.join(' ').toLowerCase() };
  });
}

export function searchHelp(query: string): HelpSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: HelpSearchHit[] = [];
  for (const topic of HELP_TOPICS) {
    for (const block of flattenSearchable(topic)) {
      if (!terms.every((t) => block.text.includes(t))) continue;
      const section = topic.sections.find((s) => s.id === block.sectionId);
      const snippet =
        section?.intro ||
        section?.steps?.[0]?.body ||
        topic.blurb;
      hits.push({
        topicId: topic.id,
        topicTitle: topic.title,
        sectionId: block.sectionId,
        sectionTitle: block.sectionTitle,
        snippet,
        accent: topic.accent,
      });
    }
  }
  return hits;
}
