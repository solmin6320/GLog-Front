import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';

describe('TM-02 팀 생성', () => {
  it('ACC-TM02-01 이름을 비우고 [팀 만들기] → 인라인 오류 · 21자는 입력이 막힌다', async () => {
    const { user } = renderRoute('/teams/new', { as: 'noteam' });
    await user.click(await screen.findByRole('button', { name: '팀 만들기' }));
    expect(await screen.findByText('팀 이름을 입력해 주세요.')).toBeInTheDocument();
    const name = screen.getByRole('textbox', { name: /팀 이름/ });
    expect(name).toHaveFocus();
    await user.type(name, '가'.repeat(21));
    expect(name).toHaveValue('가'.repeat(20));
    expect(screen.queryByText('팀 이름을 입력해 주세요.')).not.toBeInTheDocument();
  });

  it('ACC-TM02-02 생성 성공: 초대코드 + 재발급 불가 안내 + [복사](토스트) + [팀 보러 가기] → TM-05', async () => {
    const { user, router } = renderRoute('/teams/new', { as: 'noteam' });
    await user.type(await screen.findByRole('textbox', { name: /팀 이름/ }), '스터디 C팀');
    await user.click(screen.getByRole('radio', { name: '비공개' }));
    await user.click(screen.getByRole('button', { name: '팀 만들기' }));

    expect(await screen.findByRole('heading', { name: '팀을 만들었어요' })).toBeInTheDocument();
    const code = screen.getByTestId('invite-code').textContent ?? '';
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(screen.getByText('이 코드는 다시 발급할 수 없어요. 꼭 저장해 주세요.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '초대코드 복사' }));
    expect(await screen.findByText('복사했어요.')).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(code);

    const team = db.teams.find((t) => t.name === '스터디 C팀');
    expect(team).toMatchObject({ isPublic: false, leaderId: '5', inviteCode: code });
    await user.click(screen.getByRole('link', { name: '팀 보러 가기' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/teams/${team?.id}`));
    expect(await screen.findByRole('heading', { level: 1, name: '스터디 C팀' })).toBeInTheDocument();
  });
});

describe('TM-03 팀 참가', () => {
  async function submitCode(code: string, as: 'plain' | 'noteam' = 'noteam') {
    const r = renderRoute('/teams/join', { as });
    await r.user.type(await screen.findByRole('textbox', { name: '초대코드' }), code);
    await r.user.click(screen.getByRole('button', { name: '참가하기' }));
    return r;
  }

  it('ACC-TM03-01 없는 코드(E-10): 인라인 오류, 화면 이동 없음', async () => {
    const { router } = await submitCode('NOPE-0000');
    expect(await screen.findByText('그런 초대코드가 없어요. 다시 확인해 주세요.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/teams/join');
  });

  it('ACC-TM03-01 이미 속한 팀(E-11): "이미 참가한 팀이에요." + [팀 보러 가기]', async () => {
    await submitCode('jd7k-q2ma', 'plain');
    expect(await screen.findByText('이미 참가한 팀이에요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '팀 보러 가기' })).toHaveAttribute('href', '/teams');
  });

  it('ACC-TM03-01 추방 차단(E-12): 이유 · 남은 기간 없이 안내', async () => {
    db.teamJoinBlocks.push({ teamId: '3', memberId: '5', until: '2027-09-01T00:00:00+09:00' });
    await submitCode('WB3N-7KQX');
    expect(await screen.findByText('이 팀에는 참가할 수 없어요. 팀장에게 문의해 주세요.')).toBeInTheDocument();
    expect(screen.queryByText(/2027|추방/)).not.toBeInTheDocument();
  });

  it('형식이 틀린 코드는 보내지 않고 인라인 안내', async () => {
    await submitCode('가나');
    expect(await screen.findByText('초대코드는 영문, 숫자, -로 되어 있어요.')).toBeInTheDocument();
  });

  it('ACC-TM03-02 성공: /teams/:id로 이동 + 토스트 "팀에 참가했어요."', async () => {
    const { router } = await submitCode('wb3n-7kqx');
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams/3'));
    expect(await screen.findByText('팀에 참가했어요.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: '웹 프로젝트 B팀' })).toBeInTheDocument();
  });

  it('④ 받은 초대 보기 → TM-04', async () => {
    renderRoute('/teams/join', { as: 'noteam' });
    expect(await screen.findByRole('link', { name: '받은 초대 보기' })).toHaveAttribute('href', '/teams/invitations');
  });
});

describe('TM-04 받은 초대', () => {
  async function openDrawerBadge(user: ReturnType<typeof renderRoute>['user']) {
    await user.click(screen.getByRole('button', { name: '전체 메뉴 열기' }));
    const drawer = await screen.findByRole('dialog', { name: '전체 메뉴' });
    const link = within(drawer).getByRole('link', { name: /받은 초대/ });
    const name = link.getAttribute('aria-label') ?? link.textContent ?? '';
    await user.click(within(drawer).getByRole('button', { name: '메뉴 닫기' }));
    return name;
  }

  it('ACC-TM04-01 카드 2장: 팀 이름(비공개도 실명) · "{팀장} 님이 초대했어요" · 받은 날짜', async () => {
    renderRoute('/teams/invitations');
    const list = await screen.findByRole('list', { name: '받은 초대' });
    const cards = within(list).getAllByRole('listitem');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('클라우드 인프라 스터디');
    expect(cards[0]).toHaveTextContent('문지아 님이 초대했어요');
    expect(cards[0]).toHaveTextContent('9/30');
    expect(cards[1]).toHaveTextContent('웹 프로젝트 B팀');
  });

  it('ACC-TM04-02 [수락] → 확인 없이 참가 · TM-05로 · 토스트 · 드로어 받은 초대 배지 2 → 1', async () => {
    const { user, router } = renderRoute('/teams/invitations');
    await screen.findByRole('list', { name: '받은 초대' });
    expect(await openDrawerBadge(user)).toBe('받은 초대 2건');

    await user.click(screen.getByRole('button', { name: '웹 프로젝트 B팀 초대 수락' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams/3'));
    expect(await screen.findByText('팀에 참가했어요.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: '웹 프로젝트 B팀' })).toBeInTheDocument();
    expect(await openDrawerBadge(user)).toBe('받은 초대 1건');
  });

  it('ACC-TM04-03 [거절] → 확인 없이 카드 제거 + 토스트 "거절했어요."', async () => {
    const { user } = renderRoute('/teams/invitations');
    await user.click(await screen.findByRole('button', { name: '클라우드 인프라 스터디 초대 거절' }));
    expect(await screen.findByText('거절했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('클라우드 인프라 스터디')).not.toBeInTheDocument());
    expect(screen.getByText('웹 프로젝트 B팀')).toBeInTheDocument();
  });

  it('ACC-TM04-04 수락 순간 팀이 삭제됨(E-18) → "없어진 팀이에요." + 카드 사라짐', async () => {
    const { user } = renderRoute('/teams/invitations');
    await screen.findByRole('list', { name: '받은 초대' });
    const team = db.teams.find((t) => t.id === '6');
    if (team) team.deletedAt = '2026-10-01T09:30:00+09:00';
    await user.click(screen.getByRole('button', { name: '클라우드 인프라 스터디 초대 수락' }));
    expect(await screen.findByText('없어진 팀이에요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('클라우드 인프라 스터디')).not.toBeInTheDocument());
  });

  it('ACC-TM04-04 이미 다른 경로로 참가함(E-17) → "이미 참가한 팀이에요. 초대는 정리했어요."', async () => {
    db.memberships.push({ teamId: '3', memberId: '1', role: 'MEMBER', joinedAt: '2026-10-01T09:00:00+09:00' });
    const { user } = renderRoute('/teams/invitations');
    await user.click(await screen.findByRole('button', { name: '웹 프로젝트 B팀 초대 수락' }));
    expect(await screen.findByText('이미 참가한 팀이에요. 초대는 정리했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('웹 프로젝트 B팀')).not.toBeInTheDocument());
  });

  it('ACC-TM04-05 받은 초대 0건 → "받은 초대가 없어요."', async () => {
    renderRoute('/teams/invitations', { as: 'plain' });
    expect(await screen.findByText('받은 초대가 없어요.')).toBeInTheDocument();
  });
});
