import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { FieldShell } from '../_field/FieldShell';
import styles from '../_field/field.module.css';
import { useField } from '../_field/useField';
import { cx } from '../cx';
import { Icon, type IconName } from '../Icon';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: ReactNode;
  error?: string | null;
  counter?: boolean;
  icon?: IconName;
};

/**
 * 한 줄 입력. id는 자동(useId), 라벨 · 도움말 · 오류를 aria-describedby로 묶는다.
 * required는 빨간 * + aria-required로만 표시한다(브라우저 기본 검증 말풍선을 띄우지 않음 — 문구는 화면이 정한다).
 * className은 바깥 .field 묶음에 붙는다.
 */
export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, required, optionalLabel, hint, error, counter, icon, id, className, onChange, maxLength, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const f = useField<HTMLInputElement>({ id, hint, error, counter, value: rest.value, defaultValue: rest.defaultValue, describedBy: ariaDescribedBy, onChange });
  return (
    <FieldShell
      inputId={f.inputId}
      ids={f.ids}
      label={label}
      required={required}
      optionalLabel={optionalLabel}
      hint={hint}
      error={error}
      counter={counter ? { length: f.length, max: maxLength } : null}
      className={className}
    >
      <div className={cx(styles.control, icon && styles.withIcon)}>
        {icon ? (
          <span className={styles.icon}>
            <Icon name={icon} size={17} />
          </span>
        ) : null}
        <input
          ref={ref}
          id={f.inputId}
          className={cx(styles.inp, error && styles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={f.describedBy}
          maxLength={maxLength}
          onChange={f.handleChange}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});
