import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider } from './Toast';
import { useToast } from './toastContext';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('저장했어요.')}>ok</button>
      <button onClick={() => toast.error('저장하지 못했어요.')}>bad</button>
    </>
  );
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('aria-live 영역에 띄우고 3초 뒤 사라진다', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    fireEvent.click(screen.getByRole('button', { name: 'ok' }));
    fireEvent.click(screen.getByRole('button', { name: 'bad' }));
    expect(region).toHaveTextContent('저장했어요.');
    expect(region).toHaveTextContent('저장하지 못했어요.');
    act(() => vi.advanceTimersByTime(2999));
    expect(region).toHaveTextContent('저장했어요.');
    act(() => vi.advanceTimersByTime(1));
    expect(region).toBeEmptyDOMElement();
  });

  it('같은 문구는 쌓지 않는다', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ok' }));
    fireEvent.click(screen.getByRole('button', { name: 'ok' }));
    expect(screen.getAllByText('저장했어요.')).toHaveLength(1);
  });
});
