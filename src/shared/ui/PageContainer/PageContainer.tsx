import type { ReactNode } from 'react';
import { cx } from '../cx';
import styles from './PageContainer.module.css';

/** 본문 폭 700 · 960(기본) · 1120 — 콘텐츠 폭 기준이고 좌우 패딩 24(모바일 16)는 바깥에 더한다. */
export function PageContainer({ width = 'lg', children }: { width?: 'md' | 'lg' | 'xl'; children: ReactNode }) {
  return <div className={cx(styles.container, styles[width])}>{children}</div>;
}
