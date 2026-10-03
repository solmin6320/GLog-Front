/**
 * 커서 목록 캐시 정책 (설계서 3-2 · A3 8-1).
 * Connection 모양 `{ nodes, pageInfo, totalCount }` — Relay `edges`가 아니라서 relayStylePagination 대신 이걸 쓴다.
 * - `after`가 있으면(= 더 보기) 기존 nodes 뒤에 이어 붙이고 pageInfo · totalCount는 새 값으로
 * - `after`가 없으면(= 첫 페이지 · 다시 불러오기) 통째로 교체
 * keyArgs에는 필터 인수와 `first`를 넣는다(`after`는 넣지 않는다). usePagedList는 `first`를 고정한다.
 */
import type { FieldPolicy } from '@apollo/client';

type KeyArgs = FieldPolicy['keyArgs'];

type NodesConnectionShape = { nodes?: ReadonlyArray<unknown> | null } & Record<string, unknown>;

export function nodesConnection(keyArgs: KeyArgs = ['first']): FieldPolicy<NodesConnectionShape> {
  return {
    keyArgs,
    merge(existing, incoming, { args }) {
      if (!existing || !args?.after) return incoming;
      return { ...incoming, nodes: [...(existing.nodes ?? []), ...(incoming.nodes ?? [])] };
    },
  };
}
