import { InMemoryCache } from '@apollo/client';
import { parse } from 'graphql';
import { describe, expect, it } from 'vitest';
import { createTypePolicies } from './client';
import { nodesConnection } from './pagination';

const Notices = parse(`
  query Notices($first: Int, $after: String) {
    notices(first: $first, after: $after) { nodes { id title } pageInfo { hasNextPage endCursor } totalCount }
  }
`);

const node = (id: string) => ({ __typename: 'Notice', id, title: `공지 ${id}` });
const page = (ids: string[], hasNextPage: boolean, endCursor: string | null, totalCount = 3) => ({
  notices: {
    __typename: 'NoticeConnection',
    nodes: ids.map(node),
    pageInfo: { __typename: 'PageInfo', hasNextPage, endCursor },
    totalCount,
  },
});

type NoticesData = ReturnType<typeof page>;

describe('nodesConnection', () => {
  it('after가 있으면 이어 붙이고, 없으면 교체한다', () => {
    const cache = new InMemoryCache({ typePolicies: createTypePolicies() });
    cache.writeQuery({ query: Notices, variables: { first: 2 }, data: page(['1', '2'], true, 'c2') });
    cache.writeQuery({ query: Notices, variables: { first: 2, after: 'c2' }, data: page(['3'], false, 'c3') });

    const merged = cache.readQuery<NoticesData>({ query: Notices, variables: { first: 2 } });
    expect(merged?.notices.nodes.map((n) => n.id)).toEqual(['1', '2', '3']);
    expect(merged?.notices.pageInfo).toEqual({ __typename: 'PageInfo', hasNextPage: false, endCursor: 'c3' });

    // 다시 불러오기(after 없음) → 첫 페이지로 교체
    cache.writeQuery({ query: Notices, variables: { first: 2 }, data: page(['1', '2'], true, 'c2') });
    const replaced = cache.readQuery<NoticesData>({ query: Notices, variables: { first: 2 } });
    expect(replaced?.notices.nodes.map((n) => n.id)).toEqual(['1', '2']);
  });

  it('first가 다르면 다른 목록이다 (CM-01 공지 3건이 NT-01 목록을 덮지 않는다)', () => {
    const cache = new InMemoryCache({ typePolicies: createTypePolicies() });
    cache.writeQuery({ query: Notices, variables: { first: 20 }, data: page(['1', '2', '3'], false, 'c3') });
    cache.writeQuery({ query: Notices, variables: { first: 1 }, data: page(['1'], true, 'c1') });
    expect(cache.readQuery<NoticesData>({ query: Notices, variables: { first: 20 } })?.notices.nodes).toHaveLength(3);
  });

  it('merge 함수 단독', () => {
    const policy = nodesConnection(['filter']);
    expect(policy.keyArgs).toEqual(['filter']);
    const merge = policy.merge as (e: unknown, i: unknown, o: { args: Record<string, unknown> | null }) => { nodes: unknown[] };
    expect(merge(undefined, { nodes: [1] }, { args: { after: 'x' } }).nodes).toEqual([1]);
    expect(merge({ nodes: [1] }, { nodes: [2] }, { args: { after: 'x' } }).nodes).toEqual([1, 2]);
    expect(merge({ nodes: [1] }, { nodes: [2] }, { args: null }).nodes).toEqual([2]);
  });
});
