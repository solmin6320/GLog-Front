/**
 * 관리자 — 가입 승인 · 면제 · 공지 뮤테이션 (AD-01 ②-2 · ②-3 · ②-4).
 * admin.ts(판정 · 경고 · 벌칙)와 담당을 나눠 둔 파일이다. 조회(Query)는 admin.ts에 있다.
 * 이 파일의 루트 필드는 전부 관리자 전용으로 감싼다 (schema.ts policyOf).
 *
 * 소급 면제(판정이 끝난 주의 면제 기간 등록 · 수정 · 삭제, 개인 면제 승인)는 판정 행과 경고 행만 고친다.
 * 경고 수 · 연속 · 벌칙은 derive.replayWarnings()가 다시 계산한다 — 결과는 미리보기(weekExemptionScenario)와 같다.
 */
import type {
  MemberStatus,
  MutationApproveMemberArgs,
  MutationApprovePersonalExemptionArgs,
  MutationCreateExemptionPeriodArgs,
  MutationCreateNoticeArgs,
  MutationDeleteExemptionPeriodArgs,
  MutationDeleteNoticeArgs,
  MutationRejectMemberArgs,
  MutationRejectPersonalExemptionArgs,
  MutationRevertMemberToPendingArgs,
  MutationSetNoticePinnedArgs,
  MutationUpdateExemptionPeriodArgs,
  MutationUpdateNoticeArgs,
  NoticeInput,
  SkipReason,
} from '../__generated__/schema-types';
import type { MockClock } from '../clock';
import {
  approvedPersonalExemption,
  assertBasis,
  exemptionPeriodOn,
  isMondayDate,
  isRetroactiveWeek,
  judgmentFor,
  judgmentsOfWeek,
} from '../db/derive';
import {
  db,
  findExemptionPeriod,
  findMember,
  findNotice,
  findPersonalExemption,
  nextId,
  teamsOfMember,
  touch,
  type JudgmentRow,
  type NoticeRow,
} from '../db/store';
import { gqlError, invalid } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { adminMemberRowView, exemptionPeriodView, noticeView, personalExemptionView } from '../views';

/* ------------------------------------------------------------------ */
/* 입력 제한 (DB 명세 1-12 · 1-13 · 1-15)                                */
/* ------------------------------------------------------------------ */

/** exemption_period.reason VARCHAR(200) */
export const PERIOD_REASON_MAX = 200;
/** personal_exemption.reject_reason VARCHAR(500) */
export const REJECT_REASON_MAX = 500;
/** notice.title VARCHAR(200) */
export const NOTICE_TITLE_MAX = 200;
/** notice.content TEXT — 목은 이 길이에서 자른다 (제안) */
export const NOTICE_CONTENT_MAX = 20_000;

/** 앞뒤 공백을 지우고 1 ~ max자인지 본다. 아니면 VALIDATION_FAILED(field) */
function requiredText(value: string, field: string, max: number): string {
  const text = value.trim();
  if (text.length < 1 || text.length > max) throw invalid(field);
  return text;
}

/* ------------------------------------------------------------------ */
/* 가입 승인                                                             */
/* ------------------------------------------------------------------ */

/**
 * 회원 상태 전환. 이미 to면 그대로 돌려준다(두 번 눌러도 안전). from에 없는 상태에서는 VALIDATION_FAILED(memberId).
 * 승인 대기 → 승인 · 거절, 거절 → 승인 대기 (AD-01 ②-2 ⑦⑧)
 */
function transition(ctx: MockContext, memberId: string, from: MemberStatus[], to: MemberStatus) {
  const m = findMember(memberId);
  if (!m) throw gqlError('NOT_FOUND');
  if (m.status !== to) {
    if (!from.includes(m.status)) throw invalid('memberId', `mock: ${m.status} → ${to} is not allowed`);
    m.status = to;
    touch();
  }
  return adminMemberRowView(ctx, m);
}

/* ------------------------------------------------------------------ */
/* 소급 면제 — 판정 · 경고 행 고치기                                      */
/* ------------------------------------------------------------------ */

/** 그 판정 주에 생긴 경고 행 (replay 대상만) */
const warningOf = (j: JudgmentRow) => db.warnings.find((w) => w.judgmentId === j.id && !w.fixedStanding);

/** 확정 판정(통과 · 미달)을 면제로. 미달이었으면 그 주 경고를 회수한다 (E-45) */
function exemptJudgment(j: JudgmentRow, reason: SkipReason, clock: MockClock): void {
  // 보류 · 제외 · 이미 면제는 그대로 둔다 (weekExemptionScenario와 같다)
  if (j.status !== 'PASS' && j.status !== 'FAIL') return;
  if (j.status === 'FAIL') {
    const w = warningOf(j);
    if (w && !w.retractedAt) w.retractedAt = clock.now;
  }
  j.status = 'EXEMPT';
  j.skipReason = reason;
  j.verifiedDays = null;
  j.recordCount = null;
}

/**
 * 면제 기간 때문에 면제였던 판정을 풀어 스냅숏(judgment_day)으로 다시 판정한다 (C-05 미결 → 목 가정).
 * 미달이 되면 회수했던 경고를 되살리거나, 없으면 지금 소속 팀 카테고리로 새로 만든다.
 * 같은 주에 승인된 개인 면제가 있으면 면제를 유지한다 (E-44 두 면제 독립 보존).
 */
function unexemptJudgment(j: JudgmentRow): void {
  if (j.status !== 'EXEMPT' || j.skipReason !== 'EXEMPTION_PERIOD') return;
  if (approvedPersonalExemption(j.memberId, j.weekStart)) {
    j.skipReason = 'PERSONAL_EXEMPTION';
    return;
  }
  const verified = j.days.filter((d) => d.hasGrass || d.hasRecord).length;
  const records = j.days.filter((d) => d.hasRecord).length;
  j.status = verified >= 3 && records >= 1 ? 'PASS' : 'FAIL';
  j.skipReason = null;
  j.verifiedDays = verified;
  j.recordCount = records;
  if (j.status !== 'FAIL') return;
  const w = warningOf(j);
  if (w) {
    w.retractedAt = null;
    return;
  }
  const teamIds = teamsOfMember(j.memberId).map((t) => t.id);
  db.warnings.push({
    id: nextId('warnings'),
    memberId: j.memberId,
    weekStart: j.weekStart,
    judgmentId: j.id,
    verifiedDays: verified,
    recordCount: records,
    teamIds,
    originalTeamIds: [...teamIds],
    deleted: null,
    retractedAt: null,
  });
}

/** 판정이 끝난 주면 그 주 판정 전체에 면제 기간을 적용(또는 해제)한다. 판정 전 주는 할 일이 없다 */
function applyPeriodToWeek(weekStart: string, exempt: boolean, clock: MockClock): void {
  if (!isRetroactiveWeek(weekStart, clock)) return;
  for (const j of judgmentsOfWeek(weekStart, clock)) {
    if (exempt) exemptJudgment(j, 'EXEMPTION_PERIOD', clock);
    else unexemptJudgment(j);
  }
}

function checkWeek(weekStart: string): void {
  if (!isMondayDate(weekStart)) throw invalid('weekStart', 'mock: weekStart must be a Monday');
}

function periodOrThrow(id: string) {
  const p = findExemptionPeriod(id);
  if (!p) throw gqlError('NOT_FOUND');
  return p;
}

function personalOrThrow(id: string) {
  const e = findPersonalExemption(id);
  if (!e) throw gqlError('NOT_FOUND');
  return e;
}

/* ------------------------------------------------------------------ */
/* 공지                                                                  */
/* ------------------------------------------------------------------ */

function noticeOrThrow(id: string): NoticeRow {
  const n = findNotice(id);
  if (!n || n.deletedAt) throw gqlError('NOT_FOUND');
  return n;
}

function noticeFields(input: NoticeInput) {
  return {
    title: requiredText(input.title, 'title', NOTICE_TITLE_MAX),
    content: requiredText(input.content, 'content', NOTICE_CONTENT_MAX),
    isPinned: !!input.isPinned,
  };
}

/* ------------------------------------------------------------------ */
/* 리졸버                                                                */
/* ------------------------------------------------------------------ */

export const adminManageResolvers: Resolvers = {
  Mutation: {
    // --- 가입 승인 (AD-01 ②-2) ---
    approveMember: (_: unknown, { memberId }: MutationApproveMemberArgs, ctx: MockContext) =>
      transition(ctx, memberId, ['PENDING', 'REJECTED'], 'ACTIVE'),
    rejectMember: (_: unknown, { memberId }: MutationRejectMemberArgs, ctx: MockContext) =>
      transition(ctx, memberId, ['PENDING'], 'REJECTED'),
    revertMemberToPending: (_: unknown, { memberId }: MutationRevertMemberToPendingArgs, ctx: MockContext) =>
      transition(ctx, memberId, ['REJECTED'], 'PENDING'),

    // --- 면제 기간 (AD-01 ②-3 ⑤⑥) ---
    createExemptionPeriod: (_: unknown, { input }: MutationCreateExemptionPeriodArgs, ctx: MockContext) => {
      assertBasis(input.expectedBasis);
      checkWeek(input.weekStart);
      const reason = requiredText(input.reason, 'reason', PERIOD_REASON_MAX);
      if (exemptionPeriodOn(input.weekStart)) throw gqlError('EXEMPTION_DUPLICATE', { field: 'weekStart' });
      applyPeriodToWeek(input.weekStart, true, ctx.clock);
      const row = { id: nextId('exemptionPeriods'), weekStart: input.weekStart, reason, createdAt: ctx.clock.now, updatedAt: null };
      db.exemptionPeriods.push(row);
      touch();
      return exemptionPeriodView(ctx, row);
    },

    updateExemptionPeriod: (_: unknown, { id, input }: MutationUpdateExemptionPeriodArgs, ctx: MockContext) => {
      assertBasis(input.expectedBasis);
      const p = periodOrThrow(id);
      checkWeek(input.weekStart);
      const reason = requiredText(input.reason, 'reason', PERIOD_REASON_MAX);
      const other = exemptionPeriodOn(input.weekStart);
      if (other && other.id !== p.id) throw gqlError('EXEMPTION_DUPLICATE', { field: 'weekStart' });
      if (p.weekStart !== input.weekStart) {
        applyPeriodToWeek(p.weekStart, false, ctx.clock);
        applyPeriodToWeek(input.weekStart, true, ctx.clock);
        p.weekStart = input.weekStart;
      }
      p.reason = reason;
      p.updatedAt = ctx.clock.now;
      touch();
      return exemptionPeriodView(ctx, p);
    },

    // C-05 미결: 판정이 끝난 주의 면제를 지우면 스냅숏으로 다시 판정한다 (exemptionPeriodPreview removing과 같다)
    deleteExemptionPeriod: (_: unknown, { id, expectedBasis }: MutationDeleteExemptionPeriodArgs, ctx: MockContext) => {
      assertBasis(expectedBasis);
      const p = periodOrThrow(id);
      applyPeriodToWeek(p.weekStart, false, ctx.clock);
      db.exemptionPeriods.splice(db.exemptionPeriods.indexOf(p), 1);
      touch();
      return p.id;
    },

    // --- 개인 면제 (AD-01 ②-3 ⑦) ---
    // 그 주 판정이 끝났으면 소급 면제: 판정 EXEMPT/PERSONAL_EXEMPTION + 경고 회수 (personalExemptionApprovalPreview와 같다)
    approvePersonalExemption: (_: unknown, { requestId, expectedBasis }: MutationApprovePersonalExemptionArgs, ctx: MockContext) => {
      assertBasis(expectedBasis);
      const e = personalOrThrow(requestId);
      if (e.status === 'APPROVED') return personalExemptionView(ctx, e);
      if (e.status !== 'PENDING') throw invalid('requestId', 'mock: request is not pending');
      e.status = 'APPROVED';
      e.rejectReason = null;
      e.respondedAt = ctx.clock.now;
      if (isRetroactiveWeek(e.weekStart, ctx.clock)) {
        const j = judgmentFor(e.memberId, e.weekStart, ctx.clock);
        if (j) exemptJudgment(j, 'PERSONAL_EXEMPTION', ctx.clock);
      }
      touch();
      return personalExemptionView(ctx, e);
    },

    // 사유 필수 (E-48) — 요청한 팀장의 TM-08 ⑤ "거절됨 · 사유: …"
    rejectPersonalExemption: (_: unknown, { requestId, reason }: MutationRejectPersonalExemptionArgs, ctx: MockContext) => {
      const e = personalOrThrow(requestId);
      const text = requiredText(reason, 'reason', REJECT_REASON_MAX);
      if (e.status !== 'PENDING') throw invalid('requestId', 'mock: request is not pending');
      e.status = 'REJECTED';
      e.rejectReason = text;
      e.respondedAt = ctx.clock.now;
      touch();
      return personalExemptionView(ctx, e);
    },

    // --- 공지 (AD-01 ②-4) ---
    createNotice: (_: unknown, { input }: MutationCreateNoticeArgs, ctx: MockContext) => {
      const row: NoticeRow = {
        id: nextId('notices'),
        ...noticeFields(input),
        isSystem: false,
        createdAt: ctx.clock.now,
        updatedAt: null,
        deletedAt: null,
      };
      db.notices.push(row);
      touch();
      return noticeView(row);
    },

    updateNotice: (_: unknown, { id, input }: MutationUpdateNoticeArgs, ctx: MockContext) => {
      const n = noticeOrThrow(id);
      Object.assign(n, noticeFields(input), { updatedAt: ctx.clock.now });
      touch();
      return noticeView(n);
    },

    // 잔디 인정 규칙 공지는 지울 수 없다 (EX-AD01-02)
    deleteNotice: (_: unknown, { id }: MutationDeleteNoticeArgs, ctx: MockContext) => {
      const n = noticeOrThrow(id);
      if (n.isSystem) throw gqlError('SYSTEM_NOTICE_UNDELETABLE');
      n.deletedAt = ctx.clock.now;
      touch();
      return n.id;
    },

    // 고정 ON/OFF 즉시 토글 (⑥). 본문을 고친 게 아니라 updatedAt은 그대로 둔다
    setNoticePinned: (_: unknown, { id, pinned }: MutationSetNoticePinnedArgs) => {
      const n = noticeOrThrow(id);
      n.isPinned = pinned;
      touch();
      return noticeView(n);
    },
  },
};
