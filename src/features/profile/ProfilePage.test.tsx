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
      '8/24 ~ 8/30——첫 참가',
    ]);
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('ACC-PR01-04 · ⑪: [더 보기]로 8주씩 이어 붙이고 끝이면 "여기까지예요."', async () => {
    // 김철수(판정 5주)에게 지난 판정 6주를 더 넣어 11주로 만든다
    for (let i = 1; i <= 6; i += 1) {
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
    expect(rowsOf(table)).toHaveLength(9); // 진행 중 1 + 8주
    await user.click(screen.getByRole('button', { name: '더 보기' }));
    await waitFor(() => expect(rowsOf(screen.getByRole('table', { name: '주간 판정 이력' }))).toHaveLength(12));
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
    expect(within(byTeam).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['비공개 팀3회', '사이드 프로젝트 A팀2회']);
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

  it('E-32: 잔디를 못 불러오면 ⑦ 빈 상태 + [다시 시도] · E-08은 배너', async () => {
    setMockControl({ grass: 'failed' });
    const first = renderRoute('/profile/me');
    const grass = await screen.findByRole('region', { name: 'GitHub 잔디' });
    expect(within(grass).getByText('GitHub 잔디를 불러오지 못했어요.')).toBeInTheDocument();
    expect(within(grass).getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(within(grass).getByText('어제 오전 6시 기준')).toBeInTheDocument();
    first.unmount();

    setMockControl({ grass: 'identity' });
    renderRoute('/profile/me');
    const grass2 = await screen.findByRole('region', { name: 'GitHub 잔디' });
    expect(within(grass2).getByText('GitHub 아이디가 바뀌었어요. 다시 로그인하면 잔디가 연결돼요.')).toBeInTheDocument();
  });
});
