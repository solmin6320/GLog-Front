import { Link, useLocation } from 'react-router';
import { useViewer } from '@/session';
import { paths } from '@/shared/lib/paths';
import { Icon, type IconName } from '@/shared/ui';
import { drawerActive, type DrawerGroupKey } from './drawerNav';
import s from './HeaderNav.module.css';

/**
 * 헤더 오른쪽 핵심 메뉴 (768px 이상). 홈과 날마다 쓰는 4개 + 글쓰기 1개, 모두 한 줄에 둔다.
 * - 힉의 법칙: 드로어의 7개 대메뉴 중 5개만 꺼내 선택 부담을 줄인다
 * - 피츠의 법칙: 칸 높이 44px, 클릭 영역이 글자보다 넓다. 글쓰기는 가장 큰 채움 버튼
 * - 폰 레스토프 효과: 채워진 초록은 글쓰기 하나. 지금 있는 메뉴는 아래 막대로 표시
 * - 근접성의 법칙: 메뉴 4개는 붙이고, 글쓰기와 검색은 간격을 두어 따로 읽히게 한다
 */
const ITEMS: readonly { group: DrawerGroupKey; label: string; icon: IconName; to: string }[] = [
  { group: 'home', label: '홈', icon: 'home', to: paths.home() },
  { group: 'activity', label: '내 활동', icon: 'grid', to: paths.weekly() },
  { group: 'teams', label: '팀', icon: 'users', to: paths.teams() },
  { group: 'posts', label: '게시판', icon: 'file', to: paths.posts({ type: 'troubleshooting' }) },
  { group: 'notices', label: '공지', icon: 'mega', to: paths.notices() },
];

export function HeaderNav() {
  const { pathname, search } = useLocation();
  const viewer = useViewer();
  const active = drawerActive(pathname, search)?.group ?? null;
  return (
    <nav className={s.nav} aria-label="핵심 메뉴">
      <ul className={s.list}>
        {ITEMS.map((it) => {
          const on = it.group === active;
          const badge = it.group === 'teams' ? viewer.pendingInvitationCount : 0;
          return (
            <li key={it.group}>
              <Link
                to={it.to}
                className={`${s.item} ${on ? s.on : ''}`}
                aria-current={on ? 'page' : undefined}
                aria-label={badge > 0 ? `${it.label}, 받은 초대 ${badge}건` : it.label}
                title={it.label}
              >
                <Icon name={it.icon} size={18} />
                <span className={s.label}>{it.label}</span>
                {badge > 0 ? (
                  <span className={s.badge} aria-hidden="true">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to={paths.postNew({ type: 'devlog' })} className={s.write} aria-label="새 글쓰기">
        <Icon name="pencil" size={16} />
        <span className={s.label}>글쓰기</span>
      </Link>
    </nav>
  );
}
