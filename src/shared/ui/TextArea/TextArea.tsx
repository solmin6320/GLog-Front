import { type ReactNode, type TextareaHTMLAttributes, forwardRef } from 'react';
import { FieldShell } from '../_field/FieldShell';
import fieldStyles from '../_field/field.module.css';
import { useField } from '../_field/useField';
import { cx } from '../cx';
import styles from './TextArea.module.css';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: ReactNode;
  error?: string | null;
  counter?: boolean;
  serif?: boolean;
};

/** 여러 줄 입력. serif면 긴 본문용 넓은 줄 간격(글꼴은 다른 입력칸과 같다 — 이름은 호출부 호환용). 나머지 규칙은 TextField와 같다. */
export const TextArea = forwardRef<HTMLTextAreaElement, Props>(function TextArea(
  { label, required, optionalLabel, hint, error, counter, serif, id, className, onChange, maxLength, 'aria-describedby': ariaDescribedBy, ...rest },
  ref,
) {
  const f = useField<HTMLTextAreaElement>({ id, hint, error, counter, value: rest.value, defaultValue: rest.defaultValue, describedBy: ariaDescribedBy, onChange });
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
      <textarea
        ref={ref}
        id={f.inputId}
        className={cx(fieldStyles.inp, styles.ta, serif && styles.serif, error && fieldStyles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={f.describedBy}
        maxLength={maxLength}
        onChange={f.handleChange}
        {...rest}
      />
    </FieldShell>
  );
});
