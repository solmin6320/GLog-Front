import { cx } from '../cx';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './WarningGauge.module.css';

/** 경고 게이지 — max칸 중 count칸을 주황으로 */
export function WarningGauge({ count, max = 3 }: { count: number; max?: number }) {
  const n = Math.max(0, Math.min(max, count));
  return (
    <div className={styles.wbar}>
      <VisuallyHidden>{`경고 ${max}회 중 ${n}회`}</VisuallyHidden>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={cx(styles.bar, i < n && styles.on)} aria-hidden="true" />
      ))}
    </div>
  );
}
