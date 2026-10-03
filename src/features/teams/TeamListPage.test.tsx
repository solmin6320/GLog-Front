import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/render';

describe('TM-01 내 팀 목록', () => {
  it('ACC-TM01-02 카드: 실제 팀 이름 · 내가 팀장인 팀만 팀장 배지 · 공개 설정 배지 · 통과/아직만 (미달 없음)', async () => {
    renderRoute('/teams');
    const list = await screen.findByRole('list', { name: '내 팀' });
    const cards = within(list).getAllByRole('link');
    expect(cards).toHaveLength(2);

    const [a, algo] = cards as [HTMLElement, HTMLElement];
    expect(a).toHaveAttribute('href', '/teams/1');
    expect(within(a).getByRole('heading', { name: '사이드 프로젝트 A팀' })).toBeInTheDocument();
    expect(within(a).getByText('팀장')).toBeInTheDocument();
    expect(within(a).getByText('공개')).toBeInTheDocument();
    expect(a).toHaveTextContent('팀원 4명');
    expect(a).toHaveTextContent('이번 주 통과 1명');
    expect(a).toHaveTextContent('아직 3명');

    // 비공개 팀도 본인 소속 목록에서는 실제 이름 (5-2-4)
    expect(within(algo).getByRole('heading', { name: '알고리즘 스터디' })).toBeInTheDocument();
    expect(within(algo).getByText('비공개')).toBeInTheDocument();
    expect(within(algo).queryByText('팀장')).not.toBeInTheDocument();
    expect(algo).toHaveTextContent('팀원 6명');

    // M-06: 진행 중인 주에는 '미달'을 쓰지 않는다
    expect(screen.queryByText(/미달/)).not.toBeInTheDocument();
    // ② 상단 액션
    expect(screen.getByRole('link', { name: '팀 만들기' })).toHaveAttribute('href', '/teams/new');
    expect(screen.getByRole('link', { name: '초대코드 입력' })).toHaveAttribute('href', '/teams/join');
  });

  it('③ 받은 초대 배너: "받은 초대 2건" + [보러 가기] → TM-04', async () => {
    const { user, router } = renderRoute('/teams');
    expect(await screen.findByText('받은 초대 2건')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '보러 가기' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams/invitations'));
  });

  it('ACC-TM01-01 팀 0개: 빈 상태 + [팀 만들기] [초대코드 입력], 상단 ② 버튼은 숨김 (받은 초대 배너는 유지)', async () => {
    renderRoute('/teams', { as: 'noteam' });
    expect(await screen.findByText('아직 참가한 팀이 없어요.')).toBeInTheDocument();
    expect(screen.getByText('팀을 만들거나 초대코드로 참가해 보세요.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '팀 만들기' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: '초대코드 입력' })).toHaveLength(1);
    expect(screen.getByText('받은 초대 1건')).toBeInTheDocument();
  });

  it('받은 초대가 0건이면 배너가 없다', async () => {
    renderRoute('/teams', { as: 'plain' });
    expect(await screen.findByRole('list', { name: '내 팀' })).toBeInTheDocument();
    expect(screen.queryByText(/받은 초대/)).not.toBeInTheDocument();
  });
});
