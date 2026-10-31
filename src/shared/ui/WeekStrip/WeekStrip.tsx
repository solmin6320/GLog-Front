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
 * 46 · 54는 칸 표시(진하기 · 기록글 모서리 · 밑줄 · 오늘 테두리 · 남은 날 점선) 범례를 기본으로 단다. 끄려면 legend={false}.
 */
export function WeekStrip({
  days,
  size = 46,
  showLabels,
  legend,
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
      {(legend ?? size >= 46) ? (
        <StripLegend today={days.some((d) => d.isToday)} future={days.some((d) => d.isFuture)} />
      ) : null}
    </div>
  );
}

/** 칸에 쓰인 표시만 설명한다. 오늘 · 남은 날은 그 주에 있을 때만 */
function StripLegend({ today, future }: { today: boolean; future: boolean }) {
  return (
    <div className={styles.legend}>
      <span>
        <span className={styles.lgScale} aria-hidden="true">
          {[1, 2, 3, 4].map((l) => (
            <i key={l} style={{ background: `var(--h${l})` }} />
          ))}
        </span>
        잔디(진할수록 기여 많음)
      </span>
      <span>
        <i className={styles.lgRc} aria-hidden="true" />
        기록글
      </span>
      <span>
        <i className={styles.lgUl} aria-hidden="true" />
        인증일
      </span>
      {today ? (
        <span>
          <i className={styles.lgToday} aria-hidden="true" />
          오늘
        </span>
      ) : null}
      {future ? (
        <span>
          <i className={styles.lgFuture} aria-hidden="true" />
          남은 날
        </span>
      ) : null}
    </div>
  );
}
