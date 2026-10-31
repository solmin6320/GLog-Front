import type { HTMLAttributes } from 'react';
import { cx } from '../cx';
import styles from './Card.module.css';

/** 흰 카드. padding을 안 주면 22px 24px(모바일 18px 16px). 숫자는 px. */
export function Card({
  padding,
  as: Tag = 'div',
  className,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { padding?: number | string; as?: 'div' | 'section' | 'aside' }) {
  return <Tag data-card="" className={cx(styles.card, className)} style={padding === undefined ? style : { padding, ...style }} {...rest} />;
}
