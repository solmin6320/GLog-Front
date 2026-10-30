import { useEffect, useEffectEvent, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { parsePostsSearch, paths, SEARCH_MAX } from '@/shared/lib/paths';
import { isComposingEvent, useHotkey } from '@/shared/lib/useHotkey';
import { LIMITS, normalizeTag, VALIDATION_MSG, validateSearch } from '@/shared/lib/validators';
import { Icon, IconButton, Kbd } from '@/shared/ui';
import s from './HeaderSearch.module.css';

type OptionKind = 'troubleshooting' | 'devlog' | 'tag';
type Option = { kind: OptionKind; label: string; to: string };

const SUB: Record<OptionKind, string> = {
  troubleshooting: '트러블슈팅에서 검색',
  devlog: '개발일지에서 검색',
  tag: '태그 글 모아보기',
};

const NOTE = '제목 · 내용 · 태그를 찾아요. 팀과 회원은 찾지 않아요.';

const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(' ');

/** 제안 3줄 (서버 호출 없음). 태그 줄은 태그 규칙(20자)을 넘는 검색어면 뺀다. */
function buildOptions(q: string): Option[] {
  const options: Option[] = [
    { kind: 'troubleshooting', label: q, to: paths.posts({ type: 'troubleshooting', q }) },
    { kind: 'devlog', label: q, to: paths.posts({ type: 'devlog', q }) },
  ];
  const tag = normalizeTag(q);
  if (tag && tag.length <= LIMITS.tagLength) options.push({ kind: 'tag', label: tag, to: paths.posts({ tag }) });
  return options;
}

/**
 * 헤더 검색 (설계서 7-2 · A1 3-1 · ACC-HS-*). W-02 닫힘 · W-04 입력 중.
 * - 열기: 검색창 클릭 · `/` 키(입력칸 · 모달 · 한글 조합 중 제외 — useHotkey)
 * - 입력 중 서버 호출 0건. 제안은 BD-01로 가는 링크 3개뿐이다
 * - ↑↓ 이동 · Enter 이동 · Esc · 바깥 클릭 · Tab으로 나가면 닫고 입력을 비운다
 * - 768px 미만: 돋보기 버튼으로 접히고, 열면 헤더 한 줄을 덮는다(CSS)
 */
export function HeaderSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const uid = useId();
  const ids = {
    listbox: `${uid}-listbox`,
    msg: `${uid}-msg`,
    note: `${uid}-note`,
    groupBoard: `${uid}-group-board`,
    groupTag: `${uid}-group-tag`,
    option: (k: OptionKind) => `${uid}-option-${k}`,
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLSpanElement>(null);
  const restoreFocusRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [activeKind, setActiveKind] = useState<OptionKind | null>(null);

  // BD-01 개발일지 탭을 보던 중이면 ⓑ가 기본 선택
  const viewingDevlog =
    location.pathname === paths.posts() && parsePostsSearch(new URLSearchParams(location.search)).type === 'devlog';
  const defaultKind: OptionKind = viewingDevlog ? 'devlog' : 'troubleshooting';

  const q = value.trim();
  const error = validateSearch(value);
  const options = q && !error ? buildOptions(q) : [];
  const active =
    options.find((o) => o.kind === activeKind) ?? options.find((o) => o.kind === defaultKind) ?? options[0];
  const expanded = options.length > 0;
  const message = error ?? (value.length >= SEARCH_MAX ? VALIDATION_MSG.searchTooLong : null);
  const boardOptions = options.filter((o) => o.kind !== 'tag');
  const tagOption = options.find((o) => o.kind === 'tag');

  const openSearch = () => {
    setActiveKind(null);
    setOpen(true);
  };

  const closeSearch = (restoreFocus: boolean) => {
    restoreFocusRef.current = restoreFocus;
    setOpen(false);
    setValue('');
    setActiveKind(null);
  };

  const go = (to: string) => {
    closeSearch(false);
    // 게시판이 "결과가 없으면 결과 있는 탭으로" 옮길 수 있게 헤더 검색에서 왔다고 알린다(주소는 그대로)
    void navigate(to, { state: { fromHeaderSearch: true } });
  };

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else if (restoreFocusRef.current) {
      // Esc · 닫기 버튼 → 보이는 쪽 트리거(넓은 화면 검색창 · 좁은 화면 돋보기)로 포커스를 돌린다
      restoreFocusRef.current = false;
      const candidates = [triggerRef.current, mobileTriggerRef.current?.querySelector('button') ?? null];
      const visible = candidates.find((el) => el && el.getClientRects().length > 0);
      (visible ?? triggerRef.current)?.focus();
    }
  }, [open]);

  // 바깥 클릭 → 닫기 (배경 dim 없음, 설계서 7-2)
  const onOutsidePointer = useEffectEvent((e: PointerEvent) => {
    const root = rootRef.current;
    if (root && e.target instanceof Node && !root.contains(e.target)) closeSearch(false);
  });
  useEffect(() => {
    if (!open) return;
    const listener = (e: PointerEvent) => onOutsidePointer(e);
    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [open]);

  useHotkey('/', (e) => {
    e.preventDefault(); // 입력칸에 '/'가 들어가지 않게
    if (open) inputRef.current?.focus();
    else openSearch();
  });

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isComposingEvent(e.nativeEvent)) return; // 한글 조합을 끝내는 Enter · 화살표는 무시
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!active) return;
        e.preventDefault();
        const n = options.length;
        const next = options[(options.indexOf(active) + (e.key === 'ArrowDown' ? 1 : -1) + n) % n];
        if (next) setActiveKind(next.kind);
        return;
      }
      case 'Enter': {
        e.preventDefault();
        // 빈 칸 · 1자(E-61)는 무동작 — 1자 안내는 이미 떠 있다
        if (active) go(active.to);
        return;
      }
      case 'Escape': {
        e.preventDefault();
        closeSearch(true);
        return;
      }
    }
  };

  // Tab 등으로 포커스가 검색 영역 밖으로 나가면 닫는다 (창 전환처럼 relatedTarget이 없으면 그대로 둔다)
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget;
    if (open && next instanceof Node && !e.currentTarget.contains(next)) closeSearch(false);
  };

  const renderOption = (o: Option) => {
    const on = o === active;
    return (
      <div
        key={o.kind}
        id={ids.option(o.kind)}
        role="option"
        aria-selected={on}
        aria-label={`${o.kind === 'tag' ? '#' : ''}${o.label} ${SUB[o.kind]}`}
        className={cx(s.option, on && s.on)}
        onMouseEnter={() => setActiveKind(o.kind)}
        onClick={() => go(o.to)}
      >
        <Icon name={o.kind === 'tag' ? 'hash' : 'search'} size={16} />
        <b className={s.q}>{o.label}</b>{' '}
        <span className={s.sub}>{SUB[o.kind]}</span>
        {on ? (
          <span className={s.enter} aria-hidden="true">
            <Kbd>
              <Icon name="enter" size={12} strokeWidth={2.2} />
            </Kbd>
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div ref={rootRef} role="search" className={cx(s.root, open && s.open)} onBlur={onBlur}>
      {/* 입력 중에는 본문을 옅게 가린다 (A1 3-1 · 목업 W-04). 누르면 닫힌다 */}
      {open ? <div className={s.scrim} aria-hidden="true" onMouseDown={() => closeSearch(false)} /> : null}
      {open ? (
        <>
          <div className={s.field}>
            <Icon name="search" size={16} className={s.fieldIcon} />
            <input
              ref={inputRef}
              className={s.input}
              type="text"
              role="combobox"
              aria-label="글 검색"
              aria-expanded={expanded}
              aria-controls={expanded ? ids.listbox : undefined}
              aria-autocomplete="list"
              aria-activedescendant={expanded && active ? ids.option(active.kind) : undefined}
              aria-describedby={`${ids.msg} ${ids.note}`}
              aria-invalid={error ? true : undefined}
              maxLength={SEARCH_MAX}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <span className={s.esc} aria-hidden="true">
              <Kbd>Esc</Kbd>
            </span>
            <span className={s.close}>
              <IconButton label="검색 닫기" icon="x" size="sm" onClick={() => closeSearch(true)} />
            </span>
          </div>

          {/* 팝업 안 빈 곳을 눌러도 입력칸 포커스를 잃지 않게 */}
          <div className={s.pop} onMouseDown={(e) => e.preventDefault()}>
            {expanded ? (
              <div id={ids.listbox} role="listbox" aria-label="검색 제안" className={s.listbox}>
                <div role="group" aria-labelledby={ids.groupBoard} className={s.group}>
                  <div id={ids.groupBoard} role="presentation" className={s.groupLabel}>
                    게시판에서 찾기
                  </div>
                  {boardOptions.map(renderOption)}
                </div>
                {tagOption ? (
                  <div role="group" aria-labelledby={ids.groupTag} className={cx(s.group, s.groupTag)}>
                    <div id={ids.groupTag} role="presentation" className={s.groupLabel}>
                      태그
                    </div>
                    {renderOption(tagOption)}
                  </div>
                ) : null}
              </div>
            ) : null}
            <p id={ids.msg} role="status" className={s.msg}>
              {message}
            </p>
            <div className={s.footer}>
              <span className={s.keys}>
                <span>
                  <Kbd>↑</Kbd> <Kbd>↓</Kbd> 이동
                </span>
                <span>
                  <Kbd>Enter</Kbd> 검색
                </span>
              </span>
              <span id={ids.note} className={s.note}>
                {NOTE}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <button ref={triggerRef} type="button" className={s.trigger} aria-keyshortcuts="/" onClick={openSearch}>
            <Icon name="search" size={16} />
            <span>
              <Kbd>/</Kbd> 를 눌러 글 검색
            </span>
          </button>
          <span ref={mobileTriggerRef} className={s.mobileTrigger}>
            <IconButton label="글 검색" icon="search" aria-keyshortcuts="/" onClick={openSearch} />
          </span>
        </>
      )}
    </div>
  );
}
