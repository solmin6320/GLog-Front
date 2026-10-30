/** 관리자 — 판정 · 경고 · 벌칙 뮤테이션과 관리자 조회 전부 (백엔드 admin · member-approval · exemption 스키마) */
import { addDays, weekDates } from '@/shared/lib/kst';
import type {
  JudgmentStatus,
  MutationCorrectJudgmentArgs,
  MutationFulfillPenaltyArgs,
  MutationRestoreWarningArgs,
  MutationRetryJudgmentHoldArgs,
  QueryAdminDeletedWarningsArgs,
  QueryAdminJudgmentHoldsArgs,
  QueryAdminJudgmentsArgs,
  QueryAdminMembersArgs,
  QueryAdminPenaltyTargetsArgs,
  QueryAdminPostsArgs,
  QueryExemptionPeriodsArgs,
  QueryPersonalExemptionRequestsArgs,
  QueryPreviewExemptionPeriodArgs,
  QueryPreviewJudgmentCorrectionArgs,
  QueryPreviewPersonalExemptionApprovalArgs,
  QueryPreviewWarningRestoreArgs,
} from '../__generated__/schema-types';
import {
  approvedPersonalExemption,
  correctionScenario,
  exemptionPeriodOn,
  grassCount,
  isJudgmentVisible,
  isMondayDate,
  isRetroactiveWeek,
  judgmentCounts,
  judgmentsOfWeek,
  latestExecutedWeek,
  penaltyTargetIds,
  recalcPreview,
  recordPostsOn,
  replayWarnings,
  visibleJudgments,
  weekExecutedAt,
  weekExemptionScenario,
} from '../db/derive';
import {
  db,
  findJudgment,
  findMember,
  findPersonalExemption,
  findWarning,
  liveTeam,
  nextId,
  teamsOfMember,
  touch,
  type Id,
  type JudgmentRow,
  type WarningRow,
} from '../db/store';
import { gqlError } from '../errors';
import type { MockContext, Resolvers } from '../types';
import {
  adminJudgmentRowView,
  adminMemberView,
  adminPostItemView,
  contentItems,
  deletedWarningView,
  exemptionPeriodView,
  impactView,
  itemsPage,
  memberBriefView,
  penaltyTargetView,
  personalExemptionView,
  requireViewer,
} from '../views';

const STATUS_ORDER: Record<JudgmentStatus, number> = { HOLD: 0, FAIL: 1, PASS: 2, EXEMPT: 3, EXCLUDED: 4 };

function sortJudgmentRows(rows: JudgmentRow[]): JudgmentRow[] {
  const nick = (id: Id) => db.members.find((m) => m.id === id)?.nickname ?? '';
  return [...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || nick(a.memberId).localeCompare(nick(b.memberId), 'ko'));
}

const matchesMember = (memberId: Id, keyword: string | null | undefined) => {
  const q = keyword?.trim().toLowerCase().replace(/^@/, '');
  if (!q) return true;
  const m = db.members.find((x) => x.id === memberId);
  return !!m && (m.nickname.toLowerCase().includes(q) || m.githubLogin.toLowerCase().includes(q));
};

/** 정정 사유 길이 (DB 1-14 VARCHAR(500), ACC-FIX-06) */
const CORRECTION_REASON_MAX = 500;

/** 그 판정이 만든 경고 행 (시드 이전 이력 fixedStanding 제외) — replay와 같은 규칙으로 찾는다 */
const warningOfJudgment = (j: JudgmentRow): WarningRow | undefined =>
  db.warnings.find((w) => w.judgmentId === j.id && !w.fixedStanding);

/** 새 경고 행 (판정 미달 · 통과→미달 정정 · 보류 재판정 미달). 카테고리 = 지금 소속 팀 (replay 가정과 같다) */
function addWarning(j: JudgmentRow): void {
  const teamIds = teamsOfMember(j.memberId).map((t) => t.id);
  db.warnings.push({
    id: nextId('warnings'),
    memberId: j.memberId,
    weekStart: j.weekStart,
    judgmentId: j.id,
    verifiedDays: j.verifiedDays,
    recordCount: j.recordCount,
    teamIds,
    originalTeamIds: [...teamIds],
    deleted: null,
    retractedAt: null,
  });
}

/** 판정 스냅숏의 인증일 · 기록글 (면제 · 제외에서 통과 · 미달로 정정할 때 값을 채운다) */
function snapshotCounts(j: JudgmentRow): { verifiedDays: number; recordCount: number } {
  return {
    verifiedDays: j.days.filter((d) => d.hasGrass || d.hasRecord).length,
    recordCount: j.days.filter((d) => d.hasRecord).length,
  };
}

/**
 * 보류(API_ERROR) 재판정 (E-35). 지금 잔디 · 기록글로 그 주를 다시 판정한다.
 * 면제 기간 · 승인된 개인 면제가 있으면 면제, 아니면 3일 + 기록글 1개로 통과/미달.
 */
function rejudgeHeld(j: JudgmentRow, ctx: MockContext): void {
  const dates = weekDates(j.weekStart);
  const recordsPerDay = dates.map((d) => recordPostsOn(j.memberId, d, ctx.clock).length);
  j.days = dates.map((d, i) => ({ hasGrass: grassCount(j.memberId, d) > 0, hasRecord: (recordsPerDay[i] ?? 0) > 0 }));
  j.holdReason = null;
  j.judgedAt = ctx.clock.now;
  const exemptReason = exemptionPeriodOn(j.weekStart)
    ? 'EXEMPTION_PERIOD'
    : approvedPersonalExemption(j.memberId, j.weekStart)
      ? 'PERSONAL_EXEMPTION'
      : null;
  if (exemptReason) {
    j.status = 'EXEMPT';
    j.skipReason = exemptReason;
    j.verifiedDays = null;
    j.recordCount = null;
    return;
  }
  j.verifiedDays = j.days.filter((d) => d.hasGrass || d.hasRecord).length;
  j.recordCount = recordsPerDay.reduce((s, n) => s + n, 0);
  j.skipReason = null;
  j.status = j.verifiedDays >= 3 && j.recordCount >= 1 ? 'PASS' : 'FAIL';
  if (j.status === 'FAIL') {
    const w = warningOfJudgment(j);
    if (w) w.retractedAt = null;
    else addWarning(j);
  }
}


/** 판정 정정으로 갈 수 있는 결과: 보류는 불가, 제외(첫 참가 · 팀 없음)는 면제로만, 같은 결과는 불가 */
function assertCorrectable(j: JudgmentRow, to: JudgmentStatus): void {
  if (j.status === 'HOLD' || j.status === to || (j.status === 'EXCLUDED' && to !== 'EXEMPT')) throw gqlError('JUDGMENT_NOT_CORRECTABLE');
}

function weekOrThrow(weekStart: string): void {
  if (!isMondayDate(weekStart)) throw gqlError('INVALID_INPUT', { message: 'mock: weekStart must be a Monday' });
}

/** 소급 면제 미리보기 (RetroExemptionPreview). 판정 전 주면 retroactive=false · items 빈 배열 */
function retroPreview(ctx: MockContext, weekStart: string, memberIds: Id[], reason: 'EXEMPTION_PERIOD' | 'PERSONAL_EXEMPTION') {
  if (!isRetroactiveWeek(weekStart, ctx.clock)) return { weekStart, retroactive: false, items: [] };
  const items = memberIds.flatMap((memberId) => {
    const j = judgmentsOfWeek(weekStart, ctx.clock).find((x) => x.memberId === memberId);
    // 통과 · 미달만 면제로 바뀐다
    if (!j || (j.status !== 'PASS' && j.status !== 'FAIL')) return [];
    const sc = weekExemptionScenario(memberId, weekStart, true, reason, ctx.clock) ?? {};
    return [{ member: memberBriefView(memberId), currentStatus: j.status, impact: impactView(ctx, recalcPreview(memberId, sc, weekStart, ctx.clock)) }];
  });
  return { weekStart, retroactive: true, items };
}

const holdsOf = (ctx: MockContext) =>
  visibleJudgments(ctx.clock)
    .filter((j) => j.status === 'HOLD')
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart) || Number(a.id) - Number(b.id));

export const adminResolvers: Resolvers = {
  Query: {
    adminDashboardSummary: (_: unknown, __: unknown, ctx: MockContext) => {
      const judged = latestExecutedWeek(ctx.clock) ?? addDays(ctx.clock.currentWeekStart, -7);
      return {
        judgedWeekStart: judged,
        pendingMembers: db.members.filter((m) => m.status === 'PENDING').length,
        failedMembers: judgmentsOfWeek(judged, ctx.clock).filter((j) => j.status === 'FAIL').length,
        penaltyTargets: penaltyTargetIds(ctx.clock).length,
        pendingExemptions: db.personalExemptions.filter((e) => e.status === 'PENDING').length,
      };
    },

    // weekStart 생략 = 가장 최근 판정 주. 판정 전 주면 executedAt null · 행 없음. 집계는 검색 · 필터와 무관
    adminJudgments: (_: unknown, { weekStart, keyword, filter, after }: QueryAdminJudgmentsArgs, ctx: MockContext) => {
      const week = weekStart ?? latestExecutedWeek(ctx.clock) ?? addDays(ctx.clock.currentWeekStart, -7);
      weekOrThrow(week);
      if (week > ctx.clock.currentWeekStart) throw gqlError('INVALID_INPUT', { message: 'mock: future week' });
      const all = judgmentsOfWeek(week, ctx.clock);
      const c = judgmentCounts(all);
      const rows = all.filter((j) => {
        if (filter === 'FAIL_ONLY' && j.status !== 'FAIL') return false;
        if (filter === 'HOLD_ONLY' && j.status !== 'HOLD') return false;
        // 팀 없음 제외는 전체 목록에서도 뺀다 (추측)
        if ((filter ?? 'ALL') === 'ALL' && j.status === 'EXCLUDED' && j.skipReason === 'NO_TEAM') return false;
        return matchesMember(j.memberId, keyword);
      });
      return {
        weekStart: week,
        weekEnd: addDays(week, 6),
        executedAt: weekExecutedAt(week, ctx.clock),
        passCount: c.pass,
        failCount: c.fail,
        exemptCount: c.exempt,
        firstWeekCount: c.firstWeek,
        holdCount: c.hold,
        ...itemsPage(sortJudgmentRows(rows), after, (j) => adminJudgmentRowView(ctx, j)),
      };
    },

    adminJudgmentHolds: (_: unknown, { after }: QueryAdminJudgmentHoldsArgs, ctx: MockContext) => {
      const holds = holdsOf(ctx);
      return {
        ...itemsPage(holds, after, (j) => ({
          member: memberBriefView(j.memberId),
          weekStart: j.weekStart,
          reason: j.holdReason ?? 'API_ERROR',
          retryCount: 0,
          retriesExhausted: false,
        })),
        totalCount: holds.length,
        identityMismatchCount: holds.filter((j) => j.holdReason === 'IDENTITY_MISMATCH').length,
      };
    },

    previewJudgmentCorrection: (_: unknown, { judgmentId, status }: QueryPreviewJudgmentCorrectionArgs, ctx: MockContext) => {
      const j = findJudgment(judgmentId);
      if (!j || !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
      assertCorrectable(j, status);
      return {
        judgmentId: j.id,
        member: memberBriefView(j.memberId),
        weekStart: j.weekStart,
        currentStatus: j.status,
        targetStatus: status,
        impact: impactView(ctx, recalcPreview(j.memberId, correctionScenario(j.id, status), j.weekStart, ctx.clock)),
      };
    },

    adminPenaltyTargets: (_: unknown, { after }: QueryAdminPenaltyTargetsArgs, ctx: MockContext) => {
      const ids = penaltyTargetIds(ctx.clock);
      return { ...itemsPage(ids, after, (id) => penaltyTargetView(ctx, id)), totalCount: ids.length };
    },

    adminDeletedWarnings: (_: unknown, { after }: QueryAdminDeletedWarningsArgs, ctx: MockContext) => {
      const rows = db.warnings
        .filter((w) => {
          if (!w.deleted || w.retractedAt) return false;
          const j = w.judgmentId ? findJudgment(w.judgmentId) : undefined;
          return !j || isJudgmentVisible(j, ctx.clock);
        })
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart) || Number(b.id) - Number(a.id));
      return itemsPage(rows, after, (w) => deletedWarningView(ctx, w));
    },

    // 삭제된 경고가 아니면 ALREADY_HANDLED, 복구 대상이 아니면(회수 · 없음) NOT_FOUND
    previewWarningRestore: (_: unknown, { warningId }: QueryPreviewWarningRestoreArgs, ctx: MockContext) => {
      const w = restorableWarning(warningId);
      const view = deletedWarningView(ctx, w);
      return {
        warningId: w.id,
        member: view.member,
        weekStart: w.weekStart,
        restoreTeams: view.restoreTeams,
        teamDeleted: view.teamDeleted,
        impact: impactView(ctx, recalcPreview(w.memberId, { restoreWarningIds: [w.id] }, w.weekStart, ctx.clock)),
      };
    },

    adminMembers: (_: unknown, { status, keyword, after }: QueryAdminMembersArgs) => {
      const f = status ?? 'PENDING';
      const rows = db.members
        .filter((m) => (f === 'ALL' ? m.status === 'PENDING' || m.status === 'REJECTED' : m.status === f))
        .filter((m) => matchesMember(m.id, keyword))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { ...itemsPage(rows, after, adminMemberView), totalCount: rows.length };
    },

    exemptionPeriods: (_: unknown, { after }: QueryExemptionPeriodsArgs) => {
      const rows = [...db.exemptionPeriods].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
      return itemsPage(rows, after, exemptionPeriodView);
    },

    previewExemptionPeriod: (_: unknown, { weekStart }: QueryPreviewExemptionPeriodArgs, ctx: MockContext) => {
      weekOrThrow(weekStart);
      const memberIds = judgmentsOfWeek(weekStart, ctx.clock).map((j) => j.memberId);
      return retroPreview(ctx, weekStart, memberIds, 'EXEMPTION_PERIOD');
    },

    personalExemptionRequests: (_: unknown, { status, after }: QueryPersonalExemptionRequestsArgs) => {
      const s = status ?? 'PENDING';
      const rows = db.personalExemptions.filter((e) => e.status === s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return itemsPage(rows, after, personalExemptionView);
    },

    previewPersonalExemptionApproval: (_: unknown, { id }: QueryPreviewPersonalExemptionApprovalArgs, ctx: MockContext) => {
      const e = findPersonalExemption(id);
      if (!e) throw gqlError('NOT_FOUND');
      if (e.status !== 'PENDING') throw gqlError('ALREADY_HANDLED');
      return retroPreview(ctx, e.weekStart, [e.memberId], 'PERSONAL_EXEMPTION');
    },

    adminPosts: (_: unknown, { filter, keyword, after }: QueryAdminPostsArgs, ctx: MockContext) => {
      const kind = filter === 'POSTS' ? 'POST' : filter === 'COMMENTS' ? 'COMMENT' : 'ALL';
      return itemsPage(contentItems(ctx, { kind, search: keyword }), after, adminPostItemView);
    },
  },

  Mutation: {
    /** AD-01 ⑦ [재시도] — 보류 한 건. 확정된 건은 건너뛰고 현재 결과를 돌려준다. IDENTITY_MISMATCH는 풀리지 않는다(E-08) */
    retryJudgmentHold: (_: unknown, { memberId, weekStart }: MutationRetryJudgmentHoldArgs, ctx: MockContext) => {
      const j = visibleJudgments(ctx.clock, memberId).find((x) => x.weekStart === weekStart);
      if (!j) throw gqlError('NOT_FOUND');
      const wasHold = j.status === 'HOLD';
      if (wasHold && j.holdReason === 'API_ERROR') {
        rejudgeHeld(j, ctx);
        touch();
      }
      return {
        member: memberBriefView(memberId),
        weekStart,
        status: j.status,
        holdReason: j.holdReason,
        resolved: wasHold && j.status !== 'HOLD',
      };
    },

    /** AD-01 ⑨ [전체 재시도] (E-35). API_ERROR 보류만 다시 판정한다 */
    retryAllJudgmentHolds: (_: unknown, __: unknown, ctx: MockContext) => {
      const held = holdsOf(ctx);
      const retryable = held.filter((j) => j.holdReason === 'API_ERROR');
      for (const j of retryable) rejudgeHeld(j, ctx);
      if (retryable.length > 0) touch();
      const resolved = retryable.filter((j) => j.status !== 'HOLD').length;
      return { attempted: held.length, resolved, stillHold: held.length - resolved, failed: 0 };
    },

    /**
     * AD-01 ⑩ [정정하고 재계산] (E-49 · E-50 · E-58 · E-60). 결과는 previewJudgmentCorrection과 같아야 한다:
     * 미달 → 통과/면제면 그 주 경고를 회수(retractedAt), 그 외 → 미달이면 경고를 새로 붙이거나 회수했던 것을 되살린다.
     * 경고 수 · 벌칙은 replay가 다시 계산한다 (이행 체크 고정점도 replay가 지킨다).
     */
    correctJudgment: (_: unknown, { input }: MutationCorrectJudgmentArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const j = findJudgment(input.judgmentId);
      if (!j || !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
      if (input.expectedStatus && input.expectedStatus !== j.status) throw gqlError('JUDGMENT_CHANGED');
      const reason = input.reason.trim();
      if (reason.length < 1) throw gqlError('REASON_REQUIRED');
      if (reason.length > CORRECTION_REASON_MAX) throw gqlError('INVALID_INPUT');
      const before = j.status;
      const after = input.status;
      assertCorrectable(j, after);

      const now = ctx.clock.now;
      const w = warningOfJudgment(j);
      if (before === 'FAIL' && w && !w.retractedAt) w.retractedAt = now;

      if (after === 'EXEMPT') {
        j.verifiedDays = null;
        j.recordCount = null;
      } else if (j.verifiedDays === null || j.recordCount === null) {
        const snap = snapshotCounts(j);
        j.verifiedDays = snap.verifiedDays;
        j.recordCount = snap.recordCount;
      }
      j.status = after;
      // correctionScenario와 같은 사유 (면제로 정정 = 개인 면제 취급)
      j.skipReason = after === 'EXEMPT' ? 'PERSONAL_EXEMPTION' : null;
      j.holdReason = null;
      j.corrected = true;

      if (after === 'FAIL') {
        if (w) w.retractedAt = null;
        else addWarning(j);
      }

      db.judgmentCorrections.push({
        id: nextId('judgmentCorrections'),
        judgmentId: j.id,
        beforeStatus: before,
        afterStatus: after,
        reason,
        correctedById: viewer.id,
        correctedAt: now,
      });
      touch();
      const r = replayWarnings(j.memberId, ctx.clock);
      const onHold = visibleJudgments(ctx.clock, j.memberId).some((x) => x.status === 'HOLD');
      return {
        judgmentId: j.id,
        member: memberBriefView(j.memberId),
        weekStart: j.weekStart,
        status: j.status,
        onHold,
        warningCount: onHold ? null : r.activeCount,
        penaltyTarget: r.isPenaltyTarget,
      };
    },

    /** AD-01 ②-1 ⑥ 이행 완료 — 되돌릴 수 없는 고정점(E-58). 이번 주부터 경고 0 · 연속 0 [Q-10 ⓓ 추측] */
    fulfillPenalty: (_: unknown, { memberId }: MutationFulfillPenaltyArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const m = findMember(memberId);
      if (!m) throw gqlError('NOT_FOUND');
      const r = replayWarnings(m.id, ctx.clock);
      // 벌칙 대상이 아니면(이미 이행 처리됨 · 정정으로 해제됨) NOT_PENALTY_TARGET
      if (m.status !== 'ACTIVE' || !r.isPenaltyTarget) throw gqlError('NOT_PENALTY_TARGET');
      db.penaltyFulfillments.push({
        id: nextId('penaltyFulfillments'),
        memberId: m.id,
        effectiveWeekStart: ctx.clock.currentWeekStart,
        fulfilledAt: ctx.clock.now,
        fulfilledById: viewer.id,
      });
      touch();
      return {
        member: memberBriefView(m.id),
        fulfilledAt: ctx.clock.now,
        reachedWeek: r.reachedWeekStart ?? ctx.clock.currentWeekStart,
      };
    },

    /** AD-01 ②-1 ⑧ 복구 (E-42 · E-43 · E-59). 삭제 표시를 풀고 살아 있는 원래 팀을 다시 붙인다(없으면 '삭제된 팀') */
    restoreWarning: (_: unknown, { warningId }: MutationRestoreWarningArgs, ctx: MockContext) => {
      requireViewer(ctx);
      const w = restorableWarning(warningId);
      const j = w.judgmentId ? findJudgment(w.judgmentId) : undefined;
      if (j && !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
      w.deleted = null;
      w.teamIds = w.originalTeamIds.filter((t) => !!liveTeam(t));
      touch();
      const r = replayWarnings(w.memberId, ctx.clock);
      const onHold = visibleJudgments(ctx.clock, w.memberId).some((x) => x.status === 'HOLD');
      return {
        warningId: w.id,
        member: memberBriefView(w.memberId),
        weekStart: w.weekStart,
        onHold,
        warningCount: onHold ? null : r.activeCount,
        penaltyTarget: r.isPenaltyTarget,
      };
    },
  },
};

/** 복구할 경고: 없거나 회수됐으면 NOT_FOUND, 이미 복구됐으면(삭제 표시 없음) ALREADY_HANDLED */
function restorableWarning(warningId: Id): WarningRow {
  const w = findWarning(warningId);
  if (!w || w.retractedAt) throw gqlError('NOT_FOUND');
  if (!w.deleted) throw gqlError('ALREADY_HANDLED');
  return w;
}
