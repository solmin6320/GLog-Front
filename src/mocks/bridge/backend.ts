/** 브리지: 백엔드 GraphQL을 부르는 얇은 클라이언트 */

/** 같은 출처의 /__backend → 백엔드 (vite.config.ts 프록시). 브라우저 CORS를 거치지 않는다 */
const BACKEND_URL = '/__backend/graphql';

export type GqlError = { message: string; path?: unknown; extensions?: { code?: string; classification?: string } };
export type GqlResult<T> = { data: T | null; errors?: GqlError[] };

/** 백엔드에 닿지 못함(연결 끊김 · 서버 꺼짐). fetch 실패와 같은 TypeError 계열이라 화면은 네트워크 오류로 본다 */
export class BackendUnreachable extends TypeError {}

export async function callBackend<T>(query: string, variables: Record<string, unknown>, authorization: string | null): Promise<GqlResult<T>> {
  let res: Response;
  try {
    res = await fetch(new URL(BACKEND_URL, location.origin).href, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    throw new BackendUnreachable(e instanceof Error ? e.message : 'backend unreachable');
  }
  return (await res.json()) as GqlResult<T>;
}

/** 오류가 있으면 던진다. 핸들러가 잡아 { data: null, errors }로 돌려준다 */
export class BridgeError extends Error {
  readonly errors: GqlError[];
  constructor(errors: GqlError[]) {
    super(errors[0]?.message ?? 'bridge error');
    this.errors = errors;
  }
}

export async function ask<T>(query: string, variables: Record<string, unknown>, authorization: string | null): Promise<T> {
  const r = await callBackend<T>(query, variables, authorization);
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? [{ message: 'empty response', extensions: { code: 'INTERNAL' } }]);
  return r.data;
}
