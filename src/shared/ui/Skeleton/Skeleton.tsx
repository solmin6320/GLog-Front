import type { ReactNode } from 'react';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './Skeleton.module.css';

const toCss = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);

/** 불러오는 동안의 회색 블록. 혼자서는 스크린리더에 안 읽힌다. */
export function Skeleton({ width = '100%', height = 14, radius }: { width?: number | string; height?: number | string; radius?: number }) {
  return (
    <span
      className={styles.sk}
      style={{ width: toCss(width), height: toCss(height), borderRadius: radius }}
      aria-hidden="true"
      data-skeleton=""
    />
  );
}

/** 프리셋 공통 — "불러오는 중이에요"를 한 번만 알린다 */
function Busy({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <VisuallyHidden>불러오는 중이에요.</VisuallyHidden>
      {children}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Busy className={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.listRow} aria-hidden="true">
          <Skeleton width={68} height={24} />
          <span className={styles.grow}>
            <Skeleton width={`${55 + ((i * 17) % 35)}%`} height={16} />
          </span>
          <Skeleton width={72} height={14} />
        </div>
      ))}
    </Busy>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  const cells = (h: number) =>
    Array.from({ length: cols }, (_, c) => (
      <span key={c} className={styles.tCell}>
        <Skeleton width={c === 0 ? '80%' : '50%'} height={h} />
      </span>
    ));
  return (
    <Busy className={styles.table}>
      <div className={`${styles.tRow} ${styles.tHead}`} aria-hidden="true">
        {cells(12)}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={styles.tRow} aria-hidden="true">
          {cells(16)}
        </div>
      ))}
    </Busy>
  );
}

export function CardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <Busy className={styles.card}>
      <div style={{ minHeight: height - 44, display: 'flex', flexDirection: 'column', gap: 12 }} aria-hidden="true">
        <Skeleton width="40%" height={18} />
        <Skeleton width="90%" />
        <Skeleton width="70%" />
      </div>
    </Busy>
  );
}

/** 제목 + 카드 2 + 목록 — QueryBoundary 기본 */
export function PageSkeleton() {
  return (
    <Busy className={styles.page}>
      <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton width={220} height={30} />
        <Skeleton width={320} height={14} />
      </div>
      <div className={styles.cards} aria-hidden="true">
        <SkeletonCardBlock />
        <SkeletonCardBlock />
      </div>
      <div className={styles.list} aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={styles.listRow}>
            <span className={styles.grow}>
              <Skeleton width={`${50 + i * 10}%`} height={16} />
            </span>
            <Skeleton width={64} height={14} />
          </div>
        ))}
      </div>
    </Busy>
  );
}

function SkeletonCardBlock() {
  return (
    <div className={styles.card}>
      <Skeleton width="45%" height={16} />
      <Skeleton width="30%" height={36} />
      <Skeleton width="80%" />
    </div>
  );
}
