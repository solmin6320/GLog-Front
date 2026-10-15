/**
 * AD-01 ②-3 면제 관리 탭 (화면설계서 5-1-10 ②-3, A5 ACC-ADM-04 ~ 11 · E-44 · E-45 · E-48).
 * 실제 라우터 · Apollo · 목 서버로 띄운다. member(한동관)는 관리자다. 시드 시계는 2026-10-01(목) — 이번 주 9/28.
 * 시드: 면제 기간 9/7(지난 주) · 10/19 · 10/26, 대기 요청 2건(한지우 → 조성민 9/28 · 한동관 → 김철수 10/5).
 */
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MSG } from '@/domain/messages';
import { db, touch } from '@/mocks/db/store';
import { server } from '@/mocks/node';
import { isMonday } from '@/shared/lib/kst';
import { renderRoute } from '@/test/render';

/* ---------- 도우미 ---------- */

/** 이 테스트에서 나간 뮤테이션 이름 (미리보기는 쿼리만인지 확인) */
function trackMutations() {
  const names: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (!request.url.includes('/graphql')) return;
    request
      .clone()
      .json()
      .then(
        (b: { operationName?: string; query?: string }) => {
          if (/^\s*mutation\b/.test(b.query ?? '')) names.push(b.operationName ?? '');
        },
        () => undefined,
      );
  });
  return names;
}

afterEach(() => server.events.removeAllListeners());

type TableName = '전체 면제 기간' | '개인 면제 요청';
const table = (name: TableName) => screen.getByRole('table', { name });

function rowIn(name: TableName, text: string): HTMLElement {
  const row = within(table(name))
    .getAllByRole('row')
    .find((r) => within(r).queryByText(text));
  if (!row) throw new Error(`row ${text}`);
  return row;
}

async function ready() {
  await screen.findByRole('table', { name: '전체 면제 기간' });
  await screen.findByRole('table', { name: '개인 면제 요청' });
}

/** [면제 기간 등록] → 주 · 사유를 채워 [등록]까지 */
async function openRegister(user: ReturnType<typeof renderRoute>['user'], weekStart: string, reason: string) {
  await user.click(screen.getByRole('button', { name: '면제 기간 등록' }));
  const dialog = await screen.findByRole('dialog', { name: '면제 기간 등록' });
  await user.selectOptions(within(dialog).getByRole('combobox', { name: '주간' }), weekStart);
  if (reason) await user.type(within(dialog).getByRole('textbox', { name: '사유' }), reason);
  await user.click(within(dialog).getByRole('button', { name: '등록' }));
  return dialog;
}

/* ---------- 진입 ---------- */

describe('AD-01 ②-3 진입', () => {
  it('E-09: 관리자가 아니면 권한 없음 화면이다', async () => {
    renderRoute('/admin/exemptions', { as: 'plain' });
    expect(await screen.findByText(MSG.forbidden)).toBeInTheDocument();
    expect(screen.queryByText('전체 면제 기간')).not.toBeInTheDocument();
  });

  it('⑤ 면제 기간: 최근 주부터 · 지난 주간 표시 · "모든 회원에게 적용" 안내', async () => {
    renderRoute('/admin/exemptions');
    await ready();
    expect(screen.getByRole('heading', { level: 2, name: '면제 관리' })).toBeInTheDocument();
    expect(screen.getByText('대기 중인 요청 2건')).toBeInTheDocument();
    expect(screen.getByText('모든 회원에게 적용 · 주 단위')).toBeInTheDocument();

    const rows = within(table('전체 면제 기간')).getAllByRole('row').slice(1);
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringMatching(/^10\/26 ~ 11\/1\s*중간고사 기간 \(2주차\)/),
      expect.stringMatching(/^10\/19 ~ 10\/25\s*중간고사 기간/),
      expect.stringMatching(/^9\/7 ~ 9\/13\s*지난 주간\s*2학기 개강 주간/),
    ]);
  });

  it('ACC-ADM-07: 요청 행은 "{요청 팀장} → {대상 회원} · {주차}" + 사유. 팀 이름은 없다', async () => {
    renderRoute('/admin/exemptions');
    await ready();
    const requests = table('개인 면제 요청');
    expect(within(requests).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['요청', '주간', '사유', '처리']);
    expect(rowIn('개인 면제 요청', '한지우 → 조성민')).toHaveTextContent(/한지우 → 조성민\s*9\/28 ~ 10\/4\s*예비군 훈련이 있어요\./);
    expect(rowIn('개인 면제 요청', '한동관 → 김철수')).toHaveTextContent(/10\/5 ~ 10\/11\s*학회 발표 준비로 한 주 쉬어요\./);

    const teamNames = db.teams.map((t) => t.name);
    for (const name of teamNames) expect(requests).not.toHaveTextContent(name);
    expect(screen.getByText('승인하면 그 회원이 속한 모든 팀에서 그 주 판정이 빠져요. 요청한 팀 이름은 표시하지 않아요.')).toBeInTheDocument();
  });
});

/* ---------- ⑥ 등록 ---------- */

describe('AD-01 ②-3 ⑥ 면제 기간 등록', () => {
  it('ACC-ADM-04: 판정 전 주 → 바로 등록되고 목록에 M/D ~ M/D + 사유 행이 생긴다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    await openRegister(user, '2026-10-05', '축제 주간');

    expect(await screen.findByText('등록했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(rowIn('전체 면제 기간', '축제 주간')).toHaveTextContent(/10\/5 ~ 10\/11\s*축제 주간/);
    expect(mutations).toEqual(['AdminExemptionsCreatePeriod']);
    expect(db.exemptionPeriods.find((p) => p.weekStart === '2026-10-05')?.reason).toBe('축제 주간');
  });

  it('ACC-ADM-04: 주는 월 ~ 일 단위로만 고를 수 있다 · 기본은 이번 주', async () => {
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    await user.click(screen.getByRole('button', { name: '면제 기간 등록' }));
    const select = within(await screen.findByRole('dialog', { name: '면제 기간 등록' })).getByRole('combobox', { name: '주간' });
    const values = within(select)
      .getAllByRole('option')
      .map((o) => (o as HTMLOptionElement).value);
    expect(values.length).toBeGreaterThan(10);
    expect(values.every(isMonday)).toBe(true);
    expect(select).toHaveValue('2026-09-28');
    expect(within(select).getByRole('option', { name: '9/28 ~ 10/4 (이번 주)' })).toBeInTheDocument();
  });

  it('사유를 비우면 막히고 뮤테이션은 0건이다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    const dialog = await openRegister(user, '2026-10-05', '');
    expect(await within(dialog).findByText('사유를 입력해 주세요.')).toBeInTheDocument();
    expect(mutations).toEqual([]);
  });

  it('이미 면제 기간인 주는 그 자리에서 막힌다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    const dialog = await openRegister(user, '2026-10-19', '중복');
    expect(await within(dialog).findByText('이미 면제 기간으로 등록된 주간이에요.')).toBeInTheDocument();
    expect(mutations).toEqual([]);
  });

  it('ACC-ADM-05: 판정이 끝난 주 → 영향 미리보기형이 먼저 뜬다. [이전] · [취소]면 뮤테이션 0건', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    const dialog = await openRegister(user, '2026-09-21', '태풍 휴교');

    const preview = await within(dialog).findByRole('region', { name: '재계산 미리보기' });
    expect(preview).toHaveTextContent('판정이 끝난 주간이라 그 주 이후 모든 주차의 연속 통과와 경고 차감이 다시 계산돼요.');
    expect(preview).toHaveTextContent(/판정이 바뀌는 회원 \d+명/);
    expect(within(dialog).getByText('9/21 ~ 9/27 · 태풍 휴교')).toBeInTheDocument();
    expect(mutations).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: '이전' }));
    expect(within(dialog).getByRole('combobox', { name: '주간' })).toHaveValue('2026-09-21');
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mutations).toEqual([]);
  });

  it('ACC-ADM-05: 미리보기에서 [등록하기] → 반영되고 그 주 판정이 면제로 바뀐다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    const dialog = await openRegister(user, '2026-09-21', '태풍 휴교');
    await within(dialog).findByRole('region', { name: '재계산 미리보기' });
    await user.click(within(dialog).getByRole('button', { name: '등록하기' }));

    expect(await screen.findByText('등록했어요.')).toBeInTheDocument();
    expect(mutations).toEqual(['AdminExemptionsCreatePeriod']);
    expect(rowIn('전체 면제 기간', '태풍 휴교')).toHaveTextContent(/9\/21 ~ 9\/27\s*지난 주간\s*태풍 휴교/);
    // 통과 · 미달만 면제로 바뀐다. 보류 · 제외 · 이미 면제는 그대로다
    const week = db.judgments.filter((j) => j.weekStart === '2026-09-21');
    expect(week.filter((j) => j.status === 'PASS' || j.status === 'FAIL')).toEqual([]);
    expect(week.some((j) => j.status === 'EXEMPT' && j.skipReason === 'EXEMPTION_PERIOD')).toBe(true);
    expect(week.some((j) => j.status === 'HOLD')).toBe(true);
  });

  it('[수정] → 기존 값이 채워지고 사유를 고쳐 저장한다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    await user.click(within(rowIn('전체 면제 기간', '중간고사 기간')).getByRole('button', { name: '수정: 10/19 ~ 10/25 면제' }));
    const dialog = await screen.findByRole('dialog', { name: '면제 기간 수정' });
    expect(within(dialog).getByRole('combobox', { name: '주간' })).toHaveValue('2026-10-19');
    const reason = within(dialog).getByRole('textbox', { name: '사유' });
    expect(reason).toHaveValue('중간고사 기간');
    await user.clear(reason);
    await user.type(reason, '중간고사 1주차');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장했어요.')).toBeInTheDocument();
    expect(await screen.findByText('중간고사 1주차')).toBeInTheDocument();
    expect(mutations).toEqual(['AdminExemptionsUpdatePeriod']);
  });
});

/* ---------- ⑤ 삭제 ---------- */

describe('AD-01 ②-3 ⑤ 면제 기간 삭제', () => {
  it('ACC-ADM-06: 판정 전 주 → 확인을 거쳐 행이 사라진다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    await user.click(within(rowIn('전체 면제 기간', '중간고사 기간 (2주차)')).getByRole('button', { name: '삭제: 10/26 ~ 11/1 면제' }));
    const dialog = await screen.findByRole('dialog', { name: '면제 기간을 삭제할까요?' });
    expect(await within(dialog).findByText('삭제하면 이 주도 평소처럼 판정해요.')).toBeInTheDocument();
    expect(within(dialog).queryByRole('region', { name: '재계산 미리보기' })).not.toBeInTheDocument();
    expect(mutations).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
    await waitFor(() => expect(within(table('전체 면제 기간')).queryByText('중간고사 기간 (2주차)')).not.toBeInTheDocument());
    expect(mutations).toEqual(['AdminExemptionsDeletePeriod']);
  });

  it('ACC-ADM-06: 판정이 끝난 주 → 영향 미리보기형. [취소]면 그대로', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    await user.click(within(rowIn('전체 면제 기간', '2학기 개강 주간')).getByRole('button', { name: '삭제: 9/7 ~ 9/13 면제' }));
    const dialog = await screen.findByRole('dialog', { name: '면제 기간을 삭제할까요?' });
    expect(await within(dialog).findByRole('region', { name: '재계산 미리보기' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(rowIn('전체 면제 기간', '2학기 개강 주간')).toBeInTheDocument();
    expect(mutations).toEqual([]);
  });
});

/* ---------- ⑦ 개인 면제 요청 ---------- */

describe('AD-01 ②-3 ⑦ 개인 면제 요청', () => {
  it('ACC-ADM-08 승인: 판정 전 주는 바로 승인 → 행이 빠지고 대기 수 · 탭 배지가 1 준다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    expect(await screen.findByRole('link', { name: '면제 관리 2건' })).toBeInTheDocument();

    await user.click(within(rowIn('개인 면제 요청', '한동관 → 김철수')).getByRole('button', { name: '승인: 김철수 10/5 ~ 10/11' }));
    expect(await screen.findByText('승인했어요.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(within(table('개인 면제 요청')).queryByText('한동관 → 김철수')).not.toBeInTheDocument());
    expect(await screen.findByText('대기 중인 요청 1건')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '면제 관리 1건' })).toBeInTheDocument();
    expect(mutations).toEqual(['AdminExemptionsApprove']);
    expect(db.personalExemptions.find((e) => e.id === '5')?.status).toBe('APPROVED');
  });

  it('ACC-ADM-08 거절: 사유를 비우면 막히고, 입력하면 행이 빠진다 (E-48)', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();
    await user.click(within(rowIn('개인 면제 요청', '한지우 → 조성민')).getByRole('button', { name: '거절: 조성민 9/28 ~ 10/4' }));
    const dialog = await screen.findByRole('dialog', { name: '면제 요청을 거절할까요?' });

    await user.click(within(dialog).getByRole('button', { name: '거절' }));
    expect(await within(dialog).findByText('거절 사유를 입력해 주세요.')).toBeInTheDocument();
    expect(mutations).toEqual([]);

    await user.type(within(dialog).getByRole('textbox', { name: '거절 사유' }), '훈련 일정표를 첨부해 주세요.');
    await user.click(within(dialog).getByRole('button', { name: '거절' }));
    expect(await screen.findByText('거절했어요.')).toBeInTheDocument();
    await waitFor(() => expect(within(table('개인 면제 요청')).queryByText('한지우 → 조성민')).not.toBeInTheDocument());
    expect(mutations).toEqual(['AdminExemptionsReject']);
    // 요청한 팀장의 TM-08 ⑤에 "거절됨 · 사유: …"로 보일 값
    expect(db.personalExemptions.find((e) => e.id === '4')).toMatchObject({ status: 'REJECTED', rejectReason: '훈련 일정표를 첨부해 주세요.' });
  });

  it('ACC-ADM-09: 판정이 끝난 주의 요청 → 영향 미리보기형을 거쳐 승인한다 (E-45)', async () => {
    const req = db.personalExemptions.find((e) => e.id === '4');
    if (!req) throw new Error('seed');
    req.weekStart = '2026-09-21';
    touch();
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/exemptions');
    await ready();

    await user.click(within(rowIn('개인 면제 요청', '한지우 → 조성민')).getByRole('button', { name: '승인: 조성민 9/21 ~ 9/27' }));
    const dialog = await screen.findByRole('dialog', { name: '면제를 승인할까요?' });
    expect(within(dialog).getByText('이 회원의 이후 경고가 다시 계산돼요. 진행할까요?')).toBeInTheDocument();
    const preview = await within(dialog).findByRole('region', { name: '재계산 미리보기' });
    await waitFor(() => expect(preview).toHaveTextContent(/경고\s*\d+회 → \d+회/));
    expect(mutations).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: '승인하기' }));
    expect(await screen.findByText('승인했어요.')).toBeInTheDocument();
    expect(mutations).toEqual(['AdminExemptionsApprove']);
    expect(db.judgments.find((j) => j.memberId === '19' && j.weekStart === '2026-09-21')?.status).toBe('EXEMPT');
  });

  it('ACC-ADM-10: 요청 주가 이미 면제 기간이면 행에서 알린다 (E-44)', async () => {
    const req = db.personalExemptions.find((e) => e.id === '5');
    if (!req) throw new Error('seed');
    req.weekStart = '2026-10-19';
    touch();
    renderRoute('/admin/exemptions');
    await ready();
    expect(rowIn('개인 면제 요청', '한동관 → 김철수')).toHaveTextContent('이 주간은 이미 면제 기간이에요. 따로 승인하지 않아도 돼요.');
    expect(rowIn('개인 면제 요청', '한지우 → 조성민')).not.toHaveTextContent('이미 면제 기간');
  });
});

/* ---------- 빈 상태 ---------- */

describe('AD-01 ②-3 빈 상태', () => {
  it('ACC-ADM-11: 면제 기간 0 · 대기 요청 0이면 문구 하나 + [면제 기간 등록]', async () => {
    db.exemptionPeriods = [];
    db.personalExemptions = db.personalExemptions.filter((e) => e.status !== 'PENDING');
    touch();
    const { user } = renderRoute('/admin/exemptions');
    expect(await screen.findByText('면제 기간과 대기 중인 요청이 없어요.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: '면제 기간 등록' });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0] as HTMLElement);
    expect(await screen.findByRole('dialog', { name: '면제 기간 등록' })).toBeInTheDocument();
  });

  it('한쪽만 비면 그 섹션만 빈 문구', async () => {
    db.personalExemptions = db.personalExemptions.filter((e) => e.status !== 'PENDING');
    touch();
    renderRoute('/admin/exemptions');
    expect(await screen.findByText('대기 중인 요청이 없어요.')).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: '전체 면제 기간' })).toBeInTheDocument();
  });
});
