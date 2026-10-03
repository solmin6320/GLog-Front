import type { ReactNode } from 'react';
import { cx } from '../cx';
import { useOverflowX } from '../useOverflowX';
import styles from './DataTable.module.css';

export type Column<T> = { key: string; header: ReactNode; render: (row: T) => ReactNode; align?: 'left' | 'right'; width?: string };

/**
 * 흰 표(.tb). 좁은 화면에서는 가로 스크롤(넘칠 때만 키보드 포커스 가능).
 * rowTone: 'me' → 초록 행(나), 'focus' → 파란 행(정정 중 등). caption은 스크린리더용.
 * footer는 표 상자 아래에 그대로 그린다(Foot · 페이지 이동 등).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowTone,
  empty,
  caption,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowTone?: (row: T) => 'me' | 'focus' | undefined;
  empty?: ReactNode;
  caption?: string;
  footer?: ReactNode;
}) {
  const [ref, overflow] = useOverflowX<HTMLDivElement>();
  return (
    <div>
      <div
        ref={ref}
        className={styles.tb}
        tabIndex={overflow ? 0 : undefined}
        role={overflow && caption ? 'region' : undefined}
        aria-label={overflow && caption ? caption : undefined}
      >
        <table className={styles.table}>
          {caption ? <caption className="visually-hidden">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cx(c.align === 'right' && styles.r)} style={c.width ? { width: c.width } : undefined}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && empty ? (
              <tr>
                <td className={styles.empty} colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const tone = rowTone?.(row);
                return (
                  <tr key={rowKey(row)} className={cx(tone && styles[tone])} data-tone={tone}>
                    {columns.map((c) => (
                      <td key={c.key} className={cx(c.align === 'right' && styles.r)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
