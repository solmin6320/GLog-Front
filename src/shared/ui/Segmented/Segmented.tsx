import { type KeyboardEvent, useRef } from 'react';
import { cx } from '../cx';
import styles from './Segmented.module.css';

/**
 * 세그먼트 전환 (role=tablist). 화살표 ← → · Home · End로 옮기면 바로 선택된다.
 * 선택된 항목만 Tab 순서에 들어간다(로빙 tabindex).
 */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: { value: T; label: string; count?: number | null }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    items.findIndex((i) => i.value === value),
  );

  const move = (to: number) => {
    const n = items.length;
    if (!n) return;
    const idx = (to + n) % n;
    const it = items[idx];
    if (!it) return;
    refs.current[idx]?.focus();
    if (it.value !== value) onChange(it.value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowRight') move(i + 1);
    else if (e.key === 'ArrowLeft') move(i - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(items.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className={styles.seg}>
      {items.map((it, i) => {
        const on = i === selectedIndex;
        return (
          <button
            key={it.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className={cx(styles.item, on && styles.on)}
            onClick={() => {
              if (!on) onChange(it.value);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {it.label}
            {it.count != null ? <span className={styles.count}>{it.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
