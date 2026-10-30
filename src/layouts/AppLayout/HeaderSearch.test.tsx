import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { HeaderSearch } from './HeaderSearch';

// 헤더 검색 단독 테스트 — 전체 앱(세션 · Apollo · 목) 없이 메모리 라우터의 자리표시 경로만 쓴다.

function Shell() {
  return (
    <>
      <header>
        <HeaderSearch />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}

function setup(path = '/') {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [
          { path: '/', element: <textarea aria-label="본문" /> },
          { path: '/posts', element: <p>게시판</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  const user = userEvent.setup();
  render(<RouterProvider router={router} />);
  const url = () => `${router.state.location.pathname}${router.state.location.search}`;
  return { user, router, url };
}

const trigger = () => screen.getByRole('button', { name: /를 눌러 글 검색/ });
const combobox = () => screen.getByRole('combobox', { name: '글 검색' });
const options = () => screen.getAllByRole('option');
const selected = () => screen.getByRole('option', { selected: true });

async function openAndType(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(trigger());
  await user.type(combobox(), text);
}

describe('HeaderSearch — 열기 · 닫기', () => {
  it('닫힘: "/ 를 눌러 글 검색" 검색창, 콤보박스 없음 (W-02)', () => {
    setup();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-keyshortcuts', '/');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('ACC-HS-01 본문에서 / → 열리고 입력칸에 /가 들어가지 않는다', async () => {
    const { user } = setup();
    await user.keyboard('/');
    expect(combobox()).toHaveFocus();
    expect(combobox()).toHaveValue('');
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('클릭으로 열면 빈 입력: 제안 목록 없이 안내 줄만', async () => {
    const { user } = setup();
    await user.click(trigger());
    expect(combobox()).toHaveFocus();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('제목 · 내용 · 태그를 찾아요. 팀과 회원은 찾지 않아요.')).toBeInTheDocument();
    expect(screen.getByText('이동')).toBeInTheDocument();
  });

  it('좁은 화면용 돋보기 버튼으로도 열린다 (ACC-HS-15)', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: '글 검색' }));
    expect(combobox()).toHaveFocus();
  });

  it('ACC-HS-02 textarea에 포커스가 있으면 / 가 글자로 들어간다', async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText('본문'));
    await user.keyboard('/');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByLabelText('본문')).toHaveValue('/');
  });

  it('ACC-HS-02 열린 모달이 있으면 / 를 가로채지 않는다', async () => {
    const { user } = setup();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    await user.keyboard('/');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    dialog.remove();
  });

  it('ACC-HS-03 한글 조합 중이면 가로채지 않는다', () => {
    setup();
    fireEvent.keyDown(document.body, { key: '/', isComposing: true });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('ACC-HS-10 Esc → 닫히고 입력이 비워지며 검색창으로 포커스가 돌아온다', async () => {
    const { user } = setup();
    await openAndType(user, 'Redis');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    await user.click(trigger());
    expect(combobox()).toHaveValue('');
  });

  it('ACC-HS-10 바깥 클릭 → 닫힌다', async () => {
    const { user, url } = setup();
    await openAndType(user, 'Redis');
    await user.click(screen.getByLabelText('본문'));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(url()).toBe('/');
  });

  it('포커스가 검색 영역 밖으로 나가면 닫힌다 (Tab)', async () => {
    const { user } = setup();
    await openAndType(user, 'Redis');
    act(() => screen.getByLabelText('본문').focus());
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('닫기 버튼(좁은 화면) → 닫힌다', async () => {
    const { user } = setup();
    await openAndType(user, 'Redis');
    await user.click(screen.getByRole('button', { name: '검색 닫기' }));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('HeaderSearch — 제안 · 이동', () => {
  it('ACC-HS-05 "Redis" → 제안 3줄, ⓐ 기본 선택 · ARIA combobox', async () => {
    const { user } = setup();
    await openAndType(user, 'Redis');

    const box = combobox();
    const listbox = screen.getByRole('listbox', { name: '검색 제안' });
    expect(box).toHaveAttribute('aria-expanded', 'true');
    expect(box).toHaveAttribute('aria-controls', listbox.id);
    expect(box).toHaveAttribute('aria-autocomplete', 'list');

    expect(options().map((o) => o.getAttribute('aria-label'))).toEqual([
      'Redis 트러블슈팅에서 검색',
      'Redis 개발일지에서 검색',
      '#Redis 태그 글 모아보기',
    ]);
    expect(within(screen.getByRole('group', { name: '게시판에서 찾기' })).getAllByRole('option')).toHaveLength(2);
    expect(within(screen.getByRole('group', { name: '태그' })).getAllByRole('option')).toHaveLength(1);

    expect(selected()).toHaveAccessibleName('Redis 트러블슈팅에서 검색');
    expect(box).toHaveAttribute('aria-activedescendant', selected().id);
    expect(box).toHaveFocus();
  });

  it('ACC-HS-07 Enter → /posts?type=troubleshooting&q=Redis, 닫힌다', async () => {
    const { user, url } = setup();
    await openAndType(user, 'Redis');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(url()).toBe('/posts?type=troubleshooting&q=Redis'));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByText('게시판')).toBeInTheDocument();
  });

  it('ACC-HS-08 ↓ ↓ Enter → /posts?tag=Redis', async () => {
    const { user, url } = setup();
    await openAndType(user, 'Redis');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(selected()).toHaveAccessibleName('#Redis 태그 글 모아보기');
    expect(combobox()).toHaveAttribute('aria-activedescendant', selected().id);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(url()).toBe('/posts?tag=Redis'));
  });

  it('↓ Enter → 개발일지, ↑는 처음에서 끝으로 돈다', async () => {
    const { user, url } = setup();
    await openAndType(user, 'Redis');
    await user.keyboard('{ArrowUp}');
    expect(selected()).toHaveAccessibleName('#Redis 태그 글 모아보기');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(selected()).toHaveAccessibleName('Redis 개발일지에서 검색');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(url()).toBe('/posts?type=devlog&q=Redis'));
  });

  it('ACC-HS-09 BD-01 개발일지 탭을 보던 중이면 ⓑ가 기본 선택', async () => {
    const { user, url } = setup('/posts?type=devlog');
    await user.keyboard('/');
    await user.type(combobox(), 'Redis');
    expect(selected()).toHaveAccessibleName('Redis 개발일지에서 검색');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(url()).toBe('/posts?type=devlog&q=Redis'));
  });

  it('제안 줄을 누르면 그 경로로 간다 · 마우스를 올리면 선택이 옮겨진다', async () => {
    const { user, url } = setup();
    await openAndType(user, 'Redis');
    const tag = screen.getByRole('option', { name: '#Redis 태그 글 모아보기' });
    await user.hover(tag);
    expect(tag).toHaveAttribute('aria-selected', 'true');
    await user.click(tag);
    await waitFor(() => expect(url()).toBe('/posts?tag=Redis'));
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('ACC-HS-12 앞뒤 공백 제거 / 공백만이면 무동작', async () => {
    const { user, url } = setup();
    await openAndType(user, '   ');
    await user.keyboard('{Enter}');
    expect(url()).toBe('/');
    expect(combobox()).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('');

    await user.type(combobox(), 'Redis  ');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(url()).toBe('/posts?type=troubleshooting&q=Redis'));
  });

  it('ACC-HS-13 "C++ 에러" → q가 인코딩되고 원문으로 복원된다', async () => {
    const { user, router } = setup();
    await openAndType(user, 'C++ 에러');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/posts'));
    expect(router.state.location.search).not.toContain(' ');
    expect(new URLSearchParams(router.state.location.search).get('q')).toBe('C++ 에러');
  });

  it('검색어가 #으로 시작하면 태그 줄은 #을 떼고 모은다', async () => {
    const { user, url } = setup();
    await openAndType(user, '#Redis');
    expect(screen.getByRole('option', { name: '#Redis 태그 글 모아보기' })).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await waitFor(() => expect(url()).toBe('/posts?tag=Redis'));
  });

  it('태그 규칙(20자)을 넘는 검색어면 태그 줄을 뺀다', async () => {
    const { user } = setup();
    await openAndType(user, 'a'.repeat(21));
    expect(options()).toHaveLength(2);
    expect(screen.queryByRole('group', { name: '태그' })).not.toBeInTheDocument();
  });
});

describe('HeaderSearch — 검증 · 네트워크', () => {
  it('ACC-HS-04 1자 → 제안 대신 "2자 이상 입력해 주세요.", Enter 무동작', async () => {
    const { user, url } = setup();
    await openAndType(user, 'R');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('2자 이상 입력해 주세요.');
    expect(combobox()).toHaveAccessibleDescription(expect.stringContaining('2자 이상 입력해 주세요.'));
    await user.keyboard('{Enter}');
    expect(url()).toBe('/');
    expect(combobox()).toHaveValue('R');
  });

  it('ACC-HS-11 50자에서 입력이 막히고 안내가 나온다', async () => {
    const { user } = setup();
    await openAndType(user, 'a'.repeat(51));
    expect(combobox()).toHaveAttribute('maxLength', '50');
    expect(combobox()).toHaveValue('a'.repeat(50));
    expect(screen.getByRole('status')).toHaveTextContent('검색어는 50자까지 쓸 수 있어요.');
    expect(options()).toHaveLength(2);
  });

  it('ACC-HS-06 입력하는 동안 네트워크 요청 0건', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { user } = setup();
    await openAndType(user, 'Redis 캐시');
    await user.keyboard('{ArrowDown}{ArrowUp}');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
