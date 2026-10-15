import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon } from '../Icon';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './BigStat.module.css';

/** 라벨 + 큰 숫자 ("2 / 3일"). check면 라벨 옆 초록 체크(조건 채움). */
export function BigStat({
  label,
  value,
  unit,
  check,
  size = 'lg',
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  check?: boolean;
  size?: 'md' | 'lg';
}) {
  return (
    <div>
      <div className={styles.kl}>
        {label}
        {check ? (
          <span className={styles.check}>
            <Icon name="check" size={14} strokeWidth={2.4} />
            <VisuallyHidden>채웠어요</VisuallyHidden>
          </span>
        ) : null}
      </div>
      <div className={cx(styles.big, size === 'md' && styles.md)}>
        {value}
        {unit ? <small>{unit}</small> : null}
      </div>
    </div>
  );
}
