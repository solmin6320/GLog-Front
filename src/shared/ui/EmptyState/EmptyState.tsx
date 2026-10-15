import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import styles from './EmptyState.module.css';

/** 빈 목록 · 빈 데이터 안내 (화면이 직접 그린다) */
export function EmptyState({ title, body, action, icon }: { title: string; body?: ReactNode; action?: ReactNode; icon?: IconName }) {
  return (
    <div className={styles.empty}>
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
