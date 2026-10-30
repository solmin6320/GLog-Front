/** 공통 — me (설계서 4장, 백엔드 auth.graphqls). 토큰이 없으면 UNAUTHENTICATED, 대기 · 거절 회원도 조회 가능 */
import type { MockContext, Resolvers } from '../types';
import { meView, requireViewer } from '../views';

export const commonResolvers: Resolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: MockContext) => meView(ctx, requireViewer(ctx)),
  },
};
