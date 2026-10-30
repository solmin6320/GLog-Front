/**
 * 인증 (AU-01 ~ AU-03, 백엔드 auth.graphqls). 로그인 코드 형식: `mock-<PersonaKey>` (계약서 5장).
 * 같은 코드 재사용도 허용(새로고침 · StrictMode) — 잘못된 코드만 AUTH_CODE_INVALID.
 * 백엔드처럼 대기 회원에게도 토큰을 주고, 거절 회원은 토큰 없이 ACCOUNT_REJECTED로 끝낸다.
 */
import type { MutationExchangeAuthCodeArgs } from '../__generated__/schema-types';
import { isPersonaKey, MOCK_PERSONAS, mockTokenFor } from '../control';
import { findMember } from '../db/store';
import { gqlError } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { meView } from '../views';

/** 백엔드 기본 JWT 유효 시간 12시간(초) */
const TOKEN_TTL_SECONDS = 12 * 3600;

export const authResolvers: Resolvers = {
  Mutation: {
    exchangeAuthCode: (_: unknown, { code }: MutationExchangeAuthCodeArgs, ctx: MockContext) => {
      const key = /^mock-(.+)$/.exec(code.trim())?.[1];
      if (!isPersonaKey(key)) throw gqlError('AUTH_CODE_INVALID', { message: 'mock: unknown login code' });
      const memberId = MOCK_PERSONAS.find((p) => p.key === key)?.memberId;
      const member = findMember(memberId);
      if (!member) throw gqlError('AUTH_CODE_INVALID');
      if (member.status === 'REJECTED') throw gqlError('ACCOUNT_REJECTED');
      const asViewer: MockContext = { ...ctx, auth: 'valid', viewer: member };
      return { accessToken: mockTokenFor(key), expiresIn: TOKEN_TTL_SECONDS, me: meView(asViewer, member) };
    },
  },
};
