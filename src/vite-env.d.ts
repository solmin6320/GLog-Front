/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'real' | 'bridge';
  readonly VITE_API_ORIGIN?: string;
  readonly VITE_BRIDGE_ORIGIN?: string;
  readonly VITE_DEV_LOGIN?: string;
  readonly VITE_MOCK_NOW?: string;
  readonly VITE_MOCK_LATENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
