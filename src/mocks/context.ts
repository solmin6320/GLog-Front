/**
 * 요청 컨텍스트 (설계서 8-1). `Authorization: Bearer mock.<memberId>` → viewer.
 * 접근 규칙(인증 · 대기 · 관리자)은 schema.ts의 가드가 루트 필드마다 건다.
 */
import { currentClock } from './clock';
import { findMember } from './db/store';
import type { MockContext } from './types';

export function createContext(authorization: string | null | undefined): MockContext {
  const clock = currentClock();
  if (!authorization || !authorization.trim()) return { auth: 'none', viewer: null, clock };
  const id = /^Bearer\s+mock\.(\d+)$/i.exec(authorization.trim())?.[1];
  const viewer = findMember(id);
  return viewer ? { auth: 'valid', viewer, clock } : { auth: 'invalid', viewer: null, clock };
}
