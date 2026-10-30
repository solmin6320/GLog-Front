/**
 * AD-01 ②-0 대시보드 · 판정 정정 · 보류 재시도 (화면설계서 5-1-10, 목업 W-15, A5 3-7 ACC-FIX · ACC-ADM-01).
 * 실제 라우터 · Apollo · bridge 전송 + 가짜 백엔드(admin.graphqls)로 띄운다. member(한동관)는 관리자, plain(김철수)은 아니다.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MSG } from '@/domain/messages';
import { backend } from '@/test/backend';
import { HYUNWOO, installJudgments, judgmentIdOf, judgmentWorld, SEOYUN, type JudgmentWorld } from '@/test/fixtures/admin';
import { renderRoute as renderRouteRaw, type RenderRouteOptions } from '@/test/render';

/* ---------- 도우미 ---------- */

let jw: JudgmentWorld;
beforeEach(() => {
  jw = installJudgments(judgmentWorld());
});
const renderRoute = (path: string, o: RenderRouteOptions = {}) => renderRouteRaw(path, { ...o, bridge: true });

/** 백엔드로 나간 뮤테이션 (미리보기는 쿼리만 · 뮤테이션 0건 확인용) */
const MUTATIONS = ['correctJudgment', 'retryJudgmentHold', 'retryAllJudgmentHolds'];
const mutations = () => backend.calls().filter((c) => MUTATIONS.includes(c.field)).map((c) => c.field);
const previews = () => backend.calls('previewJudgmentCorrection').length;
const rowFx = (memberId: string, weekStart = '2026-09-21') => {
  const r = jw.weeks.find((w) => w.weekStart === weekStart)?.rows.find((x) => x.member.id === memberId);
  if (!r) throw new Error(`fixture: ${memberId} ${weekStart}`);
  return r;
};

/** 표에서 그 회원의 행 */
function rowOf(name: string): HTMLElement {
  const table = screen.getByRole('table', { name: '판정 결과' });
  const row = within(table)
    .getAllByRole('row')
    .find((r) => within(r).queryByText(name));
  if (!row) throw new Error(`row ${name}`);
  return row;
}

const kpi = (key: string) => {
  const el = document.querySelector<HTMLElement>(`[data-kpi="${key}"]`);
  if (!el) throw new Error(`kpi ${key}`);
  return el;
};

async function openPanelFor(user: ReturnType<typeof renderRoute>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: `${name} 판정 정정` }));
  return screen.findByRole('complementary', { name: '판정 정정' });
}

/* ---------- 진입 ---------- */

describe('AD-01 대시보드 진입', () => {
  it('ACC-FIX-01 · E-09: 관리자가 아니면 권한 없음 화면이다', async () => {
    renderRoute('/admin', { as: 'plain' });
    expect(await screen.findByText(MSG.forbidden)).toBeInTheDocument();
    expect(screen.queryByText('판정 결과')).not.toBeInTheDocument();
  });

  it('ACC-ADM-01: 요약 카드 4개 = 3 · 4 · 2 · 2 (W-15), 카드는 해당 탭으로 간다', async () => {
    renderRoute('/admin');
    await waitFor(() => expect(kpi('pending')).toHaveTextContent(/승인 대기\s*3/));
    expect(kpi('fail')).toHaveTextContent(/지난 주 미달\s*4/);
    expect(kpi('penalty')).toHaveTextContent(/벌칙 대상\s*2/);
    expect(kpi('exemption')).toHaveTextContent(/면제 요청 대기\s*2/);
    expect(kpi('pending')).toHaveAttribute('href', '/admin/members?status=pending');
    expect(kpi('penalty')).toHaveAttribute('href', '/admin/warnings');
    expect(kpi('exemption')).toHaveAttribute('href', '/admin/exemptions');
    expect(kpi('fail')).toHaveAttribute('href', '/admin?result=fail');
    // 메뉴 배지는 같은 요약에서 나온다
    expect(screen.getByRole('link', { name: '경고 복구 · 벌칙 2건' })).toBeInTheDocument();
  });

  it('ACC-FIX-02 · M-07: 기본 주차는 가장 최근 판정 주(9/21 ~ 9/27), 집계 · 실행 시각, 팀 열 없음', async () => {
    renderRoute('/admin');
    expect(await screen.findByText('9/28 07:00 실행')).toBeInTheDocument();
    const weekSelect = screen.getByRole('combobox', { name: '주차' });
    expect(weekSelect).toHaveValue('2026-09-21');
    expect(within(weekSelect).getByRole('option', { selected: true })).toHaveTextContent('9/21 ~ 9/27 (지난 주)');
    const counts = screen.getByText('9/28 07:00 실행').parentElement;
    expect(counts).toHaveTextContent(/통과\s*18\s*미달\s*4\s*면제\s*2\s*첫 참가\s*1/);
    const headers = within(screen.getByRole('table', { name: '판정 결과' }))
      .getAllByRole('columnheader')
      .map((h) => h.textContent);
    expect(headers).toEqual(['회원', '인증일', '기록글', '결과', '누적 경고', '처리']);
    // 박지훈: 0일 · 0개 · 미달 · 3 + 벌칙 대상 · [정정]
    const row = rowOf('박지훈');
    expect(row).toHaveTextContent(/0일\s*0개\s*미달\s*3\s*벌칙 대상/);
    expect(within(row).getByRole('button', { name: '박지훈 판정 정정' })).toHaveTextContent('정정');
  });

  it('ACC-FIX-15: 결과 필터 · 회원 검색 · 주차를 바꾸면 URL이 바뀌고 다시 조회한다 (새로고침해도 유지)', async () => {
    const { user, router } = renderRoute('/admin');
    await screen.findByText('9/28 07:00 실행');

    await user.selectOptions(screen.getByRole('combobox', { name: '결과' }), 'hold');
    expect(router.state.location.search).toBe('?result=hold');
    await waitFor(() => expect(within(screen.getByRole('table', { name: '판정 결과' })).getAllByRole('row')).toHaveLength(2));
    expect(rowOf('노현우')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '결과' }), 'all');
    await user.type(screen.getByRole('searchbox', { name: '회원 검색' }), 'jihoon{Enter}');
    expect(router.state.location.search).toBe('?q=jihoon');
    await waitFor(() => expect(within(screen.getByRole('table', { name: '판정 결과' })).getAllByRole('row')).toHaveLength(2));
    expect(rowOf('박지훈')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: '주차' }), '2026-09-14');
    expect(router.state.location.search).toBe('?week=2026-09-14&q=jihoon');
    expect(await screen.findByText('9/21 07:00 실행')).toBeInTheDocument();

    // 가장 최근 판정 주를 다시 고르면 URL에서 week가 빠진다
    await user.selectOptions(screen.getByRole('combobox', { name: '주차' }), '2026-09-21');
    expect(router.state.location.search).toBe('?q=jihoon');
  });

  it('ACC-FIX-15: URL 조건으로 바로 들어오면 툴바가 그 값을 보인다', async () => {
    renderRoute('/admin?week=2026-09-14&q=jihoon&result=fail');
    expect(await screen.findByText('9/21 07:00 실행')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '주차' })).toHaveValue('2026-09-14');
    expect(screen.getByRole('combobox', { name: '결과' })).toHaveValue('fail');
    expect(screen.getByRole('searchbox', { name: '회원 검색' })).toHaveValue('jihoon');
    await waitFor(() => expect(rowOf('박지훈')).toHaveTextContent('미달'));
  });

  it('5-4-9: 판정 전인 이번 주를 고르면 실행 안내가 나온다', async () => {
    renderRoute('/admin?week=2026-09-28');
    expect(await screen.findByText('이번 주 판정은 월요일 오전에 실행돼요.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: '판정 결과' })).not.toBeInTheDocument();
  });
});

/* ---------- 정정 ---------- */

describe('AD-01 ⑩ 판정 정정', () => {
  it('ACC-FIX-03 · 04 · 06 · 08 · 09: 박지훈 미달 → 통과 — 미리보기는 쿼리만, 확인 후 정정하고 요약 · 배지가 다시 계산된다', async () => {
    const { user, router } = renderRoute('/admin');
    const p = await openPanelFor(user, '박지훈');
    expect(router.state.location.search).toBe(`?fix=${judgmentIdOf('6')}`);

    // 대상 · 주차 · 인증일 · 기록글 + 행은 '정정 중'(텍스트)
    expect(within(p).getByText('박지훈')).toBeInTheDocument();
    expect(within(p).getByText('9/21 ~ 9/27 · 인증일 0일, 기록글 0개')).toBeInTheDocument();
    expect(within(rowOf('박지훈')).getByText('정정 중')).toBeInTheDocument();
    // 라디오: 미달 · 지금 결과 / 통과로 정정 / 면제로 정정
    const radios = within(p).getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-labelledby') && document.getElementById(r.getAttribute('aria-labelledby') ?? '')?.textContent)).toEqual([
      '미달',
      '통과로 정정',
      '면제로 정정',
    ]);
    expect(within(p).getByRole('radio', { name: '미달' })).toBeChecked();
    expect(within(p).getByRole('radio', { name: '미달' })).toHaveAccessibleDescription('지금 결과');
    const submit = within(p).getByRole('button', { name: '정정하고 재계산' });
    expect(submit).toBeDisabled();

    await user.click(within(p).getByRole('radio', { name: '통과로 정정' }));
    expect(await within(p).findByText('3회 → 2회')).toBeInTheDocument();
    expect(within(p).getByText('해제')).toBeInTheDocument();
    expect(within(p).getByText('1주')).toBeInTheDocument();
    expect(within(p).getByText('아직 아무것도 바뀌지 않았어요. 아래 버튼을 눌러야 반영돼요.')).toBeInTheDocument();
    expect(within(p).getByText('이 회원은 벌칙 대상에서 빠져요.')).toBeInTheDocument();
    // ACC-FIX-06: 사유가 비면 비활성
    expect(submit).toBeDisabled();
    await user.type(within(p).getByRole('textbox', { name: /사유/ }), '   ');
    expect(submit).toBeDisabled();
    await user.type(within(p).getByRole('textbox', { name: /사유/ }), 'GitHub 비공개 기여 설정이 꺼져 있었던 것을 확인했어요');
    expect(submit).toBeEnabled();
    expect(previews()).toBeGreaterThan(0);
    expect(mutations()).toEqual([]);

    await user.click(submit);
    const dialog = await screen.findByRole('dialog', { name: '판정을 정정할까요?' });
    expect(within(dialog).getByText('경고가 3개에서 2개로 바뀌어요.')).toBeInTheDocument();
    expect(within(dialog).getByText('이 회원은 벌칙 대상에서 빠져요.')).toBeInTheDocument();
    expect(mutations()).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: '정정하기' }));

    expect(await screen.findByText('정정했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('complementary', { name: '판정 정정' })).not.toBeInTheDocument());
    expect(router.state.location.search).toBe('');
    expect(mutations()).toEqual(['correctJudgment']);
    // 판정 목록 · 요약 카드 · 메뉴 배지가 다시 계산된 값
    await waitFor(() => expect(kpi('penalty')).toHaveTextContent(/벌칙 대상\s*1/));
    expect(kpi('fail')).toHaveTextContent(/지난 주 미달\s*3/);
    expect(screen.getByRole('link', { name: '경고 복구 · 벌칙 1건' })).toBeInTheDocument();
    const row = rowOf('박지훈');
    expect(row).toHaveTextContent(/통과\s*정정됨\s*2/);
    expect(within(row).queryByText('벌칙 대상')).not.toBeInTheDocument();
    // 미리보기 때 본 현재 결과(FAIL)를 expectedStatus로 보낸다 (expectedBasis → expectedStatus)
    expect(backend.calls('correctJudgment')[0]?.args.input).toMatchObject({ judgmentId: judgmentIdOf('6'), status: 'PASS', expectedStatus: 'FAIL' });
  });

  it('ACC-FIX-10: [취소]하면 패널이 닫히고 뮤테이션은 0건이다', async () => {
    const { user, router } = renderRoute('/admin');
    const p = await openPanelFor(user, '박지훈');
    await user.click(within(p).getByRole('radio', { name: '면제로 정정' }));
    expect(await within(p).findByText('3회 → 2회')).toBeInTheDocument();
    await user.click(within(p).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('complementary', { name: '판정 정정' })).not.toBeInTheDocument());
    expect(router.state.location.search).toBe('');
    expect(mutations()).toEqual([]);
    expect(screen.getByRole('button', { name: '박지훈 판정 정정' })).toHaveFocus();
  });

  it('ACC-FIX-11: 미리보기 뒤 다른 변경이 먼저 반영되면 반영하지 않고 미리보기를 다시 받아 알린다', async () => {
    const { user } = renderRoute('/admin');
    const p = await openPanelFor(user, '박지훈');
    await user.click(within(p).getByRole('radio', { name: '통과로 정정' }));
    await within(p).findByText('3회 → 2회');
    await user.type(within(p).getByRole('textbox', { name: /사유/ }), '사유');
    const before = previews();

    jw.changeBehindBack = true; // 다른 관리자가 먼저 바꿨다 → 서버가 JUDGMENT_CHANGED
    await user.click(within(p).getByRole('button', { name: '정정하고 재계산' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '정정하기' }));

    expect(await within(p).findByText(MSG.previewStale)).toBeInTheDocument();
    expect(rowFx('6').status).toBe('FAIL');
    await waitFor(() => expect(previews()).toBe(before + 1));
    expect(screen.queryByText('정정했어요.')).not.toBeInTheDocument();

    // 새 미리보기로 다시 반영하면 된다
    const submit = within(p).getByRole('button', { name: '정정하고 재계산' });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '정정하기' }));
    expect(await screen.findByText('정정했어요.')).toBeInTheDocument();
    expect(mutations()).toEqual(['correctJudgment', 'correctJudgment']);
  });

  it('ACC-FIX-16: 첫 참가 행은 통과 · 미달 · 면제 3종으로만 정정한다 (다음 페이지 행도 ?fix=로 바로 연다)', async () => {
    renderRoute(`/admin?fix=${judgmentIdOf('5')}`);
    const p = await screen.findByRole('complementary', { name: '판정 정정' });
    expect(await within(p).findByText('서연')).toBeInTheDocument();
    expect(within(p).getByRole('radio', { name: '첫 참가' })).toBeChecked();
    for (const name of ['통과로 정정', '미달로 정정', '면제로 정정']) expect(within(p).getByRole('radio', { name })).toBeInTheDocument();
    expect(within(p).getAllByRole('radio')).toHaveLength(4);
    expect(within(p).queryByText(/제외/)).not.toBeInTheDocument();
  });

  it('ACC-FIX-07: 이행 체크 이전 주차를 정정하면 미리보기가 고정점을 알린다 (E-58)', async () => {
    // 벌칙 이행(9/30) 이전 주라 서버는 기록만 바꾸고 경고 수는 비교하지 않는다(recordOnly)
    jw.impacts[`${judgmentIdOf('6')}:PASS`] = { onHold: false, warningCountBefore: 0, warningCountAfter: 0, entersPenalty: false, leavesPenalty: false, recordOnly: true, affectedWeeks: 0 };
    const { user } = renderRoute('/admin');
    const p = await openPanelFor(user, '박지훈');
    await user.click(within(p).getByRole('radio', { name: '통과로 정정' }));
    expect(await within(p).findByText('이미 벌칙을 이행한 주간이에요. 기록만 고치고 경고 수는 그대로 둬요.')).toBeInTheDocument();
    expect(within(p).getByText('0회 → 0회')).toBeInTheDocument();
  });
});

/* ---------- 보류 ---------- */

describe('AD-01 ⑦⑧⑨ 보류', () => {
  /** 시드 보류(노현우 API_ERROR)에 백서윤을 아이디 변경 보류로 더한다 */
  function addIdentityHold() {
    Object.assign(rowFx(SEOYUN.id), { status: 'HOLD', holdReason: 'IDENTITY_MISMATCH', verifiedDays: null, recordCount: null, warningCount: null });
  }

  it('ACC-FIX-12: 보류 2명 — 집계 옆 배지, 안내 문구, 행은 [재시도] 또는 재로그인 필요', async () => {
    addIdentityHold();
    renderRoute('/admin');
    const executed = await screen.findByText('9/28 07:00 실행');
    expect(executed.parentElement).toHaveTextContent('보류 2');
    expect(await screen.findByText('보류 2명')).toBeInTheDocument();
    expect(screen.getByText('보류 2명').closest('p')).toHaveTextContent('보류 2명 · GitHub 응답 실패로 아직 판정하지 못했어요.');
    const heldList = screen.getByRole('list', { name: '보류 회원' });
    expect(within(heldList).getByText('본인이 다시 로그인해야 풀려요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전체 재시도' })).toBeInTheDocument();
    // 보류 행: [정정]이 아니라 [재시도] / 아이디 변경은 재시도 대신 안내
    expect(within(rowOf('노현우')).getByRole('button', { name: '노현우 재시도' })).toBeInTheDocument();
    expect(within(rowOf('노현우')).queryByRole('button', { name: /정정/ })).not.toBeInTheDocument();
    expect(within(rowOf('노현우')).getByText('보류')).toBeInTheDocument();
    expect(within(rowOf('백서윤')).getByText('재로그인 필요')).toBeInTheDocument();
    expect(within(rowOf('백서윤')).queryByRole('button')).not.toBeInTheDocument();
  });

  it('ACC-FIX-14: [전체 재시도] → 확인 → 보류 건만 다시 돌고 "{n}명 처리했어요."', async () => {
    addIdentityHold();
    const { user } = renderRoute('/admin');
    await user.click(await screen.findByRole('button', { name: '전체 재시도' }));
    const dialog = await screen.findByRole('dialog', { name: '보류 1명을 다시 판정할까요?' });
    expect(mutations()).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: '전체 재시도' }));
    expect(await screen.findByText('1명 처리했어요.')).toBeInTheDocument();
    expect(mutations()).toEqual(['retryAllJudgmentHolds']);
    // 남은 보류는 아이디 변경 1명뿐 → 문구가 바뀌고 [전체 재시도]가 없다
    await waitFor(() => expect(screen.getByText('보류 1명').closest('p')).toHaveTextContent('보류 1명 · 본인이 다시 로그인해야 풀려요.'));
    expect(screen.queryByRole('button', { name: '전체 재시도' })).not.toBeInTheDocument();
    expect(within(rowOf('노현우')).queryByText('보류')).not.toBeInTheDocument();
    expect(rowFx(HYUNWOO.id).status).not.toBe('HOLD');
    expect(rowFx(SEOYUN.id).status).toBe('HOLD');
  });

  it('ACC-FIX-12: 행 [재시도]는 확인 없이 그 사람만 다시 판정한다', async () => {
    const { user } = renderRoute('/admin');
    await user.click(await screen.findByRole('button', { name: '노현우 재시도' }));
    expect(await screen.findByText('1명 처리했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('보류 1명')).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('9/28 07:00 실행').parentElement).not.toHaveTextContent('보류');
  });

  it('ACC-FIX-13: 보류 0명이면 배지 · 안내 · [전체 재시도]가 없고 빈 상태 문구도 없다', async () => {
    Object.assign(rowFx(HYUNWOO.id), { status: 'PASS', holdReason: null, verifiedDays: 3, recordCount: 1, warningCount: 0 });
    renderRoute('/admin');
    const executed = await screen.findByText('9/28 07:00 실행');
    await waitFor(() => expect(kpi('pending')).toHaveTextContent('3'));
    expect(executed.parentElement).not.toHaveTextContent('보류');
    expect(screen.queryByRole('list', { name: '보류 회원' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '전체 재시도' })).not.toBeInTheDocument();
    expect(screen.queryByText(/보류 \d명/)).not.toBeInTheDocument();
  });
});
