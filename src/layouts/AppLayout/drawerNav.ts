/**
 * 드로어 메뉴 정의 + 현재 경로 → 강조 항목 매핑 (요구사항 3-3 M-09, A1 3-2).
 * 순수 함수라 화면 없이 테스트한다.
 */
import type { IconName } from '@/shared/ui';
import { parsePostsSearch, paths } from '@/shared/lib/paths';

export type DrawerGroupKey = 'home' | 'activity' | 'teams' | 'posts' | 'notices' | 'profile' | 'admin';

export type DrawerItemKey =
  | 'weekly'
  | 'warnings'
  | 'teamList'
  | 'teamNew'
  | 'teamJoin'
  | 'invitations'
  | 'troubleshooting'
  | 'devlog'
  | 'noticeList'
  | 'profileMe'
  | 'adminDashboard'
  | 'adminWarnings'
  | 'adminMembers'
  | 'adminExemptions'
  | 'adminNotices'
  | 'adminPosts';

/** 배지 숫자의 출처. invitations = viewer.pendingInvitationCount, 나머지 = adminDashboardSummary */
export type DrawerBadgeKey = 'invitations' | 'penaltyTargets' | 'pendingMembers' | 'pendingExemptions';

export type DrawerItem = { key: DrawerItemKey; label: string; to: string; badge?: DrawerBadgeKey };
export type DrawerGroup = {
  key: DrawerGroupKey;
  label: string;
  icon: IconName;
  /** 서브 메뉴가 없는 대메뉴(홈)만 링크다 */
  to?: string;
  items: DrawerItem[];
  adminOnly?: boolean;
};

export const DRAWER_GROUPS: readonly DrawerGroup[] = [
  { key: 'home', label: '홈', icon: 'home', to: paths.home(), items: [] },
  {
    key: 'activity',
    label: '내 활동',
    icon: 'grid',
    items: [
      { key: 'weekly', label: '주간 활동', to: paths.weekly() },
      { key: 'warnings', label: '내 경고 · 벌칙', to: paths.warnings() },
    ],
  },
  {
    key: 'teams',
    label: '팀',
    icon: 'users',
    items: [
      { key: 'teamList', label: '내 팀', to: paths.teams() },
      { key: 'teamNew', label: '팀 만들기', to: paths.teamNew() },
      { key: 'teamJoin', label: '팀 참가', to: paths.teamJoin() },
      { key: 'invitations', label: '받은 초대', to: paths.invitations(), badge: 'invitations' },
    ],
  },
  {
    key: 'posts',
    label: '게시판',
    icon: 'file',
    items: [
      { key: 'troubleshooting', label: '트러블슈팅', to: paths.posts({ type: 'troubleshooting' }) },
      { key: 'devlog', label: '개발일지', to: paths.posts({ type: 'devlog' }) },
    ],
  },
  {
    key: 'notices',
    label: '공지',
    icon: 'mega',
    items: [{ key: 'noticeList', label: '공지 목록', to: paths.notices() }],
  },
  {
    key: 'profile',
    label: '프로필',
    icon: 'user',
    items: [{ key: 'profileMe', label: '내 프로필', to: paths.profileMe() }],
  },
  {
    key: 'admin',
    label: '관리자',
    icon: 'shield',
    adminOnly: true,
    items: [
      { key: 'adminDashboard', label: '관리자 대시보드', to: paths.admin() },
      { key: 'adminWarnings', label: '경고 복구 · 벌칙', to: paths.adminWarnings(), badge: 'penaltyTargets' },
      { key: 'adminMembers', label: '회원 · 관리자 권한', to: paths.adminMembers(), badge: 'pendingMembers' },
      { key: 'adminExemptions', label: '면제 관리', to: paths.adminExemptions(), badge: 'pendingExemptions' },
      { key: 'adminNotices', label: '공지 관리', to: paths.adminNotices() },
      { key: 'adminPosts', label: '게시물 관리', to: paths.adminPosts() },
    ],
  },
];

export type DrawerActive = { group: DrawerGroupKey; item: DrawerItemKey | null };

const TEAM_STATIC: Record<string, DrawerItemKey> = {
  new: 'teamNew',
  join: 'teamJoin',
  invitations: 'invitations',
};

const ADMIN_TABS: Record<string, DrawerItemKey> = {
  warnings: 'adminWarnings',
  members: 'adminMembers',
  exemptions: 'adminExemptions',
  notices: 'adminNotices',
  posts: 'adminPosts',
};

/**
 * 현재 경로 → 강조할 대메뉴 · 서브메뉴 (A1 3-2 "활성 항목 매핑").
 * 서브메뉴를 강조하면 그 대메뉴도 함께 밝힌다. 해당 없으면 null.
 */
export function drawerActive(pathname: string, search = ''): DrawerActive | null {
  const seg = pathname.split('/').filter(Boolean);
  const [first, second, third] = seg;

  if (seg.length === 0) return { group: 'home', item: null };

  switch (first) {
    case 'weekly':
    case 'warnings':
      return seg.length === 1 ? { group: 'activity', item: first } : null;

    case 'teams': {
      if (second === undefined) return { group: 'teams', item: 'teamList' };
      const staticItem = TEAM_STATIC[second];
      if (staticItem) return seg.length === 2 ? { group: 'teams', item: staticItem } : null;
      // /teams/:teamId/** — 팀 현황판 · 관리 · 면제 요청은 '내 팀 목록' 아래로 본다
      return { group: 'teams', item: 'teamList' };
    }

    case 'posts': {
      if (second === undefined || (second === 'new' && seg.length === 2)) {
        const { type } = parsePostsSearch(new URLSearchParams(search));
        return { group: 'posts', item: type };
      }
      // 글 상세 · 수정은 글 종류를 불러오기 전엔 모른다 → 대메뉴만
      if (seg.length === 2 || (seg.length === 3 && third === 'edit')) return { group: 'posts', item: null };
      return null;
    }

    case 'notices':
      return seg.length <= 2 ? { group: 'notices', item: 'noticeList' } : null;

    case 'profile':
      // /profile/:userId(타인)은 강조하지 않는다
      return seg.length === 2 && (second === 'me' || second === 'edit') ? { group: 'profile', item: 'profileMe' } : null;

    case 'admin': {
      if (second === undefined) return { group: 'admin', item: 'adminDashboard' };
      const tab = ADMIN_TABS[second];
      return { group: 'admin', item: seg.length === 2 && tab ? tab : null };
    }

    default:
      return null;
  }
}

/** 소메뉴 아래 화면 이름 — 경로 표시 마지막 칸과 드로어 "지금 위치"가 같이 쓴다 */
export function leafLabel(pathname: string): string | null {
  if (/^\/posts\/new\/?$/.test(pathname)) return '글쓰기';
  if (/^\/posts\/[^/]+\/edit\/?$/.test(pathname)) return '글 수정';
  if (/^\/profile\/edit\/?$/.test(pathname)) return '프로필 수정';
  return null;
}
