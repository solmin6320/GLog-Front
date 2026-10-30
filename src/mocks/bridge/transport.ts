/**
 * bridge 모드 전송 계층. 서비스 워커 없이 Apollo의 fetch 자리에 꽂는다.
 * - 브리지에 등록된 연산(BRIDGED) → 백엔드 (operations.ts가 화면 계약 ↔ 백엔드 스키마를 바꾼다)
 * - 그 밖 연산 → NOT_AVAILABLE. 브라우저 안 가짜 DB는 F18에서 지웠다
 */
import { isBridged, runBridged } from './operations';

type GqlBody = { query: string; variables?: Record<string, unknown> | null; operationName?: string | null };

const notAvailable = {
  data: null,
  errors: [{ message: 'not connected to the server yet', extensions: { code: 'NOT_AVAILABLE', classification: 'INTERNAL_ERROR' } }],
};

export const bridgeFetch: typeof fetch = async (_input, init) => {
  const body = JSON.parse(String(init?.body ?? '{}')) as GqlBody;
  const authorization = new Headers(init?.headers).get('authorization');
  // 서버에 아직 연결되지 않은 연산(조회 · 저장 모두)은 보내지 않고 막는다 — 저장된 척하고 사라지는 일을 없앤다
  const result = isBridged(body.operationName) ? await runBridged(body.operationName, body.variables ?? {}, authorization) : notAvailable;
  return new Response(JSON.stringify(result), { status: 200, headers: { 'content-type': 'application/json' } });
};
