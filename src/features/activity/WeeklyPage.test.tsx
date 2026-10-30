import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { backend } from '@/test/backend';
import { currentWeek, judgmentHistory, weeklyActivity } from '@/test/fixtures/activity';
import { installHome } from '@/test/fixtures/home';
import { renderRoute as renderRouteRaw, type RenderRouteOptions } from '@/test/render';

// bridge + 가짜 백엔드 (judgment.graphqls myWeeklyActivity · myJudgmentHistory)
beforeEach(() => installHome());
const renderRoute = (path: string, o: RenderRouteOptions = {}) => renderRouteRaw(path, { ...o, bridge: true });

// AC-01 내 주간 활동 (화면설계서 5-1-21 · 목업 W-06). 기준 시각: 2026-10-01(목) 10:00 KST · 이번 주 9/28 ~ 10/4

function rowOf(table: HTMLElement, date: string): HTMLElement {
  const row = within(table)
    .getAllByRole('row')
    .find((r) => within(r).queryByText(date));
  if (!row) throw new Error(`row ${date} not found`);
  return row;
}

describe('AC-01 내 주간 활동', () => {
  it('ACC-AC01-01: 날짜별 7행 — 미래 "아직 오지 않은 날이에요" · 오늘 "오늘" · 잔디+기록글도 인증일 1일', async () => {
    renderRoute('/weekly');
    const table = await screen.findByRole('table', { name: '날짜별 인증' });
    expect(within(table).getAllByRole('row')).toHaveLength(8); // 머리 1 + 7일

    const tue = rowOf(table, '9/29 화');
    expect(tue).toHaveTextContent('1칸');
    expect(within(tue).getByText('기록글 1개')).toBeInTheDocument();
    expect(within(tue).getByText('1일')).toBeInTheDocument();
    expect(tue).toHaveTextContent('잔디 1칸 + 기록글 1개');

    expect(rowOf(table, '9/28 월')).toHaveTextContent('잔디 3칸');
    expect(rowOf(table, '9/30 수')).toHaveTextContent('활동 없음');
    const today = rowOf(table, '10/1 목');
    expect(today).toHaveTextContent('0일');
    expect(today).toHaveTextContent('오늘');
    for (const d of ['10/2 금', '10/3 토', '10/4 일']) {
      expect(rowOf(table, d)).toHaveTextContent('아직 오지 않은 날이에요');
    }

    const days = screen.getByRole('region', { name: '날짜별 인증' });
    expect(within(days).getByText('진행 중')).toBeInTheDocument();
    expect(within(days).getByText('오늘 오전 6시 기준')).toBeInTheDocument();
    expect(
      within(days).getByText('잔디와 기록글이 둘 다 있어도 인증일은 1일로만 세요. 하루에 여러 번 활동해도 인증일은 하루예요.'),
    ).toBeInTheDocument();
    expect(screen.getByText('9월 28일 ~ 10월 4일')).toBeInTheDocument();
  });

  it('④ 이번 주 판정: 2/3일 · 1/1개 ✓ + 미달 문구 재사용 + "월요일 오전 판정에서 확정돼요."', async () => {
    renderRoute('/weekly');
    const card = await screen.findByRole('region', { name: '이번 주 판정' });
    expect(card).toHaveTextContent(/인증일 3일 이상\s*2\s*\/\s*3일/);
    expect(card).toHaveTextContent(/기록글 1개 이상\s*채웠어요\s*1\s*\/\s*1개/);
    expect(within(card).getByText('아직 통과 전이에요. 1일 더 인증하면 통과!')).toBeInTheDocument();
    expect(within(card).getByText('월요일 오전 판정에서 확정돼요.')).toBeInTheDocument();
  });

  it('ACC-AC01-02: ‹ 로 9/21 주 — ④ 없음 · 판정 때 저장한 값(단계 없음) · › 로 돌아오면 › 비활성', async () => {
    const { user, router } = renderRoute('/weekly');
    await screen.findByRole('table', { name: '날짜별 인증' });
    expect(screen.getByRole('button', { name: '다음 주' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '이전 주' }));
    await waitFor(() => expect(router.state.location.search).toBe('?week=2026-09-21'));
    expect(await screen.findByText('9월 21일 ~ 9월 27일')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: '날짜별 인증' });
    const mon = rowOf(table, '9/21 월');
    expect(mon).toHaveTextContent('있음');
    expect(mon).toHaveTextContent('1일');
    expect(table).not.toHaveTextContent('칸'); // 지난 주는 칸 수를 모른다(B-03)
    expect(table).not.toHaveTextContent('아직 오지 않은 날이에요');
    const days = screen.getByRole('region', { name: '날짜별 인증' });
    expect(within(days).getByText('통과')).toBeInTheDocument();
    expect(within(days).queryByText('진행 중')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '이번 주 판정' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 주' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '다음 주' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(await screen.findByRole('region', { name: '이번 주 판정' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 주' })).toBeDisabled();
  });

  it('ACC-AC01-03: 지난 판정 — 통과 · 미달 · 면제 · 첫 참가, 면제 · 제외 주는 "—"', async () => {
    renderRoute('/weekly');
    const table = await screen.findByRole('table', { name: '지난 판정' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((r) => r.textContent)).toEqual([
      '9/21 ~ 9/274일1개통과',
      '9/14 ~ 9/201일0개미달',
      '9/7 ~ 9/13——면제',
      '8/31 ~ 9/63일2개통과',
      '8/24 ~ 8/30——첫 참가',
    ]);
    expect(screen.getByText('확정된 판정은 글을 지워도 바뀌지 않아요. 관리자 정정으로만 바꿀 수 있어요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('?week= 지난 주를 바로 열면 그 주 판정 배지', async () => {
    renderRoute('/weekly?week=2026-09-14');
    expect(await screen.findByText('9월 14일 ~ 9월 20일')).toBeInTheDocument();
    const days = await screen.findByRole('region', { name: '날짜별 인증' });
    expect(within(days).getByText('미달')).toBeInTheDocument();
  });

  it('?week= 미래 주 · 잘못된 값은 이번 주로 (주소도 /weekly로 정리)', async () => {
    const { router } = renderRoute('/weekly?week=2026-12-07');
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(await screen.findByRole('region', { name: '이번 주 판정' })).toBeInTheDocument();
    expect(screen.getByText('9월 28일 ~ 10월 4일')).toBeInTheDocument();
  });

  it('팀 미소속: ④ 대신 "팀에 참가해야 판정이 시작돼요" · ②는 그대로', async () => {
    backend
      .on('myTeams', [])
      .on('myWeeklyActivity', weeklyActivity(currentWeek({ inTeam: false, passExpected: null })))
      .on('myJudgmentHistory', judgmentHistory([{ weekStart: '2026-09-21', weekEnd: '2026-09-27', status: 'EXCLUDED', skipReason: 'FIRST_WEEK', holdReason: null, verifiedDays: null, recordCount: null, corrected: false }]));
    renderRoute('/weekly', { as: 'noteam' });
    const card = await screen.findByRole('region', { name: '이번 주 판정' });
    expect(within(card).getByText('팀에 참가해야 판정이 시작돼요')).toBeInTheDocument();
    expect(within(card).queryByText(/인증하면 통과/)).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: '날짜별 인증' })).toBeInTheDocument();
    // 서연: 9/21 주가 첫 참가
    const history = await screen.findByRole('table', { name: '지난 판정' });
    expect(history).toHaveTextContent('첫 참가');
  });
});
