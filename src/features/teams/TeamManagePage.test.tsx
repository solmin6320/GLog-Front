import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db/store';
import { renderRoute } from '@/test/render';

const sectionOf = (name: string) => screen.getByRole('heading', { name }).closest('section') as HTMLElement;

describe('TM-06 팀 관리', () => {
  it('ACC-TM06-01 팀원(비팀장) · 관리자(비소속)는 403', async () => {
    renderRoute('/teams/1/manage', { as: 'plain' });
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
  });

  it('ACC-TM06-01 관리자도 소속 아닌 팀 관리는 403', async () => {
    renderRoute('/teams/3/manage');
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
  });

  it('ACC-TM06-02 · 03 · 11 W-10 순서 · 초대코드 · 본인 행에는 버튼 없음 · 나가기 안내 (미결 문구 없음)', async () => {
    const { user } = renderRoute('/teams/1/manage');
    expect(await screen.findByRole('heading', { level: 1, name: '팀 관리' })).toBeInTheDocument();
    await screen.findByRole('heading', { name: '초대코드' });
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['초대코드', '아이디로 초대', '팀원', '공개 설정', '팀 글 관리', '팀 나가기 · 삭제']);

    expect(screen.getByTestId('invite-code')).toHaveTextContent('JD7K-Q2MA');
    expect(screen.getByText('다시 발급할 수 없어요.')).toBeInTheDocument();
    expect(screen.queryByText(/미결|Q-01/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '초대코드 복사' }));
    expect(await screen.findByText('복사했어요.')).toBeInTheDocument();

    // ③ 보낸 초대
    const sent = screen.getByRole('list', { name: '보낸 초대' });
    expect(sent).toHaveTextContent('@seoyeon-lee');
    expect(sent).toHaveTextContent('대기 중');

    // ④ 팀원 4명, 본인(팀장) 행에는 [팀장 넘기기] [추방]이 없다
    const members = within(screen.getByRole('list', { name: '팀원' })).getAllByRole('listitem');
    expect(members).toHaveLength(4);
    expect(members[0]).toHaveTextContent('한동관@handong-gwan팀장');
    expect(within(members[0] as HTMLElement).queryByRole('button')).not.toBeInTheDocument();
    expect(within(members[1] as HTMLElement).getByRole('button', { name: '팀장 넘기기: 김철수' })).toBeInTheDocument();
    expect(within(members[1] as HTMLElement).getByRole('button', { name: '추방: 김철수' })).toBeInTheDocument();
    expect(within(sectionOf('팀원')).getByText('4명')).toBeInTheDocument();

    // ⑩ 팀원이 있으면 나가기 버튼 없이 안내만 (E-19)
    const danger = sectionOf('팀 나가기 · 삭제');
    expect(within(danger).getByText('팀장은 다른 팀원에게 팀장을 넘긴 뒤에 나갈 수 있어요.')).toBeInTheDocument();
    expect(within(danger).queryByRole('button', { name: '팀 나가기' })).not.toBeInTheDocument();
  });

  it('ACC-TM06-03 계약의 초대코드가 null이면 ① 영역이 없다', async () => {
    const team = db.teams.find((t) => t.id === '1');
    if (team) team.inviteCode = null;
    renderRoute('/teams/1/manage');
    expect(await screen.findByRole('heading', { name: '아이디로 초대' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '초대코드' })).not.toBeInTheDocument();
  });

  it('ACC-TM06-04 아이디 초대: 가입 안 함(E-15) · 이미 팀원(E-16) · 성공 시 입력칸 비우고 ③에 대기 중', async () => {
    const { user } = renderRoute('/teams/1/manage');
    const input = await screen.findByRole('textbox', { name: 'GitHub 아이디' });
    const invite = screen.getByRole('button', { name: '초대' });

    await user.type(input, 'no-such-user');
    await user.click(invite);
    expect(await screen.findByText('그 아이디의 회원을 찾을 수 없어요. 먼저 가입해야 초대할 수 있어요.')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '@chulsoo-kim');
    await user.click(invite);
    expect(await screen.findByText('이미 팀에 있는 회원이에요.')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'jihoon-park');
    await user.click(invite);
    expect(await screen.findByText('초대를 보냈어요.')).toBeInTheDocument();
    expect(input).toHaveValue('');
    await waitFor(() => expect(screen.getByRole('list', { name: '보낸 초대' })).toHaveTextContent('@jihoon-park'));
  });

  it('ACC-TM06-05 보낸 초대 [취소] → 행이 사라진다', async () => {
    const { user } = renderRoute('/teams/1/manage');
    await user.click(await screen.findByRole('button', { name: '취소: @seoyeon-lee 초대' }));
    expect(await screen.findByText('초대를 취소했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('list', { name: '보낸 초대' })).not.toBeInTheDocument());
  });

  it('ACC-TM06-06 [추방] → 확인 문구 · 취소면 그대로 · 확정하면 행 제거 + 토스트 + 경고 삭제 표시', async () => {
    const { user } = renderRoute('/teams/1/manage');
    await user.click(await screen.findByRole('button', { name: '추방: 이영희' }));
    let dialog = await screen.findByRole('dialog', { name: '이영희님을 추방할까요?' });
    expect(within(dialog).getByText('이 팀 초대코드로는 1년간 다시 들어올 수 없어요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(within(screen.getByRole('list', { name: '팀원' })).getAllByRole('listitem')).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: '추방: 이영희' }));
    dialog = await screen.findByRole('dialog', { name: '이영희님을 추방할까요?' });
    await user.click(within(dialog).getByRole('button', { name: '추방' }));
    expect(await screen.findByText('추방했어요.')).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole('list', { name: '팀원' })).getAllByRole('listitem')).toHaveLength(3));
    expect(screen.queryByRole('button', { name: '추방: 이영희' })).not.toBeInTheDocument();
    expect(db.warnings.filter((w) => w.memberId === '3' && w.deleted?.reason === 'KICKED').length).toBeGreaterThanOrEqual(2);
  });

  it('ACC-TM06-07 [팀장 넘기기] → 확인 → TM-05로(replace) · manage는 403 · TM-05에 [팀 나가기]', async () => {
    const { user, router } = renderRoute('/teams/1/manage');
    await user.click(await screen.findByRole('button', { name: '팀장 넘기기: 김철수' }));
    const dialog = await screen.findByRole('dialog', { name: '김철수님에게 팀장을 넘길까요?' });
    expect(within(dialog).getByText('넘기면 되돌릴 수 없어요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '팀장 넘기기' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/teams/1'));
    expect(router.state.historyAction).toBe('REPLACE');
    expect(await screen.findByText('팀장을 넘겼어요.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: '팀 나가기' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '팀장 전용' })).not.toBeInTheDocument();

    await router.navigate('/teams/1/manage');
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
  });

  it('ACC-TM06-08 공개 설정 끄기 → 확인 없이 반영 + 토스트, 현황판 배지도 비공개', async () => {
    const { user, router } = renderRoute('/teams/1/manage');
    const toggle = await screen.findByRole('switch', { name: '공개' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    expect(await screen.findByText('공개 설정을 바꿨어요.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '공개' })).toHaveAttribute('aria-checked', 'false');
    expect(db.teams.find((t) => t.id === '1')?.isPublic).toBe(false);

    await router.navigate('/teams/1');
    expect(await screen.findByRole('heading', { level: 1, name: '사이드 프로젝트 A팀' })).toBeInTheDocument();
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('ACC-TM06-09 팀 글 관리: 행마다 [수정]만 · 삭제 버튼 없음 · 안내 · 글 [수정] → 글 수정 화면', async () => {
    renderRoute('/teams/1/manage');
    const list = await screen.findByRole('list', { name: '팀 글과 댓글' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    // 글 행은 [수정]이 링크(BD-04로 이동), 댓글 행은 버튼(그 자리 편집)이다
    for (const row of rows) {
      const controls = [...within(row).queryAllByRole('button'), ...within(row).queryAllByRole('link')];
      expect(controls.some((el) => /^수정/.test(el.textContent ?? ''))).toBe(true);
    }
    expect(within(list).queryByRole('button', { name: /삭제/ })).not.toBeInTheDocument();
    expect(screen.getByText('삭제는 관리자에게 문의해 주세요.')).toBeInTheDocument();

    const postEdit = within(list).getAllByRole('link', { name: /^수정: / })[0];
    expect(postEdit?.getAttribute('href')).toMatch(/^\/posts\/[0-9a-f]{24}\/edit$/);
  });

  it('ACC-TM06-09 댓글 [수정] → 그 자리에서 편집 · 저장하면 목록이 바뀐다', async () => {
    const { user } = renderRoute('/teams/1/manage');
    const list = await screen.findByRole('list', { name: '팀 글과 댓글' });
    const editButtons = await within(list).findAllByRole('button', { name: /^수정: 댓글/ });
    await user.click(editButtons[0] as HTMLElement);
    const editor = await screen.findByRole('textbox', { name: '댓글 수정' });
    expect((editor as HTMLTextAreaElement).value.length).toBeGreaterThan(0);
    await user.clear(editor);
    await user.type(editor, '팀장이 고친 댓글이에요');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('저장했어요.')).toBeInTheDocument();
    expect(await within(list).findByText('팀장이 고친 댓글이에요')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '댓글 수정' })).not.toBeInTheDocument();
  });

  it('ACC-TM06-10 [팀 삭제] → 확인 문구 → /teams + 토스트, 글은 남는다', async () => {
    const { user, router } = renderRoute('/teams/1/manage');
    const danger = await waitFor(() => sectionOf('팀 나가기 · 삭제'));
    await user.click(within(danger).getByRole('button', { name: '팀 삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '팀을 삭제할까요?' });
    expect(within(dialog).getByText('팀을 삭제하면 되돌릴 수 없어요. 글은 남지만 팀 이름은 사라져요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '팀 삭제' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/teams'));
    expect(await screen.findByText('팀을 삭제했어요.')).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: '내 팀' });
    expect(within(list).queryByText('사이드 프로젝트 A팀')).not.toBeInTheDocument();
    expect(db.posts.some((p) => p.teamId === '1' && !p.deletedAt)).toBe(true);
  });

  it('ACC-TM06-12 팀장 혼자인 팀: 빈 상태 + [팀 나가기] → E-20 확인 → 삭제', async () => {
    db.teams.push({
      id: '50',
      name: '혼자 팀',
      description: null,
      isPublic: true,
      leaderId: '1',
      inviteCode: 'SOLO-TEAM',
      createdAt: '2026-09-30T10:00:00+09:00',
      deletedAt: null,
    });
    db.memberships.push({ teamId: '50', memberId: '1', role: 'LEADER', joinedAt: '2026-09-30T10:00:00+09:00' });
    const { user, router } = renderRoute('/teams/50/manage');
    expect(await screen.findByText('아직 팀원이 없어요. 초대코드를 알려주거나 아이디로 초대해 보세요.')).toBeInTheDocument();
    await user.click(within(sectionOf('팀 나가기 · 삭제')).getByRole('button', { name: '팀 나가기' }));
    const dialog = await screen.findByRole('dialog', { name: '혼자 있는 팀이에요.' });
    expect(within(dialog).getByText('나가면 팀이 삭제돼요. 삭제할까요?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '나가고 삭제' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams'));
    expect(await screen.findByText('팀을 삭제했어요.')).toBeInTheDocument();
    expect(db.teams.find((t) => t.id === '50')?.deletedAt).not.toBeNull();
  });
});
