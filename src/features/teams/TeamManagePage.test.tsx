import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { backend, backendError, type BackendCtx } from '@/test/backend';
import { comment, post } from '@/test/fixtures/posts';
import { findTeam, PEOPLE, postId, serveTeams, teamAs, teamWorld, type TeamWorld } from '@/test/fixtures/teams';
import { renderRoute } from '@/test/render';

let world: TeamWorld;
const me = (ctx: BackendCtx) => ctx.viewer!.id;
const teamOf = (id: unknown) => findTeam(world, id)!;

/** 팀 관리 화면이 부르는 백엔드 뮤테이션 (team.graphqls 규칙) */
function serveManageMutations() {
  backend
    .on('inviteToTeam', ({ teamId, githubLogin }) => {
      const invitee = Object.values(PEOPLE).find((p) => p.githubLogin === githubLogin);
      if (!invitee) throw backendError('INVITEE_NOT_FOUND');
      const t = teamOf(teamId);
      if (t.memberIds.includes(invitee.id)) throw backendError('INVITEE_ALREADY_MEMBER');
      const sent = { id: '99', inviteeId: invitee.id, createdAt: '2026-10-01T10:00:00+09:00' };
      t.sent = [sent, ...(t.sent ?? [])];
      return { id: sent.id, createdAt: sent.createdAt, invitee };
    })
    .on('cancelTeamInvitation', ({ invitationId }) => {
      for (const t of world.teams) t.sent = (t.sent ?? []).filter((x) => x.id !== String(invitationId));
      return true;
    })
    .on('kickTeamMember', ({ teamId, memberId }) => {
      const t = teamOf(teamId);
      t.memberIds = t.memberIds.filter((id) => id !== String(memberId));
      return true;
    })
    .on('transferTeamLeadership', ({ teamId, newLeaderId }, ctx) => {
      teamOf(teamId).leaderId = String(newLeaderId);
      return teamAs(world, teamId, ctx);
    })
    .on('updateTeam', ({ teamId, input }, ctx) => {
      teamOf(teamId).isPublic = (input as { isPublic: boolean }).isPublic;
      return teamAs(world, teamId, ctx);
    })
    .on('deleteTeam', ({ teamId }) => {
      world.teams = world.teams.filter((t) => t.id !== String(teamId));
      return true;
    })
    .on('leaveTeam', ({ teamId }, ctx) => {
      const t = teamOf(teamId);
      if (t.leaderId === me(ctx)) throw backendError(t.memberIds.length > 1 ? 'LEADER_MUST_TRANSFER' : 'LEADER_LAST_MEMBER');
      t.memberIds = t.memberIds.filter((id) => id !== me(ctx));
      return true;
    });
}

/** 팀장이 남의 댓글을 고치는 흐름: 원문은 post(id).comments, 저장은 updateComment */
function serveCommentEdit() {
  const comments = { '31': comment(31, postId(1), '3', '2026-10-01 09:00', '파이프라인 캐시도 같이 정리하면 좋겠어요') };
  backend
    .on('post', ({ id }) => ({
      ...post({ id: String(id), type: 'DEVLOG', title: '배포 파이프라인 정리', author: '2', team: '1', at: '2026-10-01 08:30', tags: [], body: ['한 일', '배운 점'], commentCount: 1 }),
      comments: { items: Object.values(comments).filter((c) => c.postId === String(id)), nextCursor: null },
    }))
    .on('updateComment', ({ id, content }) => {
      const c = comments[String(id) as '31'];
      c.content = String(content);
      // 화면 목록은 teamComments로 다시 읽는다
      const fx = teamOf('1').comments?.find((x) => x.id === String(id));
      if (fx) fx.content = String(content);
      return { ...c, updatedAt: '2026-10-01T10:00:00' };
    });
}

beforeEach(() => {
  world = teamWorld();
  serveTeams(world);
  serveManageMutations();
  serveCommentEdit();
});

const sectionOf = (name: string) => screen.getByRole('heading', { name }).closest('section') as HTMLElement;

describe('TM-06 팀 관리', () => {
  it('ACC-TM06-01 팀원(비팀장) · 관리자(비소속)는 403', async () => {
    renderRoute('/teams/1/manage', { as: 'plain', bridge: true });
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
  });

  it('ACC-TM06-01 관리자도 소속 아닌 팀 관리는 403', async () => {
    renderRoute('/teams/3/manage', { bridge: true });
    expect(await screen.findByText('이 페이지에 들어올 권한이 없어요.')).toBeInTheDocument();
  });

  it('ACC-TM06-02 · 03 · 11 W-10 순서 · 초대코드 · 본인 행에는 버튼 없음 · 나가기 안내 (미결 문구 없음)', async () => {
    const { user } = renderRoute('/teams/1/manage', { bridge: true });
    expect(await screen.findByRole('heading', { level: 1, name: '팀 관리' })).toBeInTheDocument();
    await screen.findByRole('heading', { name: '초대코드' });
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['초대코드', '아이디로 초대', '팀원', '공개 설정', '팀 글 관리', '팀 나가기 · 삭제']);

    expect(screen.getByTestId('invite-code')).toHaveTextContent('JD7K-Q2MA');
    expect(screen.getByText('코드는 바뀌지 않아요. 팀원에게 이 코드를 알려 주세요.')).toBeInTheDocument();
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

  // ACC-TM06-03(초대코드 null → ① 숨김)은 지웠다: 서버 teamInviteCode는 팀장에게 늘 코드를 준다(String!).
  // 팀장이 아니면 FORBIDDEN이고 그 경우는 가드가 403으로 막는다(ACC-TM06-01).

  it('ACC-TM06-04 아이디 초대: 가입 안 함(E-15) · 이미 팀원(E-16) · 성공 시 입력칸 비우고 ③에 대기 중', async () => {
    const { user } = renderRoute('/teams/1/manage', { bridge: true });
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
    const { user } = renderRoute('/teams/1/manage', { bridge: true });
    await user.click(await screen.findByRole('button', { name: '취소: @seoyeon-lee 초대' }));
    expect(await screen.findByText('초대를 취소했어요.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('list', { name: '보낸 초대' })).not.toBeInTheDocument());
  });

  it('ACC-TM06-06 [추방] → 확인 문구 · 취소면 그대로 · 확정하면 행 제거 + 토스트 + 경고 삭제 표시', async () => {
    const { user } = renderRoute('/teams/1/manage', { bridge: true });
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
    // 경고 카테고리 삭제 표시는 서버가 한다 — 화면은 kickTeamMember만 부른다
    expect(backend.calls('kickTeamMember')[0]?.args).toEqual({ teamId: '1', memberId: '3' });
  });

  it('ACC-TM06-07 [팀장 넘기기] → 확인 → TM-05로(replace) · manage는 403 · TM-05에 [팀 나가기]', async () => {
    const { user, router } = renderRoute('/teams/1/manage', { bridge: true });
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
    const { user, router } = renderRoute('/teams/1/manage', { bridge: true });
    const toggle = await screen.findByRole('switch', { name: '공개' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    expect(await screen.findByText('공개 설정을 바꿨어요.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '공개' })).toHaveAttribute('aria-checked', 'false');
    expect(backend.calls('updateTeam')[0]?.args).toEqual({ teamId: '1', input: { isPublic: false } });

    await router.navigate('/teams/1');
    expect(await screen.findByRole('heading', { level: 1, name: '사이드 프로젝트 A팀' })).toBeInTheDocument();
    expect(screen.getByText('비공개')).toBeInTheDocument();
  });

  it('ACC-TM06-09 팀 글 관리: 행마다 [수정]만 · 삭제 버튼 없음 · 안내 · 글 [수정] → 글 수정 화면', async () => {
    renderRoute('/teams/1/manage', { bridge: true });
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
    const { user } = renderRoute('/teams/1/manage', { bridge: true });
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
    const { user, router } = renderRoute('/teams/1/manage', { bridge: true });
    const danger = await waitFor(() => sectionOf('팀 나가기 · 삭제'));
    await user.click(within(danger).getByRole('button', { name: '팀 삭제' }));
    const dialog = await screen.findByRole('dialog', { name: '팀을 삭제할까요?' });
    expect(within(dialog).getByText('팀을 삭제하면 되돌릴 수 없어요. 글은 남지만 팀 이름은 사라져요.')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '팀 삭제' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/teams'));
    expect(await screen.findByText('팀을 삭제했어요.')).toBeInTheDocument();
    const list = await screen.findByRole('list', { name: '내 팀' });
    expect(within(list).queryByText('사이드 프로젝트 A팀')).not.toBeInTheDocument();
    // 글이 남는 것은 서버 규칙(team.graphqls deleteTeam) — 화면은 deleteTeam만 부른다
    expect(backend.calls('deleteTeam')[0]?.args).toEqual({ teamId: '1' });
  });

  it('ACC-TM06-12 팀장 혼자인 팀: 빈 상태 + [팀 나가기] → E-20 확인 → 삭제', async () => {
    world.teams.push({ id: '50', name: '혼자 팀', isPublic: true, leaderId: '1', memberIds: ['1'], inviteCode: 'SOLO-TEAM' });
    const { user, router } = renderRoute('/teams/50/manage', { bridge: true });
    expect(await screen.findByText('아직 팀원이 없어요. 초대코드를 알려주거나 아이디로 초대해 보세요.')).toBeInTheDocument();
    await user.click(within(sectionOf('팀 나가기 · 삭제')).getByRole('button', { name: '팀 나가기' }));
    const dialog = await screen.findByRole('dialog', { name: '혼자 있는 팀이에요.' });
    expect(within(dialog).getByText('나가면 팀이 삭제돼요. 삭제할까요?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '나가고 삭제' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/teams'));
    expect(await screen.findByText('팀을 삭제했어요.')).toBeInTheDocument();
    expect(backend.calls('deleteTeam').some((c) => c.args.teamId === '50')).toBe(true);
  });
});
