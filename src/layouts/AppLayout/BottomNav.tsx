import { Link, useLocation } from 'react-router';
import { Icon, type IconName } from '@/shared/ui';
import { paths } from '@/shared/lib/paths';
import { drawerActive, type DrawerGroupKey } from './drawerNav';
import s from './BottomNav.module.css';

/**
 * 모바일 하단 탭 (767px 이하). 데스크톱 헤더 메뉴(HeaderNav)와 같은 5개를 둔다.
 * 프로필은 헤더 오른쪽 아바타, 글쓰기는 헤더의 연필 버튼이 맡는다.
 * - 야콥의 법칙: 모바일 앱이 쓰는 하단 탭 관습을 그대로 따른다
 * - 힉의 법칙: 고르는 수를 5개로 묶는다 (관리자 · 서브 메뉴는 드로어에)
 * - 피츠의 법칙: 엄지가 닿는 화면 아래, 칸마다 56px 높이 · 폭 5등분
 * - 근접성의 법칙: 아이콘과 이름을 한 칸에 붙이고 칸끼리는 같은 간격으로 묶는다
 */
const TABS: readonly { group: DrawerGroupKey; label: string; icon: IconName; to: string }[] = [
  { group: 'home', label: '홈', icon: 'home', to: paths.home() },
  { group: 'activity', label: '내 활동', icon: 'grid', to: paths.weekly() },
  { group: 'teams', label: '팀', icon: 'users', to: paths.teams() },
  { group: 'posts', label: '게시판', icon: 'file', to: paths.posts({ type: 'troubleshooting' }) },
  { group: 'notices', label: '공지', icon: 'mega', to: paths.notices() },
];

export function BottomNav() {
  const { pathname, search } = useLocation();
  const active = drawerActive(pathname, search)?.group ?? null;
  return (
    <nav className={s.nav} aria-label="주요 메뉴">
      {TABS.map((t) => {
        const on = t.group === active;
        return (
          <Link key={t.group} to={t.to} className={`${s.tab} ${on ? s.on : ''}`} aria-current={on ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
