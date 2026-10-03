import type { ReactNode } from 'react';
import { skipToken, useQuery } from '@apollo/client/react';
import { useNavigate, useSearchParams } from 'react-router';
import type { PostFilter } from '@/gql/graphql';
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/api';
import { parsePostsSearch, paths, postTypeToEnum, type PostTypeParam } from '@/shared/lib/paths';
import { EmptyState, LinkButton, LoadMore, PageContainer, QueryBoundary, Segmented, TextLink } from '@/shared/ui';
import { PostListQuery, PostTagsQuery, PostTypeCountsQuery } from '../api';
import { BoardSearch } from '../components/BoardSearch';
import { PostListItem, PostListSkeleton } from '../components/PostListItem';
import { TagFilter } from '../components/TagFilter';
import { POST_TYPE_LABEL } from '../postText';
import s from './PostListPage.module.css';

const TYPES: PostTypeParam[] = ['troubleshooting', 'devlog'];
const typeLabel = (t: PostTypeParam) => POST_TYPE_LABEL[postTypeToEnum(t)];

/**
 * BD-01 게시판 목록 (화면설계서 5-1-6 · W-11 · W-05). 헤더 검색(5-1-0-1)의 결과 화면도 이것 하나다.
 * 상태는 URL(`?type=&q=&tag=`)에만 둔다 — 새로고침 · 뒤로가기에서 그대로 돌아온다.
 */
export default function PostListPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { type, q, tag } = parsePostsSearch(sp);
  const go = (next: { type: PostTypeParam; q?: string; tag?: string }) => void navigate(paths.posts(next));

  const where: PostFilter = { ...(q ? { query: q } : {}), ...(tag ? { tag } : {}) };
  const filtered = !!q || !!tag;

  const list = usePagedList(PostListQuery, {
    variables: { filter: { type: postTypeToEnum(type), ...where } },
    select: (d) => d.posts,
  });
  // 탭별 건수(①)와 "다른 탭에 n건"(⑫)은 거를 때만
  const counts = useQuery(PostTypeCountsQuery, filtered ? { variables: { filter: where } } : skipToken);
  const tags = useQuery(PostTagsQuery);

  const countOf = (t: PostTypeParam) =>
    t === 'devlog' ? counts.data?.postTypeCounts.devlog : counts.data?.postTypeCounts.troubleshooting;

  const board = (body: ReactNode) => (
    <>
      <h1 className="visually-hidden">게시판</h1>
      <div className={s.top}>
        <Segmented
          items={TYPES.map((t) => ({ value: t, label: typeLabel(t), count: q ? (countOf(t) ?? null) : null }))}
          value={type}
          onChange={(t) => go({ type: t, q, tag })}
          ariaLabel="글 종류"
        />
        <LinkButton to={paths.postNew({ type })} icon="pencil">
          글쓰기
        </LinkButton>
      </div>
      <div className={s.search}>
        <BoardSearch current={q ?? ''} onSearch={(next) => go({ type, q: next, tag })} />
      </div>
      <TagFilter tags={(tags.data?.popularTags ?? []).map((t) => t.tag)} type={type} q={q} tag={tag} />
      {body}
    </>
  );

  const other = TYPES.find((t) => t !== type) ?? 'devlog';
  const otherCount = countOf(other) ?? 0;

  const empty = filtered ? (
    <EmptyState
      icon="search"
      title="검색 결과가 없어요."
      body={
        <>
          다른 말로 찾아보세요.
          {otherCount > 0 ? (
            <span className={s.otherTab}>
              <TextLink to={paths.posts({ type: other, q, tag })}>
                {typeLabel(other)}에 {otherCount}건 있어요
              </TextLink>
            </span>
          ) : null}
        </>
      }
      action={
        <LinkButton to={paths.posts({ type })} variant="outline">
          필터 해제
        </LinkButton>
      }
    />
  ) : (
    <EmptyState
      icon="file"
      title="아직 글이 없어요."
      body="첫 글을 남겨보세요."
      action={
        <LinkButton to={paths.postNew({ type })} icon="pencil">
          글쓰기
        </LinkButton>
      }
    />
  );

  return (
    <PageContainer>
      <QueryBoundary
        loading={list.loading}
        error={list.error}
        data={list.data}
        onRetry={list.refetch}
        skeleton={board(<PostListSkeleton />)}
      >
        {() =>
          board(
            <>
              {q ? (
                <p className={s.summary}>
                  <b>‘{q}’</b>{' '}
                  <span className={s.muted}>검색 결과 {list.totalCount ?? 0}건 · 제목 · 내용 · 태그에서 찾았어요</span>
                </p>
              ) : null}
              {list.nodes.length === 0 ? (
                empty
              ) : (
                <>
                  <ul className={s.list} aria-label={`${typeLabel(type)} 글 목록`}>
                    {list.nodes.map((post) => (
                      <PostListItem key={post.id} post={post} q={q} type={type} />
                    ))}
                  </ul>
                  <LoadMore
                    hasMore={list.hasMore}
                    loading={list.loadingMore}
                    error={list.loadMoreError}
                    onLoadMore={list.loadMore}
                    endText={list.nodes.length > DEFAULT_PAGE_SIZE ? undefined : null}
                  />
                </>
              )}
            </>,
          )
        }
      </QueryBoundary>
    </PageContainer>
  );
}
