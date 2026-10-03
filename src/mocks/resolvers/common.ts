/** 공통 — clock · me (설계서 4 · 5장) */
import type { MockContext, Resolvers } from '../types';
import { meView } from '../views';

export const commonResolvers: Resolvers = {
  Query: {
    clock: (_: unknown, __: unknown, ctx: MockContext) => ({
      now: ctx.clock.now,
      currentWeekStart: ctx.clock.currentWeekStart,
      currentWeekEnd: ctx.clock.currentWeekEnd,
    }),
    // 토큰 없음 → null (스키마 가드가 처리), 잘못된 토큰 → UNAUTHENTICATED (가드), 대기 · 거절 회원도 조회 가능
    me: (_: unknown, __: unknown, ctx: MockContext) => (ctx.viewer ? meView(ctx, ctx.viewer) : null),
  },
};
