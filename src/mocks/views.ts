/**
 * 행(row) → GraphQL 모양 객체. 조회자(ctx.viewer)에 따라 마스킹 · viewerCan* 를 계산한다.
 *
 * - 값이 비싸거나 인자를 받는 필드는 함수로 둔다: graphql-js 기본 리졸버가 `field(args, ctx, info)`로 부른다.
 *   (그래서 리졸버는 `postView(ctx, row)`만 돌려주면 하위 필드는 알아서 풀린다)
 * - 뮤테이션 리졸버도 결과를 이 빌더로 만들어 돌려준다.
 */
import { addDays, kstDateOf } from '@/shared/lib/kst';
import type {
  ContentKind,
  MemberJudgmentHistoryArgs,
  PostCommentsArgs,
  PostType,
} from './__generated__/schema-types';
import { grassUpdatedAt } from './clock';
import {
  adminTeamLabel,
  allVisibleComments,
  byNewest,
  currentWeekDays,
  exemptionPeriodOn,
  grassCalendarData,
  grassStatusOf,
  isRecord,
  isRetroactiveWeek,
  judgmentHasActiveWarning,
  liveWeek,
  publicTeamOf,
  replayWarnings,
  teamLabel,
  teamWarningCount,
  teamWeekSummary,
  visibleComments,
  visibleJudgments,
  visiblePosts,
  warningState,
  weekActivity,
  writtenDateOf,
  type RecalcPreviewData,
  type WarningStateData,
} from './db/derive';
import { sectionKeysOf } from './db/seed';
import {
  db,
  findMember,
  findPost,
  findTeam,
  isTeamLeader,
  membershipOf,
  membershipsOfTeam,
  teamsOfMember,
  type CommentRow,
  type ExemptionPeriodRow,
  type Id,
  type InvitationRow,
  type JudgmentRow,
  type MemberRow,
  type NoticeRow,
  type PersonalExemptionRow,
  type PostRow,
  type PostSectionKey,
  type TeamRow,
  type WarningRow,
} from './db/store';
import { gqlError, invalid } from './errors';
import type { MockContext } from './types';

/* ================================================================== */
/* 페이지                                                                */
/* ================================================================== */

export type PageArgs = { first?: number | null; after?: string | null };

const encodeCursor = (n: number) => btoa(`cursor:${n}`);
function decodeCursor(c: string): number | null {
  try {
    const m = /^cursor:(\d+)$/.exec(atob(c));
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

/** 커서 Connection. first 0~100, after = 앞 페이지 endCursor. 잘못된 값은 VALIDATION_FAILED */
export function paginate<T, N>(items: T[], args: PageArgs, map: (item: T) => N, defaultFirst = 20) {
  const first = args.first ?? defaultFirst;
  if (!Number.isInteger(first) || first < 0 || first > 100) throw invalid('first');
  let start = 0;
  if (args.after) {
    const n = decodeCursor(args.after);
    if (n === null) throw invalid('after');
    start = n + 1;
  }
  const slice = items.slice(start, start + first);
  return {
    nodes: slice.map(map),
    pageInfo: {
      hasNextPage: start + slice.length < items.length,
      endCursor: slice.length > 0 ? encodeCursor(start + slice.length - 1) : (args.after ?? null),
    },
    totalCount: items.length,
  };
}

/** 백엔드 `{ items, nextCursor }` 목록 (Q-06, 20개) */
export function itemsPage<T, N>(items: T[], after: string | null | undefined, map: (item: T) => N, size = 20) {
  let start = 0;
  if (after) {
    const n = decodeCursor(after);
    if (n === null) throw invalid('after');
    start = n + 1;
  }
  const slice = items.slice(start, start + size);
  const more = start + slice.length < items.length;
  return { items: slice.map(map), nextCursor: more ? encodeCursor(start + slice.length - 1) : null };
}

/* ================================================================== */
/* 권한                                                                  */
/* ================================================================== */

export const viewerId = (ctx: MockContext): Id | null => ctx.viewer?.id ?? null;

/** 로그인한 조회자 (가드를 통과한 루트 필드 안에서는 항상 있다) */
export function requireViewer(ctx: MockContext): MemberRow {
  if (!ctx.viewer) throw gqlError('UNAUTHENTICATED');
  return ctx.viewer;
}
export const isAdmin = (ctx: MockContext) => ctx.viewer?.role === 'ADMIN';

/** 그 팀 소속이 아니면 FORBIDDEN (E-09, 관리자도 예외 없음) */
export function requireTeamMember(ctx: MockContext, teamId: Id): void {
  const v = viewerId(ctx);
  if (!v || !membershipOf(teamId, v)) throw gqlError('FORBIDDEN', { message: 'mock: not a team member' });
}

/** 팀 조회 · 관리(백엔드 2026-10-19 결정): 그 팀 소속이거나 시스템 관리자. 아니면 FORBIDDEN */
export function requireTeamViewer(ctx: MockContext, teamId: Id): void {
  if (isAdmin(ctx)) return;
  requireTeamMember(ctx, teamId);
}

/** 팀장 전용 조작: 그 팀 팀장이거나 시스템 관리자 */
export function requireTeamManager(ctx: MockContext, teamId: Id): void {
  if (isAdmin(ctx)) return;
  requireTeamLeader(ctx, teamId);
}

/** 그 팀 팀장이 아니면 FORBIDDEN */
export function requireTeamLeader(ctx: MockContext, teamId: Id): void {
  if (!isTeamLeader(teamId, viewerId(ctx))) throw gqlError('FORBIDDEN', { message: 'mock: not the team leader' });
}

/** 글 수정 권한: 작성자 또는 연결 팀의 팀장 */
export function canEditPost(ctx: MockContext, p: PostRow): boolean {
  const v = viewerId(ctx);
  return !!v && (p.authorId === v || (!!p.teamId && isTeamLeader(p.teamId, v)));
}

/** 댓글 수정 권한: 작성자 또는 그 글 연결 팀의 팀장 */
export function canEditComment(ctx: MockContext, c: CommentRow): boolean {
  const v = viewerId(ctx);
  if (!v) return false;
  if (c.authorId === v) return true;
  const p = findPost(c.postId);
  return !!p?.teamId && isTeamLeader(p.teamId, v);
}

/* ================================================================== */
/* 회원 · 본인                                                           */
/* ================================================================== */

function memberRow(m: MemberRow | Id): MemberRow {
  const row = typeof m === 'string' ? findMember(m) : m;
  if (!row) throw gqlError('INTERNAL', { message: `mock: member ${String(m)} missing` });
  return row;
}

export function memberView(ctx: MockContext, m: MemberRow | Id) {
  const row = memberRow(m);
  const { clock } = ctx;
  return {
    __typename: 'Member' as const,
    id: row.id,
    nickname: row.nickname,
    githubLogin: row.githubLogin,
    profileImageUrl: row.profileImageUrl,
    postCount: () => visiblePosts(clock).filter((p) => p.authorId === row.id).length,
    commentCount: () => allVisibleComments(clock).filter((c) => c.authorId === row.id).length,
    grassCalendar: () => grassCalendarData(row.id, viewerId(ctx), clock),
    warningState: () => warningStateView(warningState(row.id, clock)),
    currentWeek: () => (teamsOfMember(row.id).length > 0 ? weekActivityView(ctx, row.id, clock.currentWeekStart) : null),
    judgmentHistory: (args: MemberJudgmentHistoryArgs) =>
      paginate(
        visibleJudgments(clock, row.id).reverse(),
        args,
        (j) => judgmentView(ctx, j),
        8,
      ),
    publicTeams: () => teamsOfMember(row.id).filter((t) => t.isPublic).map((t) => teamView(ctx, t)),
  };
}

export function meView(_ctx: MockContext, m: MemberRow) {
  return {
    id: m.id,
    githubLogin: m.githubLogin,
    nickname: m.nickname,
    profileImageUrl: m.profileImageUrl,
    status: m.status,
    role: m.role,
  };
}

/** 받은 대기 초대 (삭제된 팀 제외), 최신순 */
export function pendingInvitationsFor(memberId: Id): InvitationRow[] {
  return db.invitations
    .filter((i) => i.inviteeId === memberId && i.status === 'PENDING' && !!findTeam(i.teamId) && !findTeam(i.teamId)?.deletedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ================================================================== */
/* 주간 활동 · 판정 · 경고                                                */
/* ================================================================== */

export function judgmentView(ctx: MockContext, j: JudgmentRow) {
  return {
    id: j.id,
    weekStart: j.weekStart,
    weekEnd: addDays(j.weekStart, 6),
    status: j.status,
    skipReason: j.skipReason,
    holdReason: j.holdReason,
    verifiedDays: j.verifiedDays,
    recordCount: j.recordCount,
    corrected: j.corrected,
    judgedAt: j.judgedAt,
    hasActiveWarning: () => judgmentHasActiveWarning(j, ctx.clock),
  };
}

export function weekActivityView(ctx: MockContext, memberId: Id, weekStart: string) {
  const data = weekActivity(memberId, weekStart, viewerId(ctx), ctx.clock);
  return { ...data, judgment: data.judgment ? judgmentView(ctx, data.judgment) : null };
}

export function warningStateView(s: WarningStateData) {
  return {
    activeCount: s.activeCount,
    isPenaltyTarget: s.isPenaltyTarget,
    consecutivePasses: s.consecutivePasses,
    weeksUntilDeduction: s.weeksUntilDeduction,
    byCategory: s.byCategory.map((c) => ({ label: teamLabel(c.teamId), count: c.count })),
  };
}

export function warningRecordView(w: WarningRow, standing: string) {
  return {
    id: w.id,
    weekStart: w.weekStart,
    weekEnd: addDays(w.weekStart, 6),
    verifiedDays: w.verifiedDays,
    recordCount: w.recordCount,
    categories: w.teamIds.map(teamLabel),
    standing,
  };
}

/* ================================================================== */
/* 팀                                                                    */
/* ================================================================== */

export function teamPersonView(_ctx: MockContext, id: Id) {
  const m = memberRow(id);
  return { id: m.id, nickname: m.nickname, githubLogin: m.githubLogin, profileImageUrl: m.profileImageUrl };
}

/** 백엔드 Team. isLeader · joinedAt은 조회자 기준 (비소속 관리자는 false · null) */
export function teamView(ctx: MockContext, t: TeamRow) {
  const v = viewerId(ctx);
  const { clock } = ctx;
  const mine = v ? membershipOf(t.id, v) : undefined;
  return {
    __typename: 'Team' as const,
    id: t.id,
    name: t.name,
    description: t.description,
    isPublic: t.isPublic,
    leader: () => teamPersonView(ctx, t.leaderId),
    isLeader: !!v && t.leaderId === v,
    memberCount: () => membershipsOfTeam(t.id).length,
    joinedAt: mine?.joinedAt ?? null,
    createdAt: t.createdAt,
    weekSummary: () => {
      requireTeamViewer(ctx, t.id);
      return { weekStart: clock.currentWeekStart, ...teamWeekSummary(t.id, clock) };
    },
  };
}

/** 팀원 목록 한 줄: 팀장이 맨 앞, 나머지는 참가 순 */
export function teamMembersOrdered(t: TeamRow) {
  const rows = membershipsOfTeam(t.id);
  return [...rows.filter((m) => m.memberId === t.leaderId), ...rows.filter((m) => m.memberId !== t.leaderId)];
}

export function teamMemberView(ctx: MockContext, t: TeamRow, m: { memberId: Id; joinedAt: string }) {
  return { ...teamPersonView(ctx, m.memberId), isLeader: m.memberId === t.leaderId, joinedAt: m.joinedAt };
}

/** 진행 중 주 상태(LiveWeekStatus) → 백엔드 TeamBoardStatus. 면제도 판정 제외로 본다 */
const BOARD_STATUS = { CONDITION_MET: 'PASS', NOT_YET: 'NOT_YET', EXCLUDED: 'EXCLUDED', EXEMPT: 'EXCLUDED' } as const;

export function teamBoardView(ctx: MockContext, t: TeamRow) {
  const { clock } = ctx;
  const v = viewerId(ctx);
  const rows = teamMembersOrdered(t).map((m) => ({ m, grassStatus: grassStatusOf(m.memberId, v) }));
  return {
    weekStart: clock.currentWeekStart,
    weekEnd: clock.currentWeekEnd,
    grassFetchedAt: grassUpdatedAt(clock),
    grassNotLoaded: rows.some((r) => r.grassStatus !== 'OK'),
    members: rows.map(({ m, grassStatus }) => {
      const live = liveWeek(m.memberId, v, clock);
      const known = grassStatus === 'OK';
      const member = memberRow(m.memberId);
      return {
        memberId: m.memberId,
        nickname: member.nickname,
        githubLogin: member.githubLogin,
        isMe: m.memberId === v,
        days: currentWeekDays(m.memberId, v, clock).map((d) => ({
          date: d.date,
          hasGrass: d.isFuture || !known ? null : d.hasGrass,
          hasRecord: d.hasRecord,
          verified: d.isFuture ? false : d.verified || (known ? false : null),
        })),
        verifiedDays: known ? live.verifiedDays : null,
        recordCount: live.recordCount,
        warningCount: teamWarningCount(m.memberId, t.id, clock),
        status: BOARD_STATUS[live.status],
      };
    }),
    recentPosts: visiblePosts(clock)
      .filter((p) => p.teamId === t.id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        author: teamPersonView(ctx, p.authorId),
        createdAt: p.createdAt,
        isRecord: isRecord(p),
      })),
  };
}

export function receivedInvitationView(ctx: MockContext, i: InvitationRow) {
  const team = findTeam(i.teamId);
  if (!team) throw gqlError('INTERNAL', { message: 'mock: invitation team missing' });
  return {
    id: i.id,
    teamId: team.id,
    teamName: team.name,
    // [DB 공백] 초대한 사람 = 지금 팀장
    inviter: () => teamPersonView(ctx, team.leaderId),
    createdAt: i.createdAt,
  };
}

export function sentInvitationView(ctx: MockContext, i: InvitationRow) {
  return { id: i.id, invitee: teamPersonView(ctx, i.inviteeId), createdAt: i.createdAt };
}

/** 백엔드 PersonalExemption (TM-08). 팀 이름은 싣지 않는다 */
export function teamPersonalExemptionView(_ctx: MockContext, e: PersonalExemptionRow) {
  const brief = (id: Id) => {
    const m = memberRow(id);
    return { id: m.id, nickname: m.nickname, githubLogin: m.githubLogin };
  };
  return {
    id: e.id,
    member: brief(e.memberId),
    requester: brief(e.requestedById),
    weekStart: e.weekStart,
    weekEnd: addDays(e.weekStart, 6),
    status: e.status,
    reason: e.reason,
    rejectReason: e.rejectReason,
    respondedAt: e.respondedAt,
    createdAt: e.createdAt,
    overlapsExemptionPeriod: !!exemptionPeriodOn(e.weekStart),
  };
}

/* ================================================================== */
/* 게시판                                                                */
/* ================================================================== */

const nonEmpty = (s: string | null | undefined) => (s && s.trim().length > 0 ? s : null);

/** 백엔드 PostSections: 그 종류의 항목만 값, 나머지는 null */
export function postSectionsView(type: PostType, sections: PostRow['sections']) {
  const keys = sectionKeysOf(type);
  const pick = (key: PostSectionKey) => (keys.includes(key) ? nonEmpty(sections[key]) : null);
  return { problem: pick('problem'), cause: pick('cause'), solution: pick('solution'), did: pick('did'), learned: pick('learned') };
}

export function postView(ctx: MockContext, p: PostRow) {
  return {
    __typename: 'Post' as const,
    id: p.id,
    authorId: p.authorId,
    author: () => memberView(ctx, p.authorId),
    teamId: p.teamId,
    teamName: () => publicTeamOf(p)?.name ?? null,
    type: p.type,
    title: p.title,
    sections: postSectionsView(p.type, p.sections),
    tags: p.tags,
    commitUrls: p.commitUrls,
    isRecord: isRecord(p),
    writtenDate: writtenDateOf(p),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt ?? p.createdAt,
    commentCount: () => visibleComments(p.id, ctx.clock).length,
    comments: ({ after }: PostCommentsArgs) => itemsPage(visibleComments(p.id, ctx.clock), after, (c) => commentView(ctx, c)),
  };
}

export function commentView(ctx: MockContext, c: CommentRow) {
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    content: c.content,
    author: () => memberView(ctx, c.authorId),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt ?? c.createdAt,
  };
}

/** 글 + 댓글 혼합 목록 원천 (AD-01 ②-5 · TM-06 ⑧), 최신순 */
export type ContentItem = { kind: ContentKind; post: PostRow; comment: CommentRow | null; createdAt: string; id: string };

export function contentItems(ctx: MockContext, o: { teamId?: Id; kind?: 'ALL' | 'POST' | 'COMMENT'; search?: string | null } = {}): ContentItem[] {
  const posts = visiblePosts(ctx.clock).filter((p) => !o.teamId || p.teamId === o.teamId);
  const postIds = new Set(posts.map((p) => p.id));
  const items: ContentItem[] = [];
  if (o.kind !== 'COMMENT') for (const p of posts) items.push({ kind: 'POST', post: p, comment: null, createdAt: p.createdAt, id: p.id });
  if (o.kind !== 'POST') {
    for (const c of allVisibleComments(ctx.clock)) {
      if (!postIds.has(c.postId)) continue;
      const post = findPost(c.postId);
      if (post) items.push({ kind: 'COMMENT', post, comment: c, createdAt: c.createdAt, id: c.id });
    }
  }
  const q = o.search?.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => {
        const author = findMember(it.comment?.authorId ?? it.post.authorId);
        const hay = it.comment
          ? [it.comment.content]
          : [it.post.title, ...Object.values(it.post.sections).map((s) => s ?? '')];
        return [...hay, author?.nickname ?? '', author?.githubLogin ?? ''].some((s) => s.toLowerCase().includes(q));
      })
    : items;
  return filtered.sort(byNewest);
}

export function contentRowView(ctx: MockContext, it: ContentItem) {
  const excerpt = (s: string) => (s.length > 40 ? `${s.slice(0, 40)}…` : s);
  return {
    kind: it.kind,
    targetId: it.comment?.id ?? it.post.id,
    postId: it.post.id,
    postType: it.post.type,
    title: it.comment ? excerpt(it.comment.content) : it.post.title,
    author: memberView(ctx, it.comment?.authorId ?? it.post.authorId),
    createdAt: it.createdAt,
  };
}

/* ================================================================== */
/* 공지                                                                  */
/* ================================================================== */

export function noticeView(n: NoticeRow) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    isPinned: n.isPinned,
    isSystem: n.isSystem,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

/* ================================================================== */
/* 면제                                                                  */
/* ================================================================== */

export function exemptionPeriodView(ctx: MockContext, e: ExemptionPeriodRow) {
  return {
    id: e.id,
    weekStart: e.weekStart,
    weekEnd: addDays(e.weekStart, 6),
    reason: e.reason,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    isPast: isRetroactiveWeek(e.weekStart, ctx.clock),
  };
}

export function personalExemptionView(ctx: MockContext, e: PersonalExemptionRow) {
  return {
    id: e.id,
    member: () => memberView(ctx, e.memberId),
    requestedBy: () => memberView(ctx, e.requestedById),
    weekStart: e.weekStart,
    weekEnd: addDays(e.weekStart, 6),
    reason: e.reason,
    status: e.status,
    rejectReason: e.rejectReason,
    createdAt: e.createdAt,
    respondedAt: e.respondedAt,
    overlapsExemptionPeriod: !!exemptionPeriodOn(e.weekStart),
    isRetroactive: isRetroactiveWeek(e.weekStart, ctx.clock),
  };
}

/* ================================================================== */
/* 관리자                                                                */
/* ================================================================== */

export function adminJudgmentRowView(ctx: MockContext, j: JudgmentRow) {
  const r = replayWarnings(j.memberId, ctx.clock);
  return {
    judgment: judgmentView(ctx, j),
    member: memberView(ctx, j.memberId),
    activeWarningCount: r.activeCount,
    isPenaltyTarget: r.isPenaltyTarget,
    canRetry: j.status === 'HOLD' && j.holdReason === 'API_ERROR',
    canCorrect: j.status !== 'HOLD',
  };
}

export function recalcPreviewView(ctx: MockContext, d: RecalcPreviewData) {
  return {
    member: memberView(ctx, d.memberId),
    warningCountBefore: d.warningCountBefore,
    warningCountAfter: d.warningCountAfter,
    penaltyChange: d.penaltyChange,
    affectedWeekCount: d.affectedWeekCount,
    frozenByFulfillment: d.frozenByFulfillment,
    restoresWithoutCategory: d.restoresWithoutCategory,
    basis: d.basis,
  };
}

/** 뮤테이션 결과 RecalcPayload */
export function recalcPayloadView(ctx: MockContext, memberId: Id, judgment?: JudgmentRow | null) {
  return {
    member: memberView(ctx, memberId),
    warningState: warningStateView(warningState(memberId, ctx.clock)),
    judgment: judgment ? judgmentView(ctx, judgment) : null,
  };
}

export function penaltyTargetView(ctx: MockContext, memberId: Id) {
  const r = replayWarnings(memberId, ctx.clock);
  const teamIds = [...new Set(r.active.flatMap((a) => a.teamIds))].sort((a, b) => Number(a) - Number(b));
  return {
    member: memberView(ctx, memberId),
    activeWarningCount: r.activeCount,
    reachedWeekStart: r.reachedWeekStart ?? ctx.clock.currentWeekStart,
    reachedAt: r.reachedAt,
    teams: teamIds.map(adminTeamLabel),
  };
}

export function deletedWarningView(ctx: MockContext, w: WarningRow) {
  return {
    id: w.id,
    member: memberView(ctx, w.memberId),
    weekStart: w.weekStart,
    weekEnd: addDays(w.weekStart, 6),
    deleteReason: w.deleted?.reason ?? 'KICKED',
    deletedAt: w.deleted?.at ?? ctx.clock.now,
    restoreCategories: w.originalTeamIds.map(adminTeamLabel),
  };
}

export function adminMemberRowView(ctx: MockContext, m: MemberRow) {
  return { member: memberView(ctx, m), status: m.status, appliedAt: m.createdAt };
}

/** 'YYYY-MM-DD' 날짜가 now 기준 미래 주인가 */
export const isFutureWeek = (ctx: MockContext, weekStart: string) => weekStart > ctx.clock.currentWeekStart;

/** DateTime → KST 날짜 (리졸버 편의) */
export const dateOf = kstDateOf;
