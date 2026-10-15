import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from '../cx';
import styles from './RowList.module.css';

/** ul.rows — 공지 · 기록글 같은 한 줄 목록 */
export function RowList({ children, ariaLabel }: { children: ReactNode; ariaLabel?: string }) {
  return (
    <ul className={styles.rows} aria-label={ariaLabel}>
      {children}
    </ul>
  );
}

/** 목록 한 줄. to가 있으면 줄 전체가 링크. right는 오른쪽 끝(작성자 · 날짜 등). */
export function RowItem({ children, right, to, alignTop }: { children: ReactNode; right?: ReactNode; to?: string; alignTop?: boolean }) {
  const cls = cx(styles.inner, alignTop && styles.top);
  const content = (
    <>
      <div className={styles.main}>{children}</div>
      {right ? <div className={styles.right}>{right}</div> : null}
    </>
  );
  return (
    <li className={styles.item}>
      {to ? (
        <Link to={to} className={cls}>
          {content}
        </Link>
      ) : (
        <div className={cls}>{content}</div>
      )}
    </li>
  );
}
