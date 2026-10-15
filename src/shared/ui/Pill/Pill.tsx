import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import styles from './Pill.module.css';

export type PillTone = 'ok' | 'bad' | 'info' | 'mute' | 'warn' | 'solid' | 'dark' | 'line';

export function Pill({ tone, icon, children }: { tone: PillTone; icon?: IconName | null; children: ReactNode }) {
  return (
    <span className={cx(styles.pill, styles[tone])} data-tone={tone}>
      {icon ? <Icon name={icon} size={12} strokeWidth={2.4} /> : null}
      {children}
    </span>
  );
}
