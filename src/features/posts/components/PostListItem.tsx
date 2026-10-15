import { Fragment } from 'react';
import { Link } from 'react-router';
import type { PostListQueryQuery } from '@/gql/graphql';
import { formatDateTimeMD } from '@/shared/lib/format';
import { paths, type PostTypeParam } from '@/shared/lib/paths';
import { Skeleton, StatusBadge, Tag, TeamTag, VisuallyHidden } from '@/shared/ui';
import { NOT_RECORD_TIP, splitByQuery } from '../postText';
import { useProfilePath } from '../useProfilePath';
import s from './PostListItem.module.css';

export type PostListNode = PostListQueryQuery['posts']['nodes'][number];

/** E-25 '인증 미포함' 배지 + 툴팁 */
export function NotRecordBadge() {
  return (
    <span className={s.notRecord} title={NOT_RECORD_TIP}>
      <StatusBadge kind="notRecord" />
      <VisuallyHidden>{` ${NOT_RECORD_TIP}`}</VisuallyHidden>
    </span>
  );
}

/**
 * BD-01 글 카드 (목업 .pi). 제목 링크가 카드 전체를 덮고(⑥), 태그(⑦) · 작성자(⑨) 링크는 그 위에 올라온다.
 * 검색어가 있으면 제목의 일치 부분을 <mark>로 강조한다.
 */
export function PostListItem({ post, q, type }: { post: PostListNode; q?: string; type: PostTypeParam }) {
  const profilePath = useProfilePath();
  const hasMeta = post.tags.length > 0 || !!post.publicTeam;
  return (
    <li className={s.item}>
      <div className={s.head}>
        <h2 className={s.title}>
          <Link to={paths.post(post.id)} className={s.link}>
            {splitByQuery(post.title, q).map((part, i) =>
              part.hit ? (
                <mark key={i} className={s.mark}>
                  {part.text}
                </mark>
              ) : (
                <Fragment key={i}>{part.text}</Fragment>
              ),
            )}
          </Link>
        </h2>
        {post.isRecord ? null : <NotRecordBadge />}
      </div>
      {hasMeta ? (
        <div className={s.meta}>
          {post.tags.map((tag) => (
            <Tag key={tag} label={tag} to={paths.posts({ type, q, tag })} />
          ))}
          <TeamTag label={post.publicTeam} />
        </div>
      ) : null}
      <p className={s.by}>
        <Link to={profilePath(post.author.id)} className={s.author}>
          {post.author.nickname}
        </Link>
        <span>{formatDateTimeMD(post.createdAt)}</span>
        <span>댓글 {post.commentCount}</span>
      </p>
    </li>
  );
}

/** E-54 카드 3개 스켈레톤 */
export function PostListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" className={s.skeleton}>
      <VisuallyHidden>불러오는 중이에요.</VisuallyHidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.skeletonItem} aria-hidden="true">
          <Skeleton width={`${50 + ((i * 19) % 30)}%`} height={18} />
          <span className={s.skeletonTags}>
            <Skeleton width={64} height={24} radius={12} />
            <Skeleton width={72} height={24} radius={12} />
          </span>
          <Skeleton width={150} height={13} />
        </div>
      ))}
    </div>
  );
}
