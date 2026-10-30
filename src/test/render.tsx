/**
 * 화면 통합 테스트 하네스 (구현 계약서 6장 · 설계서 10장).
 * 실제 라우트 트리 · Apollo · 세션 · 목 핸들러(msw/node)를 그대로 쓴다. 화면 테스트는 이 두 함수만 쓴다.
 *
 *   const { user, router } = renderRoute('/teams/1', { as: 'plain' });
 *   expect(await screen.findByRole('heading', { name: '사이드 프로젝트 A팀' })).toBeInTheDocument();
 */
import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, type DataRouter } from 'react-router';
import { AppProviders } from '@/app/AppProviders';
import { routes } from '@/app/router';
import { vi } from 'vitest';
import { bridgeFetch } from '@/mocks/bridge/transport';
import { createApolloClient } from '@/shared/api/client';
import { tokenStore } from '@/shared/api/tokenStore';
import { testTokenFor, type PersonaKey } from './personas';

/** bridge 테스트의 기준 시각 (목업과 같은 2026-10-01 목 10:00 KST) */
export const TEST_NOW = '2026-10-01T10:00:00+09:00';

export type RenderRouteOptions = {
  /** 로그인할 페르소나. 기본 'member'. null이면 비로그인 */
  as?: PersonaKey | null;
  /** 브라우저 기준 시각(ISO). 없으면 TEST_NOW */
  now?: string;
  /** (F18 이전 호환용 — 이제 늘 bridge 전송 → 가짜 백엔드다) */
  bridge?: boolean;
};

function signIn(as: PersonaKey | null | undefined) {
  const persona = as === undefined ? 'member' : as;
  if (!persona) tokenStore.clear();
  else tokenStore.set(testTokenFor(persona));
}

/** bridge 테스트: Date만 고정한다 (setTimeout 등은 실제 시간 — user-event가 그대로 동작) */
function freezeDate(now: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(now));
}

/** 경로 하나를 실제 앱처럼 띄운다 */
export function renderRoute(
  path: string,
  o: RenderRouteOptions = {},
): RenderResult & { user: UserEvent; router: DataRouter } {
  signIn(o.as);
  freezeDate(o.now ?? TEST_NOW);

  const client = createApolloClient({ fetch: bridgeFetch });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();
  const result = render(
    <AppProviders client={client}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, user, router };
}

/**
 * 컴포넌트 하나를 프로바이더(토스트 · Apollo · 세션 · 확인창) + 메모리 라우터 안에서 띄운다.
 * 라우터가 필요한 컴포넌트(Link · useNavigate)도 그대로 쓸 수 있다.
 */
export function renderWithProviders(
  ui: ReactElement,
  o: { as?: PersonaKey | null; bridge?: boolean; now?: string } = {},
): RenderResult & { user: UserEvent } {
  signIn(o.as);
  freezeDate(o.now ?? TEST_NOW);

  const client = createApolloClient({ fetch: bridgeFetch });
  const router = createMemoryRouter([{ path: '*', element: ui }], { initialEntries: ['/'] });
  const user = userEvent.setup();
  const result = render(
    <AppProviders client={client}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, user };
}
