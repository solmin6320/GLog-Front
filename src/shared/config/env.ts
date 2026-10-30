/**
 * bridge(기본): 화면 연산을 src/mocks/bridge가 백엔드 GraphQL로 바꿔 부른다. 연결되지 않은 연산은 NOT_AVAILABLE.
 * real: 백엔드가 화면 계약을 그대로 줄 때(아직 없음) Apollo가 바로 부른다.
 * 브라우저 안 가짜 DB(목 모드)는 F18에서 지웠다.
 */
export type ApiMode = 'real' | 'bridge';

const mode: ApiMode = import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'bridge';

export const env = {
  apiMode: mode,
  /** real 모드의 백엔드 출처. 비어 있으면 같은 출처. 끝의 / 는 뗀다. */
  apiOrigin: String(import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/+$/, ''),
  /** bridge 모드의 백엔드 출처(브라우저가 직접 이동하는 OAuth 시작 주소용) */
  bridgeOrigin: String(import.meta.env.VITE_BRIDGE_ORIGIN || 'http://localhost:8080').replace(/\/+$/, ''),
} as const;

export const isBridgeMode = env.apiMode === 'bridge';

export const graphqlUrl = `${env.apiOrigin}/graphql`;
export const restUrl = (path: string) => `${env.apiOrigin}${path}`;
