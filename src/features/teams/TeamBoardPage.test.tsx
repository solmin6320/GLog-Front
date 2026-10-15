import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { setMockControl } from '@/mocks/control';
import { renderRoute } from '@/test/render';

/** 표 본문 행: [이름, 인증일 수, 기록글, 경고, 상태] (아바타 글자 · 잔디 칸 설명은 뺀다) */
async function boardRows() {
  const table = await screen.findByRole('table', { name: '이번 주 팀원 현황' });
  const rows = within(table).getAllByRole('row').slice(1);
  return rows.map((r) => {
    const cells = within(r).getAllByRole('cell');
    const name = within(cells[0] as HTMLElement).getByRole('link').textContent ?? '';
    const me = within(cells[0] as HTMLElement).queryByText('나') ? '(나)' : '';
    const days = cells[1]?.querySelector('b')?.textContent ?? '';
    return [`${name}${me}`, days, ...cells.slice(2).map((c) => c.textContent?.trim() ?? '')];
  });
}

describe('TM-05 팀 현황판', () => {
  it('ACC-TM05-03 · 04 · 06 W-09 A팀: 머리 · 갱신 기준 · 5개 칸 · 본인 행 강조 · 이 팀 경고만 · 미달 없음', async () => {
    renderRoute('/teams/1');
    expect(await screen.findByRole('heading', { level: 1, name: '사이드 프로젝트 A팀' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '이번 주 (9/28 월 ~ 10/4 일)' })).toBeInTheDocument();
    expect(screen.getByText('인증일은 오늘 오전 6시 기준이에요')).toBeInTheDocument();

    const table = screen.getByRole('table', { name: '이번 주 팀원 현황' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['이름', '인증일', '기록글', '경고', '상태']);

    const rows = await boardRows();
    // 이름 · 인증일 · 기록글 · 경고 · 상태 (목업 W-09 TEAM 배열)
    expect(rows).toEqual([
      ['한동관(나)', '2일', '1개', '1', '아직'],
      ['김철수', '4일', '2개', '0', '통과'],
      ['이영희', '0일', '0개', '2', '아직'],
      ['박민수', '4일', '0개', '0', '아직'],
    ]);
    const viewerRow = within(table).getAllByRole('row')[1];
    expect(viewerRow).toHaveAttribute('data-tone', 'me');
    expect(screen.queryByText('미달')).not.toBeInTheDocument();
    // ACC-TM05-05 벌칙 대상 표시는 넣지 않는다
    expect(screen.queryByText('벌칙 대상')).not.toBeInTheDocument();
    expect(screen.getByText(/경고는 이 팀에서 받은 것만 세요/)).toBeInTheDocument();
  });

  it('ACC-TM05-10 · 13 이 팀의 기록글 5건(전체보기 없음) · 이름 클릭 → PR-01', async () => {
    const { user, router } = renderRoute('/teams/1');
    const section = (await screen.findByRole('heading', { name: '이 팀의 기록글' })).closest('section') as HTMLElement;
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(5);
    const redis = links.find((l) => l.textContent?.includes('Redis TTL이 적용되지 않던 문제'));
    // [말머리] 제목 작성자 날짜
    expect(redis).toHaveTextContent(/^트러블슈팅Redis TTL이 적용되지 않던 문제한동관9\/29$/);
    expect(redis?.getAttribute('href')).toMatch(/^\/posts\/[0-9a-f]{24}$/);
    expect(screen.queryByRole('link', { name: '전체보기' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: '김철수' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/profile/2'));
  });

  it('ACC-TM05-08 팀장: "팀장 전용" [팀원 관리] [개인 면제 요청], [팀 나가기] 없음', async () => {
    renderRoute('/teams/1');
    const group = await screen.findByRole('group', { name: '팀장 전용' });
    expect(within(group).getByRole('link', { name: '팀원 관리' })).toHaveAttribute('href', '/teams/1/manage');
    expect(within(group).getByRole('link', { name: '개인 면제 요청' })).toHaveAttribute('href', '/teams/1/exemption');
    expect(screen.queryByRole('button', { name: '팀 나가기' })).not.toBeInTheDocument();
  });

  it('ACC-TM05-08 · 09 팀원: 보조 메뉴 없음 · [팀 나가기] → 확인 → /teams + 토스트', async () => {
    const { user, router } = renderRoute('/teams/1', { as: 'plain' });
    await user.click(await screen.findByRole('button', { name: '팀 나가기' }));
    expect(screen.queryByRole('group', { name: '팀장 전용' })).not.toBeInTheDocument();
    const dialog = await screen.findByRole('dialog', { name: '팀에서 나갈까요?' });
    await user.click(within(dialog).getByRole('button', { name: '나가기' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams'));
    expect(await screen.findByText('팀에서 나왔어요.')).toBeInTheDocument();
    // 김철수는 A팀뿐이었다 → 빈 목록 (나간 팀 카드가 잠깐도 남지 않는다)
    expect(await screen.findByText('아직 참가한 팀이 없어요.')).toBeInTheDocument();
    expect(screen.queryByText('사이드 프로젝트 A팀')).not.toBeInTheDocument();
  });

  it('[팀 나가기] 확인에서 취소하면 아무 일도 없다', async () => {
    const { user, router } = renderRoute('/teams/1', { as: 'plain' });
    await user.click(await screen.findByRole('button', { name: '팀 나가기' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '취소' }));
    expect(router.state.location.pathname).toBe('/teams/1');
    expect(screen.getByRole('table', { name: '이번 주 팀원 현황' })).toBeInTheDocument();
  });

  it('ACC-TM05-01 비소속 회원 · 관리자도 403 (URL 그대로)', async () => {
    const { router } = renderRoute('/teams/1', { as: 'penalty' });
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/teams/1');
  });

  it('ACC-TM05-01 관리자(member)도 소속 아닌 팀(B팀)은 403', async () => {
    renderRoute('/teams/3');
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
  });

  it('ACC-TM05-02 없는 teamId → 404', async () => {
    renderRoute('/teams/999');
    expect(await screen.findByText('찾는 내용이 없어요. 삭제됐을 수 있어요.')).toBeInTheDocument();
  });

  it('ACC-TM05-12 잔디 조회 실패: 인증일 "—" + 배너', async () => {
    setMockControl({ grass: 'failed' });
    renderRoute('/teams/1');
    expect(await screen.findByText('잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.')).toBeInTheDocument();
    const rows = await boardRows();
    expect(rows[0]?.[1]).toBe('—');
  });

  it('ACC-TM05-11 팀원 전원 활동 0: 빈 상태 + [기록 쓰러 가기] → 글쓰기', async () => {
    renderRoute('/teams/1', { now: '2026-09-28T03:00:00+09:00' });
    expect(await screen.findByText('이번 주 활동이 아직 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '기록 쓰러 가기' }).getAttribute('href')).toMatch(/^\/posts\/new/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
