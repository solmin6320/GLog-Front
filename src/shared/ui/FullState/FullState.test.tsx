import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FullState } from './FullState';

function renderAt(ui: React.ReactNode, path = '/x') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>HOME</p>} />
        <Route path="/posts" element={<p>POSTS</p>} />
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('FullState', () => {
  it.each([
    ['forbidden', '이 페이지에 들어올 권한이 없어요.', '홈으로'],
    ['notFound', '찾는 내용이 없어요. 삭제됐을 수 있어요.', '뒤로'],
    ['server', '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.', '다시 시도'],
    ['network', '인터넷 연결을 확인해 주세요.', '다시 시도'],
    ['deleted', '삭제된 글이에요.', '목록으로'],
  ] as const)('%s 기본 문구와 버튼', (kind, title, action) => {
    renderAt(<FullState kind={kind} onRetry={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole(kind === 'forbidden' || kind === 'deleted' ? 'link' : 'button', { name: action })).toBeInTheDocument();
  });

  it('server [다시 시도] → onRetry', async () => {
    const onRetry = vi.fn();
    renderAt(<FullState kind="server" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('notFound [뒤로] — 히스토리가 없으면 홈으로', async () => {
    renderAt(<FullState kind="notFound" />);
    await userEvent.click(screen.getByRole('button', { name: '뒤로' }));
    expect(screen.getByText('HOME')).toBeInTheDocument();
  });

  it('deleted [목록으로] → 게시판', async () => {
    renderAt(<FullState kind="deleted" />);
    await userEvent.click(screen.getByRole('link', { name: '목록으로' }));
    expect(screen.getByText('POSTS')).toBeInTheDocument();
  });

  it('title · body · action으로 덮어쓴다', () => {
    renderAt(<FullState kind="forbidden" title="팀원만 볼 수 있어요." body="팀에 들어오면 볼 수 있어요." action={<button>팀 찾기</button>} />);
    expect(screen.getByRole('heading', { name: '팀원만 볼 수 있어요.' })).toBeInTheDocument();
    expect(screen.getByText('팀에 들어오면 볼 수 있어요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '팀 찾기' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '홈으로' })).toBeNull();
  });
});
