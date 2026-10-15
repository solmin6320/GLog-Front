/**
 * 가입 승인 탭의 낙관적 캐시 갱신. adminMembers 목록은 필터 · 검색마다 따로 저장된다(client.ts keyArgs).
 * 상태가 바뀐 회원을 저장된 목록마다 반영한다:
 * - 그 목록 필터에 더는 맞지 않으면 행을 뺀다 (승인 대기 목록에서 승인 · 거절)
 * - 맞으면 상태만 바꾼다 (전체 목록에서 거절 · 되돌리기)
 * - 들어가야 하는데 없던 목록은 버린다 → 다음에 볼 때 새로 받는다 (cache-and-network)
 */
import type { ApolloCache, Reference } from '@apollo/client';

type StoredRow = { member: Reference; status: string } & Record<string, unknown>;
type StoredConnection = { nodes?: StoredRow[]; totalCount?: number } & Record<string, unknown>;

/** 'adminMembers:{"filter":"REJECTED","first":20}' → 'REJECTED'. filter가 없으면 서버 기본값 PENDING */
export function filterOfStoreFieldName(storeFieldName: string): string {
  const i = storeFieldName.indexOf(':');
  if (i < 0) return 'PENDING';
  try {
    const args = JSON.parse(storeFieldName.slice(i + 1)) as { filter?: unknown };
    return typeof args.filter === 'string' ? args.filter : 'PENDING';
  } catch {
    return 'PENDING';
  }
}

/** AdminMemberFilter: ALL = 승인 대기 + 거절 (스키마 설명) */
export function filterIncludes(filter: string, status: string): boolean {
  return filter === 'ALL' ? status === 'PENDING' || status === 'REJECTED' : filter === status;
}

export function applyMemberStatus(cache: ApolloCache, memberId: string, status: string): void {
  cache.modify({
    id: 'ROOT_QUERY',
    fields: {
      adminMembers(existing, { readField, storeFieldName, DELETE }) {
        const conn = existing as StoredConnection;
        const nodes = conn.nodes ?? [];
        const index = nodes.findIndex((n) => readField<string>('id', n.member) === memberId);
        const belongs = filterIncludes(filterOfStoreFieldName(storeFieldName), status);
        if (index < 0) return belongs ? DELETE : existing;
        if (!belongs) {
          return {
            ...conn,
            nodes: nodes.filter((_, i) => i !== index),
            totalCount: typeof conn.totalCount === 'number' ? Math.max(0, conn.totalCount - 1) : conn.totalCount,
          };
        }
        return { ...conn, nodes: nodes.map((n, i) => (i === index ? { ...n, status } : n)) };
      },
    },
  });
}
