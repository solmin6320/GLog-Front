/**
 * 세션 (설계서 4장 · 요구사항 4장). ToastProvider · ApolloProvider 안쪽, 라우터 바깥에 둔다.
 * - 시작: 토큰이 없으면 바로 ANONYMOUS(시계만 받는다), 있으면 LOADING → SessionQuery → me.status
 * - 'expired' 사건: 토큰 폐기 → ANONYMOUS → 토스트 E-03(한 번만) → 캐시 비우기. 이동은 가드가 한다
 * - 'status-changed' 사건: SessionQuery 재조회 → 가드가 /pending으로
 * 이동 · 라우터를 직접 부르지 않는다.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { skipToken, useApolloClient, useQuery } from '@apollo/client/react';
import { MSG } from '@/domain/messages';
import type { SessionQueryQuery } from '@/gql/graphql';
import { appError, normalizeError, type AppError } from '@/shared/api/errors';
import { sessionEvents } from '@/shared/api/sessionEvents';
import { tokenStore } from '@/shared/api/tokenStore';
import { kstDateOf } from '@/shared/lib/kst';
import { useToast } from '@/shared/ui';
import { SessionExchangeLoginCode, SessionLogout, SessionQuery } from './api';
import { SessionContext } from './context';
import { loginUrl } from './loginUrl';
import type { Clock, Session, SessionStatus, Viewer } from './types';

type MeData = NonNullable<SessionQueryQuery['me']>;
type ClockData = SessionQueryQuery['clock'];
type State = { status: SessionStatus; me: MeData | null; clock: Clock | null };
type Loaded = { generation: number; next: SessionStatus; me: MeData | null; clock: Clock | null; failure: AppError | null };

/** 같은 일회용 code의 교환은 1번만 (StrictMode 이중 effect · A3 4-1). 끝나면 지운다 — 목은 같은 code를 다시 쓴다 */
const exchanges = new Map<string, Promise<SessionStatus>>();

function toClock(c: ClockData): Clock {
  return { now: c.now, today: kstDateOf(c.now), currentWeekStart: c.currentWeekStart, currentWeekEnd: c.currentWeekEnd };
}

function toViewer(me: MeData): Viewer {
  return {
    id: me.id,
    memberId: me.member.id,
    nickname: me.member.nickname,
    githubLogin: me.member.githubLogin,
    profileImageUrl: me.member.profileImageUrl ?? null,
    role: me.role,
    hasTeam: me.hasTeam,
    pendingInvitationCount: me.pendingInvitationCount,
  };
}

/** me 오류 → 세션 상태. null이면 실패로 다룬다 */
function statusFromError(e: AppError): SessionStatus | null {
  if (e.code === 'UNAUTHENTICATED') return 'ANONYMOUS';
  if (e.code === 'ACCOUNT_PENDING') return 'PENDING';
  if (e.code === 'ACCOUNT_REJECTED') return 'REJECTED';
  if (e.code === 'ACCOUNT_SUSPENDED') return 'SUSPENDED';
  return null;
}

const isMemberStatus = (s: SessionStatus) => s === 'ACTIVE' || s === 'PENDING' || s === 'REJECTED' || s === 'SUSPENDED';

export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const toast = useToast();
  const [state, setState] = useState<State>(() => ({
    status: tokenStore.get() ? 'LOADING' : 'ANONYMOUS',
    me: null,
    clock: null,
  }));
  /** 세대 번호 — 로그인 · 로그아웃 · 만료 뒤에 도착한 이전 조회 결과는 버린다 */
  const generation = useRef(0);

  /** SessionQuery를 네트워크로 부르고 결과만 계산한다 (상태는 건드리지 않는다) */
  const load = useCallback(async (): Promise<Loaded> => {
    const generationAtStart = ++generation.current;
    let result;
    try {
      result = await client.query({ query: SessionQuery, fetchPolicy: 'network-only', errorPolicy: 'all' });
    } catch (err) {
      throw normalizeError(err);
    }
    const { data, error } = result;
    const me = data?.me ?? null;
    const clock = data?.clock ? toClock(data.clock) : null;
    let next: SessionStatus = me ? me.status : 'ANONYMOUS';
    let failure: AppError | null = null;
    if (!me && error) {
      const e = normalizeError(error);
      const fromError = statusFromError(e);
      if (fromError) next = fromError;
      else failure = e;
    }
    return { generation: generationAtStart, next, me, clock, failure };
  }, [client]);

  /** 계산한 결과를 상태에 반영한다. 그사이 로그인 · 로그아웃 · 만료가 있었으면 버린다 */
  const apply = useCallback((r: Loaded): SessionStatus => {
    const current = r.generation === generation.current;
    if (r.failure) {
      const { clock } = r;
      if (current && clock) setState((s) => ({ ...s, clock }));
      throw r.failure;
    }
    if (!current) return r.next;
    // 토큰이 있는데 me가 없으면 쓸모없는 토큰이다 (만료 오류 없이 null로 온 경우)
    if (r.next === 'ANONYMOUS') tokenStore.clear();
    setState((s) => ({ status: r.next, me: r.me, clock: r.clock ?? s.clock }));
    return r.next;
  }, []);

  const refresh = useCallback(() => load().then(apply), [load, apply]);

  const completeLogin = useCallback(
    (code: string): Promise<SessionStatus> => {
      const running = exchanges.get(code);
      if (running) return running;
      const p = (async (): Promise<SessionStatus> => {
        let payload;
        try {
          const res = await client.mutate({ mutation: SessionExchangeLoginCode, variables: { code } });
          payload = res.data?.exchangeLoginCode;
        } catch (err) {
          throw normalizeError(err);
        }
        if (!payload) throw appError('INTERNAL');
        generation.current++;
        if (payload.accessToken) tokenStore.set(payload.accessToken);
        else tokenStore.clear();
        await client.clearStore();
        if (payload.accessToken) return refresh();
        // 토큰 없이 끝나는 경우: 거절(E-02 '토큰 미발급') · 대기 제한 토큰을 안 주는 백엔드(B-01 안 B)
        if (payload.status === 'ACTIVE') throw appError('INTERNAL');
        const status: SessionStatus = payload.status;
        setState((s) => ({ status, me: null, clock: s.clock }));
        return status;
      })();
      exchanges.set(code, p);
      const forget = () => {
        exchanges.delete(code);
      };
      p.then(forget, forget);
      return p;
    },
    [client, refresh],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (tokenStore.get()) {
      try {
        await client.mutate({ mutation: SessionLogout });
      } catch {
        // 실패해도 로그아웃은 진행한다 (설계서 4장)
      }
    }
    tokenStore.clear();
    generation.current++;
    setState((s) => ({ status: 'ANONYMOUS', me: null, clock: s.clock }));
    await client.clearStore().catch(() => undefined);
  }, [client]);

  // 시작 조회. 토큰이 없어도 부른다(시계는 공개 필드)
  useEffect(() => {
    load()
      .then(apply)
      .catch(() => {
        // 연결 · 서버 실패: 볼 수 있는 화면이 없으니 로그인 화면으로 (토큰은 남겨 다음 새로고침에 다시 시도)
        setState((s) => (s.status === 'LOADING' ? { ...s, status: 'ANONYMOUS' } : s));
      });
  }, [load, apply]);

  useEffect(() => {
    const offExpired = sessionEvents.on('expired', () => {
      // 이미 비웠으면(동시에 온 401 여러 개 · 로그아웃 뒤 늦은 응답) 아무것도 안 한다 → 토스트 1번
      if (!tokenStore.get()) return;
      tokenStore.clear();
      generation.current++;
      setState((s) => ({ status: 'ANONYMOUS', me: null, clock: s.clock }));
      toast.error(MSG.expired);
      // 링크 안에서 동기로 비우면 지금 오는 응답까지 취소된다 — 다음 틱에 비운다
      setTimeout(() => {
        client.clearStore().catch(() => undefined);
      }, 0);
    });
    const offChanged = sessionEvents.on('status-changed', () => {
      refresh().catch(() => undefined);
    });
    return () => {
      offExpired();
      offChanged();
    };
  }, [client, refresh, toast]);

  // viewer는 캐시를 지켜본다 — 다른 쿼리가 me { hasTeam pendingInvitationCount }를 다시 받으면 바로 바뀐다
  const member = isMemberStatus(state.status) && state.me !== null;
  const watched = useQuery(SessionQuery, member ? { fetchPolicy: 'cache-only', nextFetchPolicy: 'cache-only' } : skipToken);
  const me = member ? (watched.data?.me ?? state.me) : null;
  const watchedClock = member ? watched.data?.clock : undefined;

  const viewer = useMemo(() => (me ? toViewer(me) : null), [me]);
  const clock = useMemo(() => (watchedClock ? toClock(watchedClock) : state.clock), [watchedClock, state.clock]);

  const session = useMemo<Session>(
    () => ({ status: state.status, viewer, clock, refresh, completeLogin, signOut, loginUrl }),
    [state.status, viewer, clock, refresh, completeLogin, signOut],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
