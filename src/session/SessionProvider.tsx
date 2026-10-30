/**
 * 세션 (설계서 4장 · 요구사항 4장). ToastProvider · ApolloProvider 안쪽, 라우터 바깥에 둔다.
 * - 시작: 토큰이 없으면 바로 ANONYMOUS, 있으면 LOADING → SessionQuery → me.status (ACTIVE면 SessionTeamsQuery도)
 * - 시계: 백엔드에 서버 시각 API가 없어 nowSource(브라우저 · 목 기준 시각)로 조회할 때마다 계산한다
 * - 'expired' 사건: 토큰 폐기 → ANONYMOUS → 토스트 E-03(한 번만) → 캐시 비우기. 이동은 가드가 한다
 * - 'status-changed' 사건: SessionQuery 재조회 → 가드가 /pending으로
 * 이동 · 라우터를 직접 부르지 않는다.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { skipToken, useApolloClient, useQuery } from '@apollo/client/react';
import { MSG } from '@/domain/messages';
import type { SessionQueryQuery, SessionTeamsQueryQuery } from '@/gql/graphql';
import { appError, normalizeError, type AppError } from '@/shared/api/errors';
import { sessionEvents } from '@/shared/api/sessionEvents';
import { tokenStore } from '@/shared/api/tokenStore';
import { addDays, kstDateOf, kstIsoOf, mondayOf } from '@/shared/lib/kst';
import { nowMs } from '@/shared/lib/nowSource';
import { useToast } from '@/shared/ui';
import { SessionExchangeAuthCode, SessionQuery, SessionTeamsQuery } from './api';
import { SessionContext } from './context';
import { loginUrl } from './loginUrl';
import type { Clock, Session, SessionStatus, Viewer } from './types';

/** 세션 응답. 팀 · 초대는 활성 회원만 받는다 (대기 · 거절이면 null) */
type SessionData = {
  me: SessionQueryQuery['me'];
  myTeams?: SessionTeamsQueryQuery['myTeams'] | null;
  receivedTeamInvitations?: SessionTeamsQueryQuery['receivedTeamInvitations'] | null;
};
type State = { status: SessionStatus; me: SessionData | null; clock: Clock | null };
type Loaded = { generation: number; next: SessionStatus; me: SessionData | null; clock: Clock | null; failure: AppError | null };

/** 같은 일회용 code의 교환은 1번만 (StrictMode 이중 effect · A3 4-1). 끝나면 지운다 — 목은 같은 code를 다시 쓴다 */
const exchanges = new Map<string, Promise<SessionStatus>>();

/** 지금(KST)과 이번 주 월~일 */
function currentClock(): Clock {
  const now = kstIsoOf(nowMs());
  const today = kstDateOf(now);
  const currentWeekStart = mondayOf(today);
  return { now, today, currentWeekStart, currentWeekEnd: addDays(currentWeekStart, 6) };
}

function toViewer({ me, myTeams, receivedTeamInvitations }: SessionData): Viewer {
  // 대기 · 거절 회원은 팀 · 초대를 볼 수 없다 (캐시에 남은 활성 시절 값은 쓰지 않는다)
  const active = me.status === 'ACTIVE';
  return {
    id: me.id,
    memberId: me.id,
    nickname: me.nickname,
    githubLogin: me.githubLogin,
    profileImageUrl: me.profileImageUrl ?? null,
    role: me.role,
    hasTeam: active && (myTeams?.length ?? 0) > 0,
    pendingInvitationCount: active ? (receivedTeamInvitations?.items.length ?? 0) : 0,
  };
}

/** me 오류 → 세션 상태. null이면 실패로 다룬다 */
function statusFromError(e: AppError): SessionStatus | null {
  if (e.code === 'UNAUTHENTICATED') return 'ANONYMOUS';
  if (e.code === 'ACCOUNT_PENDING') return 'PENDING';
  if (e.code === 'ACCOUNT_REJECTED') return 'REJECTED';
  return null;
}

const isMemberStatus = (s: SessionStatus) => s === 'ACTIVE' || s === 'PENDING' || s === 'REJECTED';

export function SessionProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const toast = useToast();
  const [state, setState] = useState<State>(() => ({
    status: tokenStore.get() ? 'LOADING' : 'ANONYMOUS',
    me: null,
    clock: currentClock(),
  }));
  /** 세대 번호 — 로그인 · 로그아웃 · 만료 뒤에 도착한 이전 조회 결과는 버린다 */
  const generation = useRef(0);

  /** SessionQuery(+ 활성이면 SessionTeamsQuery)를 네트워크로 부르고 결과만 계산한다 (상태는 건드리지 않는다) */
  const load = useCallback(async (): Promise<Loaded> => {
    const generationAtStart = ++generation.current;
    let result;
    try {
      result = await client.query({ query: SessionQuery, fetchPolicy: 'network-only', errorPolicy: 'all' });
    } catch (err) {
      throw normalizeError(err);
    }
    const { data, error } = result;
    let me: SessionData | null = data?.me ? { me: data.me } : null;
    if (me?.me.status === 'ACTIVE') {
      try {
        const teams = await client.query({ query: SessionTeamsQuery, fetchPolicy: 'network-only' });
        me = { ...me, myTeams: teams.data?.myTeams ?? null, receivedTeamInvitations: teams.data?.receivedTeamInvitations ?? null };
      } catch (err) {
        throw normalizeError(err);
      }
    }
    const clock = currentClock();
    let next: SessionStatus = me ? me.me.status : 'ANONYMOUS';
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
          const res = await client.mutate({ mutation: SessionExchangeAuthCode, variables: { code } });
          payload = res.data?.exchangeAuthCode;
        } catch (err) {
          const e = normalizeError(err);
          // 거절 회원은 토큰 없이 ACCOUNT_REJECTED로 끝난다 (E-02 '토큰 미발급')
          if (e.code !== 'ACCOUNT_REJECTED') throw e;
          generation.current++;
          tokenStore.clear();
          setState((s) => ({ status: 'REJECTED', me: null, clock: s.clock ?? currentClock() }));
          return 'REJECTED';
        }
        if (!payload) throw appError('INTERNAL');
        generation.current++;
        tokenStore.set(payload.accessToken);
        await client.clearStore();
        return refresh();
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

  // 백엔드는 무상태 JWT라 로그아웃 API가 없다 — 토큰을 버리고 캐시를 비운다
  const signOut = useCallback(async (): Promise<void> => {
    tokenStore.clear();
    generation.current++;
    setState((s) => ({ status: 'ANONYMOUS', me: null, clock: s.clock }));
    await client.clearStore().catch(() => undefined);
  }, [client]);

  // 시작 조회. 토큰이 없으면 me를 부르지 않는다 (시계는 처음부터 있다)
  useEffect(() => {
    if (!tokenStore.get()) return;
    load()
      .then(apply)
      .catch(() => {
        // 연결 · 서버 실패: 볼 수 있는 화면이 없으니 로그인 화면으로 (토큰은 남겨 다음 새로고침에 다시 시도)
        setState((s) => (s.status === 'LOADING' ? { ...s, status: 'ANONYMOUS', clock: s.clock ?? currentClock() } : s));
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

  // viewer는 캐시를 지켜본다 — 다른 쿼리가 세션 문서(REFRESH_SESSION)를 다시 받으면 팀 유무 · 초대 수가 바로 바뀐다
  const member = isMemberStatus(state.status) && state.me !== null;
  const cacheOnly = { fetchPolicy: 'cache-only', nextFetchPolicy: 'cache-only' } as const;
  const watchedMe = useQuery(SessionQuery, member ? cacheOnly : skipToken).data?.me;
  const active = member && state.status === 'ACTIVE';
  const watchedData = useQuery(SessionTeamsQuery, active ? cacheOnly : skipToken).data;
  const data = useMemo<SessionData | null>(() => {
    if (!member || !state.me) return null;
    // 캐시의 me가 지금 상태와 다르면(예전 활성 시절 값) 방금 받은 값을 쓴다
    const me = watchedMe && watchedMe.status === state.me.me.status ? watchedMe : state.me.me;
    if (!active) return { me };
    return {
      me,
      myTeams: watchedData?.myTeams ?? state.me.myTeams,
      receivedTeamInvitations: watchedData?.receivedTeamInvitations ?? state.me.receivedTeamInvitations,
    };
  }, [member, active, watchedMe, watchedData, state.me]);

  const viewer = useMemo(() => (data ? toViewer(data) : null), [data]);
  // 세션 문서를 다시 받을 때마다 지금 시각을 다시 계산한다 (오래 켜 둔 탭에서도 오늘 · 이번 주가 맞게)
  const clock = useMemo(() => (state.clock && watchedData !== undefined ? currentClock() : state.clock), [state.clock, watchedData]);

  const session = useMemo<Session>(
    () => ({ status: state.status, viewer, clock, refresh, completeLogin, signOut, loginUrl }),
    [state.status, viewer, clock, refresh, completeLogin, signOut],
  );

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
