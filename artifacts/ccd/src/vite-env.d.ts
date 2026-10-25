/// <reference types="vite/client" />

/** Plain ESM helpers shared with Node tests (no .d.ts siblings). */
declare module '*.mjs';

interface ImportMetaEnv {
  readonly VITE_JN_DREAMHOST_BASE?: string;
  /** Public Dropbox Chooser app key (OAuth public client id — not a secret). */
  readonly VITE_DROPBOX_APP_KEY?: string;
  /**
   * Google Picker API key — must be HTTP-referrer + API restricted in Google Cloud.
   * Prefer serving picker config from /api/lesson-attachments (server env) when set.
   */
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Box OAuth public client id */
  readonly VITE_BOX_CLIENT_ID?: string;
  /** Microsoft OneDrive / Graph picker public client id */
  readonly VITE_ONEDRIVE_CLIENT_ID?: string;
  readonly VITE_MICROSOFT_CLIENT_ID?: string;
  /** Optional alias for Teams/SharePoint (same Entra app as OneDrive is fine) */
  readonly VITE_TEAMS_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
