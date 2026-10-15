import { Navigate, Outlet } from 'react-router';
import { useSession } from '@/session';
import { paths } from '@/shared/lib/paths';

/** `/login` — 비로그인 전용. ACTIVE → `/` · 대기/거절 → `/pending` (EX-AU01-01). */
export function PublicOnly() {
  const { status } = useSession();
  switch (status) {
    case 'LOADING':
      return null;
    case 'ANONYMOUS':
      return <Outlet />;
    case 'ACTIVE':
      return <Navigate to={paths.home()} replace />;
    default:
      return <Navigate to={paths.pending()} replace />;
  }
}
