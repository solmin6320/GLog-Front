/**
 * 목 메모리 DB (설계서 8-1). 새로고침하면 시드로 돌아간다.
 *
 * - 테이블은 배열이다. 행은 DB 컬럼에 가깝게 두고, 화면 모양(GraphQL 객체)은 `views.ts`가 만든다.
 * - 뮤테이션은 행을 고친 뒤 반드시 `touch()`를 부른다 → `db.version`이 올라가 미리보기 basis가 바뀐다.
 * - "언제 보이는가"는 목 시각(control.now) 기준이다: 시드 행 중 createdAt/executedAt이 now보다 뒤면 안 보인다.
 *   (조회 헬퍼 `visiblePosts()` 등이 처리한다. 새로 만드는 행은 createdAt = clock.now라 항상 보인다.)
 */
import type {
  GrassFetchStatus,
  HoldReason,
  JudgmentStatus,
  MemberRole,
  MemberStatus,
  PersonalExemptionStatus,
  PostSectionKey,
  PostType,
  SkipReason,
  TeamRole,
  WarningDeleteReason,
  WarningStanding,
} from '../__generated__/schema-types';
import { COMMENT_OID_PREFIX, objectId, POST_OID_PREFIX } from './ids';
import { createSeed } from './seed';

export { COMMENT_OID_PREFIX, objectId, POST_OID_PREFIX } from './ids';

export type Id = string;
export type DateStr = string; // YYYY-MM-DD (KST)
export type DateTimeStr = string; // ISO-8601 (+09:00)

export type MemberRow = {
  id: Id;
  nickname: string;
  githubLogin: string;
  profileImageUrl: string | null;
  status: MemberStatus;
  role: MemberRole;
  /** 신청 = 첫 로그인 시각 */
  createdAt: DateTimeStr;
  /** 생애 첫 팀 참가 시각 (FIRST_WEEK 판단). null = 팀에 들어간 적 없음 */
  firstTeamJoinedAt: DateTimeStr | null;
  /** 잔디 생성 방식: random = id 시드 의사 난수, zero = 항상 0 (E-39 비공개 기여 의심용) */
  grassMode: 'random' | 'zero';
  /** control.grass === 'auto'일 때의 잔디 조회 상태 */
  grassStatus: GrassFetchStatus;
};

export type TeamRow = {
  id: Id;
  name: string;
  description: string | null;
  isPublic: boolean;
  leaderId: Id;
  inviteCode: string | null;
  createdAt: DateTimeStr;
  /** 삭제된 팀(소프트). 글 · 경고 카테고리에 '삭제된 팀'으로 남는다 */
  deletedAt: DateTimeStr | null;
};

export type MembershipRow = { teamId: Id; memberId: Id; role: TeamRole; joinedAt: DateTimeStr };

export type InvitationRow = {
  id: Id;
  teamId: Id;
  inviteeId: Id;
  createdAt: DateTimeStr;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
};

/** 초대코드 참가 차단 (TEAM_JOIN_BLOCKED, E-12) */
export type TeamJoinBlockRow = { teamId: Id; memberId: Id; until: DateTimeStr };

export type PostRow = {
  id: Id; // ObjectId 24 hex
  type: PostType;
  title: string;
  /** 키 → 본문. 빈 문자열/null = 작성되지 않음 */
  sections: Partial<Record<PostSectionKey, string | null>>;
  tags: string[];
  commitUrls: string[];
  authorId: Id;
  teamId: Id | null;
  createdAt: DateTimeStr;
  updatedAt: DateTimeStr | null;
  deletedAt: DateTimeStr | null;
};

export type CommentRow = {
  id: Id; // ObjectId 24 hex
  postId: Id;
  authorId: Id;
  content: string;
  createdAt: DateTimeStr;
  updatedAt: DateTimeStr | null;
  deletedAt: DateTimeStr | null;
};

export type NoticeRow = {
  id: Id;
  title: string;
  content: string;
  isPinned: boolean;
  isSystem: boolean;
  createdAt: DateTimeStr;
  updatedAt: DateTimeStr | null;
  deletedAt: DateTimeStr | null;
};

/** judgment_day 스냅숏 (판정 시점 값, 이후 글 수정에 흔들리지 않는다) */
export type JudgmentDay = { hasGrass: boolean; hasRecord: boolean };

export type JudgmentRow = {
  id: Id;
  memberId: Id;
  weekStart: DateStr;
  status: JudgmentStatus;
  skipReason: SkipReason | null;
  holdReason: HoldReason | null;
  verifiedDays: number | null;
  recordCount: number | null;
  /** 월~일 7개 */
  days: JudgmentDay[];
  corrected: boolean;
  /** 배치가 이 행을 만든 시각 (보이는지 판단). HOLD도 값이 있다 */
  executedAt: DateTimeStr;
  /** 확정 시각. HOLD면 null */
  judgedAt: DateTimeStr | null;
};

export type JudgmentCorrectionRow = {
  id: Id;
  judgmentId: Id;
  beforeStatus: JudgmentStatus;
  afterStatus: JudgmentStatus;
  reason: string;
  correctedById: Id;
  correctedAt: DateTimeStr;
};

export type WarningRow = {
  id: Id;
  memberId: Id;
  weekStart: DateStr;
  /** 이 경고를 만든 판정. null = 시드 이전 이력(fixedStanding으로 상태 고정) */
  judgmentId: Id | null;
  verifiedDays: number | null;
  recordCount: number | null;
  /** 지금 붙어 있는 카테고리(팀 id). 추방 · 팀 삭제로 빠진다 */
  teamIds: Id[];
  /** 처음 붙었던 카테고리 — 복구 후 카테고리(AdminTeamLabel) 계산용 */
  originalTeamIds: Id[];
  /** 소프트 삭제(카테고리가 모두 빠짐). 회원 화면 · replay에서 빠진다 */
  deleted: { reason: WarningDeleteReason; at: DateTimeStr } | null;
  /** 정정 · 소급 면제로 회수된 경고. 어디에도 나오지 않는다 (C-03: DB에 사유값 없음 → 목 전용 플래그) */
  retractedAt: DateTimeStr | null;
  /** replay 대상이 아닌 과거 이력의 고정 상태 */
  fixedStanding?: WarningStanding;
};

/** 벌칙 이행 체크 (고정점, E-58) */
export type PenaltyFulfillmentRow = {
  id: Id;
  memberId: Id;
  /** 이 주차 이전(포함 X)의 판정은 경고 계산에서 얼어붙는다 */
  effectiveWeekStart: DateStr;
  fulfilledAt: DateTimeStr;
  fulfilledById: Id;
};

export type ExemptionPeriodRow = {
  id: Id;
  weekStart: DateStr;
  reason: string;
  createdAt: DateTimeStr;
  updatedAt: DateTimeStr | null;
};

export type PersonalExemptionRow = {
  id: Id;
  memberId: Id;
  requestedById: Id;
  /** [DB 공백] DB에는 없다. 목은 요청한 팀을 기억해 TM-08 목록을 거른다 */
  teamId: Id;
  weekStart: DateStr;
  reason: string;
  status: PersonalExemptionStatus;
  rejectReason: string | null;
  createdAt: DateTimeStr;
  respondedAt: DateTimeStr | null;
};

export type DbState = {
  version: number;
  members: MemberRow[];
  teams: TeamRow[];
  memberships: MembershipRow[];
  invitations: InvitationRow[];
  teamJoinBlocks: TeamJoinBlockRow[];
  posts: PostRow[];
  comments: CommentRow[];
  notices: NoticeRow[];
  judgments: JudgmentRow[];
  judgmentCorrections: JudgmentCorrectionRow[];
  warnings: WarningRow[];
  penaltyFulfillments: PenaltyFulfillmentRow[];
  exemptionPeriods: ExemptionPeriodRow[];
  personalExemptions: PersonalExemptionRow[];
  /** 잔디 덮어쓰기: memberId → (날짜 → 개수). 없으면 의사 난수 */
  grassOverrides: Record<Id, Record<DateStr, number>>;
};

/** 앱 전체가 공유하는 단 하나의 목 DB. 테이블 배열은 직접 고쳐도 된다(고친 뒤 touch()). */
export const db: DbState = createSeed();

/** 시드로 되돌린다 (resetMockDb · 테스트 beforeEach) */
export function resetDb(): void {
  Object.assign(db, createSeed());
}

/** 모든 뮤테이션 끝에 호출 — version을 올려 미리보기 basis를 무효화한다 */
export function touch(): number {
  db.version += 1;
  return db.version;
}

/* ------------------------------------------------------------------ */
/* id 발급                                                              */
/* ------------------------------------------------------------------ */

type BigintTable = 'members' | 'teams' | 'invitations' | 'notices' | 'judgments' | 'judgmentCorrections' | 'warnings' | 'penaltyFulfillments' | 'exemptionPeriods' | 'personalExemptions';

/** bigint 문자열 id 다음 값 (테이블 최대 + 1) */
export function nextId(table: BigintTable): Id {
  const rows = db[table] as { id: Id }[];
  const max = rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0);
  return String(max + 1);
}

/** MongoDB ObjectId 모양(24 hex) 다음 값 — posts · comments */
export function nextObjectId(table: 'posts' | 'comments'): Id {
  const prefix = table === 'posts' ? POST_OID_PREFIX : COMMENT_OID_PREFIX;
  const rows = db[table];
  const max = rows.reduce((m, r) => Math.max(m, parseInt(r.id.slice(prefix.length), 16) || 0), 0);
  return objectId(prefix, max + 1);
}

/* ------------------------------------------------------------------ */
/* 단순 조회 (보이기 규칙 없음)                                          */
/* ------------------------------------------------------------------ */

export const findMember = (id: Id | null | undefined) => (id ? db.members.find((m) => m.id === id) : undefined);
export const findTeam = (id: Id | null | undefined) => (id ? db.teams.find((t) => t.id === id) : undefined);
export const findPost = (id: Id | null | undefined) => (id ? db.posts.find((p) => p.id === id) : undefined);
export const findComment = (id: Id | null | undefined) => (id ? db.comments.find((c) => c.id === id) : undefined);
export const findNotice = (id: Id | null | undefined) => (id ? db.notices.find((n) => n.id === id) : undefined);
export const findJudgment = (id: Id | null | undefined) => (id ? db.judgments.find((j) => j.id === id) : undefined);
export const findWarning = (id: Id | null | undefined) => (id ? db.warnings.find((w) => w.id === id) : undefined);
export const findInvitation = (id: Id | null | undefined) => (id ? db.invitations.find((i) => i.id === id) : undefined);
export const findExemptionPeriod = (id: Id | null | undefined) => (id ? db.exemptionPeriods.find((e) => e.id === id) : undefined);
export const findPersonalExemption = (id: Id | null | undefined) =>
  id ? db.personalExemptions.find((e) => e.id === id) : undefined;
export const findMemberByLogin = (login: string) =>
  db.members.find((m) => m.githubLogin.toLowerCase() === login.trim().replace(/^@/, '').toLowerCase());

/** 살아 있는(삭제 안 된) 팀 */
export const liveTeam = (id: Id | null | undefined) => {
  const t = findTeam(id);
  return t && !t.deletedAt ? t : undefined;
};

export const membershipsOfTeam = (teamId: Id) =>
  db.memberships.filter((m) => m.teamId === teamId).sort((a, b) => cmpTime(a.joinedAt, b.joinedAt));

/** 회원이 지금 속한 (삭제 안 된) 팀, 참가 순 */
export const teamsOfMember = (memberId: Id): TeamRow[] =>
  db.memberships
    .filter((m) => m.memberId === memberId)
    .sort((a, b) => cmpTime(a.joinedAt, b.joinedAt))
    .map((m) => liveTeam(m.teamId))
    .filter((t): t is TeamRow => !!t);

export const membershipOf = (teamId: Id, memberId: Id) =>
  db.memberships.find((m) => m.teamId === teamId && m.memberId === memberId);

export const isTeamMember = (teamId: Id, memberId: Id | null | undefined) =>
  !!memberId && !!liveTeam(teamId) && !!membershipOf(teamId, memberId);

export const isTeamLeader = (teamId: Id, memberId: Id | null | undefined) => {
  const t = liveTeam(teamId);
  return !!t && !!memberId && t.leaderId === memberId;
};

/* ------------------------------------------------------------------ */
/* 시간 비교                                                             */
/* ------------------------------------------------------------------ */

export function toMs(iso: DateTimeStr): number {
  return Date.parse(iso);
}

/** a가 b보다 앞이면 음수 */
export function cmpTime(a: DateTimeStr, b: DateTimeStr): number {
  return toMs(a) - toMs(b);
}

export function isAtOrBefore(a: DateTimeStr, b: DateTimeStr): boolean {
  return toMs(a) <= toMs(b);
}
