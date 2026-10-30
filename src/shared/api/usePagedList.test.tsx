import type { ReactNode } from 'react';
import type { TypedDocumentNode } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { parse } from 'graphql';
import { describe, expect, it } from 'vitest';
import { createApolloClient } from './client';
import { fakeFetch, jsonResponse, networkFailure } from './fakeFetch.testutil';
import { toPaged } from './pagination';
import { usePagedList } from './usePagedList';

type Notice = { __typename: 'Notice'; id: string; title: string };
type NoticesData = { notices: { items: Notice[]; nextCursor: string | null } };
type NoticesVars = { after?: string | null };

const Notices = parse(`
  query PagedNotices($after: String) {
    notices(after: $after) { items { id title } nextCursor }
  }
`) as TypedDocumentNode<NoticesData, NoticesVars>;

const ALL = ['1', '2', '3', '4', '5'];
// 백엔드처럼 페이지 크기는 서버가 정한다 (Apollo는 문서에 없는 first 변수를 보내지 않는다)
const PAGE = 2;

function server(opts: { failAfter?: string } = {}) {
  const state = { failOnce: opts.failAfter ?? null, calls: [] as NoticesVars[] };
  const fetch = fakeFetch(({ variables }) => {
    const v = variables as NoticesVars;
    state.calls.push(v);
    if (state.failOnce && v.after === state.failOnce) {
      state.failOnce = null;
      return networkFailure();
    }
    const start = v.after ? ALL.indexOf(v.after) + 1 : 0;
    const ids = ALL.slice(start, start + PAGE);
    const last = ids[ids.length - 1] ?? null;
    return jsonResponse({
      data: {
        notices: {
          __typename: 'NoticePage',
          items: ids.map((id) => ({ __typename: 'Notice', id, title: `공지 ${id}` })),
          nextCursor: start + ids.length < ALL.length ? last : null,
        },
      },
    });
  });
  const client = createApolloClient({ uri: 'http://test/graphql', fetch });
  const wrapper = ({ children }: { children: ReactNode }) => <ApolloProvider client={client}>{children}</ApolloProvider>;
  return { state, wrapper };
}

const usePaged = () => usePagedList(Notices, { variables: {}, select: (d) => toPaged(d.notices) });

describe('usePagedList', () => {
  it('[더 보기]는 after로 이어 붙이고 끝에서 hasMore=false', async () => {
    const { state, wrapper } = server();
    const { result } = renderHook(usePaged, { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.nodes.map((n) => n.id)).toEqual(['1', '2']));
    expect(result.current.hasMore).toBe(true);
    expect(state.calls[0]).toEqual({});

    act(() => result.current.loadMore());
    expect(result.current.loadingMore).toBe(true);
    await waitFor(() => expect(result.current.nodes.map((n) => n.id)).toEqual(['1', '2', '3', '4']));
    expect(state.calls[1]).toEqual({ after: '2' });
    expect(result.current.loading).toBe(false);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.nodes).toHaveLength(5));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loadingMore).toBe(false);
  });

  it('[더 보기] 실패는 목록을 지우지 않고 loadMoreError — 다시 누르면 이어 붙인다', async () => {
    const { wrapper } = server({ failAfter: '2' });
    const { result } = renderHook(usePaged, { wrapper });
    await waitFor(() => expect(result.current.nodes).toHaveLength(2));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreError).toBe(true));
    expect(result.current.nodes.map((n) => n.id)).toEqual(['1', '2']);
    expect(result.current.error).toBeUndefined();

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.nodes).toHaveLength(4));
    expect(result.current.loadMoreError).toBe(false);
  });

  it('refetch는 첫 페이지로 되돌린다', async () => {
    const { wrapper } = server();
    const { result } = renderHook(usePaged, { wrapper });
    await waitFor(() => expect(result.current.nodes).toHaveLength(2));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.nodes).toHaveLength(4));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.nodes).toHaveLength(2));
  });

  it('skip이면 요청하지 않는다', async () => {
    const { state, wrapper } = server();
    const { result } = renderHook(() => usePagedList(Notices, { variables: {}, select: (d) => toPaged(d.notices), skip: true }), { wrapper });
    await new Promise((r) => setTimeout(r, 20));
    expect(state.calls).toHaveLength(0);
    expect(result.current.nodes).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });
});
