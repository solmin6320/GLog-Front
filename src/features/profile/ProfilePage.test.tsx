import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach } from 'vitest';
import { addDays } from '@/shared/lib/kst';
import { backend } from '@/test/backend';
import { installHome, myTeam } from '@/test/fixtures/home';
import { installProfiles, profiles, profileWeek, type ProfileFx } from '@/test/fixtures/profile';
import { renderRoute as renderRouteRaw, type RenderRouteOptions } from '@/test/render';

// bridge + 가짜 백엔드 (profile · profile-history · profile-warning.graphqls)
let all: Record<string, ProfileFx>;
beforeEach(() => {
  installHome();
  all = installProfiles(profiles());
});
const renderRoute = (path: string, o: RenderRouteOptions = {}) => renderRouteRaw(path, { ...o, bridge: true });

// PR-01 프로필 (화면설계서 5-1-9 · 목업 W-14). 회원 id: 한동관 1 · 김철수 2 · 박지훈 6

const DOUBLE_COUNT = '경고 1개에 여러 팀이 함께 붙을 수 있어서, 팀별 합계는 누적 경고 수와 다를 수 있어요.';

function rowsOf(table: HTMLElement): string[] {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((r) => r.textContent ?? '');
}

describe('PR-01 프로필', () => {
  it('ACC-PR01-02: 본인 + 관리자 — [프로필 수정] · [관리자 메뉴]→/admin · 활동 수 · 잔디 갱신 기준', async () => {
    renderRoute('/profile/me');
    expect(await screen.findByRole('heading', { level: 1, name: '한동관' })).toBeInTheDocument();
    const gh = screen.getByRole('link', { name: /@handong-gwan/ });
    expect(gh).toHaveAttribute('href', 'https://github.com/handong-gwan');
    expect(gh).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: '프로필 수정' })).toHaveAttribute('href', '/profile/edit');
    expect(screen.getByRole('link', { name: '관리자 메뉴' })).toHaveAttribute('href', '/admin');
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['게시글', '댓글']);
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual(['12', '34']);
    const grass = screen.getByRole('region', { name: 'GitHub 잔디' });
    expect(within(grass).getByText('오늘 오전 6시 기준')).toBeInTheDocument();
    expect(within(grass).getByRole('region', { name: '잔디 기록' })).toBeInTheDocument();
  });

  it('ACC-PR01-03 · ⑨⑫: 비공개 팀은 "비공개 팀"으로 집계 + 중복 집계 안내, 소속 팀에서는 빠진다', async () => {
    renderRoute('/profile/me');
    const warning = await screen.findByRole('region', { name: '경고' });
    expect(warning).toHaveTextContent(/1\s*\/\s*3/);
    const byTeam = within(warning).getByRole('list', { name: '팀별 경고' });
    expect(within(byTeam).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['사이드 프로젝트 A팀1회', '비공개 팀1회']);
    expect(within(warning).getByText(DOUBLE_COUNT)).toBeInTheDocument();
    const teams = screen.getByRole('region', { name: '소속 팀' });
    expect(within(teams).getAllByRole('listitem')).toHaveLength(1);
    expect(within(teams).getByRole('link', { name: '사이드 프로젝트 A팀' })).toHaveAttribute('href', '/teams/1');
    expect(screen.queryByText(/알고리즘 스터디/)).not.toBeInTheDocument();
  });

  it('ACC-PR01-04: 주간 판정 이력 — 첫 줄 "진행 중", 경고가 살아 있는 미달은 "미달 (경고)"', async () => {
    renderRoute('/profile/me');
    const table = await screen.findByRole('table', { name: '주간 판정 이력' });
    expect(rowsOf(table)).toEqual([
      '9/28 ~ 10/42일1개진행 중',
      '9/21 ~ 9/274일1개통과',
      '9/14 ~ 9/201일0개미달 (경고)',
      '9/7 ~ 9/13——면제',
      '8/31 ~ 9/63일2개통과',
      '8/24 ~ 8/30——첫 참가',
    ]);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-PR01-04 · ⑪: [더 보기]로 이어 붙이고 끝이면 "여기까지예요." (서버는 20주씩)', async () => {
    // 김철수에게 지난 판정 25주 — 첫 페이지 20주 + 진행 중 1, 더 보기로 나머지 5주
    const chulsoo = all['2']!;
    chulsoo.history = [profileWeek('2026-09-28', 'IN_PROGRESS', 3, 1), ...Array.from({ length: 25 }, (_, i) => profileWeek(addDays('2026-09-21', -7 * i), 'PASS', 3, 1))];
    const { user } = renderRoute('/profile/2');
    const table = await screen.findByRole('table', { name: '주간 판정 이력' });
    await waitFor(() => expect(rowsOf(table)).toHaveLength(21)); // 진행 중 1 + 20주
    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() => expect(rowsOf(screen.getByRole('table', { name: '주간 판정 이력' }))).toHaveLength(26));
    expect(screen.getByText('여기까지예요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-PR01-01: 타인 — [프로필 수정] · [관리자 메뉴] 없음, 비공개 팀 카테고리는 "비공개 팀", 소속 팀에서 빠진다', async () => {
    backend.on('myTeams', [myTeam('1', false)]);
    renderRoute('/profile/6', { as: 'plain' });
    expect(await screen.findByRole('heading', { level: 1, name: '박지훈' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '프로필 수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '관리자 메뉴' })).not.toBeInTheDocument();
    const warning = screen.getByRole('region', { name: '경고' });
    expect(within(warning).getByText('벌칙 대상')).toBeInTheDocument();
    expect(within(warning).getByText('벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.')).toBeInTheDocument();
    const byTeam = within(warning).getByRole('list', { name: '팀별 경고' });
    expect(within(byTeam).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['비공개 팀3회', '사이드 프로젝트 A팀2회']);
    // 박지훈의 소속 팀은 비공개 팀뿐 → 목록이 비어 있다 (EX-PR01-02)
    expect(within(screen.getByRole('region', { name: '소속 팀' })).getByText('공개된 소속 팀이 없어요.')).toBeInTheDocument();
    expect(screen.queryByText(/알고리즘 스터디/)).not.toBeInTheDocument();
  });

  it('타인 프로필의 공개 팀은 내가 그 팀 소속일 때만 현황판 링크', async () => {
    backend.on('myTeams', []); // 박지훈은 A팀 소속이 아니다
    renderRoute('/profile/2', { as: 'penalty' });
    const teams = await screen.findByRole('region', { name: '소속 팀' });
    expect(within(teams).getByText('사이드 프로젝트 A팀')).toBeInTheDocument();
    expect(within(teams).queryByRole('link')).not.toBeInTheDocument();
    // 경고 0 (EX-PR01-01)
    expect(within(screen.getByRole('region', { name: '경고' })).getByText('받은 경고가 없어요. 잘하고 있어요.')).toBeInTheDocument();
  });

  it('/profile/<내 id>는 본인 화면', async () => {
    renderRoute('/profile/1');
    expect(await screen.findByRole('link', { name: '프로필 수정' })).toBeInTheDocument();
  });

  it('E-53: 형식이 틀린 userId는 조회 없이 404 · 없는 회원도 404', async () => {
    const bad = renderRoute('/profile/abc');
    expect(await screen.findByRole('heading', { name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 30));
    expect(backend.calls('me').length).toBeGreaterThan(0);
    expect(backend.calls('profile')).toHaveLength(0);
    bad.unmount();
    renderRoute('/profile/999');
    expect(await screen.findByRole('heading', { name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
  });

  it('E-32: 잔디 캐시가 없으면(grass: null) ⑦ 빈 상태 + 본인에게 [다시 시도]', async () => {
    // 서버는 잔디 상태를 null 하나로만 알린다 — 아이디 변경(E-08) · 마지막 갱신 시각은 bridge가 구분하지 못한다
    all['1']!.grass = null;
    renderRoute('/profile/me');
    const grass = await screen.findByRole('region', { name: 'GitHub 잔디' });
    expect(within(grass).getByText('GitHub 잔디를 불러오지 못했어요.')).toBeInTheDocument();
    expect(within(grass).getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
  });

  it('⑧ 판정 보류 중(서버 onHold): 경고 0 · 팀별 경고 대신 "확인 중" + 안내', async () => {
    all['1']!.warning = { onHold: true, warningCount: null, penaltyTarget: null };
    all['1']!.teamWarnings = { onHold: true, teams: [] };
    renderRoute('/profile/me');
    const warning = await screen.findByRole('region', { name: '경고' });
    expect(within(warning).getByText('확인 중')).toBeInTheDocument();
    expect(within(warning).getByText('판정을 확인하는 중이에요. 확인이 끝나면 경고 수를 보여 드려요.')).toBeInTheDocument();
    expect(within(warning).queryByText(/0\s*\/\s*3/)).not.toBeInTheDocument();
    expect(within(warning).queryByText('받은 경고가 없어요. 잘하고 있어요.')).not.toBeInTheDocument();
  });
});
