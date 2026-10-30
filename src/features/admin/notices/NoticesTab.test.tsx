import { screen, waitFor, within } from '@testing-library/react';
import { backend } from '@/test/backend';
import { adminBaseline, installAdminMembers, installNotices } from '@/test/fixtures/admin';
import { renderRoute } from '@/test/render';

const RULES = '잔디 인정 규칙 안내';
const MEETING = '10월 정기 모임은 10/8(목) 저녁 7시예요';

/** 표 본문 행의 제목 링크 글자, 위에서부터 */
function titles(): string[] {
  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
  return rows.map((r) => within(r).getAllByRole('link')[0]?.textContent ?? '');
}

describe('AD-01 ②-4 공지 관리 탭', () => {
  beforeEach(() => {
    adminBaseline();
    installNotices();
  });

  it('ACC-ADM-03 목록: 고정 공지가 맨 위, 그 아래 최신순 · 잔디 인정 규칙 공지는 [삭제] 대신 이유', async () => {
    renderRoute('/admin/notices', { bridge: true });
    expect(await screen.findByRole('heading', { level: 2, name: '공지 관리' })).toBeInTheDocument();
    await screen.findByRole('table');
    expect(titles()).toEqual([
      RULES,
      MEETING,
      '2학기 스터디 팀 모집',
      '추석 연휴에도 판정은 그대로 진행돼요',
      'GitHub 비공개 기여 설정 확인해 주세요',
      '잔디로그 정식 오픈',
    ]);
    expect(screen.getByRole('button', { name: `${RULES} 고정`, pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: `${RULES} 삭제` })).not.toBeInTheDocument();
    expect(screen.getByText('이 공지는 판정 기준 안내라 삭제할 수 없어요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${MEETING} 삭제` })).toBeInTheDocument();
  });

  it('ACC-ADM-03 [공지 작성] → 목록 자리에 에디터 · 빈 값은 인라인 오류 · 저장하면 목록으로 + "저장했어요."', async () => {
    const { user, router } = renderRoute('/admin/notices', { bridge: true });
    await user.click(await screen.findByRole('button', { name: '공지 작성' }));
    await waitFor(() => expect(router.state.location.search).toBe('?editor=new'));
    expect(await screen.findByRole('heading', { name: '공지 작성' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('제목을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('본문을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveFocus();

    await user.type(screen.getByRole('textbox', { name: /제목/ }), '동아리 MT 안내');
    await user.type(screen.getByRole('textbox', { name: /본문/ }), '10/17(토)에 출발해요.{Enter}준비물은 따로 알려 드려요.');
    await user.click(screen.getByRole('switch', { name: '상단 고정' }));
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장했어요.')).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.search).toBe(''));
    await screen.findByRole('table');
    expect(titles()[0]).toBe('동아리 MT 안내');
    expect(backend.calls('createNotice').map((c) => c.args)).toEqual([
      { input: { title: '동아리 MT 안내', content: '10/17(토)에 출발해요.\n준비물은 따로 알려 드려요.', isPinned: true } },
    ]);
  });

  it('[수정] → 내용이 채워진 에디터 · 저장하면 목록에 바뀐 제목', async () => {
    const { user, router } = renderRoute('/admin/notices', { bridge: true });
    await user.click(await screen.findByRole('button', { name: '추석 연휴에도 판정은 그대로 진행돼요 수정' }));
    await waitFor(() => expect(router.state.location.search).toBe('?editor=4'));
    const title = await screen.findByRole('textbox', { name: /제목/ });
    expect(title).toHaveValue('추석 연휴에도 판정은 그대로 진행돼요');
    expect(screen.getByRole('textbox', { name: /본문/ })).toHaveValue(
      '연휴 주간(9/21 ~ 9/27)도 평소처럼 판정해요.\n사정이 있으면 팀장에게 개인 면제를 요청해 주세요.',
    );

    await user.clear(title);
    await user.type(title, '추석 연휴 판정 안내');
    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('저장했어요.')).toBeInTheDocument();
    await screen.findByRole('table');
    expect(titles()).toContain('추석 연휴 판정 안내');
    expect(titles()).not.toContain('추석 연휴에도 판정은 그대로 진행돼요');
    expect(backend.calls('updateNotice')[0]?.args).toMatchObject({ id: '4', input: { title: '추석 연휴 판정 안내', isPinned: false } });
  });

  it('쓰던 내용이 있으면 [취소] 전에 묻는다 — [계속 쓰기]는 남고 [나가기]는 목록으로 · 고치지 않았으면 바로 나간다', async () => {
    // [나가기]로 회원 탭(활성 회원 명단)까지 간다
    installAdminMembers();
    const { user, router } = renderRoute('/admin/notices?editor=new', { bridge: true });
    await user.click(await screen.findByRole('button', { name: '취소' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));

    await user.click(await screen.findByRole('button', { name: '공지 작성' }));
    await user.type(await screen.findByRole('textbox', { name: /제목/ }), '임시');
    await user.click(screen.getByRole('button', { name: '취소' }));
    const dialog = await screen.findByRole('dialog', { name: '쓰던 공지가 사라져요. 나갈까요?' });
    await user.click(within(dialog).getByRole('button', { name: '계속 쓰기' }));
    expect(router.state.location.search).toBe('?editor=new');
    expect(screen.getByRole('textbox', { name: /제목/ })).toHaveValue('임시');

    await user.click(screen.getByRole('link', { name: /회원 · 관리자 권한/ }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '나가기' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/members'));
  });

  it('ACC-ADM-03 [고정] 토글: 즉시 맨 위로 · 해제는 확인을 거친다', async () => {
    const { user } = renderRoute('/admin/notices', { bridge: true });
    await user.click(await screen.findByRole('button', { name: `${MEETING} 고정`, pressed: false }));
    await waitFor(() => expect(titles()[0]).toBe(MEETING));
    expect(screen.getByRole('button', { name: `${MEETING} 고정`, pressed: true })).toBeInTheDocument();
    expect(await screen.findByText('맨 위에 고정했어요.')).toBeInTheDocument();
    expect(backend.calls('setNoticePinned').map((c) => c.args)).toEqual([{ id: '6', isPinned: true }]);

    await user.click(screen.getByRole('button', { name: `${MEETING} 고정`, pressed: true }));
    await user.click(within(await screen.findByRole('dialog', { name: '고정을 해제할까요?' })).getByRole('button', { name: '해제' }));
    await waitFor(() => expect(titles()[0]).toBe(RULES));
    expect(await screen.findByText('고정을 해제했어요.')).toBeInTheDocument();
    expect(backend.calls('setNoticePinned').map((c) => c.args)).toEqual([
      { id: '6', isPinned: true },
      { id: '6', isPinned: false },
    ]);
  });

  it('[삭제] → 단순 확인형 → 행이 사라지고 "삭제했어요."', async () => {
    const { user } = renderRoute('/admin/notices', { bridge: true });
    const name = 'GitHub 비공개 기여 설정 확인해 주세요';
    await user.click(await screen.findByRole('button', { name: `${name} 삭제` }));
    await user.click(within(await screen.findByRole('dialog', { name: '공지를 삭제할까요?' })).getByRole('button', { name: '삭제' }));
    expect(await screen.findByText('삭제했어요.')).toBeInTheDocument();
    await waitFor(() => expect(titles()).not.toContain(name));
    expect(backend.calls('deleteNotice').map((c) => c.args)).toEqual([{ id: '3' }]);
  });

  it('없는 공지를 열면 찾을 수 없음 · 공지 0건이면 "등록된 공지가 없어요." + [공지 작성]', async () => {
    const first = renderRoute('/admin/notices?editor=999', { bridge: true });
    expect(await screen.findByText('찾는 내용이 없어요. 삭제됐을 수 있어요.')).toBeInTheDocument();
    first.unmount();

    installNotices([]);
    renderRoute('/admin/notices', { bridge: true });
    expect(await screen.findByText('등록된 공지가 없어요.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '공지 작성' })).toHaveLength(2);
  });
});
