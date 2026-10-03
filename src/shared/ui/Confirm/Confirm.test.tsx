import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmProvider } from './Confirm';
import { useConfirm } from './confirmContext';

function Asker() {
  const confirm = useConfirm();
  const [result, setResult] = useState('none');
  return (
    <>
      <button
        onClick={async () => {
          const ok = await confirm({ title: '글을 지울까요?', body: '지운 글은 되돌릴 수 없어요.', confirmLabel: '지우기', tone: 'danger' });
          setResult(String(ok));
        }}
      >
        삭제
      </button>
      <output>{result}</output>
    </>
  );
}

const setup = () =>
  render(
    <ConfirmProvider>
      <Asker />
    </ConfirmProvider>,
  );

describe('useConfirm', () => {
  it('확인 → true', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByRole('dialog', { name: '글을 지울까요?' })).toBeInTheDocument();
    expect(screen.getByText('지운 글은 되돌릴 수 없어요.')).toBeInTheDocument();
    // 위험한 확인은 [취소]에 먼저 포커스
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: '지우기' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('true'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('취소 → false', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('false'));
  });

  it('Esc → false', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('false'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Provider 밖에서 쓰면 오류', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Asker />)).toThrow();
  });
});
