/**
 * AD-01 ②-1 경고 복구 · 벌칙 탭 (화면설계서 5-1-10, 목업 W-16, A5 3-9-9 ACC-PEN).
 * 실제 라우터 · Apollo · 목 서버로 띄운다. member(한동관)는 관리자다.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MSG } from '@/domain/messages';
import { db, touch } from '@/mocks/db/store';
import { server } from '@/mocks/node';
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

const table = (name: '벌칙 대상' | '삭제된 경고') => screen.getByRole('table', { name });

function rowIn(name: '벌칙 대상' | '삭제된 경고', member: string): HTMLElement {
  const row = within(table(name))
    .getAllByRole('row')
    .find((r) => within(r).queryByText(member));
  if (!row) throw new Error(`row ${member}`);
  return row;
}

const headersOf = (name: '벌칙 대상' | '삭제된 경고') =>
  within(table(name))
    .getAllByRole('columnheader')
    .map((h) => h.textContent);

/** 두 표가 다 그려질 때까지 */
async function ready() {
  await screen.findByRole('table', { name: '벌칙 대상' });
  await screen.findByRole('table', { name: '삭제된 경고' });
}

/* ---------- 진입 ---------- */

describe('AD-01 ②-1 진입', () => {
  it('E-09: 관리자가 아니면 권한 없음 화면이다', async () => {
    renderRoute('/admin/warnings', { as: 'plain' });
    expect(await screen.findByText(MSG.forbidden)).toBeInTheDocument();
    expect(screen.queryByText('벌칙 대상')).not.toBeInTheDocument();
  });

  it('ACC-PEN-01: 벌칙 대상 2명 — 경고 3 + 배지 · 도달 주 M/D · 비공개 팀도 실명 · 각주', async () => {
    renderRoute('/admin/warnings');
    await ready();
    expect(screen.getByRole('heading', { level: 2, name: '경고 복구 · 벌칙' })).toBeInTheDocument();
    expect(headersOf('벌칙 대상')).toEqual(['회원', '경고', '도달', '경고가 붙은 팀', '처리']);
    expect(screen.getByText('2명')).toBeInTheDocument();
    const jihoon = rowIn('벌칙 대상', '박지훈');
    // 도달은 경고 3개에 도달한 주 월요일 (백엔드 reachedWeek). 공개 여부는 백엔드가 싣지 않는다
    expect(jihoon).toHaveTextContent(/3\s*벌칙 대상\s*9\/21\s*사이드 프로젝트 A팀, 알고리즘 스터디/);
    expect(rowIn('벌칙 대상', '정하늘')).toHaveTextContent(/3\s*벌칙 대상\s*9\/14\s*웹 프로젝트 B팀/);
    expect(rowIn('벌칙 대상', '정하늘')).not.toHaveTextContent('비공개');
    expect(screen.getByText('벌칙을 누구에게 통보할지 판단할 수 있도록, 이 화면에서만 비공개 팀 이름도 그대로 보여요.')).toBeInTheDocument();
  });

  it('ACC-PEN-05: 삭제된 경고 2건 — 부여 주차 · 사유(추방 / 팀 삭제) · 복구 후 카테고리(팀 / 삭제된 팀) · 각주', async () => {
    renderRoute('/admin/warnings');
    await ready();
    await waitFor(() => expect(within(table('삭제된 경고')).getAllByRole('row')).toHaveLength(3));
    expect(headersOf('삭제된 경고')).toEqual(['회원', '부여 주차', '삭제 사유', '복구 후 카테고리', '처리']);
    expect(rowIn('삭제된 경고', '이영희')).toHaveTextContent(/9\/14 ~ 9\/20\s*추방\s*웹 프로젝트 B팀\s*복구/);
    expect(rowIn('삭제된 경고', '최유진')).toHaveTextContent(/8\/31 ~ 9\/6\s*팀 삭제\s*삭제된 팀\s*복구/);
    expect(screen.getByText('추방 · 팀 삭제로 카테고리가 모두 빠진 경고')).toBeInTheDocument();
    expect(screen.getByText('판정 정정이나 소급 면제로 회수된 경고는 여기에 나오지 않아요.')).toBeInTheDocument();
  });

  it('ACC-PEN-10: 벌칙 대상 0 · 삭제된 경고 0이면 빈 상태 문구', async () => {
    db.warnings = db.warnings.filter((w) => !w.deleted);
    for (const memberId of ['6', '7']) {
      db.penaltyFulfillments.push({ id: memberId, memberId, effectiveWeekStart: '2026-09-28', fulfilledAt: '2026-09-30T10:00:00+09:00', fulfilledById: '1' });
    }
    touch();
    renderRoute('/admin/warnings');
    expect(await screen.findByText('벌칙 대상이 없어요.')).toBeInTheDocument();
    expect(await screen.findByText('삭제된 경고가 없어요.')).toBeInTheDocument();
  });

  it('ACC-PEN-02: 팀 실명은 이 탭에만 — 대시보드 판정 결과에는 팀 이름이 없다', async () => {
    renderRoute('/admin');
    await screen.findByText('9/28 07:00 실행');
    expect(screen.queryByText(/알고리즘 스터디|사이드 프로젝트 A팀|웹 프로젝트 B팀/)).not.toBeInTheDocument();
  });
});

/* ---------- 이행 완료 ---------- */

describe('AD-01 ②-1 ⑥ 이행 완료', () => {
  it('ACC-PEN-03 · 04: 확인 → 행이 빠지고 "처리했어요." · 요약 · 배지가 1 준다 · 되돌리는 버튼은 없다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/warnings');
    await ready();
    expect(await screen.findByRole('link', { name: '경고 복구 · 벌칙 2건' })).toBeInTheDocument();

    await user.click(within(rowIn('벌칙 대상', '박지훈')).getByRole('button', { name: '박지훈 이행 완료' }));
    const dialog = await screen.findByRole('dialog', { name: '박지훈님의 벌칙 이행을 완료할까요?' });
    expect(dialog).toHaveTextContent('이행 완료로 표시하면 경고가 0이 되고 벌칙 대상에서 빠져요. 되돌릴 수 없어요.');
    expect(dialog).not.toHaveTextContent('연속');
    expect(mutations).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: '이행 완료' }));

    expect(await screen.findByText('처리했어요.')).toBeInTheDocument();
    await waitFor(() => expect(within(table('벌칙 대상')).queryByText('박지훈')).not.toBeInTheDocument());
    expect(screen.getByText('1명')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '경고 복구 · 벌칙 1건' })).toBeInTheDocument();
    expect(mutations).toEqual(['AdminWarningsFulfillPenalty']);
    expect(screen.queryByRole('button', { name: /되돌|취소하기/ })).not.toBeInTheDocument();
    expect(db.penaltyFulfillments).toEqual([expect.objectContaining({ memberId: '6', fulfilledById: '1' })]);
  });

  it('[취소]하면 뮤테이션은 0건이다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/warnings');
    await ready();
    await user.click(within(rowIn('벌칙 대상', '정하늘')).getByRole('button', { name: '정하늘 이행 완료' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(rowIn('벌칙 대상', '정하늘')).toBeInTheDocument();
    expect(mutations).toEqual([]);
  });
});

/* ---------- 복구 ---------- */

describe('AD-01 ②-1 ⑧ 경고 복구', () => {
  it('ACC-PEN-06 · 07: 이영희 [복구] → 미리보기(쿼리) 2회 → 3회 · 벌칙 대상 진입 → 확인하면 행이 빠지고 벌칙 대상에 들어간다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/warnings');
    await ready();
    await user.click(await screen.findByRole('button', { name: '이영희 9/14 ~ 9/20 경고 복구' }));
    const dialog = await screen.findByRole('dialog', { name: '경고를 복구할까요?' });
    expect(within(dialog).getByText('이영희 · 9/14 ~ 9/20 경고')).toBeInTheDocument();
    expect(await within(dialog).findByText('2회 → 3회')).toBeInTheDocument();
    expect(within(dialog).getByText('진입')).toBeInTheDocument();
    expect(within(dialog).getByText('복구하면 이 회원은 다시 벌칙 대상이 돼요. 복구할까요?')).toBeInTheDocument();
    expect(within(dialog).getByText('웹 프로젝트 B팀')).toBeInTheDocument();
    expect(mutations).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: '복구하기' }));
    expect(await screen.findByText('복구했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(within(table('삭제된 경고')).queryByText('이영희')).not.toBeInTheDocument());
    expect(await within(table('벌칙 대상')).findByText('이영희')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: '경고 복구 · 벌칙 3건' })).toBeInTheDocument();
    expect(mutations).toEqual(['AdminWarningsRestoreWarning']);
  });

  it('ACC-PEN-08: 팀이 삭제된 경고는 "삭제된 팀"으로 복구된다는 안내가 나오고 팀을 고르는 입력이 없다', async () => {
    const { user } = renderRoute('/admin/warnings');
    await ready();
    await user.click(await screen.findByRole('button', { name: '최유진 8/31 ~ 9/6 경고 복구' }));
    const dialog = await screen.findByRole('dialog', { name: '경고를 복구할까요?' });
    expect(await within(dialog).findByText("연결된 팀이 없어요. 복구하면 '삭제된 팀'으로 표시돼요.")).toBeInTheDocument();
    expect(within(dialog).getByText('삭제된 팀')).toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('ACC-PEN-09: 이행 체크 이전 주차의 경고는 기록만 되살리고 경고 수는 n → n이다 (E-59)', async () => {
    db.penaltyFulfillments.push({ id: '1', memberId: '3', effectiveWeekStart: '2026-09-28', fulfilledAt: '2026-09-30T10:00:00+09:00', fulfilledById: '1' });
    touch();
    const { user } = renderRoute('/admin/warnings');
    await ready();
    await user.click(await screen.findByRole('button', { name: '이영희 9/14 ~ 9/20 경고 복구' }));
    const dialog = await screen.findByRole('dialog', { name: '경고를 복구할까요?' });
    expect(await within(dialog).findByText('이미 벌칙을 이행한 주간의 경고예요. 기록만 되살리고 경고 수는 그대로 둬요.')).toBeInTheDocument();
    expect(within(dialog).getByText('0회 → 0회')).toBeInTheDocument();
    expect(within(dialog).queryByText('복구하면 이 회원은 다시 벌칙 대상이 돼요. 복구할까요?')).not.toBeInTheDocument();
  });

  it('미리보기 뒤 그새 복구됐으면(ALREADY_HANDLED) 알리고 닫은 뒤 목록을 다시 받는다', async () => {
    const mutations = trackMutations();
    const { user } = renderRoute('/admin/warnings');
    await ready();
    await user.click(await screen.findByRole('button', { name: '이영희 9/14 ~ 9/20 경고 복구' }));
    const dialog = await screen.findByRole('dialog', { name: '경고를 복구할까요?' });
    await within(dialog).findByText('2회 → 3회');

    const w = db.warnings.find((x) => x.memberId === '3' && x.weekStart === '2026-09-14');
    if (w) w.deleted = null;
    touch();
    await user.click(within(dialog).getByRole('button', { name: '복구하기' }));
    expect(await screen.findByText('이미 복구됐거나 없는 경고예요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mutations).toEqual(['AdminWarningsRestoreWarning']);
  });
});
