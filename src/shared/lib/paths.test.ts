import {
  normalizeSearch,
  parseAdminDashboardSearch,
  parseAdminMembersSearch,
  parseAdminNoticesSearch,
  parseAdminPostsSearch,
  parsePostNewSearch,
  parsePostsSearch,
  parseWeekParam,
  paths,
  postTypeFromEnum,
  postTypeToEnum,
  SEARCH_MAX,
  SEARCH_MIN,
} from './paths';

/** '/posts?type=devlog' → URLSearchParams */
const searchOf = (url: string) => new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
const sp = (qs: string) => new URLSearchParams(qs);

describe('고정 경로', () => {
  it('인증 · 홈 · 활동', () => {
    expect(paths.login()).toBe('/login');
    expect(paths.authCallback()).toBe('/auth/callback');
    expect(paths.pending()).toBe('/pending');
    expect(paths.home()).toBe('/');
    expect(paths.warnings()).toBe('/warnings');
  });

  it('팀 · 글 · 공지 · 프로필', () => {
    expect(paths.teams()).toBe('/teams');
    expect(paths.teamNew()).toBe('/teams/new');
    expect(paths.teamJoin()).toBe('/teams/join');
    expect(paths.invitations()).toBe('/teams/invitations');
    expect(paths.team(3)).toBe('/teams/3');
    expect(paths.team('12')).toBe('/teams/12');
    expect(paths.teamManage(3)).toBe('/teams/3/manage');
    expect(paths.teamExemption(3)).toBe('/teams/3/exemption');
    expect(paths.post('65f0a1b2c3d4e5f6a7b8c9d0')).toBe('/posts/65f0a1b2c3d4e5f6a7b8c9d0');
    expect(paths.postEdit('65f0a1b2c3d4e5f6a7b8c9d0')).toBe('/posts/65f0a1b2c3d4e5f6a7b8c9d0/edit');
    expect(paths.notices()).toBe('/notices');
    expect(paths.notice(7)).toBe('/notices/7');
    expect(paths.profileMe()).toBe('/profile/me');
    expect(paths.profileEdit()).toBe('/profile/edit');
    expect(paths.profile(5)).toBe('/profile/5');
  });

  it('관리자', () => {
    expect(paths.admin()).toBe('/admin');
    expect(paths.adminWarnings()).toBe('/admin/warnings');
    expect(paths.adminMembers()).toBe('/admin/members');
    expect(paths.adminExemptions()).toBe('/admin/exemptions');
    expect(paths.adminNotices()).toBe('/admin/notices');
    expect(paths.adminPosts()).toBe('/admin/posts');
  });
});

describe('글 종류 변환 (URL 소문자 ↔ API 대문자)', () => {
  it('왕복', () => {
    expect(postTypeToEnum('troubleshooting')).toBe('TROUBLESHOOTING');
    expect(postTypeToEnum('devlog')).toBe('DEVLOG');
    expect(postTypeFromEnum('TROUBLESHOOTING')).toBe('troubleshooting');
    expect(postTypeFromEnum('DEVLOG')).toBe('devlog');
    expect(postTypeFromEnum(postTypeToEnum('devlog'))).toBe('devlog');
  });

  it('모르는 값은 트러블슈팅', () => {
    expect(postTypeFromEnum(null)).toBe('troubleshooting');
    expect(postTypeFromEnum(undefined)).toBe('troubleshooting');
    expect(postTypeFromEnum('NOTICE')).toBe('troubleshooting');
  });
});

describe('normalizeSearch (E-61 · E-63)', () => {
  it('trim 후 2자 이상만', () => {
    expect(SEARCH_MIN).toBe(2);
    expect(normalizeSearch('  Redis  ')).toBe('Redis');
    expect(normalizeSearch('ab')).toBe('ab');
    expect(normalizeSearch('a')).toBeUndefined();
    expect(normalizeSearch('  a  ')).toBeUndefined();
    expect(normalizeSearch('   ')).toBeUndefined();
    expect(normalizeSearch('')).toBeUndefined();
    expect(normalizeSearch(null)).toBeUndefined();
    expect(normalizeSearch(undefined)).toBeUndefined();
  });

  it('50자에서 자른다', () => {
    expect(SEARCH_MAX).toBe(50);
    expect(normalizeSearch('가'.repeat(60))).toBe('가'.repeat(50));
  });
});

describe('/posts (BD-01 · 헤더 검색)', () => {
  it('빌더: 빈 값은 쿼리에서 뺀다', () => {
    expect(paths.posts()).toBe('/posts');
    expect(paths.posts({})).toBe('/posts');
    expect(paths.posts({ type: 'devlog' })).toBe('/posts?type=devlog');
    expect(paths.posts({ type: 'troubleshooting', q: 'Redis' })).toBe('/posts?type=troubleshooting&q=Redis');
    expect(paths.posts({ tag: 'Redis' })).toBe('/posts?tag=Redis');
    expect(paths.posts({ q: '' })).toBe('/posts');
  });

  it('왕복: 빌더 → 파서', () => {
    const cases = [
      { type: 'troubleshooting', q: 'Redis', tag: undefined },
      { type: 'devlog', q: 'C++ 에러', tag: 'Spring Boot' },
      { type: 'devlog', q: '50% & a=b?#', tag: 'C#' },
      { type: 'troubleshooting', q: undefined, tag: '한글태그' },
    ] as const;
    for (const c of cases) {
      expect(parsePostsSearch(searchOf(paths.posts(c)))).toEqual(c);
    }
  });

  it('특수문자는 인코딩된다 (ACC-HS-13)', () => {
    const url = paths.posts({ type: 'troubleshooting', q: 'C++ 에러' });
    expect(url).not.toContain(' ');
    expect(url).not.toContain('C++');
    expect(searchOf(url).get('q')).toBe('C++ 에러');
  });

  it('파서: 잘못된 값은 기본값', () => {
    expect(parsePostsSearch(sp(''))).toEqual({ type: 'troubleshooting', q: undefined, tag: undefined });
    expect(parsePostsSearch(sp('type=DEVLOG'))).toMatchObject({ type: 'troubleshooting' });
    expect(parsePostsSearch(sp('type=notice'))).toMatchObject({ type: 'troubleshooting' });
    expect(parsePostsSearch(sp('q=a'))).toMatchObject({ q: undefined });
    expect(parsePostsSearch(sp('q=%20%20Redis%20'))).toMatchObject({ q: 'Redis' });
    expect(parsePostsSearch(sp(`q=${'a'.repeat(80)}`)).q).toHaveLength(50);
    expect(parsePostsSearch(sp('tag=%20%20'))).toMatchObject({ tag: undefined });
    expect(parsePostsSearch(sp(`tag=${'t'.repeat(30)}`)).tag).toHaveLength(20);
  });
});

describe('/posts/new', () => {
  it('빌더', () => {
    expect(paths.postNew()).toBe('/posts/new');
    expect(paths.postNew({ type: 'devlog' })).toBe('/posts/new?type=devlog');
    expect(paths.postNew({ type: 'troubleshooting', team: 3 })).toBe('/posts/new?type=troubleshooting&team=3');
  });

  it('왕복', () => {
    expect(parsePostNewSearch(searchOf(paths.postNew({ type: 'devlog', team: '12' })))).toEqual({
      type: 'devlog',
      team: '12',
    });
  });

  it('team이 BIGINT 형식이 아니면 버린다', () => {
    expect(parsePostNewSearch(sp('team=0')).team).toBeUndefined();
    expect(parsePostNewSearch(sp('team=abc')).team).toBeUndefined();
    expect(parsePostNewSearch(sp('team=-1')).team).toBeUndefined();
    expect(parsePostNewSearch(sp('type=x')).type).toBe('troubleshooting');
  });
});

describe('/weekly?week= (AC-01)', () => {
  it('빌더', () => {
    expect(paths.weekly()).toBe('/weekly');
    expect(paths.weekly('2026-09-21')).toBe('/weekly?week=2026-09-21');
  });

  it('월요일 날짜만 인정한다', () => {
    expect(parseWeekParam(searchOf(paths.weekly('2026-09-21')))).toBe('2026-09-21');
    expect(parseWeekParam(sp('week=2026-12-28'))).toBe('2026-12-28');
    expect(parseWeekParam(sp('week=2026-09-22'))).toBeUndefined(); // 화요일
    expect(parseWeekParam(sp('week=2026-02-30'))).toBeUndefined();
    expect(parseWeekParam(sp('week=last'))).toBeUndefined();
    expect(parseWeekParam(sp(''))).toBeUndefined();
  });
});

describe('/admin (대시보드)', () => {
  it('빌더: result=all은 뺀다', () => {
    expect(paths.admin({ result: 'all' })).toBe('/admin');
    expect(paths.admin({ week: '2026-09-21', q: '박지훈', result: 'fail', fix: '42' })).toBe(
      `/admin?week=2026-09-21&q=${encodeURIComponent('박지훈')}&result=fail&fix=42`,
    );
  });

  it('왕복', () => {
    const v = { week: '2026-09-21', q: '박지훈', result: 'hold', fix: '42' } as const;
    expect(parseAdminDashboardSearch(searchOf(paths.admin(v)))).toEqual(v);
    expect(parseAdminDashboardSearch(searchOf(paths.admin()))).toEqual({
      week: undefined,
      q: undefined,
      result: 'all',
      fix: undefined,
    });
  });

  it('잘못된 값은 기본값', () => {
    expect(parseAdminDashboardSearch(sp('week=2026-09-23&result=pass&fix=x&q=%20'))).toEqual({
      week: undefined,
      q: undefined,
      result: 'all',
      fix: undefined,
    });
  });
});

describe('/admin/members · /admin/posts · /admin/notices', () => {
  it('members: 기본 pending은 뺀다, 왕복', () => {
    expect(paths.adminMembers({ status: 'pending' })).toBe('/admin/members');
    expect(paths.adminMembers({ status: 'rejected', q: 'kim' })).toBe('/admin/members?status=rejected&q=kim');
    expect(parseAdminMembersSearch(searchOf(paths.adminMembers({ status: 'all', q: '서연' })))).toEqual({
      status: 'all',
      q: '서연',
    });
    expect(parseAdminMembersSearch(sp('status=approved'))).toEqual({ status: 'pending', q: undefined });
  });

  it('posts: 기본 all은 뺀다, 왕복', () => {
    expect(paths.adminPosts({ kind: 'all' })).toBe('/admin/posts');
    expect(parseAdminPostsSearch(searchOf(paths.adminPosts({ kind: 'comment', q: 'Redis' })))).toEqual({
      kind: 'comment',
      q: 'Redis',
    });
    expect(parseAdminPostsSearch(sp('kind=notice'))).toEqual({ kind: 'all', q: undefined });
  });

  it('notices: editor는 new 또는 BIGINT id', () => {
    expect(paths.adminNotices()).toBe('/admin/notices');
    expect(paths.adminNotices({ editor: 'new' })).toBe('/admin/notices?editor=new');
    expect(parseAdminNoticesSearch(searchOf(paths.adminNotices({ editor: 'new' })))).toEqual({ editor: 'new' });
    expect(parseAdminNoticesSearch(searchOf(paths.adminNotices({ editor: '5' })))).toEqual({ editor: '5' });
    expect(parseAdminNoticesSearch(sp('editor=edit'))).toEqual({ editor: undefined });
    expect(parseAdminNoticesSearch(sp('editor=0'))).toEqual({ editor: undefined });
  });
});
