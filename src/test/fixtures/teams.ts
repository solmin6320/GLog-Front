/**
 * 팀 영역 가짜 백엔드 응답 (F18). 응답은 백엔드 스키마 모양(team.graphqls · team-board.graphqls · team-post.graphqls)이다.
 * `serveTeams(world)`가 조회 필드(myTeams · team · teamBoard · teamMembers · teamInviteCode · sentTeamInvitations ·
 * teamPosts · teamComments · receivedTeamInvitations)를 등록하고, 응답은 늘 world를 그때그때 읽는다.
 * 뮤테이션은 테스트가 직접 `backend.on(...)`으로 등록하고, 그 안에서 world를 바꿔 다시 조회한 결과를 정한다.
 *
 *   const world = teamWorld();
 *   serveTeams(world);
 *   backend.on('leaveTeam', ({ teamId }, ctx) => { leave(world, teamId, ctx.viewer!.id); return true; });
 */
import { backend, backendError, type BackendCtx } from '@/test/backend';
import { PERSONAS, brief } from '@/test/personas';

export type Person = { id: string; nickname: string; githubLogin: string; profileImageUrl: string | null };

/** 테스트 페르소나 + 팀에만 나오는 회원 (목업 v2 인물) */
export const PEOPLE: Record<string, Person> = {
  '1': brief(PERSONAS.member),
  '2': brief(PERSONAS.plain),
  '3': { id: '3', nickname: '이영희', githubLogin: 'younghee-lee', profileImageUrl: null },
  '4': { id: '4', nickname: '박민수', githubLogin: 'minsu-park', profileImageUrl: null },
  '5': brief(PERSONAS.noteam),
  '6': brief(PERSONAS.penalty),
  '7': { id: '7', nickname: '문지아', githubLogin: 'jia-moon', profileImageUrl: null },
  '8': { id: '8', nickname: '강민호', githubLogin: 'minho-kang', profileImageUrl: null },
};
const person = (id: string): Person => PEOPLE[id] ?? { id, nickname: `회원${id}`, githubLogin: `member-${id}`, profileImageUrl: null };

/** 현황판 한 줄 (TeamBoardMember에서 days를 뺀 값). days는 인증일 수로 만든다 */
export type BoardRowFx = {
  memberId: string;
  verifiedDays: number | null;
  recordCount: number;
  warningCount: number | null;
  status: 'PASS' | 'NOT_YET' | 'FAIL' | 'EXCLUDED';
};
export type BoardPostFx = { id: string; type: 'TROUBLESHOOTING' | 'DEVLOG'; title: string; authorId: string; createdAt: string; isRecord?: boolean };
export type SentFx = { id: string; inviteeId: string; createdAt: string };
export type TeamPostFx = { id: string; type: 'TROUBLESHOOTING' | 'DEVLOG'; title: string; authorId: string; createdAt: string };
export type TeamCommentFx = { id: string; postId: string; content: string; authorId: string; createdAt: string };

export type TeamFx = {
  id: string;
  name: string;
  isPublic: boolean;
  leaderId: string;
  /** 참가 순서. 팀장도 포함 */
  memberIds: string[];
  inviteCode: string;
  weekSummary?: { passCount: number; failCount: number; notYetCount: number };
  board?: { grassFetchedAt: string | null; rows: BoardRowFx[]; recentPosts: BoardPostFx[] };
  sent?: SentFx[];
  posts?: TeamPostFx[];
  comments?: TeamCommentFx[];
};
export type ReceivedFx = { id: string; teamId: string; teamName: string; inviterId: string; createdAt: string };
export type TeamWorld = { teams: TeamFx[]; received: Record<string, ReceivedFx[]> };

/** 이번 주 (TEST_NOW = 2026-10-01 목) */
export const WEEK_START = '2026-09-28';
const WEEK = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
const TODAY_INDEX = 3;

/** 24자리 16진 글 id (MongoDB ObjectId 꼴) */
export const postId = (n: number) => `65f0a1b2c3d4e5f6a7b8${String(n).padStart(4, '0')}`;

/** 사이드 프로젝트 A팀 (목업 W-09 · W-10): 팀장 한동관, 팀원 김철수 · 이영희 · 박민수 */
export function teamA(): TeamFx {
  return {
    id: '1',
    name: '사이드 프로젝트 A팀',
    isPublic: true,
    leaderId: '1',
    memberIds: ['1', '2', '3', '4'],
    inviteCode: 'JD7K-Q2MA',
    weekSummary: { passCount: 1, failCount: 0, notYetCount: 3 },
    board: {
      grassFetchedAt: '2026-10-01T06:00:00+09:00',
      rows: [
        { memberId: '1', verifiedDays: 2, recordCount: 1, warningCount: 1, status: 'NOT_YET' },
        { memberId: '2', verifiedDays: 4, recordCount: 2, warningCount: 0, status: 'PASS' },
        { memberId: '3', verifiedDays: 0, recordCount: 0, warningCount: 2, status: 'NOT_YET' },
        { memberId: '4', verifiedDays: 4, recordCount: 0, warningCount: 0, status: 'NOT_YET' },
      ],
      recentPosts: [
        { id: postId(1), type: 'DEVLOG', title: '배포 파이프라인 정리', authorId: '2', createdAt: '2026-10-01T08:30:00+09:00' },
        { id: postId(2), type: 'DEVLOG', title: '로그인 화면 다듬기', authorId: '2', createdAt: '2026-09-30T21:10:00+09:00' },
        { id: postId(3), type: 'TROUBLESHOOTING', title: 'Redis TTL이 적용되지 않던 문제', authorId: '1', createdAt: '2026-09-29T22:15:00+09:00' },
        { id: postId(4), type: 'DEVLOG', title: '팀 현황판 표 만들기', authorId: '4', createdAt: '2026-09-27T20:00:00+09:00' },
        { id: postId(5), type: 'TROUBLESHOOTING', title: 'CORS 설정이 안 먹던 문제', authorId: '3', createdAt: '2026-09-25T19:40:00+09:00' },
      ],
    },
    sent: [{ id: '21', inviteeId: '5', createdAt: '2026-09-30T12:00:00+09:00' }],
    posts: [
      { id: postId(1), type: 'DEVLOG', title: '배포 파이프라인 정리', authorId: '2', createdAt: '2026-10-01T08:30:00+09:00' },
      { id: postId(3), type: 'TROUBLESHOOTING', title: 'Redis TTL이 적용되지 않던 문제', authorId: '1', createdAt: '2026-09-29T22:15:00+09:00' },
    ],
    comments: [
      { id: '31', postId: postId(1), content: '파이프라인 캐시도 같이 정리하면 좋겠어요', authorId: '3', createdAt: '2026-10-01T09:00:00+09:00' },
      { id: '32', postId: postId(3), content: 'TTL 단위가 초였군요', authorId: '2', createdAt: '2026-09-30T10:00:00+09:00' },
    ],
  };
}

/** 한동관이 팀원(비팀장)인 비공개 팀 */
export function teamAlgo(): TeamFx {
  return { id: '2', name: '알고리즘 스터디', isPublic: false, leaderId: '7', memberIds: ['7', '1'], inviteCode: 'ALG0-STDY' };
}

/** 웹 프로젝트 B팀: 한동관 · 서연은 비소속 */
export function teamB(): TeamFx {
  return {
    id: '3',
    name: '웹 프로젝트 B팀',
    isPublic: true,
    leaderId: '8',
    memberIds: ['8', '6'],
    inviteCode: 'WB3N-7KQX',
    board: {
      grassFetchedAt: '2026-10-01T06:00:00+09:00',
      rows: [
        { memberId: '8', verifiedDays: 3, recordCount: 1, warningCount: 0, status: 'PASS' },
        { memberId: '6', verifiedDays: 1, recordCount: 0, warningCount: 1, status: 'NOT_YET' },
      ],
      recentPosts: [],
    },
  };
}

/** 클라우드 인프라 스터디 (비공개, 팀장 문지아) */
export function teamCloud(): TeamFx {
  return { id: '6', name: '클라우드 인프라 스터디', isPublic: false, leaderId: '7', memberIds: ['7'], inviteCode: 'CLD6-INFR' };
}

/** 기본 세계: A팀 · 알고리즘 스터디 · B팀 · 클라우드 + 한동관이 받은 초대 2건(최신순) */
export function teamWorld(): TeamWorld {
  return {
    teams: [teamA(), teamAlgo(), teamB(), teamCloud()],
    received: {
      '1': [
        { id: '41', teamId: '6', teamName: '클라우드 인프라 스터디', inviterId: '7', createdAt: '2026-09-30T18:00:00+09:00' },
        { id: '42', teamId: '3', teamName: '웹 프로젝트 B팀', inviterId: '8', createdAt: '2026-09-29T11:00:00+09:00' },
      ],
    },
  };
}

/* ---------------- 백엔드 모양으로 바꾸기 ---------------- */

const viewerId = (ctx: BackendCtx) => {
  if (!ctx.viewer) throw backendError('UNAUTHENTICATED');
  return ctx.viewer.id;
};

export const findTeam = (w: TeamWorld, id: unknown) => w.teams.find((t) => t.id === String(id));

/** 팀원 · 팀장만 (비소속 · 관리자 FORBIDDEN, 없는 팀 NOT_FOUND) */
function memberTeam(w: TeamWorld, id: unknown, ctx: BackendCtx) {
  const t = findTeam(w, id);
  if (!t) throw backendError('NOT_FOUND');
  if (!t.memberIds.includes(viewerId(ctx))) throw backendError('FORBIDDEN');
  return t;
}
function leaderTeam(w: TeamWorld, id: unknown, ctx: BackendCtx) {
  const t = memberTeam(w, id, ctx);
  if (t.leaderId !== viewerId(ctx)) throw backendError('FORBIDDEN');
  return t;
}

/** team.graphqls Team (+ weekSummary) */
export const toBackendTeam = (t: TeamFx, viewer: string) => ({
  id: t.id,
  name: t.name,
  description: null,
  isPublic: t.isPublic,
  leader: person(t.leaderId),
  isLeader: t.leaderId === viewer,
  memberCount: t.memberIds.length,
  joinedAt: '2026-09-01T10:00:00+09:00',
  createdAt: '2026-09-01T10:00:00+09:00',
  weekSummary: { weekStart: WEEK_START, ...(t.weekSummary ?? { passCount: 0, failCount: 0, notYetCount: t.memberIds.length }) },
});

/** 팀장이 맨 앞, 나머지는 참가한 순서 */
const orderedMembers = (t: TeamFx) => [t.leaderId, ...t.memberIds.filter((id) => id !== t.leaderId)];

function boardDays(r: BoardRowFx) {
  return WEEK.map((date, i) => {
    const past = i <= TODAY_INDEX;
    const hasRecord = past && r.recordCount > 0 && i === 0;
    const grass = r.verifiedDays === null ? null : past && i < r.verifiedDays;
    return { date, hasGrass: past ? grass : false, hasRecord, verified: grass === null ? (hasRecord ? true : null) : grass || hasRecord };
  });
}

function toBoard(t: TeamFx, viewer: string) {
  const board = t.board ?? { grassFetchedAt: '2026-10-01T06:00:00+09:00', rows: [], recentPosts: [] };
  const rows = orderedMembers(t).map(
    (id) => board.rows.find((r) => r.memberId === id) ?? { memberId: id, verifiedDays: 0, recordCount: 0, warningCount: 0, status: 'NOT_YET' as const },
  );
  return {
    weekStart: WEEK_START,
    weekEnd: WEEK[6],
    grassFetchedAt: board.grassFetchedAt,
    grassNotLoaded: rows.some((r) => r.verifiedDays === null),
    members: rows.map((r) => ({ ...r, nickname: person(r.memberId).nickname, githubLogin: person(r.memberId).githubLogin, isMe: r.memberId === viewer, days: boardDays(r) })),
    recentPosts: board.recentPosts.map((p) => ({ id: p.id, type: p.type, title: p.title, createdAt: p.createdAt, isRecord: p.isRecord ?? true, author: person(p.authorId) })),
  };
}

/** 팀 영역 조회 필드를 모두 등록한다. 응답은 매번 world를 다시 읽는다 */
export function serveTeams(w: TeamWorld) {
  backend
    .on('myTeams', (_a, ctx) => {
      const me = viewerId(ctx);
      return w.teams.filter((t) => t.memberIds.includes(me)).map((t) => toBackendTeam(t, me));
    })
    .on('team', ({ id }, ctx) => toBackendTeam(memberTeam(w, id, ctx), viewerId(ctx)))
    .on('teamBoard', ({ teamId }, ctx) => toBoard(memberTeam(w, teamId, ctx), viewerId(ctx)))
    .on('teamMembers', ({ teamId }, ctx) => ({
      items: orderedMembers(memberTeam(w, teamId, ctx)).map((id) => ({ ...person(id), isLeader: id === findTeam(w, teamId)?.leaderId, joinedAt: '2026-09-01T10:00:00+09:00' })),
      nextCursor: null,
    }))
    .on('teamInviteCode', ({ teamId }, ctx) => leaderTeam(w, teamId, ctx).inviteCode)
    .on('sentTeamInvitations', ({ teamId }, ctx) => ({
      items: (leaderTeam(w, teamId, ctx).sent ?? []).map((s) => ({ id: s.id, createdAt: s.createdAt, invitee: person(s.inviteeId) })),
      nextCursor: null,
    }))
    .on('teamPosts', ({ teamId }, ctx) => ({
      items: (leaderTeam(w, teamId, ctx).posts ?? []).map((p) => ({ ...p, author: person(p.authorId) })),
      nextCursor: null,
    }))
    .on('teamComments', ({ teamId }, ctx) => ({
      items: (leaderTeam(w, teamId, ctx).comments ?? []).map((c) => ({ ...c, author: person(c.authorId) })),
      nextCursor: null,
    }))
    .on('receivedTeamInvitations', (_a, ctx) => ({
      items: (w.received[viewerId(ctx)] ?? []).map((i) => ({ id: i.id, teamId: i.teamId, teamName: i.teamName, inviter: person(i.inviterId), createdAt: i.createdAt })),
      nextCursor: null,
    }));
}

/** 뮤테이션 응답용: 그 팀을 지금 시청자 기준 Team 모양으로 */
export const teamAs = (w: TeamWorld, id: unknown, ctx: BackendCtx) => toBackendTeam(findTeam(w, id)!, viewerId(ctx));

/** 받은 초대 하나를 정리한다 (수락 · 거절 · 실패 모두 초대는 지워진다) */
export function dropInvitation(w: TeamWorld, viewer: string, invitationId: unknown) {
  w.received[viewer] = (w.received[viewer] ?? []).filter((i) => i.id !== String(invitationId));
}
