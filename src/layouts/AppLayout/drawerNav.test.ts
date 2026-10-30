import { DRAWER_GROUPS, drawerActive } from './drawerNav';

describe('drawerActive — A1 3-2 활성 항목 매핑', () => {
  it.each([
    ['/', '', { group: 'home', item: null }],
    ['/weekly', '?week=2026-09-21', { group: 'activity', item: 'weekly' }],
    ['/warnings', '', { group: 'activity', item: 'warnings' }],
    ['/teams', '', { group: 'teams', item: 'teamList' }],
    ['/teams/', '', { group: 'teams', item: 'teamList' }],
    ['/teams/new', '', { group: 'teams', item: 'teamNew' }],
    ['/teams/join', '', { group: 'teams', item: 'teamJoin' }],
    ['/teams/invitations', '', { group: 'teams', item: 'invitations' }],
    ['/teams/12', '', { group: 'teams', item: 'teamList' }],
    ['/teams/12/manage', '', { group: 'teams', item: 'teamList' }],
    ['/teams/12/exemption', '', { group: 'teams', item: 'teamList' }],
    ['/posts', '', { group: 'posts', item: 'troubleshooting' }],
    ['/posts', '?type=devlog&q=리액트', { group: 'posts', item: 'devlog' }],
    ['/posts', '?type=nope', { group: 'posts', item: 'troubleshooting' }],
    ['/posts/new', '?type=devlog', { group: 'posts', item: 'devlog' }],
    ['/posts/new', '', { group: 'posts', item: 'troubleshooting' }],
    ['/posts/65f0c0ffee0000000000abcd', '', { group: 'posts', item: null }],
    ['/posts/65f0c0ffee0000000000abcd/edit', '', { group: 'posts', item: null }],
    ['/notices', '', { group: 'notices', item: 'noticeList' }],
    ['/notices/3', '', { group: 'notices', item: 'noticeList' }],
    ['/profile/me', '', { group: 'profile', item: 'profileMe' }],
    ['/profile/edit', '', { group: 'profile', item: 'profileMe' }],
    ['/admin', '?week=2026-09-21&fix=4', { group: 'admin', item: 'adminDashboard' }],
    ['/admin/warnings', '', { group: 'admin', item: 'adminWarnings' }],
    ['/admin/members', '?status=rejected', { group: 'admin', item: 'adminMembers' }],
    ['/admin/exemptions', '', { group: 'admin', item: 'adminExemptions' }],
    ['/admin/notices', '?editor=new', { group: 'admin', item: 'adminNotices' }],
    ['/admin/posts', '', { group: 'admin', item: 'adminPosts' }],
    ['/admin/unknown', '', { group: 'admin', item: null }],
  ])('%s%s', (path, search, expected) => {
    expect(drawerActive(path, search)).toEqual(expected);
  });

  it.each(['/profile/7', '/nope', '/weekly/extra', '/teams/new/extra', '/login', '/pending'])(
    '%s → 강조 없음',
    (path) => {
      expect(drawerActive(path)).toBeNull();
    },
  );
});

describe('DRAWER_GROUPS — 목업 W-03 + 관리자 그룹 (M-09)', () => {
  it('대메뉴 순서는 홈 · 내 활동 · 팀 · 게시판 · 공지사항 · 프로필 · 관리자', () => {
    expect(DRAWER_GROUPS.map((g) => g.label)).toEqual(['홈', '내 활동', '팀', '게시판', '공지사항', '프로필', '관리자']);
  });

  it('관리자 그룹만 adminOnly이고 서브 6개', () => {
    const admin = DRAWER_GROUPS.filter((g) => g.adminOnly);
    expect(admin.map((g) => g.key)).toEqual(['admin']);
    expect(admin[0]?.items).toHaveLength(6);
  });

  it('회원 "내 경고 · 벌칙"과 관리자 "경고 복구 · 벌칙"은 이름이 다르다', () => {
    const labels = DRAWER_GROUPS.flatMap((g) => g.items.map((i) => i.label));
    expect(labels).toContain('내 경고 · 벌칙');
    expect(labels).toContain('경고 복구 · 벌칙');
  });

  it('모든 서브메뉴 경로는 자기 자신을 강조한다', () => {
    for (const g of DRAWER_GROUPS) {
      for (const item of g.items) {
        const [path = '', query = ''] = item.to.split('?');
        expect(drawerActive(path, query ? `?${query}` : '')).toEqual({ group: g.key, item: item.key });
      }
    }
  });
});
