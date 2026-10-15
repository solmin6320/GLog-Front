import { useEffect } from 'react';
import { formatMonthDay } from '@/shared/lib/format';
import { weekdayIndex, weekdayLabel } from '@/shared/lib/kst';
import { useOverflowX } from '../useOverflowX';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './GrassHeatmap.module.css';

const clampLevel = (n: number) => Math.max(0, Math.min(4, Math.round(n)));

/**
 * 1년 잔디 히트맵. 열 = 주(월~일 행). 첫 날이 월요일이 아니면 앞을 빈칸으로 채운다.
 * 좁은 화면에서는 가로 스크롤 — 처음엔 최근 쪽(오른쪽 끝)을 보여 준다.
 */
export function GrassHeatmap({
  days,
  cell = 12,
  gap = 3,
}: {
  days: { date: string; count: number; level: number }[];
  cell?: number;
  gap?: number;
}) {
  const [ref, overflow] = useOverflowX<HTMLDivElement>();
  const first = days[0];
  const lead = first ? weekdayIndex(first.date) : 0;

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [ref, days.length]);

  return (
    <div ref={ref} className={styles.scroll} role="region" aria-label="잔디 기록" tabIndex={overflow ? 0 : undefined}>
      <ul
        className={styles.grid}
        style={{ gridTemplateRows: `repeat(7, ${cell}px)`, gridAutoColumns: `${cell}px`, gap: `${gap}px` }}
      >
        {Array.from({ length: lead }, (_, i) => (
          <li key={`pad-${i}`} className={styles.pad} aria-hidden="true" />
        ))}
        {days.map((d) => {
          const level = clampLevel(d.level);
          return (
            <li
              key={d.date}
              className={styles.cell}
              style={{ width: cell, height: cell, background: `var(--h${level})` }}
              data-level={level}
            >
              <VisuallyHidden>
                {`${formatMonthDay(d.date)} ${weekdayLabel(d.date)}요일, ${d.count > 0 ? `잔디 ${d.count}칸` : '잔디 없음'}`}
              </VisuallyHidden>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
