import { useNavigate } from 'react-router';
import { paths, type PostTypeParam } from '@/shared/lib/paths';
import { Tag, TextLink } from '@/shared/ui';
import s from './TagFilter.module.css';

const sameTag = (a: string, b: string | undefined) => !!b && a.toLowerCase() === b.toLowerCase();

/**
 * BD-01 ④ 많이 쓰인 태그 + ⑤ 필터 해제. 태그를 누르면 `?tag=`를 걸고, 걸린 태그는 ✕로 푼다(검색어 · 종류는 유지).
 * 목록에 없는 태그로 들어와도(?tag= 직접 입력) 걸린 태그를 앞에 보여 준다.
 */
export function TagFilter({
  tags,
  type,
  q,
  tag,
}: {
  tags: string[];
  type: PostTypeParam;
  q?: string;
  tag?: string;
}) {
  const navigate = useNavigate();
  const filtered = !!q || !!tag;
  if (tags.length === 0 && !filtered) return null;
  const list = tag && !tags.some((t) => sameTag(t, tag)) ? [tag, ...tags] : tags;
  const clear = () => void navigate(paths.posts({ type, q }));
  return (
    <div className={s.row} role="group" aria-label="태그로 거르기">
      {list.map((t) =>
        sameTag(t, tag) ? (
          <Tag key={t} label={t} active onRemove={clear} />
        ) : (
          <Tag key={t} label={t} to={paths.posts({ type, q, tag: t })} />
        ),
      )}
      {filtered ? (
        <span className={s.reset}>
          <TextLink to={paths.posts({ type })}>필터 해제</TextLink>
        </span>
      ) : null}
    </div>
  );
}
