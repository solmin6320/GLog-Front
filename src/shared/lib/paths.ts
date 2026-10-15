/**
 * 경로 · 쿼리 계약 (요구사항 3-2, A1 5-4). URL은 이 모듈로만 만들고 읽는다.
 * URL 값은 소문자(`troubleshooting`), API enum은 대문자(`TROUBLESHOOTING`)다. 변환은 여기서만 한다.
 */
import { isDateString, isMonday } from './kst';
import { isBigintId } from './ids';

export type PostTypeParam = 'troubleshooting' | 'devlog';
export type PostTypeEnum = 'TROUBLESHOOTING' | 'DEVLOG';
export type AdminResultParam = 'all' | 'fail' | 'hold';
export type AdminMemberStatusParam = 'pending' | 'rejected' | 'all';
export type AdminPostKindParam = 'all' | 'post' | 'comment';

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 50;

type Query = Record<string, string | number | null | undefined>;

function withQuery(path: string, query: Query): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

export function postTypeToEnum(t: PostTypeParam): PostTypeEnum {
  return t === 'devlog' ? 'DEVLOG' : 'TROUBLESHOOTING';
}

export function postTypeFromEnum(t: PostTypeEnum | string | null | undefined): PostTypeParam {
  return t === 'DEVLOG' ? 'devlog' : 'troubleshooting';
}

function oneOf<T extends string>(v: string | null, allowed: readonly T[], fallback: T): T {
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** 검색어 정규화: trim + 50자. 2자 미만이면 undefined. */
export function normalizeSearch(raw: string | null | undefined): string | undefined {
  const q = (raw ?? '').trim().slice(0, SEARCH_MAX);
  return q.length >= SEARCH_MIN ? q : undefined;
}

export const paths = {
  login: () => '/login',
  authCallback: () => '/auth/callback',
  pending: () => '/pending',
  home: () => '/',

  weekly: (week?: string) => withQuery('/weekly', { week }),
  warnings: () => '/warnings',

  teams: () => '/teams',
  teamNew: () => '/teams/new',
  teamJoin: () => '/teams/join',
  invitations: () => '/teams/invitations',
  team: (teamId: string | number) => `/teams/${teamId}`,
  teamManage: (teamId: string | number) => `/teams/${teamId}/manage`,
  teamExemption: (teamId: string | number) => `/teams/${teamId}/exemption`,

  posts: (q: { type?: PostTypeParam; q?: string; tag?: string } = {}) =>
    withQuery('/posts', { type: q.type, q: q.q, tag: q.tag }),
  postNew: (q: { type?: PostTypeParam; team?: string | number } = {}) =>
    withQuery('/posts/new', { type: q.type, team: q.team }),
  post: (postId: string) => `/posts/${postId}`,
  postEdit: (postId: string) => `/posts/${postId}/edit`,

  notices: () => '/notices',
  notice: (noticeId: string | number) => `/notices/${noticeId}`,

  profileMe: () => '/profile/me',
  profileEdit: () => '/profile/edit',
  profile: (userId: string | number) => `/profile/${userId}`,

  admin: (q: { week?: string; q?: string; result?: AdminResultParam; fix?: string } = {}) =>
    withQuery('/admin', { week: q.week, q: q.q, result: q.result === 'all' ? undefined : q.result, fix: q.fix }),
  adminWarnings: () => '/admin/warnings',
  adminMembers: (q: { status?: AdminMemberStatusParam; q?: string } = {}) =>
    withQuery('/admin/members', { status: q.status === 'pending' ? undefined : q.status, q: q.q }),
  adminExemptions: () => '/admin/exemptions',
  adminNotices: (q: { editor?: 'new' | string } = {}) => withQuery('/admin/notices', { editor: q.editor }),
  adminPosts: (q: { kind?: AdminPostKindParam; q?: string } = {}) =>
    withQuery('/admin/posts', { kind: q.kind === 'all' ? undefined : q.kind, q: q.q }),
} as const;

/* ---------- 쿼리 파서 — 잘못된 값은 기본값으로 ---------- */

export function parsePostsSearch(sp: URLSearchParams) {
  return {
    type: oneOf<PostTypeParam>(sp.get('type'), ['troubleshooting', 'devlog'], 'troubleshooting'),
    q: normalizeSearch(sp.get('q')),
    tag: (sp.get('tag') ?? '').trim().slice(0, 20) || undefined,
  };
}

export function parsePostNewSearch(sp: URLSearchParams) {
  const team = sp.get('team');
  return {
    type: oneOf<PostTypeParam>(sp.get('type'), ['troubleshooting', 'devlog'], 'troubleshooting'),
    team: team && isBigintId(team) ? team : undefined,
  };
}

/** AC-01 ?week= — 월요일 날짜만 인정. 아니면 undefined(이번 주). */
export function parseWeekParam(sp: URLSearchParams): string | undefined {
  const w = sp.get('week');
  return w && isDateString(w) && isMonday(w) ? w : undefined;
}

export function parseAdminDashboardSearch(sp: URLSearchParams) {
  const fix = sp.get('fix');
  return {
    week: parseWeekParam(sp),
    q: (sp.get('q') ?? '').trim() || undefined,
    result: oneOf<AdminResultParam>(sp.get('result'), ['all', 'fail', 'hold'], 'all'),
    fix: fix && isBigintId(fix) ? fix : undefined,
  };
}

export function parseAdminMembersSearch(sp: URLSearchParams) {
  return {
    status: oneOf<AdminMemberStatusParam>(sp.get('status'), ['pending', 'rejected', 'all'], 'pending'),
    q: (sp.get('q') ?? '').trim() || undefined,
  };
}

export function parseAdminPostsSearch(sp: URLSearchParams) {
  return {
    kind: oneOf<AdminPostKindParam>(sp.get('kind'), ['all', 'post', 'comment'], 'all'),
    q: (sp.get('q') ?? '').trim() || undefined,
  };
}

export function parseAdminNoticesSearch(sp: URLSearchParams) {
  const editor = sp.get('editor');
  return { editor: editor === 'new' || (editor && isBigintId(editor)) ? editor : undefined };
}
