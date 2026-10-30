import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { isEditableTarget, isModalOpen, useHotkey } from './useHotkey';

function Harness({ allowInInputs, onKey }: { allowInInputs?: boolean; onKey: (e: KeyboardEvent) => void }) {
  const [count, setCount] = useState(0);
  useHotkey(
    '/',
    (e) => {
      e.preventDefault();
      setCount((c) => c + 1);
      onKey(e);
    },
    { allowInInputs },
  );
  return (
    <div>
      <output aria-label="횟수">{count}</output>
      <input aria-label="입력칸" />
      <textarea aria-label="본문" />
      <select aria-label="선택">
        <option>하나</option>
      </select>
      <div aria-label="편집기" role="textbox" contentEditable suppressContentEditableWarning tabIndex={0}>
        <span>안쪽</span>
      </div>
      <button type="button">버튼</button>
    </div>
  );
}

function setup(opts: { allowInInputs?: boolean } = {}) {
  const onKey = vi.fn();
  const user = userEvent.setup();
  render(<Harness onKey={onKey} allowInInputs={opts.allowInInputs} />);
  return { onKey, user, count: () => screen.getByLabelText('횟수').textContent };
}

describe('useHotkey', () => {
  it('본문(body)에서 / → handler (ACC-HS-01)', async () => {
    const { onKey, user, count } = setup();
    await user.keyboard('/');
    expect(onKey).toHaveBeenCalledTimes(1);
    expect(count()).toBe('1');
  });

  it('버튼에 포커스가 있어도 동작한다', async () => {
    const { onKey, user } = setup();
    await user.click(screen.getByRole('button', { name: '버튼' }));
    await user.keyboard('/');
    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it('다른 키는 무시', async () => {
    const { onKey, user } = setup();
    await user.keyboard('a?');
    expect(onKey).not.toHaveBeenCalled();
  });

  it('input · textarea · select에서는 가로채지 않고 글자가 들어간다 (E-62 · ACC-HS-02)', async () => {
    const { onKey, user } = setup();
    await user.click(screen.getByLabelText('입력칸'));
    await user.keyboard('a/b');
    expect(screen.getByLabelText('입력칸')).toHaveValue('a/b');

    await user.click(screen.getByLabelText('본문'));
    await user.keyboard('/');
    expect(screen.getByLabelText('본문')).toHaveValue('/');

    fireEvent.keyDown(screen.getByLabelText('선택'), { key: '/' });
    expect(onKey).not.toHaveBeenCalled();
  });

  it('contenteditable 안(자식 요소 포함)에서는 가로채지 않는다', () => {
    const { onKey } = setup();
    fireEvent.keyDown(screen.getByRole('textbox', { name: '편집기' }), { key: '/' });
    fireEvent.keyDown(screen.getByText('안쪽'), { key: '/' });
    expect(onKey).not.toHaveBeenCalled();
  });

  it('allowInInputs면 입력칸에서도 동작한다', () => {
    const { onKey } = setup({ allowInInputs: true });
    fireEvent.keyDown(screen.getByLabelText('입력칸'), { key: '/' });
    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it('한글 조합 중(isComposing · keyCode 229)이면 무시 (ACC-HS-03)', () => {
    const { onKey } = setup();
    fireEvent.keyDown(document.body, { key: '/', isComposing: true });
    fireEvent.keyDown(document.body, { key: '/', keyCode: 229 });
    expect(onKey).not.toHaveBeenCalled();
  });

  it('Ctrl · Meta · Alt 조합은 무시', () => {
    const { onKey } = setup();
    fireEvent.keyDown(document.body, { key: '/', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: '/', metaKey: true });
    fireEvent.keyDown(document.body, { key: '/', altKey: true });
    expect(onKey).not.toHaveBeenCalled();
  });

  it('열린 모달(role=dialog)이 있으면 무시, 숨겨진 dialog는 상관없다', () => {
    const { onKey } = setup();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    fireEvent.keyDown(document.body, { key: '/' });
    expect(onKey).not.toHaveBeenCalled();

    dialog.hidden = true;
    fireEvent.keyDown(document.body, { key: '/' });
    expect(onKey).toHaveBeenCalledTimes(1);
    dialog.remove();
  });

  it('언마운트하면 리스너를 뗀다', () => {
    const onKey = vi.fn();
    const { unmount } = render(<Harness onKey={onKey} />);
    unmount();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(onKey).not.toHaveBeenCalled();
  });
});

describe('isEditableTarget · isModalOpen', () => {
  it('요소 판별', () => {
    const input = document.createElement('input');
    const div = document.createElement('div');
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(div)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget(window)).toBe(false);
    div.setAttribute('contenteditable', 'false');
    expect(isEditableTarget(div)).toBe(false);
    div.setAttribute('contenteditable', '');
    expect(isEditableTarget(div)).toBe(true);
  });

  it('dialog[open] · aria-modal도 모달로 본다', () => {
    expect(isModalOpen()).toBe(false);
    const d = document.createElement('dialog');
    d.setAttribute('open', '');
    document.body.appendChild(d);
    expect(isModalOpen()).toBe(true);
    d.remove();
    const m = document.createElement('section');
    m.setAttribute('aria-modal', 'true');
    document.body.appendChild(m);
    expect(isModalOpen()).toBe(true);
    m.remove();
  });
});
