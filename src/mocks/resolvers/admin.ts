/** 관리자 (AD-01 탭 6). 이 파일의 Query · Mutation은 스키마 가드가 ADMIN만 통과시킨다 */
import { addDays, weekDates } from '@/shared/lib/kst';
import type {
  JudgmentStatus,
  MutationCorrectJudgmentArgs,
  MutationFulfillPenaltyArgs,
  MutationRerunHeldJudgmentsArgs,
  MutationRestoreWarningArgs,
  QueryAdminContentsArgs,
  QueryAdminJudgmentWeekArgs,
  QueryAdminMembersArgs,
  QueryDeletedWarningsArgs,
  QueryExemptionPeriodPreviewArgs,
  QueryExemptionPeriodsArgs,
  QueryJudgmentCorrectionPreviewArgs,
  QueryPersonalExemptionApprovalPreviewArgs,
  QueryPersonalExemptionRequestsArgs,
  QueryRestoreWarningPreviewArgs,
  AdminJudgmentWeekRowsArgs,
} from '../__generated__/schema-types';
import {
  approvedPersonalExemption,
  assertBasis,
  correctionScenario,
  currentBasis,
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
  type Scenario,
} from '../db/derive';
import {
  db,
  findExemptionPeriod,
  findJudgment,
  findMember,
  findPersonalExemption,
  findTeam,
  findWarning,
  liveTeam,
  nextId,
  teamsOfMember,
  touch,
  type Id,
  type JudgmentRow,
  type WarningRow,
} from '../db/store';
import { gqlError, invalid } from '../errors';
import type { MockContext, Resolvers } from '../types';
import {
  adminJudgmentRowView,
  adminMemberRowView,
  contentItems,
  contentRowView,
  deletedWarningView,
  exemptionPeriodView,
  paginate,
  penaltyTargetView,
  personalExemptionView,
  recalcPayloadView,
  recalcPreviewView,
  requireViewer,
} from '../views';

const STATUS_ORDER: Record<JudgmentStatus, number> = { HOLD: 0, FAIL: 1, PASS: 2, EXEMPT: 3, EXCLUDED: 4 };

function sortJudgmentRows(rows: JudgmentRow[]): JudgmentRow[] {
  const nick = (id: Id) => db.members.find((m) => m.id === id)?.nickname ?? '';
  return [...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || nick(a.memberId).localeCompare(nick(b.memberId), 'ko'));
}

const matchesMember = (memberId: Id, search: string | null | undefined) => {
  const q = search?.trim().toLowerCase().replace(/^@/, '');
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

export const adminResolvers: Resolvers = {
  Query: {
    adminDashboardSummary: (_: unknown, __: unknown, ctx: MockContext) => {
      const latest = latestExecutedWeek(ctx.clock);
      return {
        pendingMemberCount: db.members.filter((m) => m.status === 'PENDING').length,
        latestWeekFailCount: latest ? judgmentsOfWeek(latest, ctx.clock).filter((j) => j.status === 'FAIL').length : 0,
        latestJudgedWeekStart: latest,
        penaltyTargetCount: penaltyTargetIds(ctx.clock).length,
        pendingExemptionRequestCount: db.personalExemptions.filter((e) => e.status === 'PENDING').length,
        heldJudgmentCount: visibleJudgments(ctx.clock).filter((j) => j.status === 'HOLD').length,
      };
    },

    // weekStart 생략 = 가장 최근 판정 주. 이번 주(판정 전)면 executedAt null · 행 없음
    adminJudgmentWeek: (_: unknown, { weekStart }: QueryAdminJudgmentWeekArgs, ctx: MockContext) => {
      const week = weekStart ?? latestExecutedWeek(ctx.clock) ?? addDays(ctx.clock.currentWeekStart, -7);
      if (!isMondayDate(week)) throw invalid('weekStart', 'mock: weekStart must be a Monday');
      if (week > ctx.clock.currentWeekStart) throw invalid('weekStart', 'mock: future week');
      const all = judgmentsOfWeek(week, ctx.clock);
      return {
        weekStart: week,
        weekEnd: addDays(week, 6),
        executedAt: weekExecutedAt(week, ctx.clock),
        counts: judgmentCounts(all),
        rows: ({ filter, search, first, after }: AdminJudgmentWeekRowsArgs) => {
          const rows = all.filter((j) => {
            if (filter === 'FAIL' && j.status !== 'FAIL') return false;
            if (filter === 'HOLD' && j.status !== 'HOLD') return false;
            // 팀 없음 제외는 목록 기본 필터에서도 뺀다 (추측)
            if ((filter ?? 'ALL') === 'ALL' && j.status === 'EXCLUDED' && j.skipReason === 'NO_TEAM') return false;
            return matchesMember(j.memberId, search);
          });
          return paginate(sortJudgmentRows(rows), { first, after }, (j) => adminJudgmentRowView(ctx, j));
        },
      };
    },

    heldJudgments: (_: unknown, __: unknown, ctx: MockContext) =>
      visibleJudgments(ctx.clock)
        .filter((j) => j.status === 'HOLD')
        .map((j) => adminJudgmentRowView(ctx, j)),

    judgmentCorrectionPreview: (_: unknown, { judgmentId, newStatus }: QueryJudgmentCorrectionPreviewArgs, ctx: MockContext) => {
      const j = findJudgment(judgmentId);
      if (!j || !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
      if (j.status === 'HOLD') throw gqlError('JUDGMENT_NOT_CORRECTABLE');
      return recalcPreviewView(ctx, recalcPreview(j.memberId, correctionScenario(j.id, newStatus), j.weekStart, ctx.clock));
    },

    penaltyTargets: (_: unknown, __: unknown, ctx: MockContext) => penaltyTargetIds(ctx.clock).map((id) => penaltyTargetView(ctx, id)),

    deletedWarnings: (_: unknown, args: QueryDeletedWarningsArgs, ctx: MockContext) => {
      const rows = db.warnings
        .filter((w) => {
          if (!w.deleted || w.retractedAt) return false;
          const j = w.judgmentId ? findJudgment(w.judgmentId) : undefined;
          return !j || isJudgmentVisible(j, ctx.clock);
        })
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart) || Number(b.id) - Number(a.id));
      return paginate(rows, args, (w) => deletedWarningView(ctx, w));
    },

    restoreWarningPreview: (_: unknown, { warningId }: QueryRestoreWarningPreviewArgs, ctx: MockContext) => {
      const w = findWarning(warningId);
      if (!w || !w.deleted || w.retractedAt) throw gqlError('NOT_FOUND');
      const withoutCategory = w.originalTeamIds.every((t) => !findTeam(t) || !!findTeam(t)?.deletedAt);
      return recalcPreviewView(
        ctx,
        recalcPreview(w.memberId, { restoreWarningIds: [w.id] }, w.weekStart, ctx.clock, { restoresWithoutCategory: withoutCategory }),
      );
    },

    adminMembers: (_: unknown, { filter, search, first, after }: QueryAdminMembersArgs, ctx: MockContext) => {
      const f = filter ?? 'PENDING';
      const rows = db.members
        .filter((m) => (f === 'ALL' ? m.status === 'PENDING' || m.status === 'REJECTED' : m.status === f))
        .filter((m) => matchesMember(m.id, search))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return paginate(rows, { first, after }, (m) => adminMemberRowView(ctx, m));
    },

    exemptionPeriods: (_: unknown, args: QueryExemptionPeriodsArgs, ctx: MockContext) => {
      const rows = [...db.exemptionPeriods].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
      return paginate(rows, args, (e) => exemptionPeriodView(ctx, e));
    },

    exemptionPeriodPreview: (_: unknown, { weekStart, periodId, removing }: QueryExemptionPeriodPreviewArgs, ctx: MockContext) => {
      if (!isMondayDate(weekStart)) throw invalid('weekStart', 'mock: weekStart must be a Monday');
      const period = periodId ? findExemptionPeriod(periodId) : undefined;
      if (periodId && !period) throw gqlError('NOT_FOUND');
      const existing = exemptionPeriodOn(weekStart);
      if (!removing && existing && existing.id !== periodId) throw gqlError('EXEMPTION_DUPLICATE', { field: 'weekStart' });

      const specs: { week: string; exempt: boolean }[] = [];
      if (removing) specs.push({ week: period?.weekStart ?? weekStart, exempt: false });
      else {
        if (period && period.weekStart !== weekStart) specs.push({ week: period.weekStart, exempt: false });
        if (!period || period.weekStart !== weekStart) specs.push({ week: weekStart, exempt: true });
      }
      const retro = specs.filter((s) => isRetroactiveWeek(s.week, ctx.clock));
      const memberIds = [...new Set(retro.flatMap((s) => judgmentsOfWeek(s.week, ctx.clock).map((j) => j.memberId)))];
      // affectedMemberCount = 판정이 바뀌는 회원 수 · changes = 그중 경고 수나 벌칙 상태가 바뀌는 회원만
      const from = retro.map((s) => s.week).sort()[0] ?? weekStart;
      const previews = memberIds.flatMap((memberId) => {
        const merged: Scenario = { judgmentOverrides: {} };
        for (const s of retro) {
          const sc = weekExemptionScenario(memberId, s.week, s.exempt, 'EXEMPTION_PERIOD', ctx.clock);
          Object.assign(merged.judgmentOverrides ?? {}, sc?.judgmentOverrides ?? {});
        }
        if (Object.keys(merged.judgmentOverrides ?? {}).length === 0) return [];
        return [recalcPreview(memberId, merged, from, ctx.clock)];
      });
      const changes = previews
        .filter((p) => p.warningCountBefore !== p.warningCountAfter || p.penaltyChange !== 'NONE')
        .map((p) => recalcPreviewView(ctx, p));
      return { weekStart, isRetroactive: retro.length > 0, affectedMemberCount: previews.length, changes, basis: currentBasis() };
    },

    personalExemptionRequests: (_: unknown, { status, first, after }: QueryPersonalExemptionRequestsArgs, ctx: MockContext) => {
      const s = status ?? 'PENDING';
      const rows = db.personalExemptions.filter((e) => e.status === s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(rows, { first, after }, (e) => personalExemptionView(ctx, e));
    },

    // 소급이 아니면 null
    personalExemptionApprovalPreview: (_: unknown, { requestId }: QueryPersonalExemptionApprovalPreviewArgs, ctx: MockContext) => {
      const e = findPersonalExemption(requestId);
      if (!e) throw gqlError('NOT_FOUND');
      if (!isRetroactiveWeek(e.weekStart, ctx.clock)) return null;
      const sc = weekExemptionScenario(e.memberId, e.weekStart, true, 'PERSONAL_EXEMPTION', ctx.clock) ?? {};
      return recalcPreviewView(ctx, recalcPreview(e.memberId, sc, e.weekStart, ctx.clock));
    },

    adminContents: (_: unknown, { filter, search, first, after }: QueryAdminContentsArgs, ctx: MockContext) =>
      paginate(contentItems(ctx, { kind: filter ?? 'ALL', search }), { first, after }, (it) => contentRowView(ctx, it)),
  },

  Mutation: {
    // --- 판정 (반영 전 assertBasis(expectedBasis) → 고친 뒤 touch() → recalcPayloadView) ---

    /**
     * AD-01 ⑦ [재시도] · ⑨ [전체 재시도] (E-35). judgmentIds 생략 = 보류 전부.
     * 확정 건은 건너뛰고, API_ERROR 보류만 다시 판정한다. IDENTITY_MISMATCH는 재시도로 풀리지 않는다(E-08) → stillHeldCount.
     */
    rerunHeldJudgments: (_: unknown, { judgmentIds }: MutationRerunHeldJudgmentsArgs, ctx: MockContext) => {
      let targets: JudgmentRow[];
      if (judgmentIds && judgmentIds.length > 0) {
        targets = [...new Set(judgmentIds)].map((id) => {
          const j = findJudgment(id);
          if (!j || !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
          return j;
        });
      } else {
        targets = visibleJudgments(ctx.clock);
      }
      const held = targets.filter((j) => j.status === 'HOLD');
      const retryable = held.filter((j) => j.holdReason === 'API_ERROR');
      for (const j of retryable) rejudgeHeld(j, ctx);
      if (retryable.length > 0) touch();
      return {
        processedCount: retryable.length,
        stillHeldCount: held.length - retryable.length,
        rows: retryable.map((j) => adminJudgmentRowView(ctx, j)),
      };
    },

    /**
     * AD-01 ⑩ [정정하고 재계산] (E-49 · E-50 · E-58 · E-60). 결과는 judgmentCorrectionPreview와 같아야 한다:
     * 미달 → 통과/면제면 그 주 경고를 회수(retractedAt), 그 외 → 미달이면 경고를 새로 붙이거나 회수했던 것을 되살린다.
     * 경고 수 · 벌칙은 replay가 다시 계산한다 (이행 체크 고정점도 replay가 지킨다).
     */
    correctJudgment: (_: unknown, { input }: MutationCorrectJudgmentArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      assertBasis(input.expectedBasis);
      const j = findJudgment(input.judgmentId);
      if (!j || !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
      if (j.status === 'HOLD') throw gqlError('JUDGMENT_NOT_CORRECTABLE');
      const reason = input.reason.trim();
      if (reason.length < 1 || reason.length > CORRECTION_REASON_MAX) throw invalid('reason');
      const before = j.status;
      const after = input.newStatus;
      if (after === before) throw invalid('newStatus', 'mock: same status');

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
      return recalcPayloadView(ctx, j.memberId, j);
    },

    // --- 경고 · 벌칙 ---

    /** AD-01 ②-1 ⑥ 이행 완료 — 되돌릴 수 없는 고정점(E-58). 이번 주부터 경고 0 · 연속 0 [Q-10 ⓓ 추측] */
    fulfillPenalty: (_: unknown, { memberId }: MutationFulfillPenaltyArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const m = findMember(memberId);
      // 벌칙 대상이 아니면(이미 이행 처리됨 · 정정으로 해제됨) 처리할 것이 없다
      if (!m || m.status !== 'ACTIVE' || !replayWarnings(m.id, ctx.clock).isPenaltyTarget) throw gqlError('NOT_FOUND');
      db.penaltyFulfillments.push({
        id: nextId('penaltyFulfillments'),
        memberId: m.id,
        effectiveWeekStart: ctx.clock.currentWeekStart,
        fulfilledAt: ctx.clock.now,
        fulfilledById: viewer.id,
      });
      touch();
      return recalcPayloadView(ctx, m.id);
    },

    /** AD-01 ②-1 ⑧ 복구 (E-42 · E-43 · E-59). 삭제 표시를 풀고 살아 있는 원래 팀을 다시 붙인다(없으면 '삭제된 팀') */
    restoreWarning: (_: unknown, { warningId, expectedBasis }: MutationRestoreWarningArgs, ctx: MockContext) => {
      requireViewer(ctx);
      assertBasis(expectedBasis);
      const w = findWarning(warningId);
      if (!w || !w.deleted || w.retractedAt) throw gqlError('NOT_FOUND');
      const j = w.judgmentId ? findJudgment(w.judgmentId) : undefined;
      if (j && !isJudgmentVisible(j, ctx.clock)) throw gqlError('NOT_FOUND');
      w.deleted = null;
      w.teamIds = w.originalTeamIds.filter((t) => !!liveTeam(t));
      touch();
      return recalcPayloadView(ctx, w.memberId, j ?? null);
    },
  },
};
