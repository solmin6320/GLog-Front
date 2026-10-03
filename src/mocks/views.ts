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
  PostSectionKey,
  PostType,
  TeamManagedContentsArgs,
  TeamRecentPostsArgs,
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
  inFinalizedWeek,
  isPostVisible,
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

/** 그 팀 팀장이 아니면 FORBIDDEN */
export function requireTeamLeader(ctx: MockContext, teamId: Id): void {
  if (!isTeamLeader(teamId, viewerId(ctx))) throw gqlError('FORBIDDEN', { message: 'mock: not the team leader' });
}

/** 글 수정 권한: 작성자 또는 연결 팀의 팀장 */
export function canEditPost(ctx: MockContext, p: PostRow): boolean {
  const v = viewerId(ctx);
  return !!v && (p.authorId === v || (!!p.teamId && isTeamLeader(p.teamId, v)));
}

/** 글 · 댓글 삭제 권한: 작성자 또는 관리자 (팀장은 삭제 불가) */
export function canDelete(ctx: MockContext, authorId: Id): boolean {
  const v = viewerId(ctx);
  return !!v && (authorId === v || isAdmin(ctx));
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

export function meView(ctx: MockContext, m: MemberRow) {
  return {
    id: m.id,
    member: memberView(ctx, m),
    status: m.status,
    role: m.role,
    hasTeam: teamsOfMember(m.id).length > 0,
    pendingInvitationCount: () => pendingInvitationsFor(m.id).length,
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

export function teamView(ctx: MockContext, t: TeamRow) {
  const v = viewerId(ctx);
  const { clock } = ctx;
  return {
    __typename: 'Team' as const,
    id: t.id,
    name: t.name,
    description: t.description,
    isPublic: t.isPublic,
    memberCount: () => membershipsOfTeam(t.id).length,
    viewerRole: v ? (membershipOf(t.id, v)?.role ?? null) : null,
    leader: () => memberView(ctx, t.leaderId),
    // [Q-01] A안: 팀장에게만 재열람 허용
    inviteCode: v && t.leaderId === v ? t.inviteCode : null,
    currentWeekSummary: () => {
      requireTeamMember(ctx, t.id);
      return teamWeekSummary(t.id, clock);
    },
    currentWeekBoard: () => {
      requireTeamMember(ctx, t.id);
      return teamWeekBoardView(ctx, t);
    },
    recentPosts: (args: TeamRecentPostsArgs) => {
      const first = args.first ?? 5;
      if (!Number.isInteger(first) || first < 0 || first > 100) throw invalid('first');
      return visiblePosts(clock)
        .filter((p) => p.teamId === t.id)
        .slice(0, first)
        .map((p) => postView(ctx, p));
    },
    members: () => {
      requireTeamMember(ctx, t.id);
      return membershipsOfTeam(t.id).map((m) => ({ member: memberView(ctx, m.memberId), role: m.role, joinedAt: m.joinedAt }));
    },
    pendingInvitations: () => {
      requireTeamLeader(ctx, t.id);
      return db.invitations
        .filter((i) => i.teamId === t.id && i.status === 'PENDING')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((i) => sentInvitationView(ctx, i));
    },
    managedContents: (args: TeamManagedContentsArgs) => {
      requireTeamLeader(ctx, t.id);
      return paginate(contentItems(ctx, { teamId: t.id }), args, (c) => contentRowView(ctx, c));
    },
    exemptionRequests: () => {
      requireTeamLeader(ctx, t.id);
      // [DB 공백] 이 팀장이 요청했고 대상이 지금 이 팀 소속 (목은 teamId도 본다)
      return db.personalExemptions
        .filter((e) => e.teamId === t.id && e.requestedById === t.leaderId && !!membershipOf(t.id, e.memberId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((e) => personalExemptionView(ctx, e));
    },
  };
}

export function teamWeekBoardView(ctx: MockContext, t: TeamRow) {
  const { clock } = ctx;
  const v = viewerId(ctx);
  return {
    weekStart: clock.currentWeekStart,
    weekEnd: clock.currentWeekEnd,
    grassUpdatedAt: grassUpdatedAt(clock),
    rows: () =>
      membershipsOfTeam(t.id).map((m) => {
        const live = liveWeek(m.memberId, v, clock);
        const grassStatus = grassStatusOf(m.memberId, v);
        const skipped = live.status === 'EXCLUDED' || live.status === 'EXEMPT';
        return {
          member: memberView(ctx, m.memberId),
          isViewer: m.memberId === v,
          days: currentWeekDays(m.memberId, v, clock),
          verifiedDays: grassStatus !== 'OK' || skipped ? null : live.verifiedDays,
          recordCount: live.recordCount,
          teamWarningCount: teamWarningCount(m.memberId, t.id, clock),
          status: live.status,
          grassStatus,
        };
      }),
  };
}

export function receivedInvitationView(ctx: MockContext, i: InvitationRow) {
  const team = findTeam(i.teamId);
  if (!team) throw gqlError('INTERNAL', { message: 'mock: invitation team missing' });
  return {
    id: i.id,
    team: teamView(ctx, team),
    // [DB 공백] 초대한 사람 = 지금 팀장
    invitedBy: () => memberView(ctx, team.leaderId),
    createdAt: i.createdAt,
  };
}

export function sentInvitationView(ctx: MockContext, i: InvitationRow) {
  return { id: i.id, invitee: memberView(ctx, i.inviteeId), createdAt: i.createdAt };
}

/* ================================================================== */
/* 게시판                                                                */
/* ================================================================== */

const nonEmpty = (s: string | null | undefined) => (s && s.trim().length > 0 ? s : null);

export function postSectionsView(type: PostType, sections: PostRow['sections']): { key: PostSectionKey; body: string | null }[] {
  return sectionKeysOf(type).map((key) => ({ key, body: nonEmpty(sections[key]) }));
}

export function postView(ctx: MockContext, p: PostRow) {
  const v = viewerId(ctx);
  const canEdit = canEditPost(ctx, p);
  return {
    __typename: 'Post' as const,
    id: p.id,
    type: p.type,
    title: p.title,
    sections: postSectionsView(p.type, p.sections),
    tags: p.tags,
    commitUrls: p.commitUrls,
    author: () => memberView(ctx, p.authorId),
    publicTeam: () => {
      const t = publicTeamOf(p);
      return t ? teamView(ctx, t) : null;
    },
    isRecord: isRecord(p),
    writtenDate: writtenDateOf(p),
    inFinalizedWeek: () => inFinalizedWeek(p, ctx.clock),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    commentCount: () => visibleComments(p.id, ctx.clock).length,
    comments: (args: PostCommentsArgs) => paginate(visibleComments(p.id, ctx.clock), args, (c) => commentView(ctx, c), 50),
    viewerCanEdit: canEdit,
    viewerCanDelete: canDelete(ctx, p.authorId),
    viewerIsAuthor: !!v && p.authorId === v,
    editTeamId: canEdit ? p.teamId : null,
  };
}

export function deletedPostView(p: PostRow) {
  return { __typename: 'DeletedPost' as const, id: p.id, deletedAt: p.deletedAt };
}

/** post(id) 결과: 보이는 글 → Post · 삭제된 글 → DeletedPost · 없음(또는 미래 글) → null */
export function postLookupView(ctx: MockContext, id: Id) {
  const p = findPost(id);
  if (!p) return null;
  if (p.deletedAt) return deletedPostView(p);
  return isPostVisible(p, ctx.clock) ? postView(ctx, p) : null;
}

export function commentView(ctx: MockContext, c: CommentRow) {
  return {
    id: c.id,
    content: c.content,
    author: () => memberView(ctx, c.authorId),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    viewerCanEdit: canEditComment(ctx, c),
    viewerCanDelete: canDelete(ctx, c.authorId),
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
