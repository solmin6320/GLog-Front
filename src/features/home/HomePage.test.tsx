import { screen, within } from '@testing-library/react';
import { setMockControl } from '@/mocks/control';
import { db, nextId } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';

// CM-01 홈 (화면설계서 5-1-3 · 목업 W-02). 기준 시각: 목 기본 2026-10-01(목) 10:00 KST · 이번 주 9/28 ~ 10/4

const E40 = '벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.';

async function progressRegion() {
  return screen.findByRole('region', { name: '이번 주 진행' });
}

describe('CM-01 홈', () => {
  it('ACC-HOME-01: 한동관 — 인증일 2/3일(갱신 기준 병기) · 기록글 1/1개 ✓ · 진행 안내 + 다음 차감', async () => {
    renderRoute('/');
    const progress = await progressRegion();
    expect(screen.getByRole('heading', { level: 1, name: '한동관님, 이번 주도 잔디 심어볼까요' })).toBeInTheDocument();
    expect(within(progress).getByText('9/28 월 ~ 10/4 일')).toBeInTheDocument();
    expect(progress).toHaveTextContent(/인증일\s*2\s*\/\s*3일/);
    expect(within(progress).getByText('오늘 오전 6시 기준')).toBeInTheDocument();
    expect(progress).toHaveTextContent(/기록글\s*채웠어요\s*1\s*\/\s*1개/);
    expect(within(progress).getByText('아직 통과 전이에요. 1일 더 인증하면 통과!')).toBeInTheDocument();
    expect(within(progress).getByText('다음 차감까지 1주 남았어요.')).toBeInTheDocument();
    // 요일 7칸 (스크린리더 문구)
    expect(within(progress).getByText('9월 29일 화요일, 잔디 1칸, 기록글 1개, 인증됨')).toBeInTheDocument();
  });

  it('ACC-HOME-03 · ④: 경고 1/3 + [자세히] → /warnings(M-11) · 받은 초대 2건 + [보러 가기]', async () => {
    renderRoute('/');
    await progressRegion();
    const warning = screen.getByRole('region', { name: '내 경고' });
    expect(warning).toHaveTextContent(/1\s*\/\s*3/);
    expect(within(warning).getByText('경고 3회 중 1회')).toBeInTheDocument();
    expect(within(warning).getByRole('link', { name: '자세히' })).toHaveAttribute('href', '/warnings');
    expect(within(warning).queryByText('벌칙 대상')).not.toBeInTheDocument();
    expect(screen.getByText('받은 초대 2건')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '보러 가기' })).toHaveAttribute('href', '/teams/invitations');
  });

  it('ACC-HOME-03: 받은 초대 0건이면 ⑤ 영역이 DOM에 없다', async () => {
    renderRoute('/', { as: 'plain' });
    await progressRegion();
    expect(screen.queryByText(/받은 초대/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '보러 가기' })).not.toBeInTheDocument();
  });

  it('ACC-HOME-02: 팀 미소속 — ②③④ 없이 "팀에 참가해야 판정이 시작돼요" + [팀 만들기] [초대코드 입력]', async () => {
    renderRoute('/', { as: 'noteam' });
    expect(await screen.findByRole('heading', { level: 1, name: '서연님, 환영해요' })).toBeInTheDocument();
    expect(screen.getByText('팀에 참가해야 판정이 시작돼요')).toBeInTheDocument();
    expect(screen.getByText('처음 팀에 들어간 주는 판정하지 않아요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '팀 만들기' })).toHaveAttribute('href', '/teams/new');
    expect(screen.getByRole('link', { name: '초대코드 입력' })).toHaveAttribute('href', '/teams/join');
    expect(screen.getByText('받은 초대 1건')).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: '최근 공지' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '이번 주 진행' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '내 경고' })).not.toBeInTheDocument();
    expect(screen.queryByText(/인증하면 통과/)).not.toBeInTheDocument();
  });

  it('ACC-HOME-04: 공지 — 고정 공지가 📌와 함께 맨 위, 총 3건 · [전체보기] → /notices', async () => {
    renderRoute('/');
    const list = await screen.findByRole('list', { name: '최근 공지' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('고정 공지');
    expect(items[0]).toHaveTextContent('잔디 인정 규칙 안내');
    expect(within(items[0] as HTMLElement).getByRole('link')).toHaveAttribute('href', '/notices/2');
    expect(items[1]).toHaveTextContent('10월 정기 모임은 10/8(목) 저녁 7시예요');
    expect(items[1]).not.toHaveTextContent('고정 공지');
    expect(items[2]).toHaveTextContent('2학기 스터디 팀 모집');
    expect(screen.getByRole('link', { name: '전체보기' })).toHaveAttribute('href', '/notices');
  });

  it('ACC-HOME-05: 상태 배너는 1개 — 잔디 미조회(E-32)가 면제 주간(E-46)보다 먼저', async () => {
    db.exemptionPeriods.push({
      id: nextId('exemptionPeriods'),
      weekStart: '2026-09-28',
      reason: '중간고사',
      createdAt: '2026-09-20T10:00:00+09:00',
      updatedAt: null,
    });
    setMockControl({ grass: 'failed' });
    renderRoute('/');
    expect(await screen.findByText('잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.')).toBeInTheDocument();
    expect(screen.queryByText('이번 주는 면제 주간이에요.')).not.toBeInTheDocument();
    // 잔디를 못 불러오면 인증일은 서버가 비워 준다 → '—'
    expect(screen.getByRole('region', { name: '이번 주 진행' })).toHaveTextContent(/인증일\s*—/);
  });

  it('ACC-HOME-05: 면제 주간만이면 E-46 배너', async () => {
    db.exemptionPeriods.push({
      id: nextId('exemptionPeriods'),
      weekStart: '2026-09-28',
      reason: '중간고사',
      createdAt: '2026-09-20T10:00:00+09:00',
      updatedAt: null,
    });
    renderRoute('/');
    expect(await screen.findByText('이번 주는 면제 주간이에요.')).toBeInTheDocument();
    expect(screen.getByText('이번 주는 면제예요.')).toBeInTheDocument();
  });

  it('ACC-HOME-06: 경고 3 — ④에 빨간 "벌칙 대상" 배지 + E-40 (배너가 아니다)', async () => {
    renderRoute('/', { as: 'penalty' });
    await progressRegion();
    const warning = screen.getByRole('region', { name: '내 경고' });
    expect(warning).toHaveTextContent(/3\s*\/\s*3/);
    expect(within(warning).getByText('벌칙 대상')).toBeInTheDocument();
    expect(within(warning).getByText(E40)).toBeInTheDocument();
    expect(screen.getAllByText(E40)).toHaveLength(1);
  });

  it('공지만 실패하면 그 영역만 [다시 시도] — 화면 전체를 비우지 않는다', async () => {
    setMockControl({ failOnce: 'HomeNoticesQuery' });
    const { user } = renderRoute('/');
    await progressRegion();
    const notices = screen.getByRole('region', { name: '공지' });
    expect(await within(notices).findByText('공지를 불러오지 못했어요.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '내 경고' })).toBeInTheDocument();
    await user.click(within(notices).getByRole('button', { name: '다시 시도' }));
    expect(await within(notices).findByRole('list', { name: '최근 공지' })).toBeInTheDocument();
  });

  it('E-52: 홈 조회가 실패하면 본문을 서버 오류로 바꾸고 [다시 시도]로 되살린다', async () => {
    setMockControl({ failOnce: 'HomeQuery' });
    const { user } = renderRoute('/');
    expect(await screen.findByRole('heading', { name: '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await progressRegion()).toBeInTheDocument();
  });
});
