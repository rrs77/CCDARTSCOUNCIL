export { SettingsPage } from './SettingsPage';
export type { SettingsAccess } from './SettingsPage';
export { SettingsContent } from './SettingsContent';
export {
  DEFAULT_SETTINGS_SECTION,
  SETTINGS_SECTIONS,
  SCHOOL_TOOLS_PANELS,
  type SettingsSectionId,
  type SchoolToolsPanelId,
} from './settingsSections';
export {
  settingsPath,
  isSettingsPath,
  navigateToSettings,
  resolveSettingsSectionFromLocation,
  syncSettingsUrl,
  clearSettingsUrlIfPresent,
  sectionFromLegacyTab,
} from './routes';
export { useSettingsAccess } from './useSettingsAccess';
