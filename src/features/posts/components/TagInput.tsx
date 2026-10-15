import { useState, type KeyboardEvent } from 'react';
import { isComposingEvent } from '@/shared/lib/useHotkey';
import { LIMITS, normalizeTag, VALIDATION_MSG, validateNewTag } from '@/shared/lib/validators';
import { Icon, Tag } from '@/shared/ui';
import s from './TagInput.module.css';

/**
 * BD-04 ⑦ 태그 — Enter · 쉼표로 확정, 칩의 ✕로 지우기, 최대 5개 · 개당 20자(E-30).
 * 5개가 차면 입력칸을 막고 안내한다. 한글 조합 중 Enter는 확정하지 않는다.
 */
export function TagInput({
  id,
  tags,
  onChange,
  error,
  onError,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  error: string | null;
  onError: (message: string | null) => void;
}) {
  const [text, setText] = useState('');
  const full = tags.length >= LIMITS.tagCount;
  const msgId = `${id}-msg`;
  const message = error ?? (full ? VALIDATION_MSG.tagTooMany : null);

  /** 조각들을 차례로 더한다. 막히면 그 자리에서 멈추고 남은 글자를 돌려준다 */
  const addParts = (parts: string[]): string => {
    let next = tags;
    for (let i = 0; i < parts.length; i += 1) {
      const raw = parts[i] ?? '';
      if (!normalizeTag(raw)) continue;
      const err = validateNewTag(raw, next);
      if (err) {
        onError(err);
        if (next !== tags) onChange(next);
        return parts.slice(i).join(',');
      }
      next = [...next, normalizeTag(raw)];
    }
    onError(null);
    if (next !== tags) onChange(next);
    return '';
  };

  const commit = () => setText(addParts([text]));

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingEvent(e.nativeEvent)) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && text === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
      onError(null);
    }
  };

  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.label}>
        태그<span className={s.opt}>최대 {LIMITS.tagCount}개</span>
      </label>
      <div className={s.box} data-invalid={error ? '' : undefined}>
        {tags.map((tag) => (
          <Tag
            key={tag}
            label={tag}
            onRemove={() => {
              onChange(tags.filter((t) => t !== tag));
              onError(null);
            }}
          />
        ))}
        <input
          id={id}
          className={s.input}
          value={text}
          disabled={full}
          maxLength={LIMITS.tagLength}
          placeholder={full ? '' : '태그 입력 후 Enter'}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? msgId : undefined}
          autoComplete="off"
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(',')) {
              const parts = v.split(',');
              const last = parts.pop() ?? '';
              const rest = addParts(parts);
              setText(rest ? `${rest},${last}` : last);
            } else {
              setText(v);
              if (error) onError(null);
            }
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (normalizeTag(text)) commit();
          }}
        />
      </div>
      {message ? (
        <p id={msgId} className={error ? s.error : s.hint} role={error ? 'alert' : undefined}>
          {error ? <Icon name="alert" size={13} /> : null}
          {message}
        </p>
      ) : null}
    </div>
  );
}
