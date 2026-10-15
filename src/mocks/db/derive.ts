/**
 * 서버 역할 흉내 (설계서 8-5). 목 리졸버가 "서버가 계산하는 값"을 여기서 얻는다.
 * 프론트 코드(src/features · src/domain)는 이 파일을 import하지 않는다.
 *
 * - 인증일: KST 날짜별 grassCount > 0 || 기록글 ≥ 1 (같은 날 둘 다여도 1일)
 * - 기록글 인정(isRecord): 필수 섹션이 다 채워지면 true
 * - 진행 중 상태: 팀 없음 → EXCLUDED/NO_TEAM · 첫 참가 주 → EXCLUDED/FIRST_WEEK · 면제 → EXEMPT · 3일 && 1개 → CONDITION_MET · 그 외 NOT_YET
 * - 경고: 저장값이 아니라 판정 이력을 처음부터 다시 훑는다(replay). 2주 연속 통과 → 가장 오래된 경고 차감, 3개 → 벌칙 대상(차감 정지)
 * - 마스킹: 비공개 팀 → TeamLabel PRIVATE (조회자 무관, E-23) · 삭제된 팀 → DELETED
 * - 미리보기: replay를 가정(scenario)으로 한 번 더 돌려 차이를 낸다. basis = 'v' + db.version
 */
import { addDays, isDateString, isMonday, kstDateOf, mondayOf, weekDates } from '@/shared/lib/kst';
import type {
  GrassFetchStatus,
  JudgmentStatus,
  LiveWeekStatus,
  PenaltyChange,
  PostSectionKey,
  PostType,
  SkipReason,
  TeamLabelKind,
  WarningStanding,
} from '../__generated__/schema-types';
import { grassUpdatedAt, judgmentExecutionTime, type MockClock } from '../clock';
import { getMockControl } from '../control';
import { gqlError } from '../errors';
import { hash01 } from './seed';
import {
  cmpTime,
  db,
  findMember,
  findTeam,
  isAtOrBefore,
  teamsOfMember,
  type CommentRow,
  type DateStr,
  type Id,
  type JudgmentRow,
  type NoticeRow,
  type PostRow,
  type TeamRow,
  type WarningRow,
} from './store';

/* ================================================================== */
/* 보이기 규칙 (목 시각 기준)                                             */
/* ================================================================== */

export const isPostVisible = (p: PostRow, clock: MockClock) => !p.deletedAt && isAtOrBefore(p.createdAt, clock.now);

/** 삭제 안 됐고 now 이전에 쓴 글, 최신순(createdAt desc, id desc) */
export function visiblePosts(clock: MockClock): PostRow[] {
  return db.posts.filter((p) => isPostVisible(p, clock)).sort(byNewest);
}

export function visibleComments(postId: Id, clock: MockClock): CommentRow[] {
  return db.comments
    .filter((c) => c.postId === postId && !c.deletedAt && isAtOrBefore(c.createdAt, clock.now))
    .sort((a, b) => cmpTime(a.createdAt, b.createdAt) || a.id.localeCompare(b.id));
}

/** 삭제 안 된 글에 달린 보이는 댓글 전체 (작성자 집계 · 관리자 목록) */
export function allVisibleComments(clock: MockClock): CommentRow[] {
  const livePosts = new Set(db.posts.filter((p) => isPostVisible(p, clock)).map((p) => p.id));
  return db.comments.filter((c) => !c.deletedAt && livePosts.has(c.postId) && isAtOrBefore(c.createdAt, clock.now));
}

/** 고정 먼저, 그다음 최신순 (NT-01) */
export function visibleNotices(clock: MockClock): NoticeRow[] {
  return db.notices
    .filter((n) => !n.deletedAt && isAtOrBefore(n.createdAt, clock.now))
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || cmpTime(b.createdAt, a.createdAt) || Number(b.id) - Number(a.id));
}

export const isJudgmentVisible = (j: JudgmentRow, clock: MockClock) => isAtOrBefore(j.executedAt, clock.now);

/** 배치가 이미 만든 판정 행 (보류 포함). memberId 주면 그 회원만, 오래된 주부터 */
export function visibleJudgments(clock: MockClock, memberId?: Id): JudgmentRow[] {
  return db.judgments
    .filter((j) => (!memberId || j.memberId === memberId) && isJudgmentVisible(j, clock))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart) || Number(a.id) - Number(b.id));
}

export function judgmentFor(memberId: Id, weekStart: DateStr, clock: MockClock): JudgmentRow | undefined {
  return db.judgments.find((j) => j.memberId === memberId && j.weekStart === weekStart && isJudgmentVisible(j, clock));
}

export function byNewest<T extends { createdAt: string; id: string }>(a: T, b: T): number {
  return cmpTime(b.createdAt, a.createdAt) || b.id.localeCompare(a.id);
}

/* ================================================================== */
/* 게시글 계산                                                           */
/* ================================================================== */

const REQUIRED: Record<PostType, PostSectionKey[]> = {
  TROUBLESHOOTING: ['PROBLEM', 'CAUSE', 'SOLUTION'],
  DEVLOG: ['DID', 'LEARNED'],
};

export const requiredSections = (type: PostType): PostSectionKey[] => REQUIRED[type];

/** 필수 섹션이 다 채워졌는가 (DB 1-5 is_record) */
export function isRecord(p: Pick<PostRow, 'type' | 'sections'>): boolean {
  return REQUIRED[p.type].every((k) => (p.sections[k] ?? '').trim().length > 0);
}

/** 주차 귀속 날짜 (KST, 작성 시각 기준 — Q-11 작성일 기준으로 둔다) */
export const writtenDateOf = (p: PostRow): DateStr => kstDateOf(p.createdAt);

/** 그 회원이 그날 쓴 (보이는) 기록글 */
export function recordPostsOn(memberId: Id, date: DateStr, clock: MockClock): PostRow[] {
  return db.posts.filter((p) => p.authorId === memberId && isPostVisible(p, clock) && isRecord(p) && writtenDateOf(p) === date);
}

/** 판정 실행이 끝난 주인가 (그 주 판정 행이 now 이전에 만들어졌다) */
export function isWeekExecuted(weekStart: DateStr, clock: MockClock): boolean {
  if (!isAtOrBefore(judgmentExecutionTime(weekStart), clock.now)) return false;
  const rows = db.judgments.filter((j) => j.weekStart === weekStart);
  if (rows.length > 0) return rows.some((j) => isJudgmentVisible(j, clock));
  // 시드 범위보다 오래된 주는 실행된 것으로 본다
  const earliest = db.judgments.reduce<string | null>((m, j) => (m === null || j.weekStart < m ? j.weekStart : m), null);
  return earliest !== null && weekStart < earliest;
}

/** Post.inFinalizedWeek (M-03): 글쓴이의 그 주 판정이 확정됐으면 true. 보류 · 실행 전이면 false */
export function inFinalizedWeek(p: PostRow, clock: MockClock): boolean {
  const week = mondayOf(writtenDateOf(p));
  const j = judgmentFor(p.authorId, week, clock);
  if (j) return j.status !== 'HOLD';
  return isWeekExecuted(week, clock);
}

/* ================================================================== */
/* 잔디                                                                  */
/* ================================================================== */

/** 결정적 잔디 개수. 시드 덮어쓰기 > zero 모드 > 회원 id 시드 의사 난수 */
export function grassCount(memberId: Id, date: DateStr): number {
  const o = db.grassOverrides[memberId]?.[date];
  if (o !== undefined) return o;
  const m = findMember(memberId);
  if (!m || m.grassMode === 'zero') return 0;
  const activity = 0.3 + hash01(`a${memberId}`) * 0.45;
  const h = hash01(`g${memberId}:${date}`);
  if (h > activity) return 0;
  return 1 + Math.floor(hash01(`c${memberId}:${date}`) * 6);
}

/** GitHub contributionLevel 흉내 — 목업처럼 개수 그대로 0~4 */
export const grassLevel = (count: number): number => Math.max(0, Math.min(4, count));

/** 잔디 조회 상태. DevToolbar 강제값은 조회자 본인에게만 적용한다 */
export function grassStatusOf(memberId: Id, viewerId: Id | null | undefined): GrassFetchStatus {
  const forced = getMockControl().grass;
  if (forced !== 'auto' && viewerId && viewerId === memberId) {
    return forced === 'ok' ? 'OK' : forced === 'failed' ? 'FAILED' : 'IDENTITY_MISMATCH';
  }
  return findMember(memberId)?.grassStatus ?? 'OK';
}

/** 잔디 캐시 시각. OK면 오늘(또는 어제) 06:00, 실패면 그 전날 06:00(마지막 성공) */
export function grassUpdatedAtOf(status: GrassFetchStatus, clock: MockClock): string {
  const ok = grassUpdatedAt(clock);
  if (status === 'OK') return ok;
  return addDaysIso(ok, -1);
}

function addDaysIso(iso: string, n: number): string {
  // 'YYYY-MM-DDTHH:mm:ss+09:00' 모양만 다룬다
  return `${addDays(iso.slice(0, 10), n)}${iso.slice(10)}`;
}

/** 이 날짜까지는 잔디 값이 캐시에 있다 */
const knownThrough = (status: GrassFetchStatus, clock: MockClock): DateStr => grassUpdatedAtOf(status, clock).slice(0, 10);

export type GrassDayData = { date: DateStr; count: number; level: number };

/** PR-01 ⑦ 최근 12개월 (53주 × 7일, 이번 주 일요일까지. 아직 모르는 날은 0) */
export function grassCalendarData(memberId: Id, viewerId: Id | null | undefined, clock: MockClock) {
  const status = grassStatusOf(memberId, viewerId);
  const through = knownThrough(status, clock);
  const start = addDays(clock.currentWeekStart, -52 * 7);
  const days: GrassDayData[] = Array.from({ length: 53 * 7 }, (_, i) => {
    const date = addDays(start, i);
    const count = date <= through ? grassCount(memberId, date) : 0;
    return { date, count, level: grassLevel(count) };
  });
  return {
    status,
    updatedAt: grassUpdatedAtOf(status, clock),
    days,
    privateContributionSuspected: privateContributionSuspected(memberId, viewerId, clock),
  };
}

/** E-39 추정: 최근 4주 잔디 합계 0인데 기록글은 있다 */
export function privateContributionSuspected(memberId: Id, viewerId: Id | null | undefined, clock: MockClock): boolean {
  const status = grassStatusOf(memberId, viewerId);
  if (status !== 'OK') return false;
  const through = knownThrough(status, clock);
  const from = addDays(through, -27);
  let total = 0;
  for (let d = from; d <= through; d = addDays(d, 1)) total += grassCount(memberId, d);
  if (total > 0) return false;
  return db.posts.some((p) => p.authorId === memberId && isPostVisible(p, clock) && isRecord(p) && writtenDateOf(p) >= from);
}

/* ================================================================== */
/* 주간 활동                                                             */
/* ================================================================== */

export type DayActivityData = {
  date: DateStr;
  grassCount: number | null;
  grassLevel: number | null;
  hasGrass: boolean;
  recordCount: number | null;
  hasRecord: boolean;
  verified: boolean;
  isFuture: boolean;
  isToday: boolean;
};

export type LiveWeekData = {
  status: LiveWeekStatus;
  skipReason: SkipReason | null;
  verifiedDaysNeeded: number;
  recordsNeeded: number;
};

export type WeekActivityData = {
  weekStart: DateStr;
  weekEnd: DateStr;
  isCurrentWeek: boolean;
  days: DayActivityData[];
  verifiedDays: number | null;
  recordCount: number | null;
  live: LiveWeekData | null;
  judgment: JudgmentRow | null;
  grassStatus: GrassFetchStatus;
  grassUpdatedAt: string | null;
  privateContributionSuspected: boolean;
};

/** 이번 주 요일 7칸 (개수 포함) */
export function currentWeekDays(memberId: Id, viewerId: Id | null | undefined, clock: MockClock): DayActivityData[] {
  const status = grassStatusOf(memberId, viewerId);
  const through = knownThrough(status, clock);
  return weekDates(clock.currentWeekStart).map((date) => {
    const isFuture = date > clock.today;
    const isToday = date === clock.today;
    if (isFuture) {
      return { date, grassCount: null, grassLevel: null, hasGrass: false, recordCount: null, hasRecord: false, verified: false, isFuture, isToday };
    }
    const count = status === 'OK' ? (date <= through ? grassCount(memberId, date) : 0) : null;
    const rec = recordPostsOn(memberId, date, clock).length;
    const hasGrass = (count ?? 0) > 0;
    return {
      date,
      grassCount: count,
      grassLevel: count === null ? null : grassLevel(count),
      hasGrass,
      recordCount: rec,
      hasRecord: rec > 0,
      verified: hasGrass || rec > 0,
      isFuture,
      isToday,
    };
  });
}

/** 지난 주 요일 7칸 — 판정 스냅숏(boolean만) 또는 지금 데이터로 계산한 boolean */
function pastWeekDays(memberId: Id, weekStart: DateStr, judgment: JudgmentRow | undefined, clock: MockClock): DayActivityData[] {
  return weekDates(weekStart).map((date, i) => {
    const snap = judgment?.days[i];
    const hasGrass = snap ? snap.hasGrass : grassCount(memberId, date) > 0;
    const hasRecord = snap ? snap.hasRecord : recordPostsOn(memberId, date, clock).length > 0;
    return {
      date,
      grassCount: null,
      grassLevel: null,
      hasGrass,
      recordCount: null,
      hasRecord,
      verified: hasGrass || hasRecord,
      isFuture: false,
      isToday: false,
    };
  });
}

export function exemptionPeriodOn(weekStart: DateStr) {
  return db.exemptionPeriods.find((e) => e.weekStart === weekStart);
}

export function approvedPersonalExemption(memberId: Id, weekStart: DateStr) {
  return db.personalExemptions.find((e) => e.memberId === memberId && e.weekStart === weekStart && e.status === 'APPROVED');
}

/** 이번 주 진행 상태 (판정 전) */
export function liveWeek(memberId: Id, viewerId: Id | null | undefined, clock: MockClock): LiveWeekData & { verifiedDays: number; recordCount: number } {
  const days = currentWeekDays(memberId, viewerId, clock);
  const verifiedDays = days.filter((d) => d.verified).length;
  const recordCount = days.reduce((s, d) => s + (d.recordCount ?? 0), 0);
  const needs = { verifiedDaysNeeded: Math.max(0, 3 - verifiedDays), recordsNeeded: Math.max(0, 1 - recordCount) };
  const member = findMember(memberId);
  const week = clock.currentWeekStart;
  let status: LiveWeekStatus;
  let skipReason: SkipReason | null = null;
  if (teamsOfMember(memberId).length === 0) {
    status = 'EXCLUDED';
    skipReason = 'NO_TEAM';
  } else if (member?.firstTeamJoinedAt && mondayOf(kstDateOf(member.firstTeamJoinedAt)) === week) {
    status = 'EXCLUDED';
    skipReason = 'FIRST_WEEK';
  } else if (exemptionPeriodOn(week)) {
    status = 'EXEMPT';
    skipReason = 'EXEMPTION_PERIOD';
  } else if (approvedPersonalExemption(memberId, week)) {
    status = 'EXEMPT';
    skipReason = 'PERSONAL_EXEMPTION';
  } else {
    status = verifiedDays >= 3 && recordCount >= 1 ? 'CONDITION_MET' : 'NOT_YET';
  }
  return { status, skipReason, ...needs, verifiedDays, recordCount };
}

/** myWeek · Member.currentWeek. weekStart는 월요일이어야 하고 미래 주면 안 된다(호출 측에서 검사) */
export function weekActivity(memberId: Id, weekStart: DateStr, viewerId: Id | null | undefined, clock: MockClock): WeekActivityData {
  const grassStatus = grassStatusOf(memberId, viewerId);
  const base = {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    grassStatus,
    grassUpdatedAt: grassUpdatedAtOf(grassStatus, clock),
    privateContributionSuspected: privateContributionSuspected(memberId, viewerId, clock),
  };
  if (weekStart === clock.currentWeekStart) {
    const live = liveWeek(memberId, viewerId, clock);
    const skipped = live.status === 'EXCLUDED' || live.status === 'EXEMPT';
    return {
      ...base,
      isCurrentWeek: true,
      days: currentWeekDays(memberId, viewerId, clock),
      verifiedDays: skipped || grassStatus !== 'OK' ? null : live.verifiedDays,
      recordCount: live.recordCount,
      live: { status: live.status, skipReason: live.skipReason, verifiedDaysNeeded: live.verifiedDaysNeeded, recordsNeeded: live.recordsNeeded },
      judgment: null,
    };
  }
  const judgment = judgmentFor(memberId, weekStart, clock);
  const days = pastWeekDays(memberId, weekStart, judgment, clock);
  return {
    ...base,
    isCurrentWeek: false,
    days,
    verifiedDays: judgment ? judgment.verifiedDays : days.filter((d) => d.verified).length,
    recordCount: judgment ? judgment.recordCount : weekRecordCount(memberId, weekStart, clock),
    live: null,
    judgment: judgment ?? null,
  };
}

function weekRecordCount(memberId: Id, weekStart: DateStr, clock: MockClock): number {
  return weekDates(weekStart).reduce((s, d) => s + recordPostsOn(memberId, d, clock).length, 0);
}

/* ================================================================== */
/* 경고 replay                                                           */
/* ================================================================== */

/** 미리보기용 가정. 실제 DB는 건드리지 않는다 */
export type Scenario = {
  /** 판정 상태 바꾸기 (정정 · 소급 면제) */
  judgmentOverrides?: Record<Id, { status: JudgmentStatus; skipReason?: SkipReason | null }>;
  /** 소프트 삭제된 경고를 살아 있다고 보기 (경고 복구) */
  restoreWarningIds?: Id[];
  /** 지금 시점에 이행 체크를 했다고 보기 */
  fulfillNow?: boolean;
};

export type ReplayResult = {
  /** replay 대상 경고 id → 상태 (fixedStanding 경고 포함) */
  standing: Map<Id, WarningStanding>;
  /** 살아 있는 경고, 오래된 순. 가정으로 생긴 경고는 id가 'virtual:<judgmentId>' */
  active: { id: Id; weekStart: DateStr; teamIds: Id[] }[];
  activeCount: number;
  consecutivePasses: number;
  isPenaltyTarget: boolean;
  reachedWeekStart: DateStr | null;
  reachedAt: string | null;
};

const replayCache = new Map<string, ReplayResult>();
let replayCacheKey = '';

/** 회원의 경고 상태를 판정 이력에서 다시 계산한다. scenario 없으면 캐시(version · now 기준) */
export function replayWarnings(memberId: Id, clock: MockClock, scenario?: Scenario): ReplayResult {
  if (!scenario) {
    const key = `${db.version}|${clock.now}`;
    if (key !== replayCacheKey) {
      replayCache.clear();
      replayCacheKey = key;
    }
    const hit = replayCache.get(memberId);
    if (hit) return hit;
    const res = runReplay(memberId, clock, {});
    replayCache.set(memberId, res);
    return res;
  }
  return runReplay(memberId, clock, scenario);
}

function runReplay(memberId: Id, clock: MockClock, sc: Scenario): ReplayResult {
  const standing = new Map<Id, WarningStanding>();
  const restore = new Set(sc.restoreWarningIds ?? []);
  const memberWarnings = db.warnings.filter((w) => w.memberId === memberId);
  for (const w of memberWarnings) if (w.fixedStanding && !w.deleted && !w.retractedAt) standing.set(w.id, w.fixedStanding);

  const judgments = visibleJudgments(clock, memberId);
  const fulfillments = db.penaltyFulfillments
    .filter((f) => f.memberId === memberId && isAtOrBefore(f.fulfilledAt, clock.now))
    .sort((a, b) => a.effectiveWeekStart.localeCompare(b.effectiveWeekStart));
  if (sc.fulfillNow) {
    fulfillments.push({ id: 'virtual', memberId, effectiveWeekStart: clock.currentWeekStart, fulfilledAt: clock.now, fulfilledById: '' });
  }

  let active: ReplayResult['active'] = [];
  let streak = 0;
  let reachedWeekStart: DateStr | null = null;
  let reachedAt: string | null = null;
  let fi = 0;

  const applyFulfillment = () => {
    for (const a of active) if (!a.id.startsWith('virtual:')) standing.set(a.id, 'FULFILLED');
    active = [];
    streak = 0;
    reachedWeekStart = null;
    reachedAt = null;
  };

  for (const j of judgments) {
    while (fi < fulfillments.length && (fulfillments[fi]?.effectiveWeekStart ?? '') <= j.weekStart) {
      applyFulfillment();
      fi += 1;
    }
    const override = sc.judgmentOverrides?.[j.id];
    const status = override?.status ?? j.status;
    if (status === 'FAIL') {
      const w = memberWarnings.find((x) => x.judgmentId === j.id && !x.fixedStanding);
      const live = w && !(w.retractedAt && j.status === 'FAIL') && (!w.deleted || restore.has(w.id));
      if (w && live && (j.status === 'FAIL' || override)) {
        active.push({ id: w.id, weekStart: j.weekStart, teamIds: w.deleted && restore.has(w.id) ? w.originalTeamIds : w.teamIds });
      } else if (!w && override) {
        // 통과 → 미달 정정: 새 경고가 생긴다고 본다 (카테고리 = 지금 소속 팀)
        active.push({ id: `virtual:${j.id}`, weekStart: j.weekStart, teamIds: teamsOfMember(memberId).map((t) => t.id) });
      }
      streak = 0;
      if (active.length >= 3 && reachedWeekStart === null) {
        reachedWeekStart = j.weekStart;
        reachedAt = j.judgedAt ?? j.executedAt;
      }
    } else if (status === 'PASS') {
      streak += 1;
      if (streak >= 2 && active.length > 0 && active.length < 3) {
        const oldest = active.shift();
        if (oldest && !oldest.id.startsWith('virtual:')) standing.set(oldest.id, 'DEDUCTED');
        streak = 0;
      }
    }
    // EXEMPT · EXCLUDED · HOLD: 건너뛴다 (연속이 끊기지도 늘지도 않는다)
  }
  while (fi < fulfillments.length) {
    applyFulfillment();
    fi += 1;
  }
  for (const a of active) if (!a.id.startsWith('virtual:')) standing.set(a.id, 'ACTIVE');
  const isPenaltyTarget = active.length >= 3;
  return {
    standing,
    active,
    activeCount: active.length,
    consecutivePasses: streak,
    isPenaltyTarget,
    reachedWeekStart: isPenaltyTarget ? reachedWeekStart : null,
    reachedAt: isPenaltyTarget ? reachedAt : null,
  };
}

/** 경고가 회원 화면에 나오는가 (소프트 삭제 · 회수 · 판정 미공개 제외) */
export function isWarningListed(w: WarningRow, clock: MockClock): boolean {
  if (w.deleted || w.retractedAt) return false;
  if (!w.judgmentId) return true;
  const j = db.judgments.find((x) => x.id === w.judgmentId);
  return !!j && isJudgmentVisible(j, clock) && j.status === 'FAIL';
}

export type WarningStateData = {
  activeCount: number;
  isPenaltyTarget: boolean;
  consecutivePasses: number;
  weeksUntilDeduction: number | null;
  /** 팀 id → 유효 경고 수 (중복 집계) */
  byCategory: { teamId: Id; count: number }[];
};

export function warningState(memberId: Id, clock: MockClock): WarningStateData {
  const r = replayWarnings(memberId, clock);
  const counts = new Map<Id, number>();
  for (const a of r.active) for (const t of a.teamIds) counts.set(t, (counts.get(t) ?? 0) + 1);
  const byCategory = [...counts.entries()]
    .map(([teamId, count]) => ({ teamId, count }))
    .sort((a, b) => b.count - a.count || Number(a.teamId) - Number(b.teamId));
  return {
    activeCount: r.activeCount,
    isPenaltyTarget: r.isPenaltyTarget,
    consecutivePasses: r.consecutivePasses,
    // E-41: 벌칙 대상이거나 경고 0이면 null
    weeksUntilDeduction: r.activeCount > 0 && !r.isPenaltyTarget ? Math.max(0, 2 - r.consecutivePasses) : null,
    byCategory,
  };
}

/** 회원 화면 경고 이력 (AC-02 ③), 최신 주부터 */
export function warningHistory(memberId: Id, clock: MockClock): { row: WarningRow; standing: WarningStanding }[] {
  const r = replayWarnings(memberId, clock);
  return db.warnings
    .filter((w) => w.memberId === memberId && isWarningListed(w, clock))
    .map((row) => ({ row, standing: r.standing.get(row.id) ?? row.fixedStanding ?? 'ACTIVE' }))
    .sort((a, b) => b.row.weekStart.localeCompare(a.row.weekStart));
}

/** 그 팀 카테고리가 붙은 유효 경고 수 (TM-05 경고 열) */
export function teamWarningCount(memberId: Id, teamId: Id, clock: MockClock): number {
  return replayWarnings(memberId, clock).active.filter((a) => a.teamIds.includes(teamId)).length;
}

/** 그 판정 주에 받은 경고가 지금 유효한가 (PR-01 '미달 (경고)') */
export function judgmentHasActiveWarning(j: JudgmentRow, clock: MockClock): boolean {
  if (j.status !== 'FAIL') return false;
  const w = db.warnings.find((x) => x.judgmentId === j.id);
  return !!w && replayWarnings(j.memberId, clock).standing.get(w.id) === 'ACTIVE';
}

/* ================================================================== */
/* 재계산 미리보기                                                        */
/* ================================================================== */

export const currentBasis = (): string => `v${db.version}`;

/** 반영 뮤테이션 첫 줄에서 부른다. expectedBasis가 오면 지금 basis와 같아야 한다 */
export function assertBasis(expectedBasis: string | null | undefined): void {
  if (expectedBasis != null && expectedBasis !== currentBasis()) {
    throw gqlError('PREVIEW_STALE', { message: 'mock: preview basis is stale' });
  }
}

export type RecalcPreviewData = {
  memberId: Id;
  warningCountBefore: number;
  warningCountAfter: number;
  penaltyChange: PenaltyChange;
  affectedWeekCount: number;
  frozenByFulfillment: boolean;
  restoresWithoutCategory: boolean;
  basis: string;
};

/**
 * 가정 하나를 replay해서 전후를 비교한다.
 * fromWeek: 바뀌는 가장 이른 주 (다시 계산되는 주차 수 · 이행 고정점 판단)
 */
export function recalcPreview(memberId: Id, scenario: Scenario, fromWeek: DateStr, clock: MockClock, extra: { restoresWithoutCategory?: boolean } = {}): RecalcPreviewData {
  const before = replayWarnings(memberId, clock);
  const after = replayWarnings(memberId, clock, scenario);
  const penaltyChange: PenaltyChange =
    before.isPenaltyTarget === after.isPenaltyTarget ? 'NONE' : after.isPenaltyTarget ? 'ENTER' : 'RELEASE';
  const affectedWeekCount = visibleJudgments(clock, memberId).filter((j) => j.weekStart >= fromWeek && j.status !== 'HOLD').length;
  const lastFix = db.penaltyFulfillments
    .filter((f) => f.memberId === memberId && isAtOrBefore(f.fulfilledAt, clock.now))
    .reduce<string | null>((m, f) => (m === null || f.effectiveWeekStart > m ? f.effectiveWeekStart : m), null);
  return {
    memberId,
    warningCountBefore: before.activeCount,
    warningCountAfter: after.activeCount,
    penaltyChange,
    affectedWeekCount: Math.max(1, affectedWeekCount),
    frozenByFulfillment: lastFix !== null && fromWeek < lastFix,
    restoresWithoutCategory: !!extra.restoresWithoutCategory,
    basis: currentBasis(),
  };
}

/** 판정 정정 가정. 미달이 아니게 되면 그 주 경고는 회수된다고 본다 */
export function correctionScenario(judgmentId: Id, newStatus: JudgmentStatus): Scenario {
  return { judgmentOverrides: { [judgmentId]: { status: newStatus, skipReason: newStatus === 'EXEMPT' ? 'PERSONAL_EXEMPTION' : null } } };
}

/** 그 주를 면제로 바꾸는(또는 면제를 푸는) 가정 — 회원 한 명분 */
export function weekExemptionScenario(memberId: Id, weekStart: DateStr, exempt: boolean, reason: SkipReason, clock: MockClock): Scenario | null {
  const j = judgmentFor(memberId, weekStart, clock);
  if (!j || j.status === 'HOLD' || j.status === 'EXCLUDED') return null;
  if (exempt) {
    if (j.status === 'EXEMPT') return null;
    return { judgmentOverrides: { [j.id]: { status: 'EXEMPT', skipReason: reason } } };
  }
  if (j.status !== 'EXEMPT' || j.skipReason !== reason) return null;
  // 면제를 풀면 스냅숏으로 다시 판정한다 (C-05 미결 → 목 가정)
  const v = j.days.filter((d) => d.hasGrass || d.hasRecord).length;
  const r = j.days.filter((d) => d.hasRecord).length;
  return { judgmentOverrides: { [j.id]: { status: v >= 3 && r >= 1 ? 'PASS' : 'FAIL', skipReason: null } } };
}

/* ================================================================== */
/* 팀                                                                    */
/* ================================================================== */

export type TeamLabelData = { kind: TeamLabelKind; name: string | null };

/** 회원 화면용 팀 표기 — 비공개는 조회자와 무관하게 PRIVATE (E-23), 삭제 → DELETED */
export function teamLabel(teamId: Id): TeamLabelData {
  const t = findTeam(teamId);
  if (!t || t.deletedAt) return { kind: 'DELETED', name: null };
  if (!t.isPublic) return { kind: 'PRIVATE', name: null };
  return { kind: 'PUBLIC', name: t.name };
}

/** 관리자 전용 실명 표기 */
export function adminTeamLabel(teamId: Id) {
  const t = findTeam(teamId);
  return { teamId, name: t?.name ?? '삭제된 팀', isPublic: t?.isPublic ?? false, isDeleted: !t || !!t.deletedAt };
}

/** 글에 노출할 공개 팀 (비공개 · 삭제 · 미연결 → null) */
export function publicTeamOf(p: PostRow): TeamRow | null {
  const t = p.teamId ? findTeam(p.teamId) : undefined;
  return t && !t.deletedAt && t.isPublic ? t : null;
}

export function teamWeekSummary(teamId: Id, clock: MockClock) {
  const rows = db.memberships.filter((m) => m.teamId === teamId);
  const s = { passCount: 0, failCount: 0, notYetCount: 0, excludedCount: 0 };
  for (const m of rows) {
    const st = liveWeek(m.memberId, null, clock).status;
    if (st === 'CONDITION_MET') s.passCount += 1;
    else if (st === 'NOT_YET') s.notYetCount += 1;
    else s.excludedCount += 1;
  }
  return s;
}

/* ================================================================== */
/* 관리자                                                                */
/* ================================================================== */

/** 가장 최근에 실행된 판정 주 */
export function latestExecutedWeek(clock: MockClock): DateStr | null {
  return visibleJudgments(clock).reduce<string | null>((m, j) => (m === null || j.weekStart > m ? j.weekStart : m), null);
}

export function judgmentsOfWeek(weekStart: DateStr, clock: MockClock): JudgmentRow[] {
  return visibleJudgments(clock).filter((j) => j.weekStart === weekStart);
}

export function judgmentCounts(rows: JudgmentRow[]) {
  const c = { pass: 0, fail: 0, exempt: 0, firstWeek: 0, noTeam: 0, hold: 0 };
  for (const j of rows) {
    if (j.status === 'PASS') c.pass += 1;
    else if (j.status === 'FAIL') c.fail += 1;
    else if (j.status === 'EXEMPT') c.exempt += 1;
    else if (j.status === 'HOLD') c.hold += 1;
    else if (j.skipReason === 'FIRST_WEEK') c.firstWeek += 1;
    else c.noTeam += 1;
  }
  return c;
}

/** 판정 실행 시각 (그 주 행 중 가장 늦은 executedAt) */
export function weekExecutedAt(weekStart: DateStr, clock: MockClock): string | null {
  const rows = judgmentsOfWeek(weekStart, clock);
  if (rows.length === 0) return null;
  return rows.reduce((m, j) => (cmpTime(j.executedAt, m) > 0 ? j.executedAt : m), rows[0]?.executedAt ?? '');
}

/** 그 주 판정이 끝났는가 → 면제 등록 · 승인이 소급이 된다 */
export const isRetroactiveWeek = (weekStart: DateStr, clock: MockClock) => isWeekExecuted(weekStart, clock);

/** 벌칙 대상 회원 (ACTIVE 회원만), 도달 최신순 */
export function penaltyTargetIds(clock: MockClock): Id[] {
  return db.members
    .filter((m) => m.status === 'ACTIVE' && replayWarnings(m.id, clock).isPenaltyTarget)
    .sort((a, b) => {
      const ra = replayWarnings(a.id, clock).reachedAt ?? '';
      const rb = replayWarnings(b.id, clock).reachedAt ?? '';
      return rb.localeCompare(ra) || Number(a.id) - Number(b.id);
    })
    .map((m) => m.id);
}

/* ================================================================== */
/* 입력 검사                                                             */
/* ================================================================== */

/** 주 시작일 인자 검사: 날짜 형식 · 월요일 */
export function isMondayDate(d: unknown): d is string {
  return isDateString(d) && isMonday(d);
}
