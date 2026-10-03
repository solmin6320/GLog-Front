import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import styles from './InfoBox.module.css';

/** 안내 박스. action은 오른쪽 끝(좁으면 아래로 줄바꿈). */
export function InfoBox({
  tone,
  icon,
  action,
  children,
  role,
}: {
  tone: 'blue' | 'mute' | 'ok' | 'red' | 'warn';
  icon?: IconName;
  action?: ReactNode;
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div className={cx(styles.box, styles[tone])} role={role} data-tone={tone}>
      {icon ? (
        <span className={styles.icon}>
          <Icon name={icon} size={16} />
        </span>
      ) : null}
      <div className={styles.body}>{children}</div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
