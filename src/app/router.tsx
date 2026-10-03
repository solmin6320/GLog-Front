/**
 * 라우트 트리 전체 (요구사항 3-2). 화면은 `lazy`로 나눠 받는다 — 화면 파일은 기본 export 컴포넌트.
 * 정적 경로(`/teams/new` · `/posts/new` · `/profile/me` · `/profile/edit`)는 랭킹상 동적 경로보다 먼저 맞는다.
 */
import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import ErrorPage from '@/features/errors/pages/ErrorPage';
import {
  PendingOnly,
  PublicOnly,
  RequireActiveMember,
  RequireAdmin,
  RequireTeamLeader,
  TeamScope,
} from '@/guards';
import { AdminLayout } from '@/layouts/AdminLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { BareLayout } from '@/layouts/BareLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { UnknownRouteLayout } from './UnknownRouteLayout';

type PageModule = { default: ComponentType };

/** 화면 파일의 기본 export를 라우트 Component로 */
const page = (load: () => Promise<PageModule>) => async () => ({ Component: (await load()).default });

/** RequireActiveMember ─ AppLayout 아래 본문 라우트 */
const memberRoutes: RouteObject[] = [
  { index: true, lazy: page(() => import('@/features/home/pages/HomePage')) },
  { path: 'weekly', lazy: page(() => import('@/features/activity/pages/WeeklyPage')) },
  { path: 'warnings', lazy: page(() => import('@/features/activity/pages/WarningsPage')) },

  { path: 'teams', lazy: page(() => import('@/features/teams/pages/TeamListPage')) },
  { path: 'teams/new', lazy: page(() => import('@/features/teams/pages/TeamCreatePage')) },
  { path: 'teams/join', lazy: page(() => import('@/features/teams/pages/TeamJoinPage')) },
  { path: 'teams/invitations', lazy: page(() => import('@/features/teams/pages/InvitationsPage')) },
  {
    path: 'teams/:teamId',
    Component: TeamScope,
    children: [
      { index: true, lazy: page(() => import('@/features/teams/pages/TeamBoardPage')) },
      {
        Component: RequireTeamLeader,
        children: [
          { path: 'manage', lazy: page(() => import('@/features/teams/pages/TeamManagePage')) },
          { path: 'exemption', lazy: page(() => import('@/features/teams/pages/TeamExemptionPage')) },
        ],
      },
    ],
  },

  { path: 'posts', lazy: page(() => import('@/features/posts/pages/PostListPage')) },
  { path: 'posts/new', lazy: page(() => import('@/features/posts/pages/PostEditorPage')) },
  { path: 'posts/:postId', lazy: page(() => import('@/features/posts/pages/PostDetailPage')) },
  { path: 'posts/:postId/edit', lazy: page(() => import('@/features/posts/pages/PostEditorPage')) },

  { path: 'notices', lazy: page(() => import('@/features/notices/pages/NoticeListPage')) },
  { path: 'notices/:noticeId', lazy: page(() => import('@/features/notices/pages/NoticeDetailPage')) },

  { path: 'profile/me', lazy: page(() => import('@/features/profile/pages/ProfilePage')) },
  { path: 'profile/edit', lazy: page(() => import('@/features/profile/pages/ProfileEditPage')) },
  { path: 'profile/:userId', lazy: page(() => import('@/features/profile/pages/ProfilePage')) },

  {
    path: 'admin',
    Component: RequireAdmin,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, lazy: page(() => import('@/features/admin/pages/AdminDashboardPage')) },
          { path: 'warnings', lazy: page(() => import('@/features/admin/pages/AdminWarningsPage')) },
          { path: 'members', lazy: page(() => import('@/features/admin/pages/AdminMembersPage')) },
          { path: 'exemptions', lazy: page(() => import('@/features/admin/pages/AdminExemptionsPage')) },
          { path: 'notices', lazy: page(() => import('@/features/admin/pages/AdminNoticesPage')) },
          { path: 'posts', lazy: page(() => import('@/features/admin/pages/AdminPostsPage')) },
          // 잘못된 탭 → 관리자 레이아웃 안 404
          {
            path: '*',
            lazy: async () => ({ Component: (await import('@/features/errors/pages/NotFoundPage')).NotFoundContent }),
          },
        ],
      },
    ],
  },
];

export const routes: RouteObject[] = [
  {
    id: 'root',
    Component: RootLayout,
    // 첫 화면 코드를 받는 동안은 빈 캔버스 (세션 LOADING과 같은 규칙)
    HydrateFallback: () => null,
    // 전역 CM-02 — 레이아웃까지 깨졌을 때. 로고 바만 남긴다
    errorElement: (
      <BareLayout>
        <ErrorPage />
      </BareLayout>
    ),
    children: [
      {
        Component: PublicOnly,
        children: [
          { Component: BareLayout, children: [{ path: 'login', lazy: page(() => import('@/features/auth/pages/LoginPage')) }] },
        ],
      },
      {
        Component: BareLayout,
        children: [{ path: 'auth/callback', lazy: page(() => import('@/features/auth/pages/AuthCallbackPage')) }],
      },
      {
        Component: PendingOnly,
        children: [
          { Component: BareLayout, children: [{ path: 'pending', lazy: page(() => import('@/features/auth/pages/PendingPage')) }] },
        ],
      },
      {
        Component: RequireActiveMember,
        children: [
          {
            Component: AppLayout,
            // 본문 오류 경계(E-51 · E-52): 경로 없는 라우트의 errorElement라서 헤더 · 드로어는 남고 본문만 바뀐다
            children: [{ errorElement: <ErrorPage inLayout />, children: memberRoutes }],
          },
        ],
      },
      {
        // 미지 경로: 로그인이면 헤더 유지 404 · 비로그인이면 Bare 404 · 대기/거절이면 /pending
        Component: UnknownRouteLayout,
        children: [
          {
            errorElement: <ErrorPage inLayout />,
            children: [{ path: '*', lazy: page(() => import('@/features/errors/pages/NotFoundPage')) }],
          },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}

export type AppRouter = ReturnType<typeof createAppRouter>;
