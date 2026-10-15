/** 내 활동 (CM-01 ②③④ · AC-01 · AC-02) */
import type { QueryMyWeekArgs } from '../__generated__/schema-types';
import { isMondayDate, warningHistory, warningState } from '../db/derive';
import { invalid } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { requireViewer, warningRecordView, warningStateView, weekActivityView } from '../views';

export const activityResolvers: Resolvers = {
  Query: {
    myWeek: (_: unknown, { weekStart }: QueryMyWeekArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const week = weekStart ?? ctx.clock.currentWeekStart;
      if (!isMondayDate(week)) throw invalid('weekStart', 'mock: weekStart must be a Monday');
      if (week > ctx.clock.currentWeekStart) throw invalid('weekStart', 'mock: future week');
      return weekActivityView(ctx, viewer.id, week);
    },
    myWarnings: (_: unknown, __: unknown, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      return {
        state: warningStateView(warningState(viewer.id, ctx.clock)),
        history: warningHistory(viewer.id, ctx.clock).map(({ row, standing }) => warningRecordView(row, standing)),
      };
    },
  },
};
