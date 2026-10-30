import { RouterProvider } from 'react-router/dom';
import { apolloClient } from '@/shared/api/client';
import { AppProviders } from './AppProviders';
import type { AppRouter } from './router';

export function App({ router }: { router: AppRouter }) {
  return (
    <AppProviders client={apolloClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
