/**
 * 관리자 가입 승인 · 면제 · 공지 뮤테이션 (adminManage.ts).
 * 소급 면제는 "반영 결과 = 미리보기"를 회원마다 확인한다 (README 뮤테이션 규칙 5).
 */
import type { ExecutionResult } from 'graphql';
import { describe, expect, it } from 'vitest';
import { mockTokenFor, type PersonaKey } from '../control';
import { db } from '../db/store';
import { executeMock } from '../schema';

type Json = Record<string, unknown>;

async function run(query: string, variables?: Json, as: PersonaKey = 'member') {
  const res: ExecutionResult = await executeMock({ query, variables, authorization: `Bearer ${mockTokenFor(as)}` });
  return {
    data: res.data as Json | null | undefined,
    codes: (res.errors ?? []).map((e) => e.extensions?.code),
    fields: (res.errors ?? []).map((e) => e.extensions?.field),
  };
}

async function ok<T = Json>(query: string, variables?: Json): Promise<T> {
  const res: ExecutionResult = await executeMock({ query, variables, authorization: `Bearer ${mockTokenFor('member')}` });
  expect(res.errors?.map((e) => e.message) ?? []).toEqual([]);
  return res.data as T;
}

type Change = { member: { id: string }; warningCountAfter: number; penaltyChange: string };

/** 미리보기의 회원별 "이후" 값이 반영 뒤 실제 값과 같은가 */
async function expectAppliedLike(changes: Change[]) {
  expect(changes.length).toBeGreaterThan(0);
  for (const c of changes) {
    const d = await ok<{ member: { warningState: { activeCount: number; isPenaltyTarget: boolean } } }>(
      `query($id: ID!) { member(id: $id) { warningState { activeCount isPenaltyTarget } } }`,
      { id: c.member.id },
    );
    expect({ id: c.member.id, count: d.member.warningState.activeCount }).toEqual({ id: c.member.id, count: c.warningCountAfter });
    if (c.penaltyChange === 'RELEASE') expect(d.member.warningState.isPenaltyTarget).toBe(false);
    if (c.penaltyChange === 'ENTER') expect(d.member.warningState.isPenaltyTarget).toBe(true);
  }
}

const SUMMARY = `{ adminDashboardSummary { pendingMemberCount pendingExemptionRequestCount penaltyTargetCount } }`;
const PERIOD = 'id weekStart weekEnd reason isPast updatedAt';
const PERIOD_PREVIEW = `query($w: Date!, $p: ID, $rm: Boolean) {
  exemptionPeriodPreview(weekStart: $w, periodId: $p, removing: $rm) {
    isRetroactive affectedMemberCount basis changes { member { id } warningCountAfter penaltyChange }
  }
}`;
type PeriodPreview = { exemptionPeriodPreview: { isRetroactive: boolean; affectedMemberCount: number; basis: string; changes: Change[] } };

const judgmentOf = (memberId: string, weekStart: string) => db.judgments.find((j) => j.memberId === memberId && j.weekStart === weekStart);

describe('가입 승인 (AD-01 ②-2)', () => {
  it('승인 · 거절 · 승인 대기로 — 상태가 바뀌고 승인 대기 수가 따라간다', async () => {
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary.pendingMemberCount).toBe(3);

    const a = await ok<{ approveMember: Json }>(`mutation { approveMember(memberId: "9") { member { id nickname } status appliedAt } }`);
    expect(a.approveMember).toEqual({ member: { id: '9', nickname: '정다은' }, status: 'ACTIVE', appliedAt: '2026-09-30T21:15:00+09:00' });

    const r = await ok<{ rejectMember: Json }>(`mutation { rejectMember(memberId: "11") { status } }`);
    expect(r.rejectMember).toEqual({ status: 'REJECTED' });
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary.pendingMemberCount).toBe(1);

    const v = await ok<{ revertMemberToPending: Json }>(`mutation { revertMemberToPending(memberId: "10") { member { nickname } status } }`);
    expect(v.revertMemberToPending).toEqual({ member: { nickname: '최민재' }, status: 'PENDING' });

    const list = await ok<{ adminMembers: { nodes: { member: { nickname: string }; status: string }[] } }>(
      `{ adminMembers(filter: ALL) { nodes { member { nickname } status } } }`,
    );
    expect(list.adminMembers.nodes).toEqual([
      { member: { nickname: '최민재' }, status: 'PENDING' },
      { member: { nickname: '윤서준' }, status: 'REJECTED' },
      { member: { nickname: '강지민' }, status: 'PENDING' },
    ]);
  });

  it('승인된 회원 거절 · 대기 회원 되돌리기는 VALIDATION_FAILED(memberId), 같은 상태로 두 번은 그대로', async () => {
    expect(await run(`mutation { rejectMember(memberId: "2") { status } }`)).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['memberId'] });
    expect((await run(`mutation { revertMemberToPending(memberId: "9") { status } }`)).codes).toEqual([]);
    expect((await run(`mutation { approveMember(memberId: "2") { status } }`)).data).toEqual({ approveMember: { status: 'ACTIVE' } });
    expect((await run(`mutation { approveMember(memberId: "999") { status } }`)).codes).toEqual(['NOT_FOUND']);
  });

  it('관리자가 아니면 FORBIDDEN', async () => {
    expect((await run(`mutation { approveMember(memberId: "9") { status } }`, undefined, 'plain')).codes).toEqual(['FORBIDDEN']);
    expect(db.members.find((m) => m.id === '9')?.status).toBe('PENDING');
  });
});

describe('면제 기간 (AD-01 ②-3 ⑤⑥)', () => {
  it('판정 전 주 등록: 목록에 생기고 재계산은 없다', async () => {
    const before = db.version;
    const d = await ok<{ createExemptionPeriod: Json }>(
      `mutation($i: ExemptionPeriodInput!) { createExemptionPeriod(input: $i) { ${PERIOD} } }`,
      { i: { weekStart: '2026-10-05', reason: '  축제 주간  ' } },
    );
    expect(d.createExemptionPeriod).toMatchObject({ weekStart: '2026-10-05', weekEnd: '2026-10-11', reason: '축제 주간', isPast: false, updatedAt: null });
    expect(db.version).toBe(before + 1);
    const list = await ok<{ exemptionPeriods: { nodes: { weekStart: string }[] } }>(`{ exemptionPeriods { nodes { weekStart } } }`);
    expect(list.exemptionPeriods.nodes.map((n) => n.weekStart)).toEqual(['2026-10-26', '2026-10-19', '2026-10-05', '2026-09-07']);
  });

  it('같은 주 · 월요일 아님 · 빈 사유 · 200자 넘는 사유', async () => {
    const q = `mutation($i: ExemptionPeriodInput!) { createExemptionPeriod(input: $i) { id } }`;
    expect(await run(q, { i: { weekStart: '2026-10-19', reason: '중복' } })).toMatchObject({ codes: ['EXEMPTION_DUPLICATE'], fields: ['weekStart'] });
    expect(await run(q, { i: { weekStart: '2026-10-06', reason: '화요일' } })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['weekStart'] });
    expect(await run(q, { i: { weekStart: '2026-10-05', reason: '   ' } })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['reason'] });
    expect(await run(q, { i: { weekStart: '2026-10-05', reason: '가'.repeat(201) } })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['reason'] });
    expect(db.exemptionPeriods).toHaveLength(3);
  });

  it('판정이 끝난 주(9/21) 소급 등록: 미리보기와 같은 결과 · 박지훈 벌칙 해제', async () => {
    const p = (await ok<PeriodPreview>(PERIOD_PREVIEW, { w: '2026-09-21' })).exemptionPeriodPreview;
    expect(p).toMatchObject({ isRetroactive: true, affectedMemberCount: 22, basis: 'v1' });

    const d = await ok<{ createExemptionPeriod: Json }>(
      `mutation($i: ExemptionPeriodInput!) { createExemptionPeriod(input: $i) { ${PERIOD} } }`,
      { i: { weekStart: '2026-09-21', reason: '추석 연휴', expectedBasis: p.basis } },
    );
    expect(d.createExemptionPeriod).toMatchObject({ weekStart: '2026-09-21', isPast: true });
    expect(judgmentOf('6', '2026-09-21')).toMatchObject({ status: 'EXEMPT', skipReason: 'EXEMPTION_PERIOD', verifiedDays: null });
    expect(judgmentOf('14', '2026-09-21')).toMatchObject({ status: 'EXEMPT', skipReason: 'PERSONAL_EXEMPTION' });
    expect(judgmentOf('29', '2026-09-21')).toMatchObject({ status: 'HOLD' });
    await expectAppliedLike(p.changes);
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary.penaltyTargetCount).toBe(1);
  });

  it('미리보기 뒤 다른 변경이 있으면 PREVIEW_STALE — 아무것도 바뀌지 않는다', async () => {
    const p = (await ok<PeriodPreview>(PERIOD_PREVIEW, { w: '2026-09-21' })).exemptionPeriodPreview;
    await ok(`mutation { approveMember(memberId: "9") { status } }`);
    const r = await run(`mutation($i: ExemptionPeriodInput!) { createExemptionPeriod(input: $i) { id } }`, {
      i: { weekStart: '2026-09-21', reason: '추석 연휴', expectedBasis: p.basis },
    });
    expect(r.codes).toEqual(['PREVIEW_STALE']);
    expect(db.exemptionPeriods).toHaveLength(3);
    expect(judgmentOf('6', '2026-09-21')?.status).toBe('FAIL');
  });

  it('판정이 끝난 주(9/7) 면제 삭제: 스냅숏으로 다시 판정 · 미리보기와 같은 결과', async () => {
    const p = (await ok<PeriodPreview>(PERIOD_PREVIEW, { w: '2026-09-07', p: '1', rm: true })).exemptionPeriodPreview;
    expect(p.isRetroactive).toBe(true);
    const d = await ok<{ deleteExemptionPeriod: string }>(`mutation($id: ID!, $b: String) { deleteExemptionPeriod(id: $id, expectedBasis: $b) }`, {
      id: '1',
      b: p.basis,
    });
    expect(d.deleteExemptionPeriod).toBe('1');
    expect(db.exemptionPeriods.map((e) => e.id)).toEqual(['2', '3']);
    expect(judgmentOf('3', '2026-09-07')).toMatchObject({ status: 'FAIL', skipReason: null });
    await expectAppliedLike(p.changes);
  });

  it('수정: 판정 전 주끼리 옮기기 · 사유만 바꾸기 · 이미 있는 주로는 못 옮긴다', async () => {
    const q = `mutation($id: ID!, $i: ExemptionPeriodInput!) { updateExemptionPeriod(id: $id, input: $i) { ${PERIOD} } }`;
    const d = await ok<{ updateExemptionPeriod: Json }>(q, { id: '2', i: { weekStart: '2026-10-12', reason: '중간고사 1주차' } });
    expect(d.updateExemptionPeriod).toMatchObject({ id: '2', weekStart: '2026-10-12', reason: '중간고사 1주차', updatedAt: '2026-10-01T10:00:00+09:00' });
    expect(await run(q, { id: '2', i: { weekStart: '2026-10-26', reason: 'x' } })).toMatchObject({ codes: ['EXEMPTION_DUPLICATE'] });
    expect((await run(q, { id: '99', i: { weekStart: '2026-11-02', reason: 'x' } })).codes).toEqual(['NOT_FOUND']);
  });

  it('수정: 지난 주(9/7)를 다른 지난 주(9/14)로 옮기면 두 주 모두 다시 계산한다', async () => {
    const p = (await ok<PeriodPreview>(PERIOD_PREVIEW, { w: '2026-09-14', p: '1' })).exemptionPeriodPreview;
    expect(p.isRetroactive).toBe(true);
    await ok(`mutation($i: ExemptionPeriodInput!) { updateExemptionPeriod(id: "1", input: $i) { id } }`, {
      i: { weekStart: '2026-09-14', reason: '옮김', expectedBasis: p.basis },
    });
    expect(judgmentOf('1', '2026-09-14')).toMatchObject({ status: 'EXEMPT', skipReason: 'EXEMPTION_PERIOD' });
    await expectAppliedLike(p.changes);
  });
});

describe('개인 면제 요청 (AD-01 ②-3 ⑦)', () => {
  const APPROVE = `mutation($id: ID!, $b: String) { approvePersonalExemption(requestId: $id, expectedBasis: $b) { id status respondedAt rejectReason } }`;
  const REJECT = `mutation($id: ID!, $r: String!) { rejectPersonalExemption(requestId: $id, reason: $r) { id status rejectReason respondedAt } }`;

  it('판정 전 주 승인: 바로 승인 · 요청 대기 수 -1', async () => {
    const d = await ok<{ approvePersonalExemption: Json }>(APPROVE, { id: '5' });
    expect(d.approvePersonalExemption).toEqual({ id: '5', status: 'APPROVED', respondedAt: '2026-10-01T10:00:00+09:00', rejectReason: null });
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary.pendingExemptionRequestCount).toBe(1);
    // 같은 요청을 다시 승인해도 그대로
    expect((await run(APPROVE, { id: '5' })).codes).toEqual([]);
  });

  it('판정이 끝난 주 승인(소급): 미리보기 3 → 2 · 벌칙 해제와 같은 결과', async () => {
    db.personalExemptions.push({
      id: '90', memberId: '6', requestedById: '1', teamId: '1', weekStart: '2026-09-21', reason: '병원 진료',
      status: 'PENDING', rejectReason: null, createdAt: '2026-09-27T10:00:00+09:00', respondedAt: null,
    });
    const p = await ok<{ personalExemptionApprovalPreview: Change & { warningCountBefore: number; basis: string } }>(
      `{ personalExemptionApprovalPreview(requestId: "90") { member { id } warningCountBefore warningCountAfter penaltyChange basis } }`,
    );
    expect(p.personalExemptionApprovalPreview).toMatchObject({ warningCountBefore: 3, warningCountAfter: 2, penaltyChange: 'RELEASE' });

    await ok(APPROVE, { id: '90', b: p.personalExemptionApprovalPreview.basis });
    expect(judgmentOf('6', '2026-09-21')).toMatchObject({ status: 'EXEMPT', skipReason: 'PERSONAL_EXEMPTION' });
    expect(db.warnings.find((w) => w.judgmentId === judgmentOf('6', '2026-09-21')?.id)?.retractedAt).toBe('2026-10-01T10:00:00+09:00');
    await expectAppliedLike([p.personalExemptionApprovalPreview]);
  });

  it('거절: 사유 필수(E-48) · 요청한 팀장의 TM-08에 사유가 보인다 · 처리된 요청은 다시 못 바꾼다', async () => {
    expect(await run(REJECT, { id: '5', r: '  ' })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['reason'] });
    const d = await ok<{ rejectPersonalExemption: Json }>(REJECT, { id: '5', r: '대회 일정이 확인되지 않아요.' });
    expect(d.rejectPersonalExemption).toMatchObject({ status: 'REJECTED', rejectReason: '대회 일정이 확인되지 않아요.' });

    const mine = await ok<{ myPersonalExemptionRequests: { items: Json[] } }>(`{ myPersonalExemptionRequests { items { id status rejectReason } } }`);
    expect(mine.myPersonalExemptionRequests.items).toContainEqual({ id: '5', status: 'REJECTED', rejectReason: '대회 일정이 확인되지 않아요.' });

    expect(await run(REJECT, { id: '5', r: '다시' })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['requestId'] });
    expect(await run(APPROVE, { id: '5' })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['requestId'] });
  });
});

describe('공지 (AD-01 ②-4)', () => {
  const LIST = `{ notices { items { id title isPinned isSystem } } }`;
  type Notices = { notices: { items: { id: string; title: string; isPinned: boolean }[] } };

  it('작성 · 수정 · 고정 토글 — 고정 공지가 맨 위', async () => {
    const c = await ok<{ createNotice: Json }>(
      `mutation($i: NoticeInput!) { createNotice(input: $i) { id title content isPinned isSystem createdAt updatedAt } }`,
      { i: { title: ' 동아리 MT 안내 ', content: '10/17(토) 출발해요.\n준비물은 따로 알려 드려요.', isPinned: false } },
    );
    expect(c.createNotice).toEqual({
      id: '7',
      title: '동아리 MT 안내',
      content: '10/17(토) 출발해요.\n준비물은 따로 알려 드려요.',
      isPinned: false,
      isSystem: false,
      createdAt: '2026-10-01T10:00:00+09:00',
      updatedAt: null,
    });
    expect((await ok<Notices>(LIST)).notices.items.map((n) => n.id)).toEqual(['2', '7', '6', '5', '4', '3', '1']);

    const u = await ok<{ updateNotice: Json }>(`mutation($i: NoticeInput!) { updateNotice(id: "7", input: $i) { title isPinned updatedAt } }`, {
      i: { title: '동아리 MT 일정', content: '바뀐 본문', isPinned: true },
    });
    expect(u.updateNotice).toEqual({ title: '동아리 MT 일정', isPinned: true, updatedAt: '2026-10-01T10:00:00+09:00' });

    await ok(`mutation { setNoticePinned(id: "3", isPinned: true) { id isPinned } }`);
    await ok(`mutation { setNoticePinned(id: "2", isPinned: false) { id isPinned } }`);
    expect((await ok<Notices>(LIST)).notices.items.map((n) => [n.id, n.isPinned])).toEqual([
      ['7', true],
      ['3', true],
      ['6', false],
      ['5', false],
      ['4', false],
      ['2', false],
      ['1', false],
    ]);
  });

  it('삭제: 일반 공지는 사라지고, 잔디 인정 규칙 공지는 SYSTEM_NOTICE_UNDELETABLE', async () => {
    expect((await ok<{ deleteNotice: boolean }>(`mutation { deleteNotice(id: "3") }`)).deleteNotice).toBe(true);
    expect((await ok<Notices>(LIST)).notices.items.map((n) => n.id)).toEqual(['2', '6', '5', '4', '1']);
    expect((await run(`mutation { deleteNotice(id: "3") }`)).codes).toEqual(['NOT_FOUND']);
    expect((await run(`mutation { deleteNotice(id: "2") }`)).codes).toEqual(['SYSTEM_NOTICE_UNDELETABLE']);
    expect(db.notices.find((n) => n.id === '2')?.deletedAt).toBeNull();
  });

  it('제목 · 본문 빈 값은 VALIDATION_FAILED(field)', async () => {
    const q = `mutation($i: NoticeInput!) { createNotice(input: $i) { id } }`;
    expect(await run(q, { i: { title: ' ', content: '본문', isPinned: false } })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['title'] });
    expect(await run(q, { i: { title: '제목', content: '\n', isPinned: false } })).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['content'] });
    expect(await run(q, { i: { title: '가'.repeat(201), content: '본문', isPinned: false } })).toMatchObject({ fields: ['title'] });
  });
});
