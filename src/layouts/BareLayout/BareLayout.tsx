import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { Logo } from '@/shared/ui';
import s from './BareLayout.module.css';

/**
 * AU 계열 · 비로그인 404 · 전역 오류 화면. 로고만 있는 58px 바(W-01, M-10 — 네비게이션 기능 없음) + 가운데 본문.
 * 라우트로 쓰면 <Outlet/>, errorElement처럼 직접 감쌀 때는 children.
 */
export function BareLayout({ children }: { children?: ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.bar}>
        <Logo />
      </header>
      <main id="main" className={s.body}>
        <div className={s.inner}>{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
