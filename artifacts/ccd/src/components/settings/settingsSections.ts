/**
 * Teacher-facing Settings sections — few, plain names, most-used first.
 */

export type SettingsSectionId =
  | 'classes'
  | 'folders'
  | 'objectives'
  | 'preferences'
  | 'downloads'
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
  requires?: 'always' | 'downloads' | 'school';
}

/** Most-used first. Keep teacher language free of jargon. */
export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: 'classes',
    label: 'My classes',
    title: 'My classes',
    helper: 'Add, rename and group the classes you teach. These appear in the header class picker, timetable and half-term map.',
    keywords: ['class', 'year', 'group', 'stage', 'eyfs', 'ks1', 'ks2', 'add'],
    requires: 'always',
  },
  {
    id: 'folders',
    label: 'Activity folders',
    title: 'Activity folders',
    helper: 'Choose which folders each class can see in the Activity Library.',
    keywords: ['folder', 'category', 'activity', 'library', 'visibility'],
    requires: 'always',
  },
  {
    id: 'objectives',
    label: 'Learning objectives',
    title: 'Learning objectives',
    helper: 'Manage the learning objectives you can attach to lessons and activities.',
    keywords: ['objective', 'curriculum', 'standard', 'target'],
    requires: 'always',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    title: 'Preferences',
    helper: 'Small display choices — hover tips, school name, and activity resource labels.',
    keywords: ['help', 'tooltip', 'resource', 'link', 'school', 'name', 'appearance'],
    requires: 'always',
  },
  {
    id: 'downloads',
    label: 'Downloads',
    title: 'Downloads',
    helper: 'Files you have downloaded, and download stats if your role allows it.',
    keywords: ['download', 'file', 'analytics', 'stats'],
    requires: 'downloads',
  },
  {
    id: 'school',
    label: 'School tools',
    title: 'School tools',
    helper: 'Users, hubs, branding, packs and data — only shown if your account can manage them.',
    keywords: ['admin', 'user', 'hub', 'branding', 'pack', 'backup', 'data', 'system'],
    requires: 'school',
  },
];

export function isSettingsSectionId(value: string): value is SettingsSectionId {
  return SETTINGS_SECTIONS.some((s) => s.id === value);
}

/** Sub-panels inside School tools (role-gated). */
export type SchoolToolsPanelId =
  | 'users'
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
  { id: 'users', label: 'People', helper: 'Invite and manage who can use Studio Score at your school.' },
  { id: 'hub-admin', label: 'Partner hubs', helper: 'Edit hub pages, members and resources you administer.' },
  { id: 'hub-content', label: 'Hub content', helper: 'Approve and manage content shared into hubs.' },
  { id: 'branding', label: 'Login & footer', helper: 'Customise the login screen and footer for your deployment.' },
  { id: 'manage-packs', label: 'Activity packs', helper: 'Create packs and assign them to teachers.' },
  { id: 'system-categories', label: 'System folders', helper: 'Edit the shared folder catalogue for everyone.' },
  { id: 'data', label: 'Backup & data', helper: 'Export, import or clear local teaching data.' },
];
