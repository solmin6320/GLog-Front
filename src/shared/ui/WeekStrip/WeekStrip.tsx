import type { CSSProperties } from 'react';
import { weekdayLabel } from '@/shared/lib/kst';
import { cx } from '../cx';
import { VisuallyHidden } from '../VisuallyHidden';
import { type StripDay, levelOf, stripDayText } from './strip';
import styles from './WeekStrip.module.css';

/**
 * 주간 잔디 스트립.
 * size 12 = 표 안 미니(라벨 · 밑줄 없음). 32 · 46 · 54 = 큰 스트립(요일 라벨 + 인증일 밑줄).
 * 큰 스트립은 좁은 화면에서 칸이 함께 줄어든다.
 */
export function WeekStrip({
  days,
  size = 46,
  showLabels,
  legend = false,
  fallbackLevel = 3,
  className,
}: {
  days: StripDay[];
  size?: 12 | 32 | 46 | 54;
  showLabels?: boolean;
  legend?: boolean;
  fallbackLevel?: number;
  className?: string;
}) {
  const mini = size === 12;
  const labels = !mini && (showLabels ?? true);

  const items = days.map((d) => {
    const level = levelOf(d, fallbackLevel);
    const record = d.hasRecord && !d.isFuture;
    const verified = d.verified && !d.isFuture;
    const sq = (
      <span
        className={cx(styles.sq, d.isToday && styles.today, d.isFuture && styles.future, record && styles.record)}
        style={d.isFuture ? undefined : { background: `var(--h${level})` }}
        data-level={d.isFuture ? undefined : level}
        aria-hidden="true"
      >
        {record ? <i className={styles.rc} /> : null}
      </span>
    );
    const text = <VisuallyHidden>{stripDayText(d)}</VisuallyHidden>;
    if (mini) {
      return (
        <span key={d.date} role="listitem" className={styles.day}>
          {sq}
          {text}
        </span>
      );
    }
    return (
      <li key={d.date} className={cx(styles.day, verified && styles.verified)}>
        {sq}
        {labels ? (
          <span className={cx(styles.dl, verified && styles.on)} aria-hidden="true">
            {weekdayLabel(d.date)}
          </span>
        ) : null}
        <i className={cx(styles.ul, !verified && styles.off)} aria-hidden="true" />
        {text}
      </li>
    );
  });

  if (mini) {
    return (
      <span role="list" className={cx(styles.mini, className)}>
        {items}
      </span>
    );
  }

  return (
    <div className={cx(styles.root, className)}>
      <ul className={styles.big} style={{ '--sq': `${size}px` } as CSSProperties}>
        {items}
      </ul>
      {legend ? <StripLegend /> : null}
    </div>
  );
}

function StripLegend() {
  return (
    <div className={styles.legend}>
      <span>
        <i className={styles.lgSq} aria-hidden="true" />
        잔디
      </span>
      <span>
        <i className={styles.lgRc} aria-hidden="true" />
        기록글
      </span>
      <span>
        <i className={styles.lgUl} aria-hidden="true" />
        인증일
      </span>
    </div>
  );
}
