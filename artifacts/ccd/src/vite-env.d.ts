/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JN_DREAMHOST_BASE?: string;
  readonly VITE_PDF_UPLOAD_URL?: string;
  readonly VITE_PDF_API_KEY?: string;
  readonly VITE_PDFBOLT_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
