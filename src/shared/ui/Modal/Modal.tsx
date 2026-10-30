import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../cx';
import { IconButton } from '../IconButton';
import { focusables } from './focusable';
import styles from './Modal.module.css';

/** 열린 대화상자 스택 — Esc는 맨 위 것만 닫는다 */
const stack: symbol[] = [];
let lockCount = 0;

/**
 * 공통 대화상자. body로 포털, role=dialog · aria-modal.
 * 열리면 본문 · 바닥의 첫 포커스 가능한 요소(없으면 닫기 버튼)에 포커스, Tab은 안에서만 돈다,
 * Esc · 바깥 클릭 · 닫기 버튼 → onClose, 닫히면 연 요소로 포커스 복귀, 뒤 화면 스크롤 잠금.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!open) return null;
  return (
    <ModalDialog onClose={onClose} title={title} footer={footer} size={size}>
      {children}
    </ModalDialog>
  );
}

function ModalDialog({
  onClose,
  title,
  children,
  footer,
  size,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size: 'sm' | 'md' | 'lg';
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const downOnOverlay = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // 첫 포커스 + 닫힐 때 포커스 복귀
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const target = focusables(contentRef.current)[0] ?? focusables(dialog)[0] ?? dialog;
    target?.focus();
    return () => {
      if (opener && opener !== document.body && opener.isConnected) opener.focus();
    };
  }, []);

  // Esc(맨 위 대화상자만) + 스크롤 잠금
  useEffect(() => {
    const token = Symbol('modal');
    stack.push(token);
    lockCount += 1;
    document.body.classList.add('scroll-locked');
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || stack[stack.length - 1] !== token) return;
      e.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.classList.remove('scroll-locked');
      }
    };
  }, []);

  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const items = focusables(dialogRef.current);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      e.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onOverlayDown = (e: MouseEvent<HTMLDivElement>) => {
    downOnOverlay.current = e.target === e.currentTarget;
  };
  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (downOnOverlay.current && e.target === e.currentTarget) onClose();
    downOnOverlay.current = false;
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={onOverlayDown} onClick={onOverlayClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(styles.dialog, styles[size])}
        onKeyDown={trapTab}
      >
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton label="닫기" icon="x" onClick={onClose} />
        </div>
        <div ref={contentRef} className={styles.content}>
          <div className={cx(styles.body, !footer && styles.noFooter)}>{children}</div>
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
