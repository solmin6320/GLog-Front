import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryBoundary } from './QueryBoundary';

// errors.ts는 데이터 담당 모듈 — 여기서는 계약(AppError 그대로 통과)만 흉내 낸다
vi.mock('@/shared/api/errors', () => ({
  normalizeError: (e: unknown) => e,
}));

type D = { name: string };
const renderQB = (p: { loading: boolean; error?: unknown; data: D | null | undefined; onRetry?: () => void; skeleton?: React.ReactNode }) =>
  render(
    <MemoryRouter>
      <QueryBoundary<D> {...p}>{(d) => <p>hello {d.name}</p>}</QueryBoundary>
    </MemoryRouter>,
  );

describe('QueryBoundary', () => {
  it('데이터가 있으면 다시 불러오는 중이어도 children', () => {
    renderQB({ loading: true, data: { name: 'A' } });
    expect(screen.getByText('hello A')).toBeInTheDocument();
  });

  it('데이터 없이 loading → 기본 스켈레톤', () => {
    renderQB({ loading: true, data: undefined });
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중이에요.');
  });

  it('skeleton을 주면 그것을 그린다', () => {
    renderQB({ loading: true, data: undefined, skeleton: <p>loading…</p> });
    expect(screen.getByText('loading…')).toBeInTheDocument();
  });

  it.each([
    [{ code: 'FORBIDDEN', category: 'forbidden' }, '이 페이지에 들어올 권한이 없어요.'],
    [{ code: 'NOT_FOUND', category: 'notFound' }, '찾는 내용이 없어요. 삭제됐을 수 있어요.'],
    [{ code: 'NETWORK', category: 'network' }, '인터넷 연결을 확인해 주세요.'],
    [{ code: 'INTERNAL', category: 'server' }, '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.'],
    [{ code: 'POST_DELETED', category: 'notFound' }, '삭제된 글이에요.'],
  ])('오류 %o → FullState', (error, title) => {
    renderQB({ loading: false, error, data: undefined, onRetry: () => {} });
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('데이터 null · 오류 없음 → notFound', () => {
    renderQB({ loading: false, data: null });
    expect(screen.getByRole('heading', { name: '찾는 내용이 없어요. 삭제됐을 수 있어요.' })).toBeInTheDocument();
  });
});
