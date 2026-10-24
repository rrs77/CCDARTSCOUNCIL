/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JN_DREAMHOST_BASE?: string;
  /** Public Dropbox Chooser app key */
  readonly VITE_DROPBOX_APP_KEY?: string;
  /** Google Picker / Drive */
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Box OAuth client id */
  readonly VITE_BOX_CLIENT_ID?: string;
  /** Microsoft OneDrive / Graph picker */
  readonly VITE_ONEDRIVE_CLIENT_ID?: string;
  readonly VITE_MICROSOFT_CLIENT_ID?: string;
  /** Optional alias for Teams/SharePoint (same Entra app as OneDrive is fine) */
  readonly VITE_TEAMS_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
