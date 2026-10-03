import { type ReactNode, useId } from 'react';
import { cx } from '../cx';
import styles from './Switch.module.css';

/** 켜기 · 끄기 (button role=switch). 라벨을 눌러도 바뀐다. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description ? (
          <div id={descId} className={styles.desc}>
            {description}
          </div>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        className={cx(styles.switch, checked && styles.on)}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
    </div>
  );
}
