import { useId, useRef } from 'react';
import fieldStyles from '../_field/field.module.css';
import { cx } from '../cx';
import { Icon } from '../Icon';
import styles from './SearchInput.module.css';

/** 검색창 (form role=search). Enter → onSubmit(value). 값이 있으면 지우기(✕) 버튼. */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  ariaLabel,
  size = 'md',
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  placeholder: string;
  maxLength?: number;
  ariaLabel: string;
  size?: 'md' | 'sm';
  error?: string | null;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <form
      role="search"
      aria-label={ariaLabel}
      className={cx(styles.form, size === 'sm' && styles.sm)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
    >
      <div className={styles.box}>
        <span className={styles.icon}>
          <Icon name="search" size={size === 'sm' ? 16 : 17} />
        </span>
        <input
          ref={inputRef}
          type="search"
          className={cx(fieldStyles.inp, styles.input, error && fieldStyles.invalid)}
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          enterKeyHint="search"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {value ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="검색어 지우기"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            <Icon name="x" size={16} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className={fieldStyles.error} style={{ marginTop: 7 }}>
          <Icon name="alert" size={13} />
          {error}
        </p>
      ) : null}
    </form>
  );
}
