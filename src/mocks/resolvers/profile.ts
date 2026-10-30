/** 프로필 (PR-01 · PR-02, 백엔드 profile.graphqls). 이미지 업로드는 REST(handlers.ts) */
import { addDays } from '@/shared/lib/kst';
import type { QueryProfileArgs } from '../__generated__/schema-types';
import { grassUpdatedAt } from '../clock';
import { allVisibleComments, grassCalendarData, grassStatusOf, liveWeek, teamLabel, visibleJudgments, visiblePosts, warningState } from '../db/derive';
import { findMember, teamsOfMember, type MemberRow } from '../db/store';
import { gqlError } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { itemsPage, viewerId } from '../views';

const PRIVATE_TEAM = '비공개 팀';
const DELETED_TEAM = '삭제된 팀';

/** 1년치 잔디 (백엔드 GrassCacheService 기본 구간: 1년 전 다음 날 ~ 오늘). 잔디를 못 불러왔으면 null(E-32) */
function profileGrass(ctx: MockContext, m: MemberRow) {
  const { clock } = ctx;
  if (grassStatusOf(m.id, viewerId(ctx)) !== 'OK') return null;
  const from = addDays(clock.today, -364);
  const days = grassCalendarData(m.id, viewerId(ctx), clock)
    .days.filter((d) => d.date >= from && d.date <= clock.today)
    .map((d) => ({ date: d.date, count: d.count }));
  return { from, to: clock.today, fetchedAt: grassUpdatedAt(clock), days };
}

/** 팀별 경고: 공개 팀(이름순) → 비공개 팀 → 삭제된 팀, 비공개 · 삭제는 한 줄로 합친다 */
function teamWarningRows(m: MemberRow, ctx: MockContext) {
  const named = new Map<string, number>();
  let hidden = 0;
  let deleted = 0;
  for (const c of warningState(m.id, ctx.clock).byCategory) {
    const label = teamLabel(c.teamId);
    if (label.kind === 'PUBLIC' && label.name) named.set(label.name, (named.get(label.name) ?? 0) + c.count);
    else if (label.kind === 'PRIVATE') hidden += c.count;
    else deleted += c.count;
  }
  return [
    ...[...named.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count })),
    ...(hidden > 0 ? [{ name: PRIVATE_TEAM, count: hidden }] : []),
    ...(deleted > 0 ? [{ name: DELETED_TEAM, count: deleted }] : []),
  ];
}

/** 판정 이력 행. 팀 없음(NO_TEAM) 제외 주는 숨기고, 보류 주는 진행 중 */
function historyRows(m: MemberRow, ctx: MockContext) {
  return visibleJudgments(ctx.clock, m.id)
    .reverse()
    .filter((j) => !(j.status === 'EXCLUDED' && j.skipReason === 'NO_TEAM'))
    .map((j) => {
      const settled = j.status === 'PASS' || j.status === 'FAIL';
      return {
        weekStart: j.weekStart,
        weekEnd: addDays(j.weekStart, 6),
        result: j.status === 'HOLD' ? 'IN_PROGRESS' : j.status,
        verifiedDays: settled ? j.verifiedDays : null,
        recordCount: settled ? j.recordCount : null,
      };
    });
}

function profileView(ctx: MockContext, m: MemberRow) {
  const { clock } = ctx;
  const onHold = () => visibleJudgments(clock, m.id).some((j) => j.status === 'HOLD');
  return {
    id: m.id,
    nickname: m.nickname,
    githubLogin: m.githubLogin,
    profileImageUrl: m.profileImageUrl,
    isMine: viewerId(ctx) === m.id,
    postCount: () => visiblePosts(clock).filter((p) => p.authorId === m.id).length,
    commentCount: () => allVisibleComments(clock).filter((c) => c.authorId === m.id).length,
    grass: () => profileGrass(ctx, m),
    warning: () => {
      if (onHold()) return { onHold: true, warningCount: null, penaltyTarget: null };
      const w = warningState(m.id, clock);
      return { onHold: false, warningCount: w.activeCount, penaltyTarget: w.isPenaltyTarget };
    },
    teamWarnings: () => (onHold() ? { onHold: true, teams: [] } : { onHold: false, teams: teamWarningRows(m, ctx) }),
    teams: () => teamsOfMember(m.id).filter((t) => t.isPublic).map((t) => ({ id: t.id, name: t.name })),
    // 첫 페이지 맨 위에 이번 주 진행 중 행 (팀 소속일 때만, 20개에 세지 않는다)
    judgmentHistory: ({ after }: { after?: string | null }) => {
      const page = itemsPage(historyRows(m, ctx), after, (r) => r);
      if (after || teamsOfMember(m.id).length === 0) return page;
      const live = liveWeek(m.id, viewerId(ctx), clock);
      const known = grassStatusOf(m.id, viewerId(ctx)) === 'OK';
      const current = {
        weekStart: clock.currentWeekStart,
        weekEnd: clock.currentWeekEnd,
        result: 'IN_PROGRESS',
        verifiedDays: known ? live.verifiedDays : null,
        recordCount: live.recordCount,
      };
      return { ...page, items: [current, ...page.items] };
    },
  };
}

export const profileResolvers: Resolvers = {
  Query: {
    // 백엔드: 없는 회원 · 승인 안 된 회원 → NOT_FOUND
    profile: (_: unknown, { memberId }: QueryProfileArgs, ctx: MockContext) => {
      const m = findMember(memberId);
      if (!m || m.status !== 'ACTIVE') throw gqlError('NOT_FOUND');
      return profileView(ctx, m);
    },
  },
};
