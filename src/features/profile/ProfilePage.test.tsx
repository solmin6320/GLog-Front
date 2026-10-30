import { screen, waitFor, within } from '@testing-library/react';
import { setMockControl } from '@/mocks/control';
import { db, nextId } from '@/mocks/db/store';
import { server } from '@/mocks/node';
import { addDays, kstIso } from '@/shared/lib/kst';
import { renderRoute } from '@/test/render';

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
      '8/24 ~ 8/30——제외',
    ]);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-PR01-04 · ⑪: [더 보기]로 20주씩 이어 붙이고 끝이면 "여기까지예요." (백엔드 커서 20개)', async () => {
    // 김철수(판정 5주)에게 지난 판정 20주를 더 넣어 25주로 만든다
    for (let i = 1; i <= 20; i += 1) {
      const weekStart = addDays('2026-08-24', -7 * i);
      db.judgments.push({
        id: nextId('judgments'),
        memberId: '2',
        weekStart,
        status: 'PASS',
        skipReason: null,
        holdReason: null,
        verifiedDays: 3,
        recordCount: 1,
        days: Array.from({ length: 7 }, () => ({ hasGrass: false, hasRecord: false })),
        corrected: false,
        executedAt: kstIso(addDays(weekStart, 7), 7),
        judgedAt: kstIso(addDays(weekStart, 7), 7),
      });
    }
    const { user } = renderRoute('/profile/2');
    const table = await screen.findByRole('table', { name: '주간 판정 이력' });
    expect(rowsOf(table)).toHaveLength(21); // 진행 중 1 + 20주
    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() => expect(rowsOf(screen.getByRole('table', { name: '주간 판정 이력' }))).toHaveLength(26));
    expect(screen.getByText('여기까지예요.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-PR01-01: 타인 — [프로필 수정] · [관리자 메뉴] 없음, 비공개 팀 카테고리는 "비공개 팀", 소속 팀에서 빠진다', async () => {
    renderRoute('/profile/6', { as: 'plain' });
    expect(await screen.findByRole('heading', { level: 1, name: '박지훈' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '프로필 수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '관리자 메뉴' })).not.toBeInTheDocument();
    const warning = screen.getByRole('region', { name: '경고' });
    expect(within(warning).getByText('벌칙 대상')).toBeInTheDocument();
    expect(within(warning).getByText('벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.')).toBeInTheDocument();
    const byTeam = within(warning).getByRole('list', { name: '팀별 경고' });
    // 공개 팀(이름순) → 비공개 팀 → 삭제된 팀 순 (백엔드 profile-warning)
    expect(within(byTeam).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['사이드 프로젝트 A팀2회', '비공개 팀3회']);
    // 박지훈의 소속 팀은 비공개 팀뿐 → 목록이 비어 있다 (EX-PR01-02)
    expect(within(screen.getByRole('region', { name: '소속 팀' })).getByText('공개된 소속 팀이 없어요.')).toBeInTheDocument();
    expect(screen.queryByText(/알고리즘 스터디/)).not.toBeInTheDocument();
  });

  it('타인 프로필의 공개 팀은 내가 그 팀 소속일 때만 현황판 링크', async () => {
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
    const operations: string[] = [];
    const onStart = ({ request }: { request: Request }) => {
      void request
        .clone()
        .json()
        .then((b: { operationName?: string }) => operations.push(b.operationName ?? ''))
        .catch(() => undefined);
    };
    server.events.on('request:start', onStart);
    try {
      const bad = renderRoute('/profile/abc');
      expect(await screen.findByRole('heading', { name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
      await new Promise((r) => setTimeout(r, 30));
      expect(operations).toContain('SessionQuery');
      expect(operations).not.toContain('ProfileQuery');
      expect(operations).not.toContain('ProfileHistoryQuery');
      bad.unmount();
    } finally {
      server.events.removeListener('request:start', onStart);
    }
    renderRoute('/profile/999');
    expect(await screen.findByRole('heading', { name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
  });

  it('E-32: 잔디 캐시가 없으면(grass null) ⑦ 빈 상태 + [다시 시도]', async () => {
    setMockControl({ grass: 'failed' });
    renderRoute('/profile/me');
    const grass = await screen.findByRole('region', { name: 'GitHub 잔디' });
    expect(within(grass).getByText('GitHub 잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.')).toBeInTheDocument();
    expect(within(grass).getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(within(grass).queryByRole('region', { name: '잔디 기록' })).not.toBeInTheDocument();
  });

  it('⑦ 잔디는 1년치(오늘까지 365일)이고 색 단계는 기여가 있는 날의 사분위로 나눈다', async () => {
    renderRoute('/profile/me');
    const grass = await screen.findByRole('region', { name: 'GitHub 잔디' });
    const cells = within(within(grass).getByRole('region', { name: '잔디 기록' })).getAllByRole('listitem');
    expect(cells.filter((c) => !c.getAttribute('aria-hidden'))).toHaveLength(365);
  });
});
