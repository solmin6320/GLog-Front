/**
 * Apollo 링크 (설계서 3-1). 링크는 사건만 내보낸다 — 이동 · 토스트는 SessionProvider 몫.
 */
import type { ApolloLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { normalizeError } from './errors';
import { sessionEvents } from './sessionEvents';
import { tokenStore } from './tokenStore';

/** 이 연산들의 UNAUTHENTICATED는 '만료'가 아니다 — 교환은 토큰 없이 부르고, 로그아웃은 실패해도 진행한다 */
const NOT_EXPIRY_OPERATIONS = new Set(['SessionExchangeLoginCode', 'SessionLogout']);
/** 세션 조회 자신은 계정 상태의 출처라 'status-changed'를 내지 않는다 (재조회 → 같은 오류 → 재조회 고리 방지) */
const NOT_STATUS_OPERATIONS = new Set(['SessionQuery', 'SessionExchangeLoginCode', 'SessionLogout']);

export const bearer = (token: string) => `Bearer ${token}`;

export function createAuthLink(): ApolloLink {
  return new SetContextLink((prev) => {
    const token = tokenStore.get();
    if (!token) return {};
    return { headers: { ...(prev.headers as Record<string, string> | undefined), authorization: bearer(token) } };
  });
}

/** 지금 저장된 토큰으로 보낸 요청인가 — 토큰 없이 보낸 요청이나 이전 토큰의 늦은 응답은 만료로 보지 않는다 */
function sentWithCurrentToken(operation: ApolloLink.Operation): boolean {
  const headers = operation.getContext().headers as Record<string, string> | undefined;
  const sent = headers?.authorization ?? headers?.Authorization;
  const current = tokenStore.get();
  return !!sent && !!current && sent === bearer(current);
}

export function createErrorLink(): ApolloLink {
  return new ErrorLink(({ error, operation }) => {
    const e = normalizeError(error);
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      console.warn(`[graphql] ${operation.operationName ?? '(anonymous)'} → ${e.code}`, error);
    }
    if (e.code === 'UNAUTHENTICATED') {
      if (!NOT_EXPIRY_OPERATIONS.has(operation.operationName ?? '') && sentWithCurrentToken(operation)) {
        sessionEvents.emit('expired');
      }
    } else if (e.code === 'ACCOUNT_PENDING' || e.code === 'ACCOUNT_REJECTED' || e.code === 'ACCOUNT_SUSPENDED') {
      if (!NOT_STATUS_OPERATIONS.has(operation.operationName ?? '')) sessionEvents.emit('status-changed');
    }
  });
}
