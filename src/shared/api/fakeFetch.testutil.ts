/**
 * 테스트 전용: createApolloClient({ fetch })에 넣는 가짜 fetch. src/mocks(MSW)에 기대지 않고
 * 연산 이름별로 응답을 정한다. 앱 코드는 import하지 않는다.
 */
import { vi } from 'vitest';

export type FakeRequest = { operationName: string; variables: Record<string, unknown>; headers: Headers };
export type FakeHandler = (req: FakeRequest) => Response | Promise<Response>;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

export function gqlErrorResponse(code: string, extra: Record<string, unknown> = {}, data: unknown = null): Response {
  return jsonResponse({ data, errors: [{ message: `test: ${code}`, extensions: { code, ...extra } }] });
}

export function fakeFetch(handler: FakeHandler) {
  return vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { operationName?: string; variables?: Record<string, unknown> };
    return handler({
      operationName: body.operationName ?? '',
      variables: body.variables ?? {},
      headers: new Headers(init?.headers),
    });
  });
}

export const networkFailure = (): never => {
  throw new TypeError('Failed to fetch');
};
