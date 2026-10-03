import { lazy, Suspense } from 'react';
import { RouterProvider } from 'react-router/dom';
import { apolloClient } from '@/shared/api/client';
import { isMockMode } from '@/shared/config/env';
import { AppProviders } from './AppProviders';
import type { AppRouter } from './router';

/** 목 모드 전용 떠 있는 패널 (시나리오 · 장애 · 시각). real 빌드에서는 불러오지 않는다. */
const DevToolbar = isMockMode ? lazy(() => import('@/mocks/DevToolbar')) : null;

export function App({ router }: { router: AppRouter }) {
  return (
    <AppProviders client={apolloClient}>
      <RouterProvider router={router} />
      {DevToolbar && (
        <Suspense fallback={null}>
          <DevToolbar />
        </Suspense>
      )}
    </AppProviders>
  );
}
