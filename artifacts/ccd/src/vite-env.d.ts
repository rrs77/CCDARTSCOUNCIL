/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JN_DREAMHOST_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
