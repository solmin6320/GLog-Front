/** 공지 조회 (NT-01 · NT-02 · CM-01 ⑦, 백엔드 notice.graphqls). 공지 뮤테이션 4종은 관리자 영역(adminManage.ts) */
import type { QueryNoticeArgs, QueryNoticesArgs } from '../__generated__/schema-types';
import { visibleNotices } from '../db/derive';
import { gqlError } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { itemsPage, noticeView } from '../views';

export const noticesResolvers: Resolvers = {
  Query: {
    // 고정 먼저, 그다음 최신순. 커서 20개
    notices: (_: unknown, { after }: QueryNoticesArgs, ctx: MockContext) => itemsPage(visibleNotices(ctx.clock), after, noticeView),
    // 없는 공지 NOT_FOUND
    notice: (_: unknown, { id }: QueryNoticeArgs, ctx: MockContext) => {
      const n = visibleNotices(ctx.clock).find((x) => x.id === id);
      if (!n) throw gqlError('NOT_FOUND');
      return noticeView(n);
    },
  },
};
