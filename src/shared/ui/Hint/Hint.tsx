import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Hint.module.css';

/** 입력 아래 도움말 · 오류 문구 */
export function Hint({ children, id, tone = 'mute' }: { children: ReactNode; id?: string; tone?: 'mute' | 'error' }) {
  return (
    <p id={id} className={cx(styles.hint, tone === 'error' && styles.error)}>
      {children}
    </p>
  );
}
