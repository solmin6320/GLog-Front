import type { ReactNode } from 'react';
import { normalizeError } from '@/shared/api/errors';
import { FullState, type FullStateKind } from '../FullState';
import { PageSkeleton } from '../Skeleton';

function kindOf(error: unknown): FullStateKind {
  const e = normalizeError(error);
  if (e.code === 'POST_DELETED') return 'deleted';
  switch (e.category) {
    case 'forbidden':
      return 'forbidden';
    case 'notFound':
      return 'notFound';
    case 'network':
      return 'network';
    default:
      return 'server';
  }
}

/**
 * 조회 화면의 상태 4종 (설계서 3-5).
 * 데이터가 있으면 다시 불러오는 중이어도 children(data) — 깜빡임 없음.
 * 데이터 없이 loading → skeleton(기본 PageSkeleton). error → 범주별 FullState.
 * 끝났는데 데이터가 null/undefined이고 오류도 없으면 notFound.
 */
export function QueryBoundary<T>({
  loading,
  error,
  data,
  skeleton,
  onRetry,
  children,
}: {
  loading: boolean;
  error?: unknown;
  data: T | undefined | null;
  skeleton?: ReactNode;
  onRetry?: () => void;
  children: (data: T) => ReactNode;
}) {
  if (data !== undefined && data !== null) return <>{children(data)}</>;
  if (loading) return <>{skeleton ?? <PageSkeleton />}</>;
  if (error) return <FullState kind={kindOf(error)} onRetry={onRetry} />;
  return <FullState kind="notFound" />;
}
