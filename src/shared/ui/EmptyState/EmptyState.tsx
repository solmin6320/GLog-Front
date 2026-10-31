import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import styles from './EmptyState.module.css';

/**
 * 빈 목록 · 빈 데이터 안내 (화면이 직접 그린다). 모든 화면이 같은 모양을 쓴다:
 * 흰 상자(카드와 같은 테두리 · 모서리) 안에 가운데 정렬 [아이콘] 제목 · 설명 · 버튼.
 * Card 안에 놓이면 상자는 저절로 빠진다(이중 테두리 방지). Card가 아닌 틀 안이면 inset으로 직접 뺀다.
 * - size="sm": 섹션 안의 짧은 안내 — 여백을 줄인다
 */
export function EmptyState({
  title,
  body,
  action,
  icon,
  inset = false,
  size = 'md',
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  icon?: IconName;
  inset?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cx(styles.empty, !inset && styles.boxed, size === 'sm' && styles.sm)}>
      {icon ? (
        <span className={styles.icon}>
          <Icon name={icon} size={22} />
        </span>
      ) : null}
      <p className={styles.title}>{title}</p>
      {body ? <div className={styles.body}>{body}</div> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
