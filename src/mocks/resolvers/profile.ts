/** 프로필 (PR-01 · PR-02). 이미지 업로드는 REST(handlers.ts) */
import type { QueryMemberArgs } from '../__generated__/schema-types';
import { findMember, touch } from '../db/store';
import type { MockContext, Resolvers } from '../types';
import { memberView, requireViewer } from '../views';

export const profileResolvers: Resolvers = {
  Query: {
    // 없는 회원 · 승인 안 된 회원 → null(E-53)
    member: (_: unknown, { id }: QueryMemberArgs, ctx: MockContext) => {
      const m = findMember(id);
      return m && m.status === 'ACTIVE' ? memberView(ctx, m) : null;
    },
  },
  Mutation: {
    // PR-02 ③ 기본 이미지로 되돌리기 — 본인 사진만 지운다. 이미 기본 이미지여도 성공(멱등)
    resetProfileImage: (_: unknown, __: unknown, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      viewer.profileImageUrl = null;
      touch();
      return memberView(ctx, viewer);
    },
  },
};
