/** 공지 조회 (NT-01 · NT-02 · CM-01 ⑦). 공지 뮤테이션 4종은 관리자 영역(admin.ts) */
import type { QueryNoticeArgs, QueryNoticesArgs } from '../__generated__/schema-types';
import { visibleNotices } from '../db/derive';
import type { MockContext, Resolvers } from '../types';
import { noticeView, paginate } from '../views';

export const noticesResolvers: Resolvers = {
  Query: {
    // 고정 먼저, 그다음 최신순
    notices: (_: unknown, args: QueryNoticesArgs, ctx: MockContext) => paginate(visibleNotices(ctx.clock), args, noticeView),
    notice: (_: unknown, { id }: QueryNoticeArgs, ctx: MockContext) => {
      const n = visibleNotices(ctx.clock).find((x) => x.id === id);
      return n ? noticeView(n) : null;
    },
    grassRuleNotice: (_: unknown, __: unknown, ctx: MockContext) => {
      const n = visibleNotices(ctx.clock).find((x) => x.isSystem);
      return n ? noticeView(n) : null;
    },
  },
};
