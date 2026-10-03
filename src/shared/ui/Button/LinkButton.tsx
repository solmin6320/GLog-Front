import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../Icon';
import { type BtnSize, type BtnVariant, ICON_SIZE, buttonClass } from './buttonClass';

/** 버튼 모양의 react-router Link */
export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  'aria-label': ariaLabel,
}: {
  to: string;
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: IconName;
  children: ReactNode;
  className?: string;
  /** 보이는 라벨이 짧아 대상이 드러나지 않을 때 (예: 행마다 같은 [수정]) */
  'aria-label'?: string;
}) {
  return (
    <Link to={to} className={buttonClass({ variant, size, className })} aria-label={ariaLabel}>
      {icon ? <Icon name={icon} size={ICON_SIZE[size]} /> : null}
      {children}
    </Link>
  );
}
