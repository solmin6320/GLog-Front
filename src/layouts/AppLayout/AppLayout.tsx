import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Drawer } from './Drawer';
import { Header } from './Header';
import s from './AppLayout.module.css';

/**
 * 로그인 후 전 화면 (RequireActiveMember 아래). 공통 헤더 + 오버레이 드로어 + 본문.
 * 본문 폭(700/960/1120)은 각 화면의 PageContainer가 정한다.
 * 본문 오류(E-51 · E-52)는 라우터가 이 레이아웃 아래 경로 없는 라우트의 errorElement로 본문만 대체한다 — 헤더 · 드로어 유지(M-13).
 */
export function AppLayout() {
  const location = useLocation();
  // 드로어는 연 시점의 위치에서만 열려 있다 → 어떤 이동이든(링크 · 뒤로 가기) 이동하면 닫힌다
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const drawerOpen = drawerAt === location.key;

  const openDrawer = () => setDrawerAt(location.key);
  const closeDrawer = useCallback(() => setDrawerAt(null), []);

  return (
    <div className={s.shell}>
      <Header drawerOpen={drawerOpen} onOpenDrawer={openDrawer} />
      <Drawer open={drawerOpen} onClose={closeDrawer} />
      <main id="main" className={s.main} inert={drawerOpen}>
        <Outlet />
      </main>
    </div>
  );
}
