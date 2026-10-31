import { useEffect, useState, type MouseEvent } from 'react';
import { formatMonthDay } from '@/shared/lib/format';
import { addDays, weekdayIndex, weekdayLabel } from '@/shared/lib/kst';
import { useOverflowX } from '../useOverflowX';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './GrassHeatmap.module.css';

const clampLevel = (n: number) => Math.max(0, Math.min(4, Math.round(n)));
const LEVELS = [0, 1, 2, 3, 4] as const;
/** 왼쪽 요일 라벨: 월 · 수 · 금만 (GitHub와 같은 밀도) */
const ROW_LABELS = ['월', '', '수', '', '금', '', ''] as const;

type Day = { date: string; count: number; level: number };
/** 서버가 값을 주지 않은 날(빈 칸으로 그린다) */
type Cell = Day & { missing?: boolean };

/** 늘 1년(365일)을 그린다. 서버가 2주치만 줘도 칸 크기가 1년 달력과 같게 마지막 날 기준으로 앞을 빈 날로 채운다 */
const YEAR_DAYS = 365;
function fillYear(days: Day[]): Cell[] {
  const last = days[days.length - 1];
  if (!last || days.length >= YEAR_DAYS) return days;
  const byDate = new Map(days.map((d) => [d.date, d]));
  return Array.from({ length: YEAR_DAYS }, (_, i) => {
    const date = addDays(last.date, i - YEAR_DAYS + 1);
    return byDate.get(date) ?? { date, count: 0, level: 0, missing: true };
  });
}

/** 열(주)마다 그 주에 처음 나오는 달을 라벨로. 같은 달이 이어지면 비운다 */
function monthLabels(days: Cell[], lead: number, columns: number): (string | null)[] {
  const labels: (string | null)[] = Array.from({ length: columns }, () => null);
  let last = -1;
  days.forEach((d, i) => {
    const col = Math.floor((lead + i) / 7);
    const month = Number(d.date.slice(5, 7));
    if (month !== last) {
      // 첫 열이 달 중간에서 시작하면 다음 달 라벨과 겹치지 않게 건너뛴다
      if (!(col === 0 && Number(d.date.slice(8, 10)) > 20)) labels[col] = `${month}월`;
      last = month;
    }
  });
  return labels;
}

/**
 * 1년 잔디 히트맵 (GitHub 프로필 달력과 같은 모양). 열 = 주(월~일 행), 칸은 11px 고정.
 * 위에 월 라벨, 왼쪽에 월 · 수 · 금 라벨, 아래에 적음 → 많음 범례. 좁은 화면에서는 칸이 너무 작아지지 않게 가로 스크롤.
 */
export function GrassHeatmap({ days: given }: { days: Day[] }) {
  const [ref, overflow] = useOverflowX<HTMLDivElement>();
  const days = fillYear(given);
  const first = days[0];
  const lead = first ? weekdayIndex(first.date) : 0;
  const columns = Math.max(1, Math.ceil((lead + days.length) / 7));
  const months = monthLabels(days, lead, columns);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [ref, days.length]);

  // 칸에 커서를 올리면 날짜와 기여 수를 띄운다. 스크롤 영역에 잘리지 않게 화면 기준(fixed)으로 그린다
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const showTip = (e: MouseEvent<HTMLElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
    if (!el) return setTip(null);
    const r = el.getBoundingClientRect();
    const half = 90;
    const x = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half);
    setTip({ x, y: r.top, text: el.dataset.tip ?? '' });
  };

  const cols = { gridTemplateColumns: `repeat(${columns}, var(--cell))` };

  return (
    <div className={styles.wrap}>
      <div ref={ref} className={styles.scroll} role="region" aria-label="잔디 기록" tabIndex={overflow ? 0 : undefined}>
        <div className={styles.frame}>
          <span aria-hidden="true" />
          <div className={styles.months} style={cols} aria-hidden="true">
            {months.map((m, i) => (
              <span key={i} className={styles.month}>
                {m}
              </span>
            ))}
          </div>
          <div className={styles.rows} aria-hidden="true">
            {ROW_LABELS.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
          <ul className={styles.grid} style={cols} onMouseOver={showTip} onMouseLeave={() => setTip(null)}>
            {Array.from({ length: lead }, (_, i) => (
              <li key={`pad-${i}`} className={styles.pad} aria-hidden="true" />
            ))}
            {days.map((d) => {
              const level = clampLevel(d.level);
              return (
                <li
                  key={d.date}
                  className={styles.cell}
                  style={{ background: `var(--h${level})` }}
                  data-level={level}
                  data-tip={`${formatMonthDay(d.date)} ${weekdayLabel(d.date)}요일 · ${d.missing ? '아직 불러오지 않음' : `기여 ${d.count}건`}`}
                >
                  <VisuallyHidden>
                    {`${formatMonthDay(d.date)} ${weekdayLabel(d.date)}요일, ${d.missing ? '아직 불러오지 않음' : d.count > 0 ? `기여 ${d.count}회` : '잔디 없음'}`}
                  </VisuallyHidden>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={styles.legend} aria-hidden="true">
        <span>적음</span>
        {LEVELS.map((l) => (
          <span key={l} className={styles.swatch} style={{ background: `var(--h${l})` }} />
        ))}
        <span>많음</span>
      </div>
      {tip ? (
        <div className={styles.tip} style={{ left: tip.x, top: tip.y }} role="presentation">
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}
