import { screen, within } from '@testing-library/react';
import { backend, backendError } from '@/test/backend';
import { currentWeek, MEMBER_WARNINGS, NO_WARNINGS, PENALTY_WARNINGS, weeklyActivity } from '@/test/fixtures/activity';
import { installHome, invitations, noticePage } from '@/test/fixtures/home';
import { renderRoute } from '@/test/render';

// CM-01 홈 (화면설계서 5-1-3 · 목업 W-02). 기준 시각: TEST_NOW 2026-10-01(목) 10:00 KST · 이번 주 9/28 ~ 10/4

const E40 = '벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.';

async function progressRegion() {
  return screen.findByRole('region', { name: '이번 주 진행' });
}

beforeEach(() => installHome());

describe('CM-01 홈', () => {
  it('ACC-HOME-01: 한동관 — 인증일 2/3일(갱신 기준 병기) · 기록글 1/1개 ✓ · 진행 안내 + 다음 차감', async () => {
    renderRoute('/', { bridge: true });
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
    renderRoute('/', { bridge: true });
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
    backend.on('receivedTeamInvitations', invitations(0)).on('myWarningSummary', NO_WARNINGS);
    renderRoute('/', { as: 'plain', bridge: true });
    await progressRegion();
    expect(screen.queryByText(/받은 초대/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '보러 가기' })).not.toBeInTheDocument();
  });

  it('ACC-HOME-02: 팀 미소속 — ②③④ 없이 "팀에 참가해야 판정이 시작돼요" + [팀 만들기] [초대코드 입력]', async () => {
    backend.on('myTeams', []).on('receivedTeamInvitations', invitations(1));
    renderRoute('/', { as: 'noteam', bridge: true });
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
    // 팀 미소속이면 판정 · 경고를 묻지 않는다
    expect(backend.calls('myWeeklyActivity')).toHaveLength(0);
    expect(backend.calls('myWarningSummary')).toHaveLength(0);
  });

  it('ACC-HOME-04: 공지 — 고정 공지가 📌와 함께 맨 위, 총 3건 · [전체보기] → /notices', async () => {
    renderRoute('/', { bridge: true });
    const list = await screen.findByRole('list', { name: '최근 공지' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3); // 서버는 4건을 줬다 — 앞 3건만
    expect(items[0]).toHaveTextContent('고정 공지');
    expect(items[0]).toHaveTextContent('잔디 인정 규칙 안내');
    expect(within(items[0] as HTMLElement).getByRole('link')).toHaveAttribute('href', '/notices/2');
    expect(items[1]).toHaveTextContent('10월 정기 모임은 10/8(목) 저녁 7시예요');
    expect(items[1]).not.toHaveTextContent('고정 공지');
    expect(items[2]).toHaveTextContent('2학기 스터디 팀 모집');
    expect(screen.getByRole('link', { name: '전체보기' })).toHaveAttribute('href', '/notices');
  });

  // 배너 우선순위(E-39 → E-32 → E-36 → E-46)는 서버가 정해 하나만 내려준다(ActivityBanner) — 화면은 그 하나를 그린다
  it('ACC-HOME-05: 잔디 미조회(GRASS_NOT_LOADED)면 E-32 배너 하나 · 면제 배너 없음 · 인증일 "—"', async () => {
    backend.on(
      'myWeeklyActivity',
      weeklyActivity(currentWeek({ banner: 'GRASS_NOT_LOADED', grassAvailable: false, grassFetchedAt: null, verifiedDays: null, passExpected: null })),
    );
    renderRoute('/', { bridge: true });
    expect(await screen.findByText('잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.')).toBeInTheDocument();
    expect(screen.queryByText('이번 주는 면제 주간이에요.')).not.toBeInTheDocument();
    // 잔디를 못 불러오면 인증일은 서버가 비워 준다 → '—'
    expect(screen.getByRole('region', { name: '이번 주 진행' })).toHaveTextContent(/인증일\s*—/);
  });

  it('ACC-HOME-05: 면제 주간만이면 E-46 배너', async () => {
    backend.on('myWeeklyActivity', weeklyActivity(currentWeek({ banner: 'EXEMPTION_WEEK' })));
    renderRoute('/', { bridge: true });
    expect(await screen.findByText('이번 주는 면제 주간이에요.')).toBeInTheDocument();
    expect(screen.getByText('이번 주는 면제예요.')).toBeInTheDocument();
  });

  it('ACC-HOME-06: 경고 3 — ④에 빨간 "벌칙 대상" 배지 + E-40 (배너가 아니다)', async () => {
    backend.on('receivedTeamInvitations', invitations(0)).on('myWarningSummary', PENALTY_WARNINGS);
    renderRoute('/', { as: 'penalty', bridge: true });
    await progressRegion();
    const warning = screen.getByRole('region', { name: '내 경고' });
    expect(warning).toHaveTextContent(/3\s*\/\s*3/);
    expect(within(warning).getByText('벌칙 대상')).toBeInTheDocument();
    expect(within(warning).getByText(E40)).toBeInTheDocument();
    expect(screen.getAllByText(E40)).toHaveLength(1);
  });

  // bridge의 HomeQuery도 잔디 규칙 공지 id를 위해 notices를 묻는다(같은 질의) → 팀 있는 회원은 공지 실패가 홈 전체 실패가 된다.
  // 공지 영역만 따로 실패시키려고 HomeQuery를 부르지 않는 팀 미소속 화면으로 본다
  it('공지만 실패하면 그 영역만 [다시 시도] — 화면 전체를 비우지 않는다 (팀 미소속)', async () => {
    let fail = true;
    backend.on('myTeams', []).on('notices', () => {
      if (fail) {
        fail = false;
        throw backendError('INTERNAL_ERROR');
      }
      return noticePage();
    });
    const { user } = renderRoute('/', { as: 'noteam', bridge: true });
    const notices = await screen.findByRole('region', { name: '공지' });
    expect(await within(notices).findByText('공지를 불러오지 못했어요.')).toBeInTheDocument();
    expect(screen.getByText('팀에 참가해야 판정이 시작돼요')).toBeInTheDocument();
    await user.click(within(notices).getByRole('button', { name: '다시 시도' }));
    expect(await within(notices).findByRole('list', { name: '최근 공지' })).toBeInTheDocument();
  });

  it('E-52: 홈 조회가 실패하면 본문을 서버 오류로 바꾸고 [다시 시도]로 되살린다', async () => {
    let fail = true;
    backend.on('myWarningSummary', () => {
      if (fail) {
        fail = false;
        throw backendError('INTERNAL_ERROR');
      }
      return MEMBER_WARNINGS;
    });
    const { user } = renderRoute('/', { bridge: true });
    expect(await screen.findByRole('heading', { name: '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await progressRegion()).toBeInTheDocument();
  });

  it('④ 판정 보류 중(서버 onHold): "경고 없음" 대신 "확인 중" + 안내', async () => {
    backend.on('myWarningSummary', { onHold: true, holdWeeks: ['2026-09-21'], warningCount: null, streak: null, penaltyTarget: null, penaltyReachedWeek: null });
    renderRoute('/', { bridge: true });
    await progressRegion();
    const warning = screen.getByRole('region', { name: '내 경고' });
    expect(within(warning).getByText('확인 중')).toBeInTheDocument();
    expect(within(warning).getByText('판정을 확인하는 중이에요. 확인이 끝나면 경고 수를 보여 드려요.')).toBeInTheDocument();
    expect(within(warning).queryByText('받은 경고가 없어요')).not.toBeInTheDocument();
  });
});
