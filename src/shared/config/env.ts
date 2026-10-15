export type ApiMode = 'mock' | 'real';

const mode = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock';
const latency = import.meta.env.VITE_MOCK_LATENCY;

export const env = {
  apiMode: mode as ApiMode,
  /** 백엔드 출처. 비어 있으면 같은 출처(목 모드). 끝의 / 는 뗀다. */
  apiOrigin: String(import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/+$/, ''),
  mockNow: String(import.meta.env.VITE_MOCK_NOW || '2026-10-01T10:00:00+09:00'),
  mockLatency: latency === undefined || latency === '' ? 250 : Number(latency) || 0,
} as const;

export const isMockMode = env.apiMode === 'mock';

export const graphqlUrl = `${env.apiOrigin}/graphql`;
export const restUrl = (path: string) => `${env.apiOrigin}${path}`;
