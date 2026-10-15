/**
 * 세션 사건 (설계서 3-1). 링크 · REST는 라우터나 토스트를 직접 부르지 않고 사건만 내보낸다.
 * SessionProvider가 듣고 처리한다.
 * - 'expired'        : 지금 토큰이 거절됐다 (UNAUTHENTICATED · HTTP 401) → 토큰 폐기 · 캐시 비우기 · 토스트(E-03)
 * - 'status-changed' : 계정 상태가 바뀌었다 (ACCOUNT_PENDING · ACCOUNT_REJECTED) → me 재조회 → 가드가 /pending으로
 */
export type SessionEvent = 'expired' | 'status-changed';

const listeners = new Map<SessionEvent, Set<() => void>>();

export const sessionEvents = {
  on(e: SessionEvent, fn: () => void): () => void {
    let set = listeners.get(e);
    if (!set) {
      set = new Set();
      listeners.set(e, set);
    }
    set.add(fn);
    return () => {
      set.delete(fn);
    };
  },
  emit(e: SessionEvent): void {
    const set = listeners.get(e);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    }
  },
};
