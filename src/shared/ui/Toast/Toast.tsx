import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../cx';
import { Icon } from '../Icon';
import styles from './Toast.module.css';
import { type ToastApi, ToastContext } from './toastContext';

type Tone = 'success' | 'error' | 'info';
type Item = { id: number; tone: Tone; message: string };

const DURATION = 3000;
const MAX = 3;
const ICON = { success: 'check', error: 'alert', info: 'info' } as const;

/** 토스트 공급자. 알림 영역(aria-live)은 늘 그려 두고 내용만 바꾼다 — 그래야 스크린리더가 읽는다. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      nextId.current += 1;
      const id = nextId.current;
      // 같은 문구가 이미 떠 있으면 새로 띄우며 바꾼다(쌓이지 않게)
      setItems((xs) => [...xs.filter((x) => !(x.tone === tone && x.message === message)), { id, tone, message }].slice(-MAX));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DURATION),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className={styles.region} role="status" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className={cx(styles.toast, styles[t.tone])} data-tone={t.tone}>
              <Icon name={ICON[t.tone]} size={16} />
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
