/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CACHE_ENV?: string;
  readonly VITE_CACHE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
