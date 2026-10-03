import { useContext } from 'react';
import { SessionContext } from './context';
import type { Clock, Session, Viewer } from './types';

export function useSession(): Session {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession must be used inside <SessionProvider>');
  return s;
}

/** 로그인한 본인. RequireActiveMember 아래에서만 쓴다 (viewer가 없으면 throw) */
export function useViewer(): Viewer {
  const { viewer } = useSession();
  if (!viewer) throw new Error('useViewer: no viewer — use it under RequireActiveMember');
  return viewer;
}

/** 서버 기준 시각. 세션을 한 번이라도 조회했으면 있다 (RequireActiveMember 아래에서는 항상) */
export function useClock(): Clock {
  const { clock } = useSession();
  if (!clock) throw new Error('useClock: clock is not loaded yet');
  return clock;
}

export function useIsAdmin(): boolean {
  const { status, viewer } = useSession();
  return status === 'ACTIVE' && viewer?.role === 'ADMIN';
}
