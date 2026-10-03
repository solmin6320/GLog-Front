import { screen, within } from '@testing-library/react';
import { db } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';

// AC-02 내 경고 · 벌칙 (화면설계서 5-1-22 · 목업 W-07)

const E40 = '벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.';

describe('AC-02 내 경고 · 벌칙', () => {
  it('ACC-AC02-01: 누적 1/3회 · 게이지 1칸 · 벌칙까지 2회 · 연속 통과 1/2주 + 다음 결과 안내 · ④⑤', async () => {
    renderRoute('/warnings');
    const total = await screen.findByRole('region', { name: '누적 경고' });
    expect(total).toHaveTextContent(/1\s*\/\s*3회/);
    expect(within(total).getByText('경고 3회 중 1회')).toBeInTheDocument();
    expect(within(total).getByText('벌칙까지 2회 남았어요')).toBeInTheDocument();
    const streak = screen.getByRole('region', { name: '연속 통과' });
    expect(streak).toHaveTextContent(/1\s*\/\s*2주/);
    expect(within(streak).getByText('이번 주를 통과하면 경고 1개가 차감되고 연속 횟수는 0으로 돌아가요.')).toBeInTheDocument();

    const rules = screen.getByRole('region', { name: '경고가 쌓이는 기준' });
    expect(within(rules).getAllByRole('term').map((t) => t.textContent)).toEqual(['주간 미달', '2주 연속 통과', '경고 3회', '면제 주간']);
    expect(screen.getByRole('region', { name: '벌칙 대상이 되면' })).toHaveTextContent('경고가 초기화돼요.');
  });

  it('ACC-AC02-03: 경고 이력 — 비공개 팀은 실명 없이 "비공개 팀", 상태 유효 · 차감됨', async () => {
    renderRoute('/warnings');
    const table = await screen.findByRole('table', { name: '경고 이력' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('9/14 ~ 9/20');
    expect(rows[0]).toHaveTextContent('인증일 1일 · 기록글 0개');
    expect(rows[0]).toHaveTextContent('사이드 프로젝트 A팀, 비공개 팀');
    expect(within(rows[0] as HTMLElement).getByText('유효')).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('7/13 ~ 7/19');
    expect(rows[1]).toHaveTextContent('웹 프로젝트 B팀');
    expect(within(rows[1] as HTMLElement).getByText('차감됨')).toBeInTheDocument();
    // 본인 팀이어도 비공개 팀 실명은 화면에 없다
    expect(screen.queryByText(/알고리즘 스터디/)).not.toBeInTheDocument();
  });

  it('ACC-AC02-04: 카테고리가 하나도 남지 않은 경고는 "삭제된 팀"', async () => {
    const w = db.warnings.find((x) => x.memberId === '1' && x.weekStart === '2026-09-14');
    if (!w) throw new Error('seed warning missing');
    w.teamIds = [];
    renderRoute('/warnings');
    const table = await screen.findByRole('table', { name: '경고 이력' });
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('삭제된 팀');
  });

  it('ACC-AC02-05: 누적 3 — "벌칙 대상" 배지 · ②가 E-40 · "벌칙까지" 문구 없음', async () => {
    renderRoute('/warnings', { as: 'penalty' });
    const total = await screen.findByRole('region', { name: '누적 경고' });
    expect(total).toHaveTextContent(/3\s*\/\s*3회/);
    expect(within(total).getByText('벌칙 대상')).toBeInTheDocument();
    expect(within(total).queryByText(/벌칙까지/)).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '연속 통과' })).getByText(E40)).toBeInTheDocument();
  });

  it('ACC-AC02-06: 경고 0 · 이력 0 — "받은 경고가 없어요. 잘하고 있어요." · ③ 없음 · ④⑤ 그대로', async () => {
    renderRoute('/warnings', { as: 'plain' });
    const total = await screen.findByRole('region', { name: '누적 경고' });
    expect(within(total).getByText('받은 경고가 없어요. 잘하고 있어요.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: '경고 이력' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: '경고가 쌓이는 기준' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '벌칙 대상이 되면' })).toBeInTheDocument();
  });

  it('ACC-AC02-02: ①의 누적 경고와 PR-01 ⑧이 같은 값이다', async () => {
    const first = renderRoute('/warnings', { as: 'penalty' });
    expect(await screen.findByRole('region', { name: '누적 경고' })).toHaveTextContent(/3\s*\/\s*3회/);
    first.unmount();
    renderRoute('/profile/me', { as: 'penalty' });
    const warning = await screen.findByRole('region', { name: '경고' });
    expect(warning).toHaveTextContent(/3\s*\/\s*3/);
    expect(within(warning).getByText('벌칙 대상')).toBeInTheDocument();
  });
});
