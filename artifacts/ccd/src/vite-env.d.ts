/// <reference types="vite/client" />

/** Plain ESM helpers shared with Node tests (no .d.ts siblings). */
declare module '*.mjs';

interface ImportMetaEnv {
  readonly VITE_JN_DREAMHOST_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
