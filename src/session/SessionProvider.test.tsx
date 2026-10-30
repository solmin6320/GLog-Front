import type { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { parse } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApolloClient } from '@/shared/api/client';
import { fakeFetch, gqlErrorResponse, jsonResponse, networkFailure } from '@/shared/api/fakeFetch.testutil';
import { tokenStore } from '@/shared/api/tokenStore';
import { useClock, useIsAdmin, useSession } from './hooks';
import { SessionProvider } from './SessionProvider';
import type { Session, SessionStatus } from './types';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/shared/ui', () => ({ useToast: () => toast }));

const CLOCK = { __typename: 'ServerClock', now: '2026-10-01T10:00:00+09:00', currentWeekStart: '2026-09-28', currentWeekEnd: '2026-10-04' };
const me = (status: string, hasTeam = true) => ({
  __typename: 'Me',
  id: '1',
  status,
  role: 'ADMIN',
  hasTeam,
  pendingInvitationCount: 2,
  member: { __typename: 'Member', id: '1', nickname: '한동관', githubLogin: 'handong-gwan', profileImageUrl: null },
});

type Srv = {
  meStatus: 'ACTIVE' | 'PENDING' | 'REJECTED';
  sessionError: string | null;
  sessionNetworkFail: boolean;
  exchange: (code: string) => Response;
  other: () => Response;
  calls: string[];
};

function setup(opts: { token?: string; configure?: (srv: Srv) => void } = {}) {
  if (opts.token) tokenStore.set(opts.token);
  const srv: Srv = {
    meStatus: 'ACTIVE',
    sessionError: null,
    sessionNetworkFail: false,
    exchange: () => jsonResponse({ data: { exchangeLoginCode: { __typename: 'AuthPayload', status: 'ACTIVE', accessToken: 'tok', expiresAt: null } } }),
    other: () => jsonResponse({ data: { clock: CLOCK } }),
    calls: [],
  };
  opts.configure?.(srv);
  const fetch = fakeFetch(({ operationName, variables, headers }) => {
    srv.calls.push(operationName);
    switch (operationName) {
      case 'SessionQuery':
        if (srv.sessionNetworkFail) return networkFailure();
        if (srv.sessionError) return gqlErrorResponse(srv.sessionError, {}, { clock: CLOCK, me: null });
        return jsonResponse({ data: { clock: CLOCK, me: headers.get('authorization') ? me(srv.meStatus) : null } });
      case 'SessionExchangeLoginCode':
        return srv.exchange(String(variables.code));
      case 'SessionLogout':
        return jsonResponse({ data: { logout: true } });
      default:
        return srv.other();
    }
  });
  const client = createApolloClient({ uri: 'http://test/graphql', fetch });
  const history: [SessionStatus, string | null][] = [];
  const ref: { current: Session | null; isAdmin: boolean } = { current: null, isAdmin: false };

  function Probe() {
    const s = useSession();
    ref.current = s;
    ref.isAdmin = useIsAdmin();
    history.push([s.status, s.viewer?.nickname ?? null]);
    return (
      <div>
        <span data-testid="status">{s.status}</span>
        <span data-testid="hasTeam">{String(s.viewer?.hasTeam ?? '-')}</span>
        {s.clock && <ClockProbe />}
      </div>
    );
  }
  function ClockProbe() {
    return <span data-testid="today">{useClock().today}</span>;
  }

  render(
    <ApolloProvider client={client}>
      <SessionProvider>
        <Probe />
      </SessionProvider>
    </ApolloProvider>,
  );
  const session = () => {
    if (!ref.current) throw new Error('not rendered');
    return ref.current;
  };
  const count = (op: string) => srv.calls.filter((c) => c === op).length;
  return { srv, client: client as ApolloClient, history, session, ref, count };
}

const status = () => screen.getByTestId('status').textContent;

describe('SessionProvider', () => {
  beforeEach(() => {
    toast.error.mockReset();
    toast.info.mockReset();
  });

  it('토큰이 없으면 바로 ANONYMOUS, 시계는 받아 둔다', async () => {
    const { history } = setup();
    expect(history[0]?.[0]).toBe('ANONYMOUS');
    await waitFor(() => expect(screen.getByTestId('today').textContent).toBe('2026-10-01'));
    expect(status()).toBe('ANONYMOUS');
    expect(history.some(([s]) => s === 'LOADING')).toBe(false);
  });

  it('토큰이 있으면 LOADING → me.status, viewer · clock 매핑', async () => {
    const { history, session, ref } = setup({ token: 'tok' });
    expect(history[0]?.[0]).toBe('LOADING');
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    expect(session().viewer).toEqual({
      id: '1',
      memberId: '1',
      nickname: '한동관',
      githubLogin: 'handong-gwan',
      profileImageUrl: null,
      role: 'ADMIN',
      hasTeam: true,
      pendingInvitationCount: 2,
    });
    expect(session().clock).toEqual({ now: '2026-10-01T10:00:00+09:00', today: '2026-10-01', currentWeekStart: '2026-09-28', currentWeekEnd: '2026-10-04' });
    expect(ref.isAdmin).toBe(true);
  });

  it('PENDING · REJECTED 상태를 그대로 쓴다', async () => {
    const { srv, session } = setup({ token: 'tok' });
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    srv.meStatus = 'PENDING';
    await act(async () => {
      expect(await session().refresh()).toBe('PENDING');
    });
    expect(status()).toBe('PENDING');
    expect(session().viewer?.githubLogin).toBe('handong-gwan');
  });

  it('completeLogin: 같은 code는 한 번만 교환한다 (StrictMode)', async () => {
    const { session, count } = setup();
    await waitFor(() => expect(screen.getByTestId('today')).toBeInTheDocument());
    const s = session();
    let a!: Promise<SessionStatus>;
    let b!: Promise<SessionStatus>;
    await act(async () => {
      a = s.completeLogin('mock-member');
      b = s.completeLogin('mock-member');
      expect(b).toBe(a);
      expect(await a).toBe('ACTIVE');
    });
    expect(await b).toBe('ACTIVE');
    expect(count('SessionExchangeLoginCode')).toBe(1);
    expect(tokenStore.get()).toBe('tok');
    expect(status()).toBe('ACTIVE');
    expect(session().completeLogin).toBe(s.completeLogin); // 정체성 유지 (effect deps)

    // 끝난 뒤 같은 code를 다시 쓰면(목 재로그인) 새로 교환한다
    await act(async () => {
      await session().completeLogin('mock-member');
    });
    expect(count('SessionExchangeLoginCode')).toBe(2);
  });

  it('completeLogin: 거절(토큰 없음) → REJECTED, viewer 없음', async () => {
    const { srv, session } = setup();
    srv.exchange = () =>
      jsonResponse({ data: { exchangeLoginCode: { __typename: 'AuthPayload', status: 'REJECTED', accessToken: null, expiresAt: null } } });
    await act(async () => {
      expect(await session().completeLogin('mock-rejected')).toBe('REJECTED');
    });
    expect(status()).toBe('REJECTED');
    expect(session().viewer).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });

  it('completeLogin: 잘못된 code → LOGIN_CODE_INVALID로 reject, 만료 토스트 없음', async () => {
    const { srv, session } = setup();
    srv.exchange = () => gqlErrorResponse('LOGIN_CODE_INVALID', { classification: 'BAD_REQUEST' });
    await act(async () => {
      await expect(session().completeLogin('bad')).rejects.toEqual({ code: 'LOGIN_CODE_INVALID', category: 'validation' });
    });
    expect(status()).toBe('ANONYMOUS');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('signOut: logout → 토큰 삭제 → ANONYMOUS와 viewer null이 한 번에', async () => {
    const { history, session, count } = setup({ token: 'tok' });
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    await act(async () => {
      await session().signOut();
    });
    expect(count('SessionLogout')).toBe(1);
    expect(tokenStore.get()).toBeNull();
    expect(status()).toBe('ANONYMOUS');
    expect(session().viewer).toBeNull();
    const firstActive = history.findIndex(([s]) => s === 'ACTIVE');
    const after = history.slice(firstActive);
    expect(after.some(([s, nick]) => s === 'ANONYMOUS' && nick !== null)).toBe(false);
    expect(after.some(([s, nick]) => s === 'ACTIVE' && nick === null)).toBe(false);
  });

  it('만료: 동시에 401이 여러 개 와도 토큰 폐기 · ANONYMOUS · 토스트 1번', async () => {
    const { srv, client } = setup({ token: 'tok' });
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    srv.other = () => gqlErrorResponse('UNAUTHENTICATED', { classification: 'UNAUTHORIZED' });
    await act(async () => {
      await Promise.all([
        client.query({ query: parse('query Other1 { clock { now } }'), fetchPolicy: 'network-only' }).catch(() => undefined),
        client.query({ query: parse('query Other2 { clock { now } }'), fetchPolicy: 'network-only' }).catch(() => undefined),
      ]);
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('로그인이 만료됐어요. 다시 로그인해 주세요.');
    expect(tokenStore.get()).toBeNull();
    expect(status()).toBe('ANONYMOUS');
  });

  it('시작할 때 토큰이 만료돼 있으면 ANONYMOUS + 만료 토스트', async () => {
    setup({ token: 'stale', configure: (srv) => (srv.sessionError = 'UNAUTHENTICATED') });
    await waitFor(() => expect(status()).toBe('ANONYMOUS'));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(tokenStore.get()).toBeNull();
  });

  it("다른 요청이 ACCOUNT_PENDING이면 'status-changed' → 재조회 → PENDING", async () => {
    const { srv, client } = setup({ token: 'tok' });
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    srv.meStatus = 'PENDING';
    srv.other = () => gqlErrorResponse('ACCOUNT_PENDING', { classification: 'FORBIDDEN' });
    await act(async () => {
      await client.query({ query: parse('query Other3 { clock { now } }'), fetchPolicy: 'network-only' }).catch(() => undefined);
    });
    await waitFor(() => expect(status()).toBe('PENDING'));
  });

  it('viewer는 캐시를 따라간다 — 다른 쿼리가 me.hasTeam을 다시 받으면 바뀐다', async () => {
    const { srv, client } = setup({ token: 'tok' });
    await waitFor(() => expect(screen.getByTestId('hasTeam').textContent).toBe('true'));
    srv.other = () => jsonResponse({ data: { me: { __typename: 'Me', id: '1', hasTeam: false } } });
    await act(async () => {
      await client.query({ query: parse('query Other4 { me { id hasTeam } }'), fetchPolicy: 'network-only' });
    });
    await waitFor(() => expect(screen.getByTestId('hasTeam').textContent).toBe('false'));
  });

  it('refresh 연결 실패 → NETWORK로 reject, 상태는 그대로', async () => {
    const { srv, session } = setup({ token: 'tok' });
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    srv.sessionNetworkFail = true;
    await act(async () => {
      await expect(session().refresh()).rejects.toEqual({ code: 'NETWORK', category: 'network' });
    });
    expect(status()).toBe('ACTIVE');
  });

  it('시작 조회가 연결 실패면 ANONYMOUS로 (빈 화면에 갇히지 않는다), 토큰은 남긴다', async () => {
    const { history } = setup({ token: 'tok', configure: (srv) => (srv.sessionNetworkFail = true) });
    expect(history[0]?.[0]).toBe('LOADING');
    await waitFor(() => expect(status()).toBe('ANONYMOUS'));
    expect(tokenStore.get()).toBe('tok');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('loginUrl: bridge 모드는 백엔드 GitHub OAuth 시작 주소로 (페르소나는 무시)', () => {
    const { session } = setup();
    expect(session().loginUrl()).toBe('http://localhost:8080/oauth2/authorization/github');
    expect(session().loginUrl('plain')).toBe('http://localhost:8080/oauth2/authorization/github');
  });
});
