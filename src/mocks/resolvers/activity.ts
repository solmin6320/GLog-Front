/** 내 활동 (CM-01 ②③④ · AC-01 · AC-02, 백엔드 judgment · warning · warning-history). 목 계산(derive)을 백엔드 모양으로 낸다 */
import type {
  QueryMyJudgmentHistoryArgs,
  QueryMyWarningHistoryArgs,
  QueryMyWeeklyActivityArgs,
} from '../__generated__/schema-types';
import { isMondayDate, teamLabel, visibleJudgments, warningHistory, warningState, weekActivity } from '../db/derive';
import { teamsOfMember } from '../db/store';
import { invalid } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { itemsPage, requireViewer, viewerId } from '../views';
import { addDays } from '@/shared/lib/kst';

const REQUIRED_VERIFIED_DAYS = 3;
const REQUIRED_RECORD_COUNT = 1;

/** 판정 보류(HOLD)가 남아 있는가 — 백엔드는 이때 경고 계산을 미룬다 */
const holdWeeksOf = (ctx: MockContext, memberId: string) =>
  visibleJudgments(ctx.clock, memberId)
    .filter((j) => j.status === 'HOLD')
    .map((j) => j.weekStart);

function weeklyActivityView(ctx: MockContext, memberId: string, weekStart: string) {
  const w = weekActivity(memberId, weekStart, viewerId(ctx), ctx.clock);
  const live = w.live;
  // 배너 후보: E-39 → E-32 → E-36 → E-46 중 하나 (이번 주만)
  let banner: string | null = null;
  if (w.isCurrentWeek) {
    if (w.privateContributionSuspected) banner = 'CONTRIBUTIONS_HIDDEN';
    else if (w.grassStatus !== 'OK') banner = 'GRASS_NOT_LOADED';
    else if (live?.skipReason === 'FIRST_WEEK') banner = 'FIRST_WEEK';
    else if (live?.status === 'EXEMPT') banner = 'EXEMPTION_WEEK';
  }
  const j = w.judgment;
  return {
    weekStart: w.weekStart,
    weekEnd: w.weekEnd,
    currentWeek: w.isCurrentWeek,
    inTeam: teamsOfMember(memberId).length > 0,
    days: w.days.map((d) => ({
      date: d.date,
      hasGrass: d.isFuture ? null : d.grassCount == null && !d.hasGrass && w.grassStatus !== 'OK' ? null : d.hasGrass,
      grassCount: d.grassCount,
      hasRecord: d.hasRecord,
      recordCount: d.recordCount,
    })),
    verifiedDays: w.verifiedDays,
    recordCount: w.recordCount ?? 0,
    requiredVerifiedDays: REQUIRED_VERIFIED_DAYS,
    requiredRecordCount: REQUIRED_RECORD_COUNT,
    passExpected: w.isCurrentWeek && w.verifiedDays != null ? live?.status === 'CONDITION_MET' : null,
    grassAvailable: w.grassStatus === 'OK',
    grassFetchedAt: w.isCurrentWeek ? w.grassUpdatedAt : null,
    banner,
    judgment: j
      ? {
          status: j.status,
          skipReason: j.skipReason,
          holdReason: j.holdReason,
          verifiedDays: j.verifiedDays,
          recordCount: j.recordCount,
          corrected: j.corrected,
          judgedAt: j.judgedAt,
        }
      : null,
  };
}

export const activityResolvers: Resolvers = {
  Query: {
    myWeeklyActivity: (_: unknown, { weekStart }: QueryMyWeeklyActivityArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const week = weekStart ?? ctx.clock.currentWeekStart;
      if (!isMondayDate(week)) throw invalid('weekStart', 'mock: weekStart must be a Monday');
      if (week > ctx.clock.currentWeekStart) throw invalid('weekStart', 'mock: future week');
      return weeklyActivityView(ctx, viewer.id, week);
    },
    // 최근 주부터
    myJudgmentHistory: (_: unknown, { after }: QueryMyJudgmentHistoryArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const rows = visibleJudgments(ctx.clock, viewer.id).reverse();
      return itemsPage(rows, after, (j) => ({
        weekStart: j.weekStart,
        weekEnd: addDays(j.weekStart, 6),
        status: j.status,
        skipReason: j.skipReason,
        holdReason: j.holdReason,
        verifiedDays: j.verifiedDays,
        recordCount: j.recordCount,
        corrected: j.corrected,
      }));
    },
    myWarningSummary: (_: unknown, __: unknown, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const holdWeeks = holdWeeksOf(ctx, viewer.id);
      if (holdWeeks.length > 0) {
        return { onHold: true, holdWeeks, warningCount: null, streak: null, penaltyTarget: null, penaltyReachedWeek: null };
      }
      const s = warningState(viewer.id, ctx.clock);
      return {
        onHold: false,
        holdWeeks: [],
        warningCount: s.activeCount,
        streak: s.consecutivePasses,
        penaltyTarget: s.isPenaltyTarget,
        penaltyReachedWeek: null,
      };
    },
    myWarningHistory: (_: unknown, { after }: QueryMyWarningHistoryArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      if (holdWeeksOf(ctx, viewer.id).length > 0) return { onHold: true, items: [], nextCursor: null };
      const rows = warningHistory(viewer.id, ctx.clock);
      const page = itemsPage(rows, after, ({ row, standing }) => ({
        weekStart: row.weekStart,
        weekEnd: addDays(row.weekStart, 6),
        verifiedDays: row.verifiedDays,
        recordCount: row.recordCount,
        // 열람자와 무관하게 비공개 · 삭제된 팀은 가린다
        categories: row.teamIds.map((t) => {
          const l = teamLabel(t);
          return l.kind === 'PUBLIC' && l.name ? l.name : l.kind === 'PRIVATE' ? '비공개 팀' : '삭제된 팀';
        }),
        status: standing,
      }));
      return { onHold: false, ...page };
    },
  },
};
