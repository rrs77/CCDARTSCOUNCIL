/**
 * Settings is now a full-page Studio route (`/settings/...`).
 * This shim keeps any leftover imports compiling and opens the page.
 */
export { navigateToSettings as openUserSettings } from './settings';
export { SettingsPage as UserSettings } from './settings';
