import { cx } from '../cx';
import styles from './Button.module.css';

export type BtnVariant = 'primary' | 'outline' | 'danger' | 'text' | 'dark';
export type BtnSize = 'xs' | 'sm' | 'md' | 'lg'; // 28 · 32 · 40 · 52px

export const ICON_SIZE: Record<BtnSize, number> = { xs: 13, sm: 14, md: 15, lg: 16 };

export function buttonClass(o: { variant: BtnVariant; size: BtnSize; fullWidth?: boolean; busy?: boolean; className?: string }) {
  return cx(
    styles.btn,
    styles[o.variant],
    o.size !== 'md' && styles[o.size],
    o.fullWidth && styles.full,
    o.busy && styles.busy,
    o.className,
  );
}

export const spinnerClass = styles.spinner;
