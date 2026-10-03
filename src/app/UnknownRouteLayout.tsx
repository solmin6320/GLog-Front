import { Navigate } from 'react-router';
import { AppLayout } from '@/layouts/AppLayout';
import { BareLayout } from '@/layouts/BareLayout';
import { useSession } from '@/session';
import { paths } from '@/shared/lib/paths';

/**
 * 어디에도 맞지 않는 경로(`*`)의 레이아웃을 세션 상태로 고른다 (요구사항 3-2).
 * 같은 `*`를 두 곳에 두면 먼저 선언한 쪽만 매칭되므로 한 라우트에서 나눈다.
 * - 로그인(ACTIVE): AppLayout 안 404 — 헤더 · 드로어 유지
 * - 비로그인: Bare 404 (알려진 보호 경로는 RequireActiveMember가 먼저 `/login`으로 보낸다)
 * - 승인 대기 · 거절: `/pending` (E-01)
 */
export function UnknownRouteLayout() {
  const { status } = useSession();
  switch (status) {
    case 'LOADING':
      return null;
    case 'ACTIVE':
      return <AppLayout />;
    case 'ANONYMOUS':
      return <BareLayout />;
    default:
      return <Navigate to={paths.pending()} replace />;
  }
}
