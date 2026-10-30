import { Outlet } from 'react-router';
import { useIsAdmin } from '@/session';
import { GuardState } from './GuardState';

/** `/admin` 부모 한 곳. 관리자가 아니면 본문만 403 + [홈으로] (E-09). */
export function RequireAdmin() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <Outlet /> : <GuardState kind="forbidden" />;
}
