/**
 * 커서 목록 훅 (설계서 3-3 · 요구사항 6-5). 화면은 Connection 모양을 모른다.
 *   const list = usePagedList(PostListQuery, { variables: { filter }, select: (d) => d.posts });
 *   list.nodes · list.totalCount · list.hasMore · list.loadMore() · list.loadingMore · list.loadMoreError · list.refetch()
 * 문서는 `$first: Int` · `$after: String` 변수를 받아야 한다(이름 고정). first = pageSize(기본 20).
 * 이어 붙이기는 캐시 정책(nodesConnection)이 한다. [더 보기] 실패는 목록을 지우지 않는다(loadMoreError).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { NetworkStatus } from '@apollo/client';
import type { OperationVariables, TypedDocumentNode } from '@apollo/client';
import { skipToken, useQuery } from '@apollo/client/react';

export type PagedConnection<TNode> = {
  nodes: TNode[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
  totalCount?: number;
};

export type PagedList<TData, TNode> = {
  nodes: TNode[];
  totalCount: number | null;
  hasMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  loadMoreError: boolean;
  loading: boolean;
  error: unknown;
  data: TData | undefined;
  refetch: () => void;
};

export const DEFAULT_PAGE_SIZE = 20;

const EMPTY: never[] = [];

export function usePagedList<TData, TVars extends OperationVariables, TNode>(
  doc: TypedDocumentNode<TData, TVars>,
  o: {
    variables: TVars;
    select: (d: TData) => PagedConnection<TNode> | null | undefined;
    skip?: boolean;
    pageSize?: number;
  },
): PagedList<TData, TNode> {
  const first = o.pageSize ?? DEFAULT_PAGE_SIZE;
  const variables = { ...o.variables, first } as TVars;
  // 제네릭 TVars로는 useQuery 오버로드가 풀리지 않아 옵션 타입만 넓힌다
  const q = useQuery(doc as TypedDocumentNode<TData, OperationVariables>, o.skip ? skipToken : { variables });

  const data = q.data as TData | undefined;
  const conn = data ? o.select(data) : null;
  const hasMore = !!conn?.pageInfo.hasNextPage;
  const endCursor = conn?.pageInfo.endCursor ?? null;

  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const busy = useRef(false);

  const fetchMore = q.fetchMore;
  const refetchQuery = q.refetch;
  const latest = useRef({ fetchMore, refetchQuery });
  useEffect(() => {
    latest.current = { fetchMore, refetchQuery };
  });

  const loadMore = useCallback(() => {
    if (!hasMore || busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    setLoadMoreError(false);
    latest.current
      .fetchMore({ variables: { after: endCursor, first } })
      .then(
        () => undefined,
        () => setLoadMoreError(true),
      )
      .finally(() => {
        busy.current = false;
        setLoadingMore(false);
      });
  }, [hasMore, endCursor, first]);

  const refetch = useCallback(() => {
    setLoadMoreError(false);
    // after 없이 다시 부르면 캐시 정책이 목록을 첫 페이지로 바꾼다. 실패는 q.error로 보인다.
    latest.current.refetchQuery().catch(() => undefined);
  }, []);

  return {
    nodes: conn?.nodes ?? EMPTY,
    totalCount: conn?.totalCount ?? null,
    hasMore,
    loadMore,
    loadingMore,
    loadMoreError,
    // [더 보기] 중에는 첫 로딩 상태를 켜지 않는다(목록 유지)
    loading: q.loading && q.networkStatus !== NetworkStatus.fetchMore,
    error: q.error,
    data,
    refetch,
  };
}
