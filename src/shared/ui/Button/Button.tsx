import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon';
import { type BtnSize, type BtnVariant, ICON_SIZE, buttonClass, spinnerClass } from './buttonClass';

/**
 * 기본 type="button" (폼 제출 버튼은 type="submit"을 넘긴다).
 * loading이면 disabled + aria-busy, 라벨은 그대로 둔다 (설계서 3-6).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  className,
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, fullWidth, busy: loading, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className={spinnerClass} aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={ICON_SIZE[size]} />
      ) : null}
      {children}
    </button>
  );
}
