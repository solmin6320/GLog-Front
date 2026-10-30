import { type ReactNode, type SelectHTMLAttributes, useId } from 'react';
import { FieldShell } from '../_field/FieldShell';
import fieldStyles from '../_field/field.module.css';
import { cx } from '../cx';
import { Icon } from '../Icon';
import styles from './Select.module.css';

/**
 * 네이티브 select. label이 있으면 폼 필드(46px, 아래 여백 20),
 * label이 없으면 필터용 작은 모양(40px, 여백 없음) — 이때는 aria-label을 넘긴다.
 */
export function Select({
  label,
  options,
  hint,
  error,
  id,
  className,
  required,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
  hint?: ReactNode;
  error?: string | null;
}) {
  const auto = useId();
  const selectId = id ?? `${auto}-select`;
  const ids = { hint: `${selectId}-hint`, error: `${selectId}-error`, counter: `${selectId}-counter` };
  const describedBy = [ariaDescribedBy, error ? ids.error : null, hint ? ids.hint : null].filter(Boolean).join(' ') || undefined;
  return (
    <FieldShell inputId={selectId} ids={ids} label={label} required={required} hint={hint} error={error} bare={!label} className={className}>
      <div className={fieldStyles.control}>
        <select
          id={selectId}
          className={cx(fieldStyles.inp, styles.select, !label && styles.compact, error && fieldStyles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className={styles.chev} aria-hidden="true">
          <Icon name="chevD" size={16} />
        </span>
      </div>
    </FieldShell>
  );
}
