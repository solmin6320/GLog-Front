import { type ReactNode, useId } from 'react';
import { cx } from '../cx';
import styles from './RadioCard.module.css';

/** 카드 모양 라디오. 실제 input[type=radio]라 같은 name끼리 화살표 키로 움직인다. 묶음은 화면이 fieldset · legend로 감싼다. */
export function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  return (
    <label htmlFor={id} className={cx(styles.card, checked && styles.on, disabled && styles.disabled)}>
      <input
        id={id}
        type="radio"
        className={styles.input}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      />
      <span className={styles.rdo} aria-hidden="true" />
      <span className={styles.text}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        {description ? (
          <span id={descId} className={styles.desc}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
