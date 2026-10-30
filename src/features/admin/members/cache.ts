/**
 * 가입 승인 탭의 낙관적 캐시 갱신. adminMembers 목록은 필터 · 검색마다 따로 저장된다(client.ts keyArgs).
 * 상태가 바뀐 회원을 저장된 목록마다 반영한다:
 * - 그 목록 필터에 더는 맞지 않으면 행을 뺀다 (승인 대기 목록에서 승인 · 거절)
 * - 맞으면 그대로 둔다 — 상태는 정규화된 AdminMember에서 바뀐다 (전체 목록에서 거절 · 되돌리기)
 * - 들어가야 하는데 없던 목록은 버린다 → 다음에 볼 때 새로 받는다 (cache-and-network)
 */
import type { ApolloCache, Reference } from '@apollo/client';

type StoredPage = { items?: Reference[]; totalCount?: number } & Record<string, unknown>;

/** 'adminMembers:{"status":"REJECTED"}' → 'REJECTED'. status가 없으면 서버 기본값 PENDING */
export function filterOfStoreFieldName(storeFieldName: string): string {
  const i = storeFieldName.indexOf(':');
  if (i < 0) return 'PENDING';
  try {
    const args = JSON.parse(storeFieldName.slice(i + 1)) as { status?: unknown };
    return typeof args.status === 'string' ? args.status : 'PENDING';
  } catch {
    return 'PENDING';
  }
}

/** MemberApprovalFilter: ALL = 승인 대기 + 거절 (스키마 설명) */
export function filterIncludes(filter: string, status: string): boolean {
  return filter === 'ALL' ? status === 'PENDING' || status === 'REJECTED' : filter === status;
}

export function applyMemberStatus(cache: ApolloCache, memberId: string, status: string): void {
  cache.modify({
    id: 'ROOT_QUERY',
    fields: {
      adminMembers(existing, { readField, storeFieldName, DELETE }) {
        // 행은 AdminMember:{id}로 정규화돼 상태 글자는 뮤테이션 결과로 바뀐다. 여기선 목록에 넣고 빼기만 한다
        const page = existing as StoredPage;
        const items = page.items ?? [];
        const index = items.findIndex((ref) => readField<string>('id', ref) === memberId);
        const belongs = filterIncludes(filterOfStoreFieldName(storeFieldName), status);
        if (index < 0) return belongs ? DELETE : existing;
        if (belongs) return existing;
        return {
          ...page,
          items: items.filter((_, i) => i !== index),
          totalCount: typeof page.totalCount === 'number' ? Math.max(0, page.totalCount - 1) : page.totalCount,
        };
      },
    },
  });
}
