/**
 * 관리자 — 가입 승인 · 면제 · 공지 뮤테이션 (AD-01 ②-2 · ②-3 · ②-4).
 * admin.ts(판정 · 경고 · 벌칙)와 담당을 나눠 둔 파일이다. 조회(Query)는 admin.ts에 있다.
 * 이 파일의 루트 필드는 전부 관리자 전용으로 감싼다 (schema.ts policyOf).
 *
 * 소급 면제(판정이 끝난 주의 면제 기간 등록 · 다른 주로 옮기기, 개인 면제 승인)는 판정 행과 경고 행만 고친다.
 * 백엔드처럼 기간을 지우거나 옮겨도 이미 면제로 바뀐 판정은 되돌리지 않는다.
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
  MutationPromoteMemberToAdminArgs,
  MutationRejectMemberArgs,
  MutationRejectPersonalExemptionArgs,
  MutationRevertMemberToPendingArgs,
  MutationSetNoticePinnedArgs,
  MutationUpdateExemptionPeriodArgs,
  MutationUpdateNoticeArgs,
  NoticeInput,
} from '../__generated__/schema-types';
import type { MockClock } from '../clock';
import {
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
  touch,
  type JudgmentRow,
  type NoticeRow,
  type SkipReason,
} from '../db/store';
import { gqlError, type ErrorCode } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { adminMemberView, exemptionPeriodView, noticeView, personalExemptionView } from '../views';

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

/** 앞뒤 공백을 지우고 1 ~ max자인지 본다 (백엔드 InputRules). 빈 값은 requiredCode, 너무 길면 INVALID_INPUT */
function requiredText(value: string, max: number, requiredCode: ErrorCode = 'INVALID_INPUT'): string {
  const text = value.trim();
  if (text.length < 1) throw gqlError(requiredCode);
  if (text.length > max) throw gqlError('INVALID_INPUT');
  return text;
}

/* ------------------------------------------------------------------ */
/* 가입 승인                                                             */
/* ------------------------------------------------------------------ */

/**
 * 회원 상태 전환. from에 없는 상태(이미 처리됨 포함)면 CONFLICT (백엔드 MemberApprovalService).
 * 승인 대기 → 승인 · 거절, 거절 → 승인 대기 (AD-01 ②-2 ⑦⑧)
 */
function transition(memberId: string, from: MemberStatus[], to: MemberStatus) {
  const m = findMember(memberId);
  if (!m) throw gqlError('NOT_FOUND');
  if (!from.includes(m.status)) throw gqlError('CONFLICT', { message: `mock: ${m.status} → ${to} is not allowed` });
  m.status = to;
  touch();
  return adminMemberView(m);
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

/** 판정이 끝난 주면 그 주 판정 전체에 면제 기간을 적용한다. 판정 전 주는 할 일이 없다 */
function applyPeriodToWeek(weekStart: string, clock: MockClock): void {
  if (!isRetroactiveWeek(weekStart, clock)) return;
  for (const j of judgmentsOfWeek(weekStart, clock)) exemptJudgment(j, 'EXEMPTION_PERIOD', clock);
}

/** 월요일이 아니면 INVALID_INPUT */
function checkWeek(weekStart: string): void {
  if (!isMondayDate(weekStart)) throw gqlError('INVALID_INPUT', { message: 'mock: weekStart must be a Monday' });
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
    title: requiredText(input.title, NOTICE_TITLE_MAX),
    content: requiredText(input.content, NOTICE_CONTENT_MAX),
    isPinned: !!input.isPinned,
  };
}

/* ------------------------------------------------------------------ */
/* 리졸버                                                                */
/* ------------------------------------------------------------------ */

export const adminManageResolvers: Resolvers = {
  Mutation: {
    // --- 가입 승인 (AD-01 ②-2) ---
    approveMember: (_: unknown, { memberId }: MutationApproveMemberArgs) => transition(memberId, ['PENDING'], 'ACTIVE'),
    rejectMember: (_: unknown, { memberId }: MutationRejectMemberArgs) => transition(memberId, ['PENDING'], 'REJECTED'),
    revertMemberToPending: (_: unknown, { memberId }: MutationRevertMemberToPendingArgs) => transition(memberId, ['REJECTED'], 'PENDING'),
    // 활성 일반 회원만 관리자로. 대기 · 거절 · 이미 관리자면 CONFLICT
    promoteMemberToAdmin: (_: unknown, { memberId }: MutationPromoteMemberToAdminArgs) => {
      const m = findMember(memberId);
      if (!m) throw gqlError('NOT_FOUND');
      if (m.status !== 'ACTIVE' || m.role === 'ADMIN') throw gqlError('CONFLICT');
      m.role = 'ADMIN';
      touch();
      return adminMemberView(m);
    },

    // --- 면제 기간 (AD-01 ②-3 ⑤⑥) ---
    createExemptionPeriod: (_: unknown, { input }: MutationCreateExemptionPeriodArgs, ctx: MockContext) => {
      checkWeek(input.weekStart);
      const reason = requiredText(input.reason, PERIOD_REASON_MAX, 'REASON_REQUIRED');
      if (exemptionPeriodOn(input.weekStart)) throw gqlError('EXEMPTION_PERIOD_DUPLICATE');
      applyPeriodToWeek(input.weekStart, ctx.clock);
      const row = { id: nextId('exemptionPeriods'), weekStart: input.weekStart, reason, createdAt: ctx.clock.now, updatedAt: null };
      db.exemptionPeriods.push(row);
      touch();
      return exemptionPeriodView(row);
    },

    updateExemptionPeriod: (_: unknown, { id, input }: MutationUpdateExemptionPeriodArgs, ctx: MockContext) => {
      const p = periodOrThrow(id);
      checkWeek(input.weekStart);
      const reason = requiredText(input.reason, PERIOD_REASON_MAX, 'REASON_REQUIRED');
      const other = exemptionPeriodOn(input.weekStart);
      if (other && other.id !== p.id) throw gqlError('EXEMPTION_PERIOD_DUPLICATE');
      if (p.weekStart !== input.weekStart) {
        applyPeriodToWeek(input.weekStart, ctx.clock);
        p.weekStart = input.weekStart;
      }
      p.reason = reason;
      p.updatedAt = ctx.clock.now;
      touch();
      return exemptionPeriodView(p);
    },

    // 지워도 이미 면제로 바뀐 판정은 되돌리지 않는다 (확정 판정은 정정으로만 바뀐다)
    deleteExemptionPeriod: (_: unknown, { id }: MutationDeleteExemptionPeriodArgs) => {
      const p = periodOrThrow(id);
      db.exemptionPeriods.splice(db.exemptionPeriods.indexOf(p), 1);
      touch();
      return true;
    },

    // --- 개인 면제 (AD-01 ②-3 ⑦) ---
    // 그 주 판정이 끝났으면 소급 면제: 판정 EXEMPT/PERSONAL_EXEMPTION + 경고 회수 (previewPersonalExemptionApproval과 같다)
    approvePersonalExemption: (_: unknown, { id }: MutationApprovePersonalExemptionArgs, ctx: MockContext) => {
      const e = personalOrThrow(id);
      if (e.status !== 'PENDING') throw gqlError('ALREADY_HANDLED');
      e.status = 'APPROVED';
      e.rejectReason = null;
      e.respondedAt = ctx.clock.now;
      if (isRetroactiveWeek(e.weekStart, ctx.clock)) {
        const j = judgmentFor(e.memberId, e.weekStart, ctx.clock);
        if (j) exemptJudgment(j, 'PERSONAL_EXEMPTION', ctx.clock);
      }
      touch();
      return personalExemptionView(e);
    },

    // 사유 필수 (E-48) — 요청한 팀장의 TM-08 ⑤ "거절됨 · 사유: …"
    rejectPersonalExemption: (_: unknown, { id, reason }: MutationRejectPersonalExemptionArgs, ctx: MockContext) => {
      const e = personalOrThrow(id);
      const text = requiredText(reason, REJECT_REASON_MAX, 'REJECT_REASON_REQUIRED');
      if (e.status !== 'PENDING') throw gqlError('ALREADY_HANDLED');
      e.status = 'REJECTED';
      e.rejectReason = text;
      e.respondedAt = ctx.clock.now;
      touch();
      return personalExemptionView(e);
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
      return true;
    },

    // 고정 ON/OFF 즉시 토글 (⑥). 본문을 고친 게 아니라 updatedAt은 그대로 둔다
    setNoticePinned: (_: unknown, { id, isPinned }: MutationSetNoticePinnedArgs) => {
      const n = noticeOrThrow(id);
      n.isPinned = isPinned;
      touch();
      return noticeView(n);
    },
  },
};
