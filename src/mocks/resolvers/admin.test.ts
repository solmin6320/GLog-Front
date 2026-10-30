/**
 * 관리자 재계산 뮤테이션 (AD-01 ②-0 ⑦⑨⑩ · ②-1 ⑥⑧) — 반영 결과가 미리보기와 같아야 한다 (README 5).
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
  return { data: res.data as Json | null | undefined, codes: (res.errors ?? []).map((e) => e.extensions?.code) };
}

async function ok<T = Json>(query: string, variables?: Json, as: PersonaKey = 'member'): Promise<T> {
  const res: ExecutionResult = await executeMock({ query, variables, authorization: `Bearer ${mockTokenFor(as)}` });
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

const IMPACT = 'impact { onHold warningCountBefore warningCountAfter entersPenalty leavesPenalty recordOnly affectedWeeks }';
const PREVIEW = `query($id: ID!, $s: AdminCorrectionStatus!) {
  previewJudgmentCorrection(judgmentId: $id, status: $s) { currentStatus targetStatus ${IMPACT} }
}`;
const CORRECT = `mutation($input: JudgmentCorrectionInput!) {
  correctJudgment(input: $input) { judgmentId member { nickname } weekStart status onHold warningCount penaltyTarget }
}`;
const RESTORE_PREVIEW = `query($id: ID!) { previewWarningRestore(warningId: $id) { member { nickname } restoreTeams { name } teamDeleted ${IMPACT} } }`;
const RESTORE = `mutation($id: ID!) { restoreWarning(warningId: $id) { member { nickname } onHold warningCount penaltyTarget } }`;
const SUMMARY = `{ adminDashboardSummary { failedMembers penaltyTargets } adminJudgmentHolds { totalCount identityMismatchCount } }`;

type Impact = {
  onHold: boolean;
  warningCountBefore: number | null;
  warningCountAfter: number | null;
  entersPenalty: boolean;
  leavesPenalty: boolean;
  recordOnly: boolean;
  affectedWeeks: number;
};
type Preview = { currentStatus: string; targetStatus: string; impact: Impact };
type Corrected = { judgmentId: string; status: string; onHold: boolean; warningCount: number | null; penaltyTarget: boolean };

const preview = async (id: string, s: string) => (await ok<{ previewJudgmentCorrection: Preview }>(PREVIEW, { id, s })).previewJudgmentCorrection;
const correct = async (input: Json) => (await ok<{ correctJudgment: Corrected }>(CORRECT, { input })).correctJudgment;

describe('correctJudgment (AD-01 ⑩)', () => {
  it('ACC-FIX-08 · ACC-FIX-09: 박지훈 9/21 미달 → 통과 = 미리보기(3 → 2 · 해제)와 같은 결과 + 벌칙 대상에서 빠진다', async () => {
    const id = judgmentIdOf('박지훈');
    const p = await preview(id, 'PASS');
    expect(p).toEqual({
      currentStatus: 'FAIL',
      targetStatus: 'PASS',
      impact: { onHold: false, warningCountBefore: 3, warningCountAfter: 2, entersPenalty: false, leavesPenalty: true, recordOnly: false, affectedWeeks: 1 },
    });

    const r = await correct({ judgmentId: id, status: 'PASS', reason: '  비공개 기여 설정 확인  ', expectedStatus: p.currentStatus });
    expect(r).toMatchObject({ judgmentId: id, status: 'PASS', onHold: false, warningCount: p.impact.warningCountAfter, penaltyTarget: false });
    expect(db.judgments.find((j) => j.id === id)).toMatchObject({ status: 'PASS', skipReason: null, corrected: true });
    expect(db.judgmentCorrections.at(-1)).toMatchObject({ judgmentId: id, beforeStatus: 'FAIL', afterStatus: 'PASS', reason: '비공개 기여 설정 확인', correctedById: '1' });

    const s = await ok<{ adminDashboardSummary: Json; adminPenaltyTargets: { items: { member: { nickname: string } }[]; totalCount: number } }>(
      `{ adminDashboardSummary { failedMembers penaltyTargets } adminPenaltyTargets { items { member { nickname } } totalCount } }`,
    );
    expect(s.adminDashboardSummary).toEqual({ failedMembers: 3, penaltyTargets: 1 });
    expect(s.adminPenaltyTargets.items.map((t) => t.member.nickname)).toEqual(['정하늘']);
    // 회수된 경고는 삭제된 경고 목록에 나오지 않는다
    const d = await ok<{ adminDeletedWarnings: { items: Json[] } }>(`{ adminDeletedWarnings { items { warningId } } }`);
    expect(d.adminDeletedWarnings.items).toHaveLength(2);
  });

  it('expectedStatus가 지금 판정과 다르면 JUDGMENT_CHANGED이고 아무것도 바뀌지 않는다', async () => {
    const id = judgmentIdOf('박지훈');
    const r = await run(CORRECT, { input: { judgmentId: id, status: 'PASS', reason: '사유', expectedStatus: 'PASS' } });
    expect(r.codes).toEqual(['JUDGMENT_CHANGED']);
    expect(db.judgments.find((j) => j.id === id)?.status).toBe('FAIL');
    expect(db.judgmentCorrections).toHaveLength(1); // 시드 1건 그대로

    // 다른 관리자가 먼저 정정하면 같은 expectedStatus로는 못 바꾼다
    await correct({ judgmentId: id, status: 'PASS', reason: '사유', expectedStatus: 'FAIL' });
    const again = await run(CORRECT, { input: { judgmentId: id, status: 'EXEMPT', reason: '사유', expectedStatus: 'FAIL' } });
    expect(again.codes).toEqual(['JUDGMENT_CHANGED']);
    expect(db.judgments.find((j) => j.id === id)?.status).toBe('PASS');
  });

  it('보류 · 같은 결과 · 제외를 면제 아닌 결과로는 JUDGMENT_NOT_CORRECTABLE, 사유 빈 값 REASON_REQUIRED · 501자 INVALID_INPUT', async () => {
    const held = db.judgments.find((j) => j.status === 'HOLD')?.id;
    expect((await run(CORRECT, { input: { judgmentId: held, status: 'PASS', reason: '사유' } })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    expect((await run(PREVIEW, { id: held, s: 'PASS' })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    const id = judgmentIdOf('박지훈');
    expect((await run(CORRECT, { input: { judgmentId: id, status: 'PASS', reason: '   ' } })).codes).toEqual(['REASON_REQUIRED']);
    expect((await run(CORRECT, { input: { judgmentId: id, status: 'PASS', reason: 'x'.repeat(501) } })).codes).toEqual(['INVALID_INPUT']);
    expect((await run(CORRECT, { input: { judgmentId: id, status: 'FAIL', reason: '사유' } })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    expect((await run(PREVIEW, { id, s: 'FAIL' })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    const firstWeek = judgmentIdOf('서연');
    expect((await run(CORRECT, { input: { judgmentId: firstWeek, status: 'PASS', reason: '사유' } })).codes).toEqual(['JUDGMENT_NOT_CORRECTABLE']);
    expect((await run(CORRECT, { input: { judgmentId: '99999', status: 'PASS', reason: '사유' } })).codes).toEqual(['NOT_FOUND']);
    expect(db.judgmentCorrections).toHaveLength(1);
  });

  it('E-49: 통과 → 미달은 경고를 붙이고, 다시 통과 → 회수, 또 미달 → 같은 경고를 되살린다', async () => {
    const id = judgmentIdOf('김철수');
    const p = await preview(id, 'FAIL');
    expect(p.impact).toMatchObject({ warningCountBefore: 0, warningCountAfter: 1, entersPenalty: false, leavesPenalty: false });
    const toFail = await correct({ judgmentId: id, status: 'FAIL', reason: '사유', expectedStatus: 'PASS' });
    expect(toFail.warningCount).toBe(1);
    const warnings = () => db.warnings.filter((w) => w.judgmentId === id);
    expect(warnings()).toHaveLength(1);
    expect(warnings()[0]).toMatchObject({ teamIds: ['1'], retractedAt: null, deleted: null });

    const toPass = await correct({ judgmentId: id, status: 'PASS', reason: '사유' });
    expect(toPass.warningCount).toBe(0);
    expect(warnings()[0]?.retractedAt).not.toBeNull();

    const again = await preview(id, 'FAIL');
    const back = await correct({ judgmentId: id, status: 'FAIL', reason: '사유' });
    expect(back.warningCount).toBe(again.impact.warningCountAfter);
    expect(warnings()).toHaveLength(1);
  });

  it('ACC-FIX-16: 첫 참가(EXCLUDED)는 면제로만 정정하고, 면제로 정정하면 인증일 · 기록글은 비운다', async () => {
    const id = judgmentIdOf('서연');
    const r = await correct({ judgmentId: id, status: 'EXEMPT', reason: '사유', expectedStatus: 'EXCLUDED' });
    expect(r).toMatchObject({ status: 'EXEMPT' });
    expect(db.judgments.find((j) => j.id === id)).toMatchObject({ skipReason: 'PERSONAL_EXEMPTION', corrected: true, verifiedDays: null, recordCount: null });
    // 면제 → 통과는 스냅숏으로 인증일 · 기록글을 채운다
    await correct({ judgmentId: id, status: 'PASS', reason: '사유' });
    expect(db.judgments.find((j) => j.id === id)).toMatchObject({ status: 'PASS', skipReason: null, verifiedDays: 2, recordCount: 0 });
  });
});

describe('보류 재시도 (AD-01 ⑦⑨, E-35)', () => {
  const RETRY_ALL = `mutation { retryAllJudgmentHolds { attempted resolved stillHold failed } }`;
  const RETRY = `mutation($m: ID!, $w: String!) { retryJudgmentHold(memberId: $m, weekStart: $w) { member { nickname } weekStart status holdReason resolved } }`;

  it('ACC-FIX-14: 보류(API_ERROR)만 다시 판정하고 확정 건 · 아이디 변경 건은 그대로다', async () => {
    // 보류 2명: 시드 노현우(API_ERROR) + 백서윤을 아이디 변경 보류로
    const extra = db.judgments.find((j) => j.memberId === '30' && j.weekStart === '2026-09-21');
    if (!extra) throw new Error('seed');
    Object.assign(extra, { status: 'HOLD', holdReason: 'IDENTITY_MISMATCH', verifiedDays: null, recordCount: null, judgedAt: null });
    touch();
    const apiHold = db.judgments.find((j) => j.status === 'HOLD' && j.holdReason === 'API_ERROR');
    if (!apiHold) throw new Error('seed');
    const before = db.judgments.filter((j) => j.status !== 'HOLD').map((j) => `${j.id}:${j.status}`);

    const r = (await ok<{ retryAllJudgmentHolds: Json }>(RETRY_ALL)).retryAllJudgmentHolds;
    expect(r).toEqual({ attempted: 2, resolved: 1, stillHold: 1, failed: 0 });
    expect(apiHold).toMatchObject({ holdReason: null, judgedAt: '2026-10-01T10:00:00+09:00' });
    expect(['PASS', 'FAIL', 'EXEMPT']).toContain(apiHold.status);
    expect(extra).toMatchObject({ status: 'HOLD', holdReason: 'IDENTITY_MISMATCH' });
    // 확정 건은 바뀌지 않는다
    for (const s of before) {
      const [id, status] = s.split(':');
      expect(db.judgments.find((j) => j.id === id)?.status).toBe(status);
    }
    expect((await ok<{ adminJudgmentHolds: Json }>(SUMMARY)).adminJudgmentHolds).toEqual({ totalCount: 1, identityMismatchCount: 1 });
    // 다시 돌려도 풀 것이 없다
    expect((await ok<{ retryAllJudgmentHolds: Json }>(RETRY_ALL)).retryAllJudgmentHolds).toEqual({ attempted: 1, resolved: 0, stillHold: 1, failed: 0 });
  });

  it('행 [재시도]: 지정한 보류만 · 확정 건은 현재 결과 그대로 · 없는 주는 NOT_FOUND', async () => {
    const held = db.judgments.find((j) => j.status === 'HOLD');
    if (!held) throw new Error('seed');
    const r = (await ok<{ retryJudgmentHold: Json }>(RETRY, { m: held.memberId, w: held.weekStart })).retryJudgmentHold;
    expect(r).toMatchObject({ weekStart: held.weekStart, holdReason: null, resolved: true });

    const kim = memberIdOf('김철수');
    const confirmed = (await ok<{ retryJudgmentHold: Json }>(RETRY, { m: kim, w: '2026-09-21' })).retryJudgmentHold;
    expect(confirmed).toEqual({ member: { nickname: '김철수' }, weekStart: '2026-09-21', status: 'PASS', holdReason: null, resolved: false });
    expect((await run(RETRY, { m: kim, w: '2026-01-05' })).codes).toEqual(['NOT_FOUND']);
  });
});

describe('fulfillPenalty (AD-01 ②-1 ⑥, E-58)', () => {
  const FULFILL = `mutation($id: ID!) { fulfillPenalty(memberId: $id) { member { nickname } fulfilledAt reachedWeek } }`;

  it('ACC-PEN-03: 박지훈 이행 완료 → 경고 0 · 벌칙 대상에서 빠지고, 두 번째는 NOT_PENALTY_TARGET', async () => {
    const id = memberIdOf('박지훈');
    const r = await ok<{ fulfillPenalty: Json }>(FULFILL, { id });
    expect(r.fulfillPenalty).toEqual({ member: { nickname: '박지훈' }, fulfilledAt: '2026-10-01T10:00:00+09:00', reachedWeek: '2026-09-21' });
    expect(db.penaltyFulfillments).toEqual([expect.objectContaining({ memberId: id, effectiveWeekStart: '2026-09-28', fulfilledById: '1' })]);
    const mine = await ok<{ myWarningSummary: Json }>(`{ myWarningSummary { warningCount penaltyTarget streak } }`, undefined, 'penalty');
    expect(mine.myWarningSummary).toEqual({ warningCount: 0, penaltyTarget: false, streak: 0 });
    expect((await ok<{ adminDashboardSummary: Json }>(SUMMARY)).adminDashboardSummary).toMatchObject({ penaltyTargets: 1 });
    expect((await run(FULFILL, { id })).codes).toEqual(['NOT_PENALTY_TARGET']);
    expect((await run(FULFILL, { id: memberIdOf('김철수') })).codes).toEqual(['NOT_PENALTY_TARGET']);
    expect((await run(FULFILL, { id: '99999' })).codes).toEqual(['NOT_FOUND']);
  });

  it('ACC-FIX-07: 이행 체크 이전 주차를 정정하면 미리보기가 기록만 바뀐다고 알리고 경고 수는 그대로다', async () => {
    await ok(FULFILL, { id: memberIdOf('박지훈') });
    const p = await preview(judgmentIdOf('박지훈'), 'PASS');
    expect(p.impact).toMatchObject({ recordOnly: true, warningCountBefore: 0, warningCountAfter: 0, entersPenalty: false, leavesPenalty: false });
    const r = await correct({ judgmentId: judgmentIdOf('박지훈'), status: 'PASS', reason: '사유' });
    expect(r.warningCount).toBe(0);
  });
});

describe('restoreWarning (AD-01 ②-1 ⑧)', () => {
  type RestorePreview = { member: { nickname: string }; restoreTeams: { name: string }[]; teamDeleted: boolean; impact: Impact };

  it('ACC-PEN-06 · ACC-PEN-07: 이영희 복구 = 미리보기(2 → 3 · 벌칙 진입)와 같고 목록에서 빠진다', async () => {
    const id = deletedWarningIdOf('이영희');
    const p = (await ok<{ previewWarningRestore: RestorePreview }>(RESTORE_PREVIEW, { id })).previewWarningRestore;
    expect(p).toMatchObject({ restoreTeams: [{ name: '웹 프로젝트 B팀' }], teamDeleted: false });
    expect(p.impact).toMatchObject({ warningCountBefore: 2, warningCountAfter: 3, entersPenalty: true, leavesPenalty: false });
    const r = await ok<{ restoreWarning: Json }>(RESTORE, { id });
    expect(r.restoreWarning).toEqual({ member: { nickname: '이영희' }, onHold: false, warningCount: 3, penaltyTarget: true });
    const tw = await ok<{ profile: { teamWarnings: { teams: { name: string }[] } } }>(
      `query($m: ID!) { profile(memberId: $m) { teamWarnings { teams { name count } } } }`,
      { m: memberIdOf('이영희') },
    );
    expect(tw.profile.teamWarnings.teams.map((t) => t.name)).toContain('웹 프로젝트 B팀');
    const d = await ok<{ adminDeletedWarnings: { items: { member: { nickname: string } }[] }; adminPenaltyTargets: { items: { member: { nickname: string } }[] } }>(
      `{ adminDeletedWarnings { items { member { nickname } } } adminPenaltyTargets { items { member { nickname } } } }`,
    );
    expect(d.adminDeletedWarnings.items.map((n) => n.member.nickname)).toEqual(['최유진']);
    expect(d.adminPenaltyTargets.items.map((t) => t.member.nickname)).toContain('이영희');
    // 이미 복구됐으면 ALREADY_HANDLED
    expect((await run(RESTORE, { id })).codes).toEqual(['ALREADY_HANDLED']);
    expect((await run(RESTORE_PREVIEW, { id })).codes).toEqual(['ALREADY_HANDLED']);
  });

  it('ACC-PEN-08: 팀이 삭제된 경고는 팀 없이 복구된다 · 없는 경고는 NOT_FOUND', async () => {
    const id = deletedWarningIdOf('최유진');
    const p = (await ok<{ previewWarningRestore: RestorePreview }>(RESTORE_PREVIEW, { id })).previewWarningRestore;
    expect(p).toMatchObject({ restoreTeams: [], teamDeleted: true });
    const r = await ok<{ restoreWarning: { warningCount: number | null } }>(RESTORE, { id });
    expect(db.warnings.find((w) => w.id === id)).toMatchObject({ deleted: null, teamIds: [] });
    expect(r.restoreWarning.warningCount).toBe(p.impact.warningCountAfter);
    expect((await run(RESTORE, { id: '99999' })).codes).toEqual(['NOT_FOUND']);
  });

  it('관리자가 아니면 FORBIDDEN', async () => {
    const r = await run(RESTORE, { id: deletedWarningIdOf('이영희') }, 'plain');
    expect(r.codes).toEqual(['FORBIDDEN']);
  });
});
