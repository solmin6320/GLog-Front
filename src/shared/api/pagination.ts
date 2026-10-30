/** 커서 목록 캐시 정책 (설계서 3-2) */
import type { FieldPolicy } from '@apollo/client';

type KeyArgs = FieldPolicy['keyArgs'];

/**
 * 백엔드 `{ items, nextCursor }` 목록 캐시 정책 (Q-06). `after`가 있으면 items를 이어 붙이고, 없으면 통째로 교체한다.
 * 백엔드 목록은 `first` 인수가 없어 keyArgs에는 필터 인수만 넣는다.
 */
type ItemsPageShape = { items?: ReadonlyArray<unknown> | null } & Record<string, unknown>;

export function itemsPage(keyArgs: KeyArgs = false): FieldPolicy<ItemsPageShape> {
  return {
    keyArgs,
    merge(existing, incoming, { args }) {
      if (!existing || !args?.after) return incoming;
      return { ...incoming, items: [...(existing.items ?? []), ...(incoming.items ?? [])] };
    },
  };
}

/** `{ items, nextCursor, totalCount? }`를 usePagedList가 읽는 `{ nodes, pageInfo, totalCount }` 모양으로 바꾼다 */
export function toPaged<T>(page: { items: T[]; nextCursor?: string | null; totalCount?: number } | null | undefined) {
  if (!page) return page;
  return {
    nodes: page.items,
    pageInfo: { hasNextPage: !!page.nextCursor, endCursor: page.nextCursor ?? null },
    totalCount: page.totalCount,
  };
}
