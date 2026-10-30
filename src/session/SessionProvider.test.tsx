import type { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { parse } from 'graphql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApolloClient } from '@/shared/api/client';
import { fakeFetch, gqlErrorResponse, jsonResponse, networkFailure } from '@/shared/api/fakeFetch.testutil';
import { tokenStore } from '@/shared/api/tokenStore';
import { nowMs, setNowSource } from '@/shared/lib/nowSource';
import { useClock, useIsAdmin, useSession } from './hooks';
import { SessionProvider } from './SessionProvider';
import type { Session, SessionStatus } from './types';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/shared/ui', () => ({ useToast: () => toast }));

/** 세션 시계 기준 (백엔드에 서버 시각 API가 없어 nowSource에서 읽는다) */
const NOW = '2026-10-01T10:00:00+09:00';
const me = (status: string) => ({
  __typename: 'Me',
  id: '1',
  githubLogin: 'handong-gwan',
  nickname: '한동관',
  profileImageUrl: null,
  status,
  role: 'ADMIN',
});
const teams = [{ __typename: 'Team', id: '1' }];
const invitations = {
  __typename: 'ReceivedTeamInvitationPage',
  items: [
    { __typename: 'ReceivedTeamInvitation', id: '1' },
    { __typename: 'ReceivedTeamInvitation', id: '2' },
  ],
  nextCursor: null,
};
/** 팀 · 초대는 활성 회원만. 대기 · 거절이면 계정 상태 오류 (백엔드는 data 전체가 null) */
function teamsResponse(status: string) {
  if (status === 'ACTIVE') return jsonResponse({ data: { myTeams: teams, receivedTeamInvitations: invitations } });
  return gqlErrorResponse(status === 'PENDING' ? 'ACCOUNT_PENDING' : 'ACCOUNT_REJECTED', { classification: 'FORBIDDEN' });
}

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
    exchange: () =>
      jsonResponse({ data: { exchangeAuthCode: { __typename: 'AuthPayload', accessToken: 'tok', expiresIn: 43200, me: { __typename: 'Me', id: '1', status: 'ACTIVE' } } } }),
    other: () => jsonResponse({ data: { me: { __typename: 'Me', id: '1' } } }),
    calls: [],
  };
  opts.configure?.(srv);
  const fetch = fakeFetch(({ operationName, variables, headers }) => {
    srv.calls.push(operationName);
    switch (operationName) {
      case 'SessionQuery':
        if (srv.sessionNetworkFail) return networkFailure();
        if (srv.sessionError) return gqlErrorResponse(srv.sessionError, {}, { me: null });
        if (!headers.get('authorization')) return gqlErrorResponse('UNAUTHENTICATED', { classification: 'UNAUTHORIZED' });
        return jsonResponse({ data: { me: me(srv.meStatus) } });
      case 'SessionTeamsQuery':
        return teamsResponse(srv.meStatus);
      case 'SessionExchangeAuthCode':
        return srv.exchange(String(variables.code));
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
  const original = nowMs;
  beforeEach(() => {
    toast.error.mockReset();
    toast.info.mockReset();
    setNowSource(() => Date.parse(NOW));
  });
  afterEach(() => setNowSource(original));

  it('대기 회원은 팀 · 초대 쿼리를 부르지 않는다 (백엔드에서 data 전체가 null이 되므로)', async () => {
    const { count } = setup({ token: 'tok', configure: (srv) => (srv.meStatus = 'PENDING') });
    await waitFor(() => expect(status()).toBe('PENDING'));
    expect(count('SessionQuery')).toBe(1);
    expect(count('SessionTeamsQuery')).toBe(0);
  });

  it('토큰이 없으면 바로 ANONYMOUS, me를 부르지 않고 시계는 있다', async () => {
    const { history, count } = setup();
    expect(count('SessionQuery')).toBe(0);
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
    expect(session().clock).toEqual({ now: NOW, today: '2026-10-01', currentWeekStart: '2026-09-28', currentWeekEnd: '2026-10-04' });
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
    // 대기 회원은 팀 · 초대를 볼 수 없어 없음으로 센다
    expect(session().viewer).toMatchObject({ hasTeam: false, pendingInvitationCount: 0 });
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
    expect(count('SessionExchangeAuthCode')).toBe(1);
    expect(tokenStore.get()).toBe('tok');
    expect(status()).toBe('ACTIVE');
    expect(session().completeLogin).toBe(s.completeLogin); // 정체성 유지 (effect deps)

    // 끝난 뒤 같은 code를 다시 쓰면(목 재로그인) 새로 교환한다
    await act(async () => {
      await session().completeLogin('mock-member');
    });
    expect(count('SessionExchangeAuthCode')).toBe(2);
  });

  it('completeLogin: 거절(ACCOUNT_REJECTED, 토큰 미발급) → REJECTED, viewer 없음', async () => {
    const { srv, session } = setup();
    srv.exchange = () => gqlErrorResponse('ACCOUNT_REJECTED', { classification: 'FORBIDDEN' });
    await act(async () => {
      expect(await session().completeLogin('mock-rejected')).toBe('REJECTED');
    });
    expect(status()).toBe('REJECTED');
    expect(session().viewer).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });

  it('completeLogin: 잘못된 code → AUTH_CODE_INVALID로 reject, 만료 토스트 없음', async () => {
    const { srv, session } = setup();
    srv.exchange = () => gqlErrorResponse('AUTH_CODE_INVALID', { classification: 'BAD_REQUEST' });
    await act(async () => {
      await expect(session().completeLogin('bad')).rejects.toEqual({ code: 'AUTH_CODE_INVALID', category: 'validation' });
    });
    expect(status()).toBe('ANONYMOUS');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('signOut: (백엔드 로그아웃 API 없음) 토큰 삭제 → ANONYMOUS와 viewer null이 한 번에', async () => {
    const { history, session } = setup({ token: 'tok' });
    await waitFor(() => expect(status()).toBe('ACTIVE'));
    await act(async () => {
      await session().signOut();
    });
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
        client.query({ query: parse('query Other1 { me { id } }'), fetchPolicy: 'network-only' }).catch(() => undefined),
        client.query({ query: parse('query Other2 { me { id } }'), fetchPolicy: 'network-only' }).catch(() => undefined),
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
      await client.query({ query: parse('query Other3 { me { id } }'), fetchPolicy: 'network-only' }).catch(() => undefined);
    });
    await waitFor(() => expect(status()).toBe('PENDING'));
  });

  it('viewer는 캐시를 따라간다 — 다른 쿼리가 myTeams를 다시 받으면 hasTeam이 바뀐다', async () => {
    const { srv, client } = setup({ token: 'tok' });
    await waitFor(() => expect(screen.getByTestId('hasTeam').textContent).toBe('true'));
    srv.other = () => jsonResponse({ data: { myTeams: [] } });
    await act(async () => {
      await client.query({ query: parse('query Other4 { myTeams { id } }'), fetchPolicy: 'network-only' });
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

  it('loginUrl: 목 모드는 바로 콜백으로', () => {
    const { session } = setup();
    expect(session().loginUrl()).toBe('/auth/callback?code=mock-member');
    expect(session().loginUrl('plain')).toBe('/auth/callback?code=mock-plain');
  });
});
