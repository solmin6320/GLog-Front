/**
 * 인증 (AU-01 ~ AU-03). 로그인 코드 형식: `mock-<PersonaKey>` (계약서 5장).
 * 같은 코드 재사용도 허용(새로고침 · StrictMode) — 잘못된 코드만 LOGIN_CODE_INVALID.
 */
import type { MutationExchangeLoginCodeArgs } from '../__generated__/schema-types';
import { kstIsoFromMs } from '../clock';
import { isPersonaKey, MOCK_PERSONAS, mockTokenFor } from '../control';
import { findMember } from '../db/store';
import { gqlError } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { meView } from '../views';

const TOKEN_TTL_MS = 24 * 3_600_000;

export const authResolvers: Resolvers = {
  Mutation: {
    exchangeLoginCode: (_: unknown, { code }: MutationExchangeLoginCodeArgs, ctx: MockContext) => {
      const key = /^mock-(.+)$/.exec(code.trim())?.[1];
      if (!isPersonaKey(key)) throw gqlError('LOGIN_CODE_INVALID', { message: 'mock: unknown login code' });
      const memberId = MOCK_PERSONAS.find((p) => p.key === key)?.memberId;
      const member = findMember(memberId);
      if (!member) throw gqlError('LOGIN_CODE_INVALID');
      const asViewer: MockContext = { ...ctx, auth: 'valid', viewer: member };
      return {
        status: member.status,
        // B-01 제안: 대기 · 거절 회원에게도 본인 상태 조회 전용 제한 토큰을 준다 (목 토큰은 같은 모양)
        accessToken: mockTokenFor(key),
        expiresAt: kstIsoFromMs(ctx.clock.nowMs + TOKEN_TTL_MS),
        me: member.status === 'REJECTED' ? null : meView(asViewer, member),
      };
    },
    // 무상태 토큰이라 서버 처리는 없다. 토큰 없이 불러도 true (signOut이 실패하지 않게)
    logout: () => true,
  },
};
