import { Outlet, ScrollRestoration } from 'react-router';

/**
 * 라우트 트리의 뿌리. 프로바이더(세션 · Apollo · 토스트 · 확인 다이얼로그)는 app/AppProviders가 라우터 밖에서 감싼다.
 * 여기서는 스크롤 복원만 하고, 전역 오류 화면(CM-02)은 라우터의 errorElement가 맡는다.
 */
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
