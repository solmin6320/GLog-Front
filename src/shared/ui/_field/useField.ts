import { type ChangeEvent, useId, useState } from 'react';
import type { FieldIds } from './FieldShell';

/** id · aria-describedby · 글자 수 (내부용) */
export function useField<E extends HTMLInputElement | HTMLTextAreaElement>(o: {
  id?: string;
  hint?: unknown;
  error?: string | null;
  counter?: boolean;
  value?: unknown;
  defaultValue?: unknown;
  describedBy?: string;
  onChange?: (e: ChangeEvent<E>) => void;
}) {
  const auto = useId();
  const inputId = o.id ?? `${auto}-input`;
  const ids: FieldIds = { hint: `${inputId}-hint`, error: `${inputId}-error`, counter: `${inputId}-counter` };
  const [uncontrolledLength, setLength] = useState(() => String(o.defaultValue ?? '').length);
  const length = o.value !== undefined && o.value !== null ? String(o.value).length : uncontrolledLength;
  const describedBy =
    [o.describedBy, o.error ? ids.error : null, o.hint ? ids.hint : null, o.counter ? ids.counter : null]
      .filter(Boolean)
      .join(' ') || undefined;
  const handleChange = (e: ChangeEvent<E>) => {
    setLength(e.target.value.length);
    o.onChange?.(e);
  };
  return { inputId, ids, length, describedBy, handleChange };
}
