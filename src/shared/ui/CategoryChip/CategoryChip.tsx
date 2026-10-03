import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';
import styles from './CategoryChip.module.css';

export function CategoryChip({ children, icon }: { children: ReactNode; icon?: IconName }) {
  return (
    <span className={styles.cat}>
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}
