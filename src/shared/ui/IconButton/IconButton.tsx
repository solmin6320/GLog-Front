import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';
import styles from './IconButton.module.css';

/** 아이콘만 있는 버튼. label은 aria-label로 들어간다. */
export function IconButton({
  label,
  icon,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: IconName; size?: 'sm' | 'md' }) {
  return (
    <button type={type} aria-label={label} className={cx(styles.ib, size === 'sm' && styles.sm, className)} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
    </button>
  );
}
