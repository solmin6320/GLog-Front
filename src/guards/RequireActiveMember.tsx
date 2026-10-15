import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/session';
import { paths } from '@/shared/lib/paths';

/**
 * AppLayout 부모. ACTIVE만 통과. 비로그인 → `/login` · 대기/거절 → `/pending` (E-01 · E-02).
 * 원래 가려던 곳으로 돌려보내지 않는다 — 로그인 뒤 목적지는 항상 `/` (요구사항 4-3).
 */
export function RequireActiveMember() {
  const { status } = useSession();
  switch (status) {
    case 'LOADING':
      return null;
    case 'ACTIVE':
      return <Outlet />;
    case 'ANONYMOUS':
      return <Navigate to={paths.login()} replace />;
    default:
      return <Navigate to={paths.pending()} replace />;
  }
}
