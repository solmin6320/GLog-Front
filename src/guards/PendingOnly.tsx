import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/session';
import { paths } from '@/shared/lib/paths';

/** `/pending` — 승인 대기 · 거절 전용. ACTIVE → `/` (EX-AU03-01) · 비로그인 → `/login`. */
export function PendingOnly() {
  const { status } = useSession();
  switch (status) {
    case 'LOADING':
      return null;
    case 'PENDING':
    case 'REJECTED':
      return <Outlet />;
    case 'ACTIVE':
      return <Navigate to={paths.home()} replace />;
    default:
      return <Navigate to={paths.login()} replace />;
  }
}
