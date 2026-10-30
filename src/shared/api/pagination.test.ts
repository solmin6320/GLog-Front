import { InMemoryCache } from '@apollo/client';
import { parse } from 'graphql';
import { describe, expect, it } from 'vitest';
import { createTypePolicies } from './client';
import { itemsPage, toPaged } from './pagination';

const Notices = parse(`
  query Notices($after: String) {
    notices(after: $after) { items { id title } nextCursor }
  }
`);

const node = (id: string) => ({ __typename: 'Notice', id, title: `공지 ${id}` });
const page = (ids: string[], nextCursor: string | null) => ({
  notices: { __typename: 'NoticePage', items: ids.map(node), nextCursor },
});

type NoticesData = ReturnType<typeof page>;

describe('itemsPage (백엔드 { items, nextCursor })', () => {
  it('after가 있으면 이어 붙이고, 없으면 교체한다', () => {
    const cache = new InMemoryCache({ typePolicies: createTypePolicies() });
    cache.writeQuery({ query: Notices, variables: {}, data: page(['1', '2'], 'c2') });
    cache.writeQuery({ query: Notices, variables: { after: 'c2' }, data: page(['3'], null) });

    const merged = cache.readQuery<NoticesData>({ query: Notices, variables: {} });
    expect(merged?.notices.items.map((n) => n.id)).toEqual(['1', '2', '3']);
    expect(merged?.notices.nextCursor).toBeNull();

    // 다시 불러오기(after 없음) → 첫 페이지로 교체
    cache.writeQuery({ query: Notices, variables: {}, data: page(['1', '2'], 'c2') });
    const replaced = cache.readQuery<NoticesData>({ query: Notices, variables: {} });
    expect(replaced?.notices.items.map((n) => n.id)).toEqual(['1', '2']);
  });

  it('merge 함수 단독 · toPaged', () => {
    const merge = itemsPage().merge as (e: unknown, i: unknown, o: { args: Record<string, unknown> | null }) => { items: unknown[] };
    expect(merge(undefined, { items: [1] }, { args: { after: 'x' } }).items).toEqual([1]);
    expect(merge({ items: [1] }, { items: [2] }, { args: { after: 'x' } }).items).toEqual([1, 2]);
    expect(merge({ items: [1] }, { items: [2] }, { args: null }).items).toEqual([2]);
    expect(toPaged({ items: [1], nextCursor: 'c' })).toEqual({ nodes: [1], pageInfo: { hasNextPage: true, endCursor: 'c' } });
    expect(toPaged({ items: [], nextCursor: null })?.pageInfo.hasNextPage).toBe(false);
  });
});
