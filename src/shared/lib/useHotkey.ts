/**
 * 전역 단축키 (설계서 7-2 · E-62 · ACC-HS-01 ~ 03).
 * 다음일 때는 가로채지 않는다 — 글자가 그대로 입력되게 둔다.
 * - 포커스가 input · textarea · select · contenteditable 안 (allowInInputs로 끌 수 있다)
 * - 열린 모달 · 드로어(`role=dialog` · `role=alertdialog` · `dialog[open]` · `aria-modal=true`)가 있다
 * - 한글 조합 중(`isComposing`, Safari는 keyCode 229)
 * - Ctrl · Meta · Alt 조합, 이미 다른 곳에서 처리한 이벤트(defaultPrevented)
 */
import { useEffect, useEffectEvent } from 'react';

export type HotkeyOptions = { allowInInputs?: boolean };

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
const MODAL_SELECTOR = '[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]';

/** 포커스된 요소가 글자를 받는 곳인가 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.closest(EDITABLE_SELECTOR) !== null;
}

/** 화면에 열린 모달이 있는가 (숨김 처리된 것은 뺀다) */
export function isModalOpen(doc: Document = document): boolean {
  return Array.from(doc.querySelectorAll(MODAL_SELECTOR)).some(
    (el) => el.closest('[hidden], [aria-hidden="true"], [inert]') === null,
  );
}

/** IME 조합 중인가 (조합 중 키는 keyCode 229로 오기도 한다) */
export function isComposingEvent(e: KeyboardEvent): boolean {
  return e.isComposing || e.keyCode === 229;
}

export function shouldIgnoreHotkey(e: KeyboardEvent, opts: HotkeyOptions = {}): boolean {
  if (e.defaultPrevented) return true;
  if (isComposingEvent(e)) return true;
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  if (!opts.allowInInputs && isEditableTarget(e.target)) return true;
  if (isModalOpen(e.target instanceof Node ? (e.target.ownerDocument ?? document) : document)) return true;
  return false;
}

/**
 * `useHotkey('/', (e) => { e.preventDefault(); open(); })`.
 * key는 `KeyboardEvent.key`와 같은 값으로 비교한다. handler는 항상 최신 것을 부른다.
 */
export function useHotkey(key: string, handler: (e: KeyboardEvent) => void, opts?: HotkeyOptions): void {
  const allowInInputs = opts?.allowInInputs ?? false;
  const onHotkey = useEffectEvent(handler);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key !== key) return;
      if (shouldIgnoreHotkey(e, { allowInInputs })) return;
      onHotkey(e);
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, allowInInputs]);
}
