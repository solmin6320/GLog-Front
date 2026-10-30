import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadMore } from './LoadMore';

describe('LoadMore', () => {
  it('더 있으면 [더 보기]', async () => {
    const onLoadMore = vi.fn();
    render(<LoadMore hasMore loading={false} onLoadMore={onLoadMore} />);
    await userEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('불러오는 중엔 버튼을 막고 라벨은 그대로', () => {
    render(<LoadMore hasMore loading onLoadMore={() => {}} />);
    const btn = screen.getByRole('button', { name: '더 보기' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
  });

  it('오류 → 문구 + [다시 시도]', async () => {
    const onLoadMore = vi.fn();
    render(<LoadMore hasMore loading={false} error onLoadMore={onLoadMore} />);
    expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했어요.');
    expect(screen.queryByRole('button', { name: '더 보기' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('끝 → 기본 문구', () => {
    render(<LoadMore hasMore={false} loading={false} onLoadMore={() => {}} />);
    expect(screen.getByText('여기까지예요.')).toBeInTheDocument();
  });

  it('끝 → endText', () => {
    render(<LoadMore hasMore={false} loading={false} onLoadMore={() => {}} endText="모든 글을 봤어요." />);
    expect(screen.getByText('모든 글을 봤어요.')).toBeInTheDocument();
  });

  it('endText=null이면 아무것도 안 그린다', () => {
    const { container } = render(<LoadMore hasMore={false} loading={false} onLoadMore={() => {}} endText={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
