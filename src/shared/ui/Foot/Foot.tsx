import type { ReactNode } from 'react';
import styles from './Foot.module.css';

/** 표 · 목록 아래 각주 */
export function Foot({ children }: { children: ReactNode }) {
  return <p className={styles.foot}>{children}</p>;
}
