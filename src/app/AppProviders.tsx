import type { ReactNode } from 'react';
import type { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { SessionProvider } from '@/session';
import { ConfirmProvider, ToastProvider } from '@/shared/ui';

/**
 * ToastProvider > ApolloProvider > SessionProvider > ConfirmProvider > children (구현 계약서 4장).
 * 라우터 밖에 둔다 — 앱(RouterProvider)과 테스트(createMemoryRouter)가 같은 순서를 쓴다.
 */
export function AppProviders({ client, children }: { client: ApolloClient; children: ReactNode }) {
  return (
    <ToastProvider>
      <ApolloProvider client={client}>
        <SessionProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </SessionProvider>
      </ApolloProvider>
    </ToastProvider>
  );
}
