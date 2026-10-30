import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Icon } from '../Icon';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './field.module.css';

export type FieldIds = { hint: string; error: string; counter: string };

/** 라벨 · 필수 표시 · 도움말 · 오류 · 글자 수 틀 (내부용) */
export function FieldShell({
  inputId,
  ids,
  label,
  required,
  optionalLabel,
  hint,
  error,
  counter,
  bare,
  className,
  children,
}: {
  inputId: string;
  ids: FieldIds;
  label?: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: ReactNode;
  error?: string | null;
  counter?: { length: number; max?: number } | null;
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx(styles.field, bare && styles.bare, className)}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required ? (
            <span className={styles.req} aria-hidden="true">
              *
            </span>
          ) : null}
          {optionalLabel ? <span className={styles.opt}>{optionalLabel}</span> : null}
        </label>
      ) : null}
      {children}
      {error || hint || counter ? (
        <div className={styles.meta}>
          <div className={styles.msgs}>
            {error ? (
              <p id={ids.error} className={styles.error}>
                <Icon name="alert" size={13} />
                {error}
              </p>
            ) : null}
            {hint ? (
              <div id={ids.hint} className={styles.hint}>
                {hint}
              </div>
            ) : null}
          </div>
          {counter ? (
            <span id={ids.counter} className={styles.counter}>
              <span aria-hidden="true">{counter.max ? `${counter.length}/${counter.max}` : counter.length}</span>
              <VisuallyHidden>
                {counter.max ? `${counter.max}자 중 ${counter.length}자` : `${counter.length}자`}
              </VisuallyHidden>
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
