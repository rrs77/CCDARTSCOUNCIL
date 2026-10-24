/**
 * Teacher-facing Settings sections — few, plain names, most-used first.
 */

export type SettingsSectionId =
  | 'classes'
  | 'folders'
  | 'objectives'
  | 'curriculum'
  | 'preferences'
  | 'downloads'
  | 'users'
  | 'school';

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = 'classes';

export interface SettingsSectionDef {
  id: SettingsSectionId;
  /** Short label in the left nav */
  label: string;
  /** Page title */
  title: string;
  /** One-line helper under the title */
  helper: string;
  /** Keywords for the left-nav search */
  keywords: string[];
  /** Only show when the callback returns true (role gates) */
  requires?: 'always' | 'downloads' | 'users' | 'school';
}

/** Most-used first. Keep teacher language free of jargon. */
export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: 'classes',
    label: 'My classes',
    title: 'My classes',
    helper: 'Add and group the classes you teach.',
    keywords: ['class', 'year', 'group', 'stage', 'eyfs', 'ks1', 'ks2', 'add'],
    requires: 'always',
  },
  {
    id: 'folders',
    label: 'Activity folders',
    title: 'Activity folders',
    helper: 'Which folders each class can see.',
    keywords: ['folder', 'category', 'activity', 'library', 'visibility'],
    requires: 'always',
  },
  {
    id: 'objectives',
    label: 'Learning objectives',
    title: 'Learning objectives',
    helper: 'Objectives for lessons and activities.',
    keywords: ['objective', 'curriculum', 'standard', 'target'],
    requires: 'always',
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    title: 'Curriculum',
    helper: 'Frameworks, strands and statements for lesson plans — all user-defined.',
    keywords: [
      'curriculum',
      'framework',
      'strand',
      'statement',
      'template',
      'section',
      'planner',
    ],
    requires: 'always',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    title: 'Preferences',
    helper: 'School name, tips and resource labels.',
    keywords: ['help', 'tooltip', 'resource', 'link', 'school', 'name', 'appearance'],
    requires: 'always',
  },
  {
    id: 'downloads',
    label: 'Downloads',
    title: 'Downloads',
    helper: 'Your downloads and stats.',
    keywords: ['download', 'file', 'analytics', 'stats'],
    requires: 'downloads',
  },
  {
    id: 'users',
    label: 'Users',
    title: 'Users',
    helper: 'Invite and manage who can use Studio Score.',
    keywords: [
      'user',
      'people',
      'invite',
      'role',
      'admin',
      'password',
      'access',
      'csv',
      'school',
    ],
    requires: 'users',
  },
  {
    id: 'school',
    label: 'School tools',
    title: 'School tools',
    helper: 'Hubs, branding and data.',
    keywords: ['admin', 'hub', 'branding', 'pack', 'backup', 'data', 'system'],
    requires: 'school',
  },
];

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((s) => s.id === value);
}

/** Sub-panels inside School tools (role-gated). Users is a top-level section. */
export type SchoolToolsPanelId =
  | 'hub-admin'
  | 'hub-content'
  | 'branding'
  | 'manage-packs'
  | 'system-categories'
  | 'data';

export const SCHOOL_TOOLS_PANELS: {
  id: SchoolToolsPanelId;
  label: string;
  helper: string;
}[] = [
  { id: 'hub-admin', label: 'Partner hubs', helper: 'Edit hub pages, members and resources you administer.' },
  { id: 'hub-content', label: 'Hub content', helper: 'Approve and manage content shared into hubs.' },
  { id: 'branding', label: 'Login & footer', helper: 'Customise the login screen and footer for your deployment.' },
  { id: 'manage-packs', label: 'Activity packs', helper: 'Create packs and assign them to teachers.' },
  { id: 'system-categories', label: 'System folders', helper: 'Edit the shared folder catalogue for everyone.' },
  { id: 'data', label: 'Backup & data', helper: 'Export, import or clear local teaching data.' },
];
