import { Link } from 'react-router';
import { useViewer } from '@/session';
import { paths } from '@/shared/lib/paths';
import { Avatar, IconButton, Logo } from '@/shared/ui';
import { DRAWER_ID } from './Drawer';
import { HeaderNav } from './HeaderNav';
import { HeaderSearch } from './HeaderSearch';
import s from './AppLayout.module.css';

type Props = { drawerOpen: boolean; onOpenDrawer: () => void };

/** 공통 헤더 (W-02): [☰] 로고 ——— [검색창] | [아바타 닉네임] → /profile/me. 로그아웃은 프로필 화면. */
export function Header({ drawerOpen, onOpenDrawer }: Props) {
  const viewer = useViewer();
  return (
    <header className={s.header} inert={drawerOpen}>
      <IconButton
        label="전체 메뉴 열기"
        icon="menu"
        onClick={onOpenDrawer}
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
        aria-controls={drawerOpen ? DRAWER_ID : undefined}
      />
      <Logo to={paths.home()} />
      <div className={s.grow} />
      <HeaderNav />
      <HeaderSearch />
      <span className={s.sep} aria-hidden="true" />
      <Link to={paths.profileMe()} className={s.me} aria-label={`${viewer.nickname} 내 프로필`}>
        <Avatar name={viewer.nickname} imageUrl={viewer.profileImageUrl} size={32} />
        <span className={s.nick}>{viewer.nickname}</span>
      </Link>
    </header>
  );
}
