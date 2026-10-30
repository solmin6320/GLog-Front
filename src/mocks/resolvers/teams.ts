/** 팀 (TM-01 ~ TM-08) */
import { addDays } from '@/shared/lib/kst';
import { LIMITS } from '@/shared/lib/validators';
import type {
  MutationAcceptTeamInvitationArgs,
  MutationCancelTeamInvitationArgs,
  MutationCreateTeamArgs,
  MutationDeclineTeamInvitationArgs,
  MutationDeleteTeamArgs,
  MutationInviteToTeamArgs,
  MutationJoinTeamByCodeArgs,
  MutationKickTeamMemberArgs,
  MutationLeaveTeamArgs,
  MutationRequestPersonalExemptionArgs,
  MutationTransferTeamLeadershipArgs,
  MutationUpdateTeamArgs,
  QueryMyPersonalExemptionRequestsArgs,
  QueryReceivedTeamInvitationsArgs,
  QuerySentTeamInvitationsArgs,
  QueryTeamArgs,
  QueryTeamBoardArgs,
  QueryTeamCommentsArgs,
  QueryTeamInviteCodeArgs,
  QueryTeamMembersArgs,
  QueryTeamPostsArgs,
} from '../__generated__/schema-types';
import { kstIsoFromMs } from '../clock';
import { hash01 } from '../db/seed';
import {
  cmpTime,
  db,
  findInvitation,
  findMember,
  findMemberByLogin,
  liveTeam,
  membershipOf,
  membershipsOfTeam,
  nextId,
  teamsOfMember,
  touch,
  type Id,
  type InvitationRow,
  type MemberRow,
  type PersonalExemptionRow,
  type TeamRow,
  type WarningDeleteReason,
} from '../db/store';
import { gqlError, invalid } from '../errors';
import type { MockContext, Resolvers } from '../types';
import {
  commentView,
  contentItems,
  itemsPage,
  pendingInvitationsFor,
  postView,
  receivedInvitationView,
  requireTeamLeader,
  requireTeamManager,
  requireTeamViewer,
  requireViewer,
  sentInvitationView,
  teamBoardView,
  teamMembersOrdered,
  teamMemberView,
  personalExemptionView,
  teamView,
} from '../views';

/* ------------------------------------------------------------------ */
/* 도우미                                                               */
/* ------------------------------------------------------------------ */

/** 초대코드 차단 기간 (TM-03 비고 · FC-05 'TTL 1년') */
const JOIN_BLOCK_DAYS = 365;
/** 헷갈리는 글자(I · O · 0 · 1)를 뺀 초대코드 글자 */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** GitHub 아이디 규칙 (validators.validateGithubLogin과 같다) */
const GITHUB_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/** 테이블 배열을 제자리에서 걸러 낸다 (다른 모듈이 같은 배열을 보고 있어도 안전) */
function removeWhere<T>(rows: T[], pred: (row: T) => boolean): void {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (row !== undefined && pred(row)) rows.splice(i, 1);
  }
}

/** 살아 있는 팀. 없거나 삭제됐으면 NOT_FOUND (E-53) */
function teamOrNotFound(teamId: Id): TeamRow {
  const t = liveTeam(teamId);
  if (!t) throw gqlError('NOT_FOUND');
  return t;
}

/** 팀장 전용 조작의 공통 첫 줄: 살아 있는 팀 + 조회자가 그 팀 팀장이거나 시스템 관리자(아니면 FORBIDDEN) */
function leaderTeam(ctx: MockContext, teamId: Id): { team: TeamRow; viewer: MemberRow } {
  const viewer = requireViewer(ctx);
  const team = teamOrNotFound(teamId);
  requireTeamManager(ctx, team.id);
  return { team, viewer };
}

/** 소속자 · 관리자 조회용: 살아 있는 팀 + 소속이거나 시스템 관리자 */
function viewableTeam(ctx: MockContext, teamId: Id): TeamRow {
  requireViewer(ctx);
  const team = teamOrNotFound(teamId);
  requireTeamViewer(ctx, team.id);
  return team;
}

/** 팀 글 관리: 그 팀 팀장만 (관리자 예외 없음, 백엔드 team-post) */
function strictLeaderTeam(ctx: MockContext, teamId: Id): TeamRow {
  requireViewer(ctx);
  const team = teamOrNotFound(teamId);
  requireTeamLeader(ctx, team.id);
  return team;
}

/** 겹치지 않는 초대코드 `XXXX-XXXX` (결정적 — 같은 시드 · 같은 순서면 같은 코드) */
function newInviteCode(teamId: Id): string {
  const used = new Set(db.teams.map((t) => t.inviteCode).filter((c): c is string => !!c));
  for (let attempt = 0; ; attempt += 1) {
    let s = '';
    for (let i = 0; i < 8; i += 1) {
      const n = Math.floor(hash01(`invite:${teamId}:${db.version}:${attempt}:${i}`) * CODE_CHARS.length);
      s += CODE_CHARS[n] ?? 'A';
    }
    const code = `${s.slice(0, 4)}-${s.slice(4)}`;
    if (!used.has(code)) return code;
  }
}

/** 팀에 넣는다. 생애 첫 팀이면 firstTeamJoinedAt을 남긴다 (첫 참가 주 판정 제외, E-36) */
function addMembership(ctx: MockContext, teamId: Id, member: MemberRow, role: 'LEADER' | 'MEMBER'): void {
  db.memberships.push({ teamId, memberId: member.id, role, joinedAt: ctx.clock.now });
  if (!member.firstTeamJoinedAt) member.firstTeamJoinedAt = ctx.clock.now;
}

/**
 * 추방 · 팀 삭제의 경고 처리 (TM-06 비고 · E-22): 그 팀 카테고리만 빼고, 남은 카테고리가 없으면 소프트 삭제.
 * 자진 탈퇴는 부르지 않는다 (경고 유지).
 */
function dropWarningCategory(ctx: MockContext, teamId: Id, reason: WarningDeleteReason, memberId?: Id): void {
  for (const w of db.warnings) {
    if (memberId && w.memberId !== memberId) continue;
    if (w.deleted || !w.teamIds.includes(teamId)) continue;
    w.teamIds = w.teamIds.filter((t) => t !== teamId);
    if (w.teamIds.length === 0) w.deleted = { reason, at: ctx.clock.now };
  }
}

function cleanTeamName(raw: string): string {
  const name = raw.trim();
  if (name.length < 1 || name.length > LIMITS.teamName) throw invalid('name');
  return name;
}

function cleanDescription(raw: string | null | undefined): string | null {
  const d = (raw ?? '').trim();
  if (d.length > LIMITS.teamDescription) throw invalid('description');
  return d.length > 0 ? d : null;
}

/** 팀 안의 다른 팀원 (본인 · 팀장 → VALIDATION_FAILED, 비소속 → TEAM_MEMBER_NOT_FOUND) */
function otherMember(team: TeamRow, viewer: MemberRow, memberId: Id) {
  if (memberId === viewer.id || memberId === team.leaderId) throw invalid('memberId', 'mock: cannot target yourself or the leader');
  const m = membershipOf(team.id, memberId);
  if (!m) throw gqlError('TEAM_MEMBER_NOT_FOUND');
  return m;
}

/* ------------------------------------------------------------------ */
/* 리졸버                                                               */
/* ------------------------------------------------------------------ */

export const teamsResolvers: Resolvers = {
  Query: {
    // 참가 순(오래된 순)
    myTeams: (_: unknown, __: unknown, ctx: MockContext) => teamsOfMember(requireViewer(ctx).id).map((t) => teamView(ctx, t)),
    // 없는 팀 · 삭제된 팀 → NOT_FOUND, 비소속 → FORBIDDEN. 시스템 관리자는 볼 수 있다
    team: (_: unknown, { id }: QueryTeamArgs, ctx: MockContext) => teamView(ctx, viewableTeam(ctx, id)),
    teamMembers: (_: unknown, { teamId, after }: QueryTeamMembersArgs, ctx: MockContext) => {
      const team = viewableTeam(ctx, teamId);
      return itemsPage(teamMembersOrdered(team), after, (m) => teamMemberView(ctx, team, m));
    },
    // [Q-01] 팀장 재열람
    teamInviteCode: (_: unknown, { teamId }: QueryTeamInviteCodeArgs, ctx: MockContext) => leaderTeam(ctx, teamId).team.inviteCode ?? '',
    receivedTeamInvitations: (_: unknown, { after }: QueryReceivedTeamInvitationsArgs, ctx: MockContext) =>
      itemsPage(
        pendingInvitationsFor(requireViewer(ctx).id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        after,
        (i) => receivedInvitationView(ctx, i),
      ),
    sentTeamInvitations: (_: unknown, { teamId, after }: QuerySentTeamInvitationsArgs, ctx: MockContext) => {
      const { team } = leaderTeam(ctx, teamId);
      const rows = db.invitations
        .filter((i) => i.teamId === team.id && i.status === 'PENDING')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return itemsPage(rows, after, (i) => sentInvitationView(ctx, i));
    },
    teamBoard: (_: unknown, { teamId }: QueryTeamBoardArgs, ctx: MockContext) => teamBoardView(ctx, viewableTeam(ctx, teamId)),
    teamPosts: (_: unknown, { teamId, after }: QueryTeamPostsArgs, ctx: MockContext) => {
      const team = strictLeaderTeam(ctx, teamId);
      return itemsPage(contentItems(ctx, { teamId: team.id, kind: 'POST' }), after, (c) => postView(ctx, c.post));
    },
    teamComments: (_: unknown, { teamId, after }: QueryTeamCommentsArgs, ctx: MockContext) => {
      const team = strictLeaderTeam(ctx, teamId);
      return itemsPage(contentItems(ctx, { teamId: team.id, kind: 'COMMENT' }), after, (c) => {
        if (!c.comment) throw gqlError('INTERNAL', { message: 'mock: comment row missing' });
        return commentView(ctx, c.comment);
      });
    },
    // 내가 보낸 요청 (팀 무관), 최신순
    myPersonalExemptionRequests: (_: unknown, { after }: QueryMyPersonalExemptionRequestsArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const rows = db.personalExemptions
        .filter((e) => e.requestedById === viewer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return itemsPage(rows, after, (e) => personalExemptionView(e));
    },
  },
  Mutation: {
    // TM-02 — 이름 1~20자 · 설명 100자 · 만든 사람이 팀장. 초대코드는 이 응답에서 반드시 준다
    createTeam: (_: unknown, { input }: MutationCreateTeamArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const id = nextId('teams');
      const team: TeamRow = {
        id,
        name: cleanTeamName(input.name),
        description: cleanDescription(input.description),
        isPublic: input.isPublic ?? true,
        leaderId: viewer.id,
        inviteCode: newInviteCode(id),
        createdAt: ctx.clock.now,
        deletedAt: null,
      };
      db.teams.push(team);
      addMembership(ctx, team.id, viewer, 'LEADER');
      touch();
      return { team: teamView(ctx, team), inviteCode: team.inviteCode };
    },

    // TM-03 — 대소문자 무시. 없음 E-10 · 이미 소속 E-11 · 추방 차단 E-12 (사유 · 남은 기간은 알리지 않는다)
    joinTeamByCode: (_: unknown, { code }: MutationJoinTeamByCodeArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const normalized = code.trim().toUpperCase();
      if (!normalized) throw invalid('code');
      const team = db.teams.find((t) => !t.deletedAt && t.inviteCode?.toUpperCase() === normalized);
      if (!team) throw gqlError('TEAM_CODE_NOT_FOUND');
      if (membershipOf(team.id, viewer.id)) throw gqlError('TEAM_ALREADY_JOINED');
      const blocked = db.teamJoinBlocks.some(
        (b) => b.teamId === team.id && b.memberId === viewer.id && cmpTime(b.until, ctx.clock.now) > 0,
      );
      if (blocked) throw gqlError('TEAM_JOIN_BLOCKED');
      addMembership(ctx, team.id, viewer, 'MEMBER');
      touch();
      return teamView(ctx, team);
    },

    // TM-06 ② — 승인된 회원만(E-15) · 이미 팀원(E-16) · 대기 초대 중복 · 추방자 재초대 허용(E-13)
    inviteToTeam: (_: unknown, { teamId, githubLogin }: MutationInviteToTeamArgs, ctx: MockContext) => {
      const { team } = leaderTeam(ctx, teamId);
      const login = githubLogin.trim().replace(/^@/, '');
      if (!GITHUB_LOGIN_RE.test(login)) throw invalid('githubLogin');
      const invitee = findMemberByLogin(login);
      if (!invitee || invitee.status !== 'ACTIVE') throw gqlError('INVITEE_NOT_FOUND');
      if (membershipOf(team.id, invitee.id)) throw gqlError('INVITEE_ALREADY_MEMBER');
      const existing = db.invitations.find((i) => i.teamId === team.id && i.inviteeId === invitee.id && i.status === 'PENDING');
      if (existing) throw gqlError('INVITATION_DUPLICATE');
      const row: InvitationRow = { id: nextId('invitations'), teamId: team.id, inviteeId: invitee.id, createdAt: ctx.clock.now, status: 'PENDING' };
      db.invitations.push(row);
      touch();
      return sentInvitationView(ctx, row);
    },

    // TM-06 ③ [취소] — DB에 철회 상태가 없어 행을 지운다
    cancelTeamInvitation: (_: unknown, { invitationId }: MutationCancelTeamInvitationArgs, ctx: MockContext) => {
      const inv = findInvitation(invitationId);
      if (!inv || inv.status !== 'PENDING') throw gqlError('NOT_FOUND');
      leaderTeam(ctx, inv.teamId);
      removeWhere(db.invitations, (i) => i.id === inv.id);
      touch();
      return true;
    },

    // TM-04 — 팀 삭제됨 E-18(TEAM_GONE) · 이미 다른 경로로 참가 E-17(초대만 정리하고 INVITATION_ALREADY_JOINED)
    acceptTeamInvitation: (_: unknown, { invitationId }: MutationAcceptTeamInvitationArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const inv = findInvitation(invitationId);
      if (!inv || inv.inviteeId !== viewer.id || inv.status !== 'PENDING') throw gqlError('NOT_FOUND');
      const team = liveTeam(inv.teamId);
      if (!team) {
        inv.status = 'DECLINED';
        touch();
        throw gqlError('TEAM_GONE');
      }
      inv.status = 'ACCEPTED';
      if (membershipOf(team.id, viewer.id)) {
        touch();
        throw gqlError('INVITATION_ALREADY_JOINED');
      }
      // 아이디 초대는 초대코드 차단과 무관하다 (E-13 · ACC-TM04-06)
      addMembership(ctx, team.id, viewer, 'MEMBER');
      touch();
      return teamView(ctx, team);
    },

    declineTeamInvitation: (_: unknown, { invitationId }: MutationDeclineTeamInvitationArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const inv = findInvitation(invitationId);
      if (!inv || inv.inviteeId !== viewer.id || inv.status !== 'PENDING') throw gqlError('NOT_FOUND');
      inv.status = 'DECLINED';
      touch();
      return true;
    },

    // TM-05 ④ — 팀원만. 팀장은 LEADER_MUST_TRANSFER(E-19), 혼자 남은 팀장은 LAST_MEMBER(E-20 → 팀 삭제로). 경고는 유지
    leaveTeam: (_: unknown, { teamId }: MutationLeaveTeamArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const team = teamOrNotFound(teamId);
      const mine = membershipOf(team.id, viewer.id);
      if (!mine) throw gqlError('FORBIDDEN', { message: 'mock: not a team member' });
      if (team.leaderId === viewer.id) {
        throw gqlError(membershipsOfTeam(team.id).length <= 1 ? 'LEADER_LAST_MEMBER' : 'LEADER_MUST_TRANSFER');
      }
      removeWhere(db.memberships, (m) => m === mine);
      touch();
      return true;
    },

    // TM-06 ⑤ — 초대코드 1년 차단 + 그 팀 경고 카테고리 제거(비면 KICKED 소프트 삭제, E-22)
    kickTeamMember: (_: unknown, { teamId, memberId }: MutationKickTeamMemberArgs, ctx: MockContext) => {
      const { team, viewer } = leaderTeam(ctx, teamId);
      const target = otherMember(team, viewer, memberId);
      removeWhere(db.memberships, (m) => m === target);
      removeWhere(db.teamJoinBlocks, (b) => b.teamId === team.id && b.memberId === memberId);
      db.teamJoinBlocks.push({ teamId: team.id, memberId, until: kstIsoFromMs(ctx.clock.nowMs + JOIN_BLOCK_DAYS * 86_400_000) });
      dropWarningCategory(ctx, team.id, 'KICKED', memberId);
      touch();
      return true;
    },

    // TM-06 ⑥ — 되돌릴 수 없음. 결과의 isLeader는 false (조회자가 TM-06 권한을 잃는다)
    transferTeamLeadership: (_: unknown, { teamId, newLeaderId }: MutationTransferTeamLeadershipArgs, ctx: MockContext) => {
      const { team, viewer } = leaderTeam(ctx, teamId);
      const target = otherMember(team, viewer, newLeaderId);
      const old = membershipOf(team.id, team.leaderId);
      if (old) old.role = 'MEMBER';
      target.role = 'LEADER';
      team.leaderId = newLeaderId;
      touch();
      return teamView(ctx, team);
    },

    // TM-06 ⑦ — 즉시 반영
    updateTeam: (_: unknown, { teamId, input }: MutationUpdateTeamArgs, ctx: MockContext) => {
      const { team } = leaderTeam(ctx, teamId);
      team.isPublic = input.isPublic;
      touch();
      return teamView(ctx, team);
    },

    // TM-06 ⑨ — 소프트 삭제. 글의 teamId는 남기고(표기는 derive가 DELETED/null) 소속은 정리, 카테고리 제거 (E-21 · E-22)
    deleteTeam: (_: unknown, { teamId }: MutationDeleteTeamArgs, ctx: MockContext) => {
      const { team } = leaderTeam(ctx, teamId);
      team.deletedAt = ctx.clock.now;
      removeWhere(db.memberships, (m) => m.teamId === team.id);
      dropWarningCategory(ctx, team.id, 'TEAM_DELETED');
      touch();
      return true;
    },

    // TM-08 ④ — 대상 = 이 팀 팀원(본인 포함) · 주 = 이번 주 · 다음 주 · 사유 1~200자. 대기 · 승인 중복은 E-47.
    // 전체 면제 기간과 겹쳐도 요청은 보관하고 overlapsExemptionPeriod로 알린다 (E-44, 추측)
    // 그 팀 팀장만 (관리자 예외 없음, 백엔드 exemption)
    requestPersonalExemption: (_: unknown, input: MutationRequestPersonalExemptionArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const team = strictLeaderTeam(ctx, input.teamId);
      if (!membershipOf(team.id, input.memberId) || !findMember(input.memberId)) throw invalid('memberId');
      const allowedWeeks = [ctx.clock.currentWeekStart, addDays(ctx.clock.currentWeekStart, 7)];
      if (!allowedWeeks.includes(input.weekStart)) throw invalid('weekStart');
      const reason = input.reason.trim();
      if (reason.length < 1 || reason.length > LIMITS.exemptionReason) throw invalid('reason');
      const duplicate = db.personalExemptions.some(
        (e) => e.memberId === input.memberId && e.weekStart === input.weekStart && (e.status === 'PENDING' || e.status === 'APPROVED'),
      );
      if (duplicate) throw gqlError('EXEMPTION_REQUEST_DUPLICATE');
      const row: PersonalExemptionRow = {
        id: nextId('personalExemptions'),
        memberId: input.memberId,
        requestedById: viewer.id,
        teamId: team.id,
        weekStart: input.weekStart,
        reason,
        status: 'PENDING',
        rejectReason: null,
        createdAt: ctx.clock.now,
        respondedAt: null,
      };
      db.personalExemptions.push(row);
      touch();
      return personalExemptionView(row);
    },
  },
};
