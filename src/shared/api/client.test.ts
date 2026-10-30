import { parse } from 'graphql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApolloClient } from './client';
import { fakeFetch, gqlErrorResponse, jsonResponse, networkFailure, type FakeHandler } from './fakeFetch.testutil';
import { normalizeError } from './errors';
import { sessionEvents } from './sessionEvents';
import { tokenStore } from './tokenStore';

const Ping = parse('query Ping { me { id } }');
const Exchange = parse('mutation SessionExchangeAuthCode($code: String!) { exchangeAuthCode(code: $code) { accessToken } }');
const SessionQ = parse('query SessionQuery { me { id status } }');

function setup(handler: FakeHandler) {
  const fetch = fakeFetch(handler);
  const client = createApolloClient({ uri: 'http://test/graphql', fetch });
  return { client, fetch };
}

describe('Apollo 링크', () => {
  const expired = vi.fn();
  const statusChanged = vi.fn();
  let offs: (() => void)[] = [];

  beforeEach(() => {
    expired.mockReset();
    statusChanged.mockReset();
    offs = [sessionEvents.on('expired', expired), sessionEvents.on('status-changed', statusChanged)];
  });
  afterEach(() => {
    offs.forEach((off) => off());
    tokenStore.clear();
  });

  it('토큰이 있으면 Authorization: Bearer를 붙이고, 없으면 붙이지 않는다', async () => {
    const seen: (string | null)[] = [];
    const { client } = setup(({ headers }) => {
      seen.push(headers.get('authorization'));
      return jsonResponse({ data: { me: { __typename: 'Me', id: '1' } } });
    });
    await client.query({ query: Ping, fetchPolicy: 'network-only' });
    tokenStore.set('t1');
    await client.query({ query: Ping, fetchPolicy: 'network-only' });
    expect(seen).toEqual([null, 'Bearer t1']);
  });

  it("지금 토큰으로 보낸 요청이 UNAUTHENTICATED면 'expired'", async () => {
    tokenStore.set('t1');
    const { client } = setup(() => gqlErrorResponse('UNAUTHENTICATED', { classification: 'UNAUTHORIZED' }));
    const err = await client.query({ query: Ping }).catch((e: unknown) => e);
    expect(normalizeError(err).code).toBe('UNAUTHENTICATED');
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("HTTP 401도 'expired'", async () => {
    tokenStore.set('t1');
    const { client } = setup(() => new Response('', { status: 401 }));
    const err = await client.query({ query: Ping }).catch((e: unknown) => e);
    expect(normalizeError(err).code).toBe('UNAUTHENTICATED');
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("토큰 없이 보낸 요청 · 로그인 코드 교환의 UNAUTHENTICATED는 'expired'가 아니다", async () => {
    const { client } = setup(() => gqlErrorResponse('UNAUTHENTICATED'));
    await client.query({ query: Ping }).catch(() => undefined);
    tokenStore.set('t1');
    await client.mutate({ mutation: Exchange, variables: { code: 'x' } }).catch(() => undefined);
    expect(expired).not.toHaveBeenCalled();
  });

  it("이전 토큰으로 보낸 요청의 늦은 401은 새 토큰을 지우지 않는다", async () => {
    tokenStore.set('old');
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { client, fetch } = setup(async () => {
      await gate;
      return gqlErrorResponse('UNAUTHENTICATED');
    });
    const pending = client.query({ query: Ping }).catch(() => undefined);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    tokenStore.set('new');
    release();
    await pending;
    expect(expired).not.toHaveBeenCalled();
  });

  it("ACCOUNT_PENDING · ACCOUNT_REJECTED → 'status-changed' (세션 조회 자신은 제외)", async () => {
    tokenStore.set('t1');
    const { client } = setup(({ operationName }) =>
      gqlErrorResponse(operationName === 'Ping' ? 'ACCOUNT_PENDING' : 'ACCOUNT_REJECTED', { classification: 'FORBIDDEN' }),
    );
    await client.query({ query: Ping }).catch(() => undefined);
    expect(statusChanged).toHaveBeenCalledTimes(1);
    await client.query({ query: SessionQ }).catch(() => undefined);
    expect(statusChanged).toHaveBeenCalledTimes(1);
    expect(expired).not.toHaveBeenCalled();
  });

  it('응답이 없으면 NETWORK, 사건은 없다', async () => {
    tokenStore.set('t1');
    const { client } = setup(networkFailure);
    const err = await client.query({ query: Ping }).catch((e: unknown) => e);
    expect(normalizeError(err)).toEqual({ code: 'NETWORK', category: 'network' });
    expect(expired).not.toHaveBeenCalled();
    expect(statusChanged).not.toHaveBeenCalled();
  });
});

describe('캐시 정책', () => {
  it('Me는 싱글턴(Me:{}) — 로그인한 본인 하나', () => {
    const { client } = setup(() => jsonResponse({}));
    client.writeQuery({
      query: parse('query A { me { id nickname } }'),
      data: { me: { __typename: 'Me', id: '1', nickname: '한동관' } },
    });
    const store = client.cache.extract() as Record<string, unknown>;
    expect(store['Me:{}']).toBeDefined();
    expect(store['Me:1']).toBeUndefined();
  });

  it('TeamMember는 정규화하지 않는다 (팀마다 isLeader · joinedAt이 다른 값 객체)', () => {
    const { client } = setup(() => jsonResponse({}));
    client.writeQuery({
      query: parse('query B { teamMembers(teamId: "1") { items { id nickname isLeader } nextCursor } }'),
      data: {
        teamMembers: {
          __typename: 'TeamMemberPage',
          items: [{ __typename: 'TeamMember', id: '1', nickname: '한동관', isLeader: true }],
          nextCursor: null,
        },
      },
    });
    const keys = Object.keys(client.cache.extract() as Record<string, unknown>);
    expect(keys.some((k) => k.startsWith('TeamMember'))).toBe(false);
  });

  it('AdminDashboardSummary는 서로 다른 필드를 골라 온 쿼리끼리 합친다', () => {
    const { client } = setup(() => jsonResponse({}));
    client.writeQuery({
      query: parse('query C1 { adminDashboardSummary { pendingMembers } }'),
      data: { adminDashboardSummary: { __typename: 'AdminDashboardSummary', pendingMembers: 3 } },
    });
    client.writeQuery({
      query: parse('query C2 { adminDashboardSummary { penaltyTargets } }'),
      data: { adminDashboardSummary: { __typename: 'AdminDashboardSummary', penaltyTargets: 2 } },
    });
    const both = client.readQuery({ query: parse('query C3 { adminDashboardSummary { pendingMembers penaltyTargets } }') });
    expect(both).toEqual({ adminDashboardSummary: { __typename: 'AdminDashboardSummary', pendingMembers: 3, penaltyTargets: 2 } });
  });

  it("기본 watchQuery 정책은 cache-and-network → cache-first", () => {
    const { client } = setup(() => jsonResponse({}));
    expect(client.defaultOptions.watchQuery).toMatchObject({ fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  });
});
