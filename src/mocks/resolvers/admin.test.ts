/**
 * 관리자 재계산 뮤테이션 4종 (AD-01 ②-0 ⑦⑨⑩ · ②-1 ⑥⑧) — 반영 결과가 미리보기와 같아야 한다 (README 5).
 * MSW 없이 executeMock으로 스키마를 바로 실행한다. 매 테스트 시드로 돌아간다(test/setup.ts).
 */
import type { ExecutionResult } from 'graphql';
import { describe, expect, it } from 'vitest';
import { mockTokenFor, type PersonaKey } from '../control';
import { db, touch } from '../db/store';
import { executeMock } from '../schema';

type Json = Record<string, unknown>;

async function run(query: string, variables?: Json, as: PersonaKey = 'member') {
  const res: ExecutionResult = await executeMock({ query, variables, authorization: `Bearer ${mockTokenFor(as)}` });
  return { data: res.data as Json | null | undefined, codes: (res.errors ?? []).map((e) => e.extensions?.code), fields: (res.errors ?? []).map((e) => e.extensions?.field) };
}

async function ok<T = Json>(query: string, variables?: Json): Promise<T> {
  const res: ExecutionResult = await executeMock({ query, variables, authorization: `Bearer ${mockTokenFor('member')}` });
  expect(res.errors?.map((e) => e.message) ?? []).toEqual([]);
  return res.data as T;
}

/** 9/21 주 판정 id (닉네임으로) */
function judgmentIdOf(nickname: string, weekStart = '2026-09-21'): string {
  const m = db.members.find((x) => x.nickname === nickname);
  const j = db.judgments.find((x) => x.memberId === m?.id && x.weekStart === weekStart);
  if (!j) throw new Error(`no judgment for ${nickname} ${weekStart}`);
  return j.id;
}

const memberIdOf = (nickname: string) => db.members.find((x) => x.nickname === nickname)?.id ?? '';
const deletedWarningIdOf = (nickname: string) => db.warnings.find((w) => w.memberId === memberIdOf(nickname) && w.deleted)?.id ?? '';

const PREVIEW = `query($id: ID!, $s: CorrectableJudgmentStatus!) {
  judgmentCorrectionPreview(judgmentId: $id, newStatus: $s) { warningCountBefore warningCountAfter penaltyChange affectedWeekCount frozenByFulfillment basis }
}`;
const CORRECT = `mutation($input: CorrectJudgmentInput!) {
  correctJudgment(input: $input) { member { nickname } warningState { activeCount isPenaltyTarget } judgment { id status skipReason corrected } }
}`;
const RESTORE_PREVIEW = `query($id: ID!) { restoreWarningPreview(warningId: $id) { warningCountBefore warningCountAfter penaltyChange frozenByFulfillment restoresWithoutCategory basis } }`;
const RESTORE = `mutation($id: ID!, $b: String) { restoreWarning(warningId: $id, expectedBasis: $b) { member { nickname } warningState { activeCount isPenaltyTarget byCategory { label { kind name } count } } } }`;
const SUMMARY = `{ adminDashboardSummary { latestWeekFailCount penaltyTargetCount heldJudgmentCount } }`;

type Preview = { warningCountBefore: number; warningCountAfter: number; penaltyChange: string; affectedWeekCount: number; frozenByFulfillment: boolean; basis: string };
type Payload = { member: { nickname: string }; warningState: { activeCount: number; isPenaltyTarget: boolean }; judgment: { id: string; status: string; skipReason: string | null; corrected: boolean } };

describe('correctJudgment (AD-01 ⑩)', () => {
  it('ACC-FIX-08 · ACC-FIX-09: 박지훈 9/21 미달 → 통과 = 미리보기(3 → 2 · 해제)와 같은 결과 + 벌칙 대상에서 빠진다', async () => {
    const id = judgmentIdOf('박지훈');
    const p = (await ok<{ judgmentCorrectionPreview: Preview }>(PREVIEW, { id, s: 'PASS' })).judgmentCorrectionPreview;
    expect(p).toMatchObject({ warningCountBefore: 3, warningCountAfter: 2, penaltyChange: 'RELEASE', affectedWeekCount: 1 });

    const r = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: id, newStatus: 'PASS', reason: '  비공개 기여 설정 확인  ', expectedBasis: p.basis } }))
      .correctJudgment;
    expect(r.warningState).toEqual({ activeCount: p.warningCountAfter, isPenaltyTarget: false });
    expect(r.judgment).toEqual({ id, status: 'PASS', skipReason: null, corrected: true });
    expect(db.judgmentCorrections.at(-1)).toMatchObject({ judgmentId: id, beforeStatus: 'FAIL', afterStatus: 'PASS', reason: '비공개 기여 설정 확인', correctedById: '1' });

    const s = await ok<{ adminDashboardSummary: Json; penaltyTargets: { member: { nickname: string } }[] }>(
      `{ adminDashboardSummary { latestWeekFailCount penaltyTargetCount } penaltyTargets { member { nickname } } }`,
    );
    expect(s.adminDashboardSummary).toEqual({ latestWeekFailCount: 3, penaltyTargetCount: 1 });
    expect(s.penaltyTargets.map((t) => t.member.nickname)).toEqual(['정하늘']);
    // 회수된 경고는 삭제된 경고 목록에 나오지 않는다
    const d = await ok<{ deletedWarnings: { totalCount: number } }>(`{ deletedWarnings { totalCount } }`);
    expect(d.deletedWarnings.totalCount).toBe(2);
  });

  it('ACC-FIX-11: 미리보기 뒤 다른 변경이 먼저 반영되면 PREVIEW_STALE이고 아무것도 바뀌지 않는다', async () => {
    const id = judgmentIdOf('박지훈');
    const p = (await ok<{ judgmentCorrectionPreview: Preview }>(PREVIEW, { id, s: 'PASS' })).judgmentCorrectionPreview;
    touch(); // 다른 관리자의 변경
    const r = await run(CORRECT, { input: { judgmentId: id, newStatus: 'PASS', reason: '사유', expectedBasis: p.basis } });
    expect(r.codes).toEqual(['PREVIEW_STALE']);
    expect(db.judgments.find((j) => j.id === id)?.status).toBe('FAIL');
    expect(db.judgmentCorrections).toHaveLength(1); // 시드 1건 그대로
  });

  it('보류는 JUDGMENT_NOT_CORRECTABLE · 사유 빈 값 · 501자 · 같은 결과는 VALIDATION_FAILED', async () => {
    const held = db.judgments.find((j) => j.status === 'HOLD')?.id;
    expect((await run(CORRECT, { input: { judgmentId: held, newStatus: 'PASS', reason: '사유' } })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    expect((await run(PREVIEW, { id: held, s: 'PASS' })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    const id = judgmentIdOf('박지훈');
    const blank = await run(CORRECT, { input: { judgmentId: id, newStatus: 'PASS', reason: '   ' } });
    expect(blank).toMatchObject({ codes: ['VALIDATION_FAILED'], fields: ['reason'] });
    expect((await run(CORRECT, { input: { judgmentId: id, newStatus: 'PASS', reason: 'x'.repeat(501) } })).fields).toEqual(['reason']);
    expect((await run(CORRECT, { input: { judgmentId: id, newStatus: 'FAIL', reason: '사유' } })).fields).toEqual(['newStatus']);
    expect((await run(CORRECT, { input: { judgmentId: '99999', newStatus: 'PASS', reason: '사유' } })).codes).toEqual(['NOT_FOUND']);
  });

  it('E-49: 통과 → 미달은 경고를 붙이고, 다시 통과 → 회수, 또 미달 → 같은 경고를 되살린다', async () => {
    const id = judgmentIdOf('김철수');
    const p = (await ok<{ judgmentCorrectionPreview: Preview }>(PREVIEW, { id, s: 'FAIL' })).judgmentCorrectionPreview;
    expect(p).toMatchObject({ warningCountBefore: 0, warningCountAfter: 1, penaltyChange: 'NONE' });
    const toFail = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: id, newStatus: 'FAIL', reason: '사유', expectedBasis: p.basis } })).correctJudgment;
    expect(toFail.warningState.activeCount).toBe(1);
    const warnings = () => db.warnings.filter((w) => w.judgmentId === id);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatchObject({ teamIds: ['1'], retractedAt: null, deleted: null });

    const toPass = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: id, newStatus: 'PASS', reason: '사유' } })).correctJudgment;
    expect(toPass.warningState.activeCount).toBe(0);
    expect(warnings()[0]?.retractedAt).not.toBeNull();

    const again = (await ok<{ judgmentCorrectionPreview: Preview }>(PREVIEW, { id, s: 'FAIL' })).judgmentCorrectionPreview;
    const back = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: id, newStatus: 'FAIL', reason: '사유' } })).correctJudgment;
    expect(back.warningState.activeCount).toBe(again.warningCountAfter);
    expect(warnings()).toHaveLength(1);
  });

  it('ACC-FIX-16: 첫 참가(EXCLUDED)도 정정할 수 있고, 면제로 정정하면 인증일 · 기록글은 비운다', async () => {
    const id = judgmentIdOf('서연');
    const r = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: id, newStatus: 'PASS', reason: '사유' } })).correctJudgment;
    expect(r.judgment).toMatchObject({ status: 'PASS', corrected: true });
    expect(db.judgments.find((j) => j.id === id)).toMatchObject({ verifiedDays: 2, recordCount: 0 });
    const ex = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: id, newStatus: 'EXEMPT', reason: '사유' } })).correctJudgment;
    expect(ex.judgment).toMatchObject({ status: 'EXEMPT', skipReason: 'PERSONAL_EXEMPTION' });
    expect(db.judgments.find((j) => j.id === id)).toMatchObject({ verifiedDays: null, recordCount: null });
  });
});

describe('rerunHeldJudgments (AD-01 ⑦⑨, E-35)', () => {
  const RERUN = `mutation($ids: [ID!]) { rerunHeldJudgments(judgmentIds: $ids) { processedCount stillHeldCount rows { judgment { status holdReason judgedAt } canRetry canCorrect } } }`;
  type Rerun = { rerunHeldJudgments: { processedCount: number; stillHeldCount: number; rows: { judgment: { status: string; holdReason: string | null; judgedAt: string }; canRetry: boolean; canCorrect: boolean }[] } };

  it('ACC-FIX-14: 보류(API_ERROR)만 다시 판정하고 확정 건 · 아이디 변경 건은 그대로다', async () => {
    // 보류 2명: 시드 노현우(API_ERROR) + 백서윤을 아이디 변경 보류로
    const extra = db.judgments.find((j) => j.memberId === '30' && j.weekStart === '2026-09-21');
    if (!extra) throw new Error('seed');
    Object.assign(extra, { status: 'HOLD', holdReason: 'IDENTITY_MISMATCH', verifiedDays: null, recordCount: null, judgedAt: null });
    touch();
    const before = db.judgments.filter((j) => j.status !== 'HOLD').map((j) => `${j.id}:${j.status}`);

    const r = (await ok<Rerun>(RERUN)).rerunHeldJudgments;
    expect(r.processedCount).toBe(1);
    expect(r.stillHeldCount).toBe(1);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({ canRetry: false, canCorrect: true, judgment: { holdReason: null, judgedAt: '2026-10-01T10:00:00+09:00' } });
    expect(['PASS', 'FAIL', 'EXEMPT']).toContain(r.rows[0]?.judgment.status);
    // 확정 건은 바뀌지 않는다
    for (const s of before) {
      const [id, status] = s.split(':');
      expect(db.judgments.find((j) => j.id === id)?.status).toBe(status);
    }
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary).toMatchObject({ heldJudgmentCount: 1 });
    // 다시 돌려도 처리할 것이 없다 (멱등)
    expect((await ok<Rerun>(RERUN)).rerunHeldJudgments).toMatchObject({ processedCount: 0, stillHeldCount: 1 });
  });

  it('행 [재시도]: 지정한 보류만 · 확정 건 id는 건너뛴다 · 없는 id는 NOT_FOUND', async () => {
    const held = db.judgments.find((j) => j.status === 'HOLD');
    const confirmed = judgmentIdOf('김철수');
    const r = (await ok<Rerun>(RERUN, { ids: [held?.id, confirmed] })).rerunHeldJudgments;
    expect(r).toMatchObject({ processedCount: 1, stillHeldCount: 0 });
    expect(db.judgments.find((j) => j.id === confirmed)?.status).toBe('PASS');
    expect((await run(RERUN, { ids: ['99999'] })).codes).toEqual(['NOT_FOUND']);
  });
});

describe('fulfillPenalty (AD-01 ②-1 ⑥, E-58)', () => {
  const FULFILL = `mutation($id: ID!) { fulfillPenalty(memberId: $id) { member { nickname } warningState { activeCount isPenaltyTarget consecutivePasses } } }`;

  it('ACC-PEN-03: 박지훈 이행 완료 → 경고 0 · 벌칙 대상에서 빠지고, 두 번째는 NOT_FOUND', async () => {
    const id = memberIdOf('박지훈');
    const r = await ok<{ fulfillPenalty: { warningState: Json } }>(FULFILL, { id });
    expect(r.fulfillPenalty.warningState).toEqual({ activeCount: 0, isPenaltyTarget: false, consecutivePasses: 0 });
    expect(db.penaltyFulfillments).toEqual([expect.objectContaining({ memberId: id, effectiveWeekStart: '2026-09-28', fulfilledById: '1' })]);
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary).toMatchObject({ penaltyTargetCount: 1 });
    expect((await run(FULFILL, { id })).codes).toEqual(['NOT_FOUND']);
    expect((await run(FULFILL, { id: memberIdOf('김철수') })).codes).toEqual(['NOT_FOUND']);
  });

  it('ACC-FIX-07: 이행 체크 이전 주차를 정정하면 미리보기가 고정점을 알리고 경고 수는 그대로다', async () => {
    await ok(FULFILL, { id: memberIdOf('박지훈') });
    const p = (await ok<{ judgmentCorrectionPreview: Preview }>(PREVIEW, { id: judgmentIdOf('박지훈'), s: 'PASS' })).judgmentCorrectionPreview;
    expect(p).toMatchObject({ frozenByFulfillment: true, warningCountBefore: 0, warningCountAfter: 0, penaltyChange: 'NONE' });
    const r = (await ok<{ correctJudgment: Payload }>(CORRECT, { input: { judgmentId: judgmentIdOf('박지훈'), newStatus: 'PASS', reason: '사유', expectedBasis: p.basis } }))
      .correctJudgment;
    expect(r.warningState.activeCount).toBe(0);
  });
});

describe('restoreWarning (AD-01 ②-1 ⑧)', () => {
  it('ACC-PEN-06 · ACC-PEN-07: 이영희 복구 = 미리보기(2 → 3 · 벌칙 진입)와 같고 목록에서 빠진다', async () => {
    const id = deletedWarningIdOf('이영희');
    const p = (await ok<{ restoreWarningPreview: Preview }>(RESTORE_PREVIEW, { id })).restoreWarningPreview;
    expect(p).toMatchObject({ warningCountBefore: 2, warningCountAfter: 3, penaltyChange: 'ENTER' });
    const r = await ok<{ restoreWarning: { warningState: { activeCount: number; isPenaltyTarget: boolean; byCategory: Json[] } } }>(RESTORE, { id, b: p.basis });
    expect(r.restoreWarning.warningState).toMatchObject({ activeCount: 3, isPenaltyTarget: true });
    expect(r.restoreWarning.warningState.byCategory).toContainEqual({ label: { kind: 'PUBLIC', name: '웹 프로젝트 B팀' }, count: 1 });
    const d = await ok<{ deletedWarnings: { nodes: { member: { nickname: string } }[] }; penaltyTargets: { member: { nickname: string } }[] }>(
      `{ deletedWarnings { nodes { member { nickname } } } penaltyTargets { member { nickname } } }`,
    );
    expect(d.deletedWarnings.nodes.map((n) => n.member.nickname)).toEqual(['최유진']);
    expect(d.penaltyTargets.map((t) => t.member.nickname)).toContain('이영희');
    expect((await run(RESTORE, { id })).codes).toEqual(['NOT_FOUND']);
  });

  it('ACC-PEN-08: 팀이 삭제된 경고는 팀 없이 복구된다 · 낡은 미리보기는 PREVIEW_STALE', async () => {
    const id = deletedWarningIdOf('최유진');
    const p = (await ok<{ restoreWarningPreview: Preview & { restoresWithoutCategory: boolean } }>(RESTORE_PREVIEW, { id })).restoreWarningPreview;
    expect(p.restoresWithoutCategory).toBe(true);
    touch();
    expect((await run(RESTORE, { id, b: p.basis })).codes).toEqual(['PREVIEW_STALE']);
    const r = await ok<{ restoreWarning: { warningState: { activeCount: number; byCategory: Json[] } } }>(RESTORE, { id });
    expect(db.warnings.find((w) => w.id === id)).toMatchObject({ deleted: null, teamIds: [] });
    expect(r.restoreWarning.warningState.activeCount).toBeGreaterThanOrEqual(0);
  });

  it('관리자가 아니면 FORBIDDEN', async () => {
    const r = await run(RESTORE, { id: deletedWarningIdOf('이영희') }, 'plain');
    expect(r.codes).toEqual(['FORBIDDEN']);
  });
});
