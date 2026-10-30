import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from './Modal';

function Harness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>열기</button>
      <Modal
        open={open}
        title="규칙 보기"
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        footer={<button>확인</button>}
      >
        <input aria-label="이름" />
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('열리면 dialog · 첫 입력에 포커스 · 스크롤 잠금', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    const dialog = screen.getByRole('dialog', { name: '규칙 보기' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('textbox', { name: '이름' })).toHaveFocus();
    expect(document.body).toHaveClass('scroll-locked');
  });

  it('Esc로 닫고 연 버튼으로 포커스를 돌려준다', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: '열기' });
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
    expect(document.body).not.toHaveClass('scroll-locked');
  });

  it('Tab은 대화상자 안에서만 돈다', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    // 이름(첫 포커스) → 확인 → 닫기(처음으로)
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '확인' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: '확인' })).toHaveFocus();
  });

  it('닫기 버튼', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
