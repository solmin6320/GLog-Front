import { useState } from 'react';
import { normalizeSearch, SEARCH_MAX } from '@/shared/lib/paths';
import { VALIDATION_MSG, validateSearch } from '@/shared/lib/validators';
import { SearchInput } from '@/shared/ui';

/**
 * BD-01 ③ 검색창. 헤더 검색과 같은 규칙(2~50자, 앞뒤 공백 제거 — E-61 · E-63).
 * URL의 q(current)가 바뀌면(헤더 검색 · 필터 해제 · 뒤로가기) 입력도 따라간다. 칸을 비우면 검색을 푼다.
 */
export function BoardSearch({ current, onSearch }: { current: string; onSearch: (q: string | undefined) => void }) {
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(current);
  if (synced !== current) {
    setSynced(current);
    setValue(current);
    setError(null);
  }

  const submit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (current) onSearch(undefined);
      return;
    }
    const err = validateSearch(trimmed);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSearch(normalizeSearch(trimmed));
  };

  return (
    <SearchInput
      value={value}
      onChange={(v) => {
        setValue(v);
        setError(null);
        if (v === '' && current) onSearch(undefined);
      }}
      onSubmit={submit}
      placeholder="제목, 내용, 태그로 검색"
      maxLength={SEARCH_MAX}
      ariaLabel="게시판 검색"
      error={error ?? (value.length >= SEARCH_MAX ? VALIDATION_MSG.searchTooLong : null)}
    />
  );
}
