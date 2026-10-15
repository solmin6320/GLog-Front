import { screen, waitFor } from '@testing-library/react';
import { renderRoute } from './render';

// 하네스 자체 점검: 실제 라우트 트리 + 가드 + 세션(목 서버)이 한 번에 돈다.

describe('renderRoute', () => {
  it('비로그인(as: null)으로 / → /login', async () => {
    const { router } = renderRoute('/', { as: null });
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('member(기본)로 / → 헤더 검색이 있는 앱 화면', async () => {
    const { router } = renderRoute('/');
    expect(await screen.findByRole('search')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
  });

  it('없는 경로 → 헤더가 남은 404 본문', async () => {
    renderRoute('/no-such-page');
    expect(await screen.findByRole('heading', { name: '찾는 페이지가 없어요.' })).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('pending 페르소나로 / → /pending', async () => {
    const { router } = renderRoute('/', { as: 'pending' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/pending'));
  });
});
