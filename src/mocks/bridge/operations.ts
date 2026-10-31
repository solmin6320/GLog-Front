/**
 * 브리지: 화면 연산(프론트 계약) → 백엔드 GraphQL 호출 → 프론트 계약 모양으로 되돌리기.
 * 여기 없는 연산은 목이 그대로 받는다(핸들러가 isBridged로 가른다).
 */
import { addDays, kstDateOf, mondayOf } from '@/shared/lib/kst';
import { ask, BackendUnreachable, BridgeError, callBackend } from './backend';

type Vars = Record<string, unknown>;
type Auth = string | null;
type Op = (vars: Vars, auth: Auth) => Promise<Record<string, unknown>>;

const nowIso = () => new Date().toISOString();
const todayKst = () => kstDateOf(nowIso());

function clock() {
  const now = nowIso();
  const start = mondayOf(kstDateOf(now));
  return { __typename: 'ServerClock', now, currentWeekStart: start, currentWeekEnd: addDays(start, 6) };
}

type BackendMe = { id: string; githubLogin: string; nickname: string; profileImageUrl: string | null; status: 'PENDING' | 'ACTIVE' | 'REJECTED'; role: 'MEMBER' | 'ADMIN' };

function toMe(me: BackendMe, hasTeam: boolean, pendingInvitationCount: number) {
  return {
    __typename: 'Me',
    id: me.id,
    status: me.status,
    role: me.role,
    hasTeam,
    pendingInvitationCount,
    member: { __typename: 'Member', id: me.id, nickname: me.nickname, githubLogin: me.githubLogin, profileImageUrl: me.profileImageUrl },
  };
}

/* ---------------- 세션 ---------------- */

const sessionQuery: Op = async (_v, auth) => {
  if (!auth) return { clock: clock(), me: null };
  const { me } = await ask<{ me: BackendMe }>(`{ me { id githubLogin nickname profileImageUrl status role } }`, {}, auth);
  if (me.status !== 'ACTIVE') return { clock: clock(), me: toMe(me, false, 0) };
  const extra = await ask<{ myTeams: { id: string }[]; receivedTeamInvitations: { items: { id: string }[] } }>(
    `{ myTeams { id } receivedTeamInvitations { items { id } } }`,
    {},
    auth,
  );
  return { clock: clock(), me: toMe(me, extra.myTeams.length > 0, extra.receivedTeamInvitations.items.length) };
};

const exchangeLoginCode: Op = async ({ code }, auth) => {
  const r = await callBackend<{ exchangeAuthCode: { accessToken: string; expiresIn: number; me: BackendMe } }>(
    `mutation($code: String!) { exchangeAuthCode(code: $code) { accessToken expiresIn me { id githubLogin nickname profileImageUrl status role } } }`,
    { code },
    auth,
  );
  if (r.errors?.some((e) => e.extensions?.code === 'ACCOUNT_REJECTED')) {
    return { exchangeLoginCode: { __typename: 'AuthPayload', status: 'REJECTED', accessToken: null, expiresAt: null, me: null } };
  }
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  const p = r.data.exchangeAuthCode;
  return {
    exchangeLoginCode: {
      __typename: 'AuthPayload',
      status: p.me.status,
      accessToken: p.accessToken,
      expiresAt: new Date(Date.now() + p.expiresIn * 1000).toISOString(),
      me: toMe(p.me, false, 0),
    },
  };
};

const logout: Op = async () => ({ logout: true });

/* ---------------- 주간 활동 ---------------- */

type BackendDay = { date: string; hasGrass: boolean | null; grassCount: number | null; hasRecord: boolean; recordCount: number | null };
type BackendJudgment = {
  status: string;
  skipReason: string | null;
  holdReason: string | null;
  verifiedDays: number | null;
  recordCount: number | null;
  corrected: boolean;
  judgedAt: string | null;
};
type BackendWeek = {
  weekStart: string;
  weekEnd: string;
  currentWeek: boolean;
  inTeam: boolean;
  days: BackendDay[];
  verifiedDays: number | null;
  recordCount: number;
  requiredVerifiedDays: number;
  requiredRecordCount: number;
  passExpected: boolean | null;
  grassAvailable: boolean;
  grassFetchedAt: string | null;
  banner: 'CONTRIBUTIONS_HIDDEN' | 'GRASS_NOT_LOADED' | 'FIRST_WEEK' | 'EXEMPTION_WEEK' | null;
  judgment: BackendJudgment | null;
};

const WEEK_FIELDS = `weekStart weekEnd currentWeek inTeam verifiedDays recordCount requiredVerifiedDays requiredRecordCount
  passExpected grassAvailable grassFetchedAt banner
  days { date hasGrass grassCount hasRecord recordCount }
  judgment { status skipReason holdReason verifiedDays recordCount corrected judgedAt }`;

/** 잔디 개수 → 0~4 단계 (목업 heat()의 h0~h4) */
function levelOf(count: number | null): number | null {
  if (count === null) return null;
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

function toWeek(w: BackendWeek) {
  const today = todayKst();
  const needDays = Math.max(0, w.requiredVerifiedDays - (w.verifiedDays ?? 0));
  const needRecords = Math.max(0, w.requiredRecordCount - w.recordCount);
  let live = null;
  if (w.currentWeek) {
    if (!w.inTeam) live = { status: 'EXCLUDED', skipReason: 'NO_TEAM' };
    else if (w.banner === 'FIRST_WEEK') live = { status: 'EXCLUDED', skipReason: 'FIRST_WEEK' };
    else if (w.banner === 'EXEMPTION_WEEK') live = { status: 'EXEMPT', skipReason: 'EXEMPTION_PERIOD' };
    else live = { status: w.passExpected ? 'CONDITION_MET' : 'NOT_YET', skipReason: null };
    live = { __typename: 'LiveWeekState', ...live, verifiedDaysNeeded: needDays, recordsNeeded: needRecords };
  }
  return {
    __typename: 'WeekActivity',
    weekStart: w.weekStart,
    weekEnd: w.weekEnd,
    isCurrentWeek: w.currentWeek,
    days: w.days.map((d) => ({
      __typename: 'DayActivity',
      date: d.date,
      grassCount: d.grassCount,
      grassLevel: levelOf(d.grassCount),
      hasGrass: d.hasGrass ?? false,
      recordCount: d.recordCount,
      hasRecord: d.hasRecord,
      verified: (d.hasGrass ?? false) || d.hasRecord,
      isFuture: d.date > today,
      isToday: d.date === today,
    })),
    // 판정 없는 지난 주는 서버가 인증일을 0으로 줄 때가 있어(B3) 날짜별 값으로 다시 센다
    verifiedDays:
      !w.currentWeek && !w.judgment
        ? w.days.filter((d) => d.hasGrass === true || d.hasRecord).length
        : w.verifiedDays,
    recordCount: w.recordCount,
    live,
    judgment: w.judgment
      ? { __typename: 'WeeklyJudgment', id: `${w.weekStart}`, weekStart: w.weekStart, weekEnd: w.weekEnd, ...w.judgment }
      : null,
    grassStatus: w.grassAvailable ? 'OK' : 'FAILED',
    grassUpdatedAt: w.grassFetchedAt,
    privateContributionSuspected: w.banner === 'CONTRIBUTIONS_HIDDEN',
  };
}

async function loadWeek(weekStart: unknown, auth: Auth) {
  const { myWeeklyActivity } = await ask<{ myWeeklyActivity: BackendWeek }>(
    `query($weekStart: String) { myWeeklyActivity(weekStart: $weekStart) { ${WEEK_FIELDS} } }`,
    { weekStart: weekStart ?? null },
    auth,
  );
  return toWeek(myWeeklyActivity);
}

type BackendNotice = { id: string; title: string; content: string; isPinned: boolean; isSystem: boolean; createdAt: string; updatedAt: string | null };
async function loadNotices(auth: Auth) {
  const { notices } = await ask<{ notices: { items: BackendNotice[]; nextCursor: string | null } }>(
    `{ notices { items { id title content isPinned isSystem createdAt updatedAt } nextCursor } }`,
    {},
    auth,
  );
  return notices.items.map((n) => ({ __typename: 'Notice', ...n }));
}

type BackendWarning = { warningCount: number | null; streak: number | null; penaltyTarget: boolean | null };
async function loadWarningState(auth: Auth) {
  const { myWarningSummary: s } = await ask<{ myWarningSummary: BackendWarning & { onHold: boolean } }>(
    `{ myWarningSummary { onHold warningCount streak penaltyTarget } }`,
    {},
    auth,
  );
  // 판정 보류가 남아 있으면 서버가 숫자를 주지 않는다(null) — 0으로 두되 isOnHold로 화면이 숫자 대신 '확인 중'을 그린다
  const onHold = s.onHold;
  const active = onHold ? 0 : (s.warningCount ?? 0);
  const penalty = onHold ? false : (s.penaltyTarget ?? false);
  const streak = onHold ? 0 : (s.streak ?? 0);
  return {
    __typename: 'WarningState',
    isOnHold: onHold,
    activeCount: active,
    isPenaltyTarget: penalty,
    consecutivePasses: streak,
    weeksUntilDeduction: onHold || penalty || active === 0 ? null : Math.max(0, 2 - streak),
    byCategory: [],
  };
}

const homeQuery: Op = async (_v, auth) => {
  const [myWeek, state, notices] = await Promise.all([loadWeek(null, auth), loadWarningState(auth), loadNotices(auth)]);
  const rule = notices.find((n) => n.isSystem);
  return {
    myWeek,
    myWarnings: { __typename: 'MyWarnings', state, history: [] },
    grassRuleNotice: rule ? { __typename: 'Notice', id: rule.id } : null,
  };
};

const homeNoticesQuery: Op = async (_v, auth) => {
  const items = await loadNotices(auth);
  return {
    notices: {
      __typename: 'NoticeConnection',
      nodes: items.slice(0, 3),
      pageInfo: { __typename: 'PageInfo', hasNextPage: items.length > 3, endCursor: null },
    },
  };
};

const weeklyQuery: Op = async ({ weekStart }, auth) => {
  const [myWeek, notices] = await Promise.all([loadWeek(weekStart, auth), loadNotices(auth)]);
  const rule = notices.find((n) => n.isSystem);
  return { myWeek, grassRuleNotice: rule ? { __typename: 'Notice', id: rule.id } : null };
};

const weeklyHistoryQuery: Op = async ({ memberId, after }, auth) => {
  const { myJudgmentHistory: h } = await ask<{
    myJudgmentHistory: { items: (BackendJudgment & { weekStart: string; weekEnd: string })[]; nextCursor: string | null };
  }>(
    `query($after: String) { myJudgmentHistory(after: $after) { items { weekStart weekEnd status skipReason holdReason verifiedDays recordCount corrected } nextCursor } }`,
    { after: after ?? null },
    auth,
  );
  return {
    member: {
      __typename: 'Member',
      id: memberId,
      judgmentHistory: {
        __typename: 'WeeklyJudgmentConnection',
        nodes: h.items.map((i) => ({ __typename: 'WeeklyJudgment', id: i.weekStart, ...i })),
        pageInfo: { __typename: 'PageInfo', hasNextPage: h.nextCursor !== null, endCursor: h.nextCursor },
      },
    },
  };
};

/* ---------------- 팀 목록 ---------------- */

const teamListQuery: Op = async (_v, auth) => {
  const d = await ask<{
    me: { id: string };
    myTeams: { id: string; name: string; isPublic: boolean; isLeader: boolean; memberCount: number; weekSummary: { passCount: number; notYetCount: number } }[];
    receivedTeamInvitations: { items: { id: string }[] };
  }>(
    `{ me { id } myTeams { id name isPublic isLeader memberCount weekSummary { passCount notYetCount } } receivedTeamInvitations { items { id } } }`,
    {},
    auth,
  );
  return {
    me: { __typename: 'Me', id: d.me.id, pendingInvitationCount: d.receivedTeamInvitations.items.length },
    myTeams: d.myTeams.map((t) => ({
      __typename: 'Team',
      id: t.id,
      name: t.name,
      isPublic: t.isPublic,
      viewerRole: t.isLeader ? 'LEADER' : 'MEMBER',
      memberCount: t.memberCount,
      currentWeekSummary: { __typename: 'TeamWeekSummary', passCount: t.weekSummary.passCount, notYetCount: t.weekSummary.notYetCount },
    })),
  };
};

/* ---------------- 게시판 ---------------- */

type BackendPost = {
  id: string;
  authorId: string;
  author: { id: string; nickname: string; profileImageUrl: string | null };
  teamId: string | null;
  teamName: string | null;
  type: 'TROUBLESHOOTING' | 'DEVLOG';
  title: string;
  sections: Record<string, string | null>;
  tags: string[];
  isRecord: boolean;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
};
type BackendComment = { id: string; authorId: string; author: BackendPost['author']; content: string; createdAt: string; updatedAt: string };
type Viewer = { id: string; role: string; leaderTeamIds: Set<string>; teamIds: Set<string> };

const POST_FIELDS = `id authorId author { id nickname profileImageUrl } teamId teamName type title tags isRecord createdAt updatedAt commentCount
  sections { problem cause solution did learned }`;
const COMMENT_FIELDS = `id authorId author { id nickname profileImageUrl } content createdAt updatedAt`;

const SECTION_KEYS: Record<BackendPost['type'], string[]> = {
  TROUBLESHOOTING: ['problem', 'cause', 'solution'],
  DEVLOG: ['did', 'learned'],
};

async function loadViewer(auth: Auth): Promise<Viewer> {
  const d = await ask<{ me: { id: string; role: string }; myTeams: { id: string; isLeader: boolean }[] }>(
    `{ me { id role } myTeams { id isLeader } }`,
    {},
    auth,
  );
  return {
    id: d.me.id,
    role: d.me.role,
    leaderTeamIds: new Set(d.myTeams.filter((t) => t.isLeader).map((t) => t.id)),
    teamIds: new Set(d.myTeams.map((t) => t.id)),
  };
}

const publicTeamOf = (p: BackendPost) =>
  p.teamId && p.teamName ? { __typename: 'Team', id: p.teamId, name: p.teamName } : null;
const memberOf = (a: BackendPost['author']) => ({ __typename: 'Member', ...a });
const canEdit = (v: Viewer, authorId: string, teamId: string | null) =>
  v.id === authorId || (teamId !== null && v.leaderTeamIds.has(teamId));

function toSections(p: BackendPost) {
  return SECTION_KEYS[p.type].map((k) => ({ __typename: 'PostSection', key: k.toUpperCase(), body: p.sections[k] ?? null }));
}

/** 프론트 PostSectionInput[] → 백엔드 PostSectionsInput 객체 */
function sectionsInput(list: unknown): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const s of (list as { key: string; body?: string | null }[]) ?? []) out[s.key.toLowerCase()] = s.body ?? null;
  return out;
}

function toPostNode(p: BackendPost, v: Viewer) {
  return {
    __typename: 'Post',
    id: p.id,
    type: p.type,
    title: p.title,
    sections: toSections(p),
    tags: p.tags,
    author: memberOf(p.author),
    publicTeam: publicTeamOf(p),
    isRecord: p.isRecord,
    // E-28: 서버에 필드가 없다. 작성일(createdAt, KST)의 주가 이번 주보다 앞이면 끝난 주로 본다 (판정 전 월요일 새벽 · 보류 주는 구분 못 함)
    inFinalizedWeek: mondayOf(p.createdAt.slice(0, 10)) < mondayOf(todayKst()),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt === p.createdAt ? null : p.updatedAt,
    commentCount: p.commentCount,
    viewerCanEdit: canEdit(v, p.authorId, p.teamId),
    // 작성자, 또는 관리자(관리자 삭제 adminDeletePost)
    viewerCanDelete: v.id === p.authorId || v.role === 'ADMIN',
    viewerIsAuthor: v.id === p.authorId,
    editTeamId: p.teamId && v.teamIds.has(p.teamId) ? p.teamId : null,
  };
}

function toCommentNode(c: BackendComment, p: Pick<BackendPost, 'teamId'>, v: Viewer) {
  return {
    __typename: 'Comment',
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt === c.createdAt ? null : c.updatedAt,
    author: memberOf(c.author),
    viewerCanEdit: canEdit(v, c.authorId, p.teamId),
    viewerCanDelete: v.id === c.authorId || v.role === 'ADMIN',
  };
}

const pageInfo = (next: string | null) => ({ __typename: 'PageInfo', hasNextPage: next !== null, endCursor: next });

type Filter = { type?: BackendPost['type'] | null; tag?: string | null; query?: string | null };
const postsArgs = (f: Filter) => ({ type: f.type ?? 'TROUBLESHOOTING', tag: f.tag ?? null, q: f.query ?? null });

const postListQuery: Op = async ({ filter, after }, auth) => {
  const f = filter as Filter;
  const [d, v] = await Promise.all([
    ask<{ posts: { items: BackendPost[]; nextCursor: string | null; totalCount: number } }>(
      `query($type: PostType!, $tag: String, $q: String, $after: String) {
        posts(type: $type, tag: $tag, q: $q, after: $after) { items { ${POST_FIELDS} } nextCursor totalCount } }`,
      { ...postsArgs(f), after: after ?? null },
      auth,
    ),
    loadViewer(auth),
  ]);
  return {
    posts: {
      __typename: 'PostConnection',
      nodes: d.posts.items.map((p) => toPostNode(p, v)),
      pageInfo: pageInfo(d.posts.nextCursor),
      totalCount: d.posts.totalCount,
    },
  };
};

const postTypeCountsQuery: Op = async ({ filter }, auth) => {
  const f = filter as Filter;
  const count = async (type: BackendPost['type']) =>
    (
      await ask<{ posts: { totalCount: number } }>(
        `query($type: PostType!, $tag: String, $q: String) { posts(type: $type, tag: $tag, q: $q) { totalCount } }`,
        postsArgs({ ...f, type }),
        auth,
      )
    ).posts.totalCount;
  const [troubleshooting, devlog] = await Promise.all([count('TROUBLESHOOTING'), count('DEVLOG')]);
  return { postTypeCounts: { __typename: 'PostTypeCounts', troubleshooting, devlog } };
};

const postTagsQuery: Op = async (_v, auth) => {
  const { popularTags } = await ask<{ popularTags: { tag: string; count: number }[] }>(`{ popularTags { tag count } }`, {}, auth);
  return { popularTags: popularTags.slice(0, 10).map((t) => ({ __typename: 'TagCount', ...t })) };
};

/** 글 한 건 조회. 삭제된 글 → DeletedPost, 없는 글 → null (프론트 계약) */
async function lookupPost(id: unknown, auth: Auth, after: unknown = null) {
  const r = await callBackend<{ post: BackendPost & { comments: { items: BackendComment[]; nextCursor: string | null } } }>(
    `query($id: ID!, $after: String) { post(id: $id) { ${POST_FIELDS} comments(after: $after) { items { ${COMMENT_FIELDS} } nextCursor } } }`,
    { id, after },
    auth,
  );
  const code = r.errors?.[0]?.extensions?.code;
  if (code === 'POST_DELETED') return { post: { __typename: 'DeletedPost', id: String(id), deletedAt: null } };
  if (code === 'NOT_FOUND') return { post: null };
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  const v = await loadViewer(auth);
  const p = r.data.post;
  return {
    post: {
      ...toPostNode(p, v),
      comments: {
        __typename: 'CommentConnection',
        nodes: p.comments.items.map((c) => toCommentNode(c, p, v)),
        pageInfo: pageInfo(p.comments.nextCursor),
        totalCount: p.commentCount,
      },
    },
  };
}

const postDetailQuery: Op = ({ id, after }, auth) => lookupPost(id, auth, after);
const postEditorPostQuery: Op = ({ id }, auth) => lookupPost(id, auth);

const postEditorTeamsQuery: Op = async (_v, auth) => {
  const { myTeams } = await ask<{ myTeams: { id: string; name: string; isPublic: boolean }[] }>(
    `{ myTeams { id name isPublic } }`,
    {},
    auth,
  );
  return { clock: clock(), myTeams: myTeams.map((t) => ({ __typename: 'Team', ...t })) };
};

const postWrite =
  (mode: 'create' | 'update'): Op =>
  async (vars, auth) => {
    const i = vars.input as { type?: string; title: string; sections: unknown; tags: string[]; teamId?: string | null };
    const input = {
      ...(mode === 'create' ? { type: i.type } : {}),
      title: i.title,
      sections: sectionsInput(i.sections),
      tags: i.tags,
      teamId: i.teamId ?? null,
    };
    const field = mode === 'create' ? 'createPost' : 'updatePost';
    const d = await ask<Record<string, BackendPost>>(
      mode === 'create'
        ? `mutation($input: CreatePostInput!) { createPost(input: $input) { ${POST_FIELDS} } }`
        : `mutation($id: ID!, $input: UpdatePostInput!) { updatePost(id: $id, input: $input) { ${POST_FIELDS} } }`,
      mode === 'create' ? { input } : { id: vars.id, input },
      auth,
    );
    const v = await loadViewer(auth);
    return { [field]: toPostNode(d[field]!, v) };
  };

/** 작성자는 deletePost, 남의 글이면(FORBIDDEN) 관리자 삭제로 한 번 더 */
const postDelete: Op = async ({ id }, auth) => {
  const r = await callBackend<{ deletePost: boolean }>(`mutation($id: ID!) { deletePost(id: $id) }`, { id }, auth);
  if (r.errors?.[0]?.extensions?.code === 'FORBIDDEN') {
    const a = await ask<{ adminDeletePost: boolean }>(`mutation($id: ID!) { adminDeletePost(postId: $id) }`, { id }, auth);
    return { deletePost: a.adminDeletePost };
  }
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  return { deletePost: r.data.deletePost };
};

const commentWrite =
  (kind: 'add' | 'update'): Op =>
  async (vars, auth) => {
    const d = await ask<Record<string, BackendComment>>(
      kind === 'add'
        ? `mutation($postId: ID!, $content: String!) { createComment(postId: $postId, content: $content) { ${COMMENT_FIELDS} } }`
        : `mutation($id: ID!, $content: String!) { updateComment(id: $id, content: $content) { ${COMMENT_FIELDS} } }`,
      vars,
      auth,
    );
    const c = d[kind === 'add' ? 'createComment' : 'updateComment']!;
    return {
      [kind === 'add' ? 'addComment' : 'updateComment']: {
        __typename: 'Comment',
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt === c.createdAt ? null : c.updatedAt,
      },
    };
  };

const commentDelete: Op = async ({ id }, auth) => {
  const r = await callBackend<{ deleteComment: boolean }>(`mutation($id: ID!) { deleteComment(id: $id) }`, { id }, auth);
  if (r.errors?.[0]?.extensions?.code === 'FORBIDDEN') {
    const a = await ask<{ adminDeleteComment: boolean }>(`mutation($id: ID!) { adminDeleteComment(commentId: $id) }`, { id }, auth);
    return { deleteComment: a.adminDeleteComment };
  }
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  return { deleteComment: r.data.deleteComment };
};

/* ---------------- 관리자: 회원 · 관리자 승격 ---------------- */

type BackendAdminMember = { id: string; githubLogin: string; nickname: string; status: string; role: string; createdAt: string };

const toMemberRow = (m: BackendAdminMember) => ({
  __typename: 'AdminMemberRow',
  member: { __typename: 'Member', id: m.id, nickname: m.nickname, githubLogin: m.githubLogin, profileImageUrl: null },
  status: m.status,
  role: m.role,
  appliedAt: m.createdAt,
});

const ADMIN_MEMBER_FIELDS = 'id githubLogin nickname status role createdAt';

/**
 * 배포 서버(GLog-Backend main)에는 활성 회원 명단(adminMemberRoster)과 정지(SUSPENDED)가 없다.
 * 그 필터는 서버에 보내지 않고 NOT_AVAILABLE로 막는다. 승인 대기 · 거절 · 전체(대기+거절)만 서버로 간다.
 */
const SERVER_MEMBER_FILTERS = new Set(['PENDING', 'REJECTED', 'ALL']);

const adminMembersQuery: Op = async ({ filter, search, after }, auth) => {
  type Page = { items: BackendAdminMember[]; nextCursor: string | null; totalCount: number };
  const status = (filter as string | null | undefined) ?? 'ACTIVE';
  if (!SERVER_MEMBER_FILTERS.has(status)) {
    throw new BridgeError([{ message: 'not on the deployed server', extensions: { code: 'NOT_AVAILABLE', classification: 'INTERNAL_ERROR' } }]);
  }
  const d = (
    await ask<{ adminMembers: Page }>(
      `query($status: MemberApprovalFilter, $keyword: String, $after: String) {
        adminMembers(status: $status, keyword: $keyword, after: $after) { items { ${ADMIN_MEMBER_FIELDS} } nextCursor totalCount } }`,
      { status, keyword: search ?? null, after: after ?? null },
      auth,
    )
  ).adminMembers;
  return {
    adminMembers: { __typename: 'AdminMemberConnection', nodes: d.items.map(toMemberRow), pageInfo: pageInfo(d.nextCursor), totalCount: d.totalCount },
  };
};

/** 탭 배지 · 패널 건수. 백엔드에 요약 쿼리가 없어 목록 건수로 모은다 (실패한 칸은 0) */
const adminDashboardSummary: Op = async (_v, auth) => {
  const safe = async <T,>(q: string, pick: (d: T) => number) => {
    const r = await callBackend<T>(q, {}, auth);
    return r.data ? pick(r.data) : 0;
  };
  const [pendingMemberCount, penaltyTargetCount, pendingExemptionRequestCount] = await Promise.all([
    safe<{ adminMembers: { totalCount: number } }>(`{ adminMembers { totalCount } }`, (d) => d.adminMembers.totalCount),
    safe<{ adminPenaltyTargets: { totalCount: number } }>(`{ adminPenaltyTargets { totalCount } }`, (d) => d.adminPenaltyTargets.totalCount),
    safe<{ personalExemptionRequests: { items: unknown[] } }>(`{ personalExemptionRequests { items { id } } }`, (d) => d.personalExemptionRequests.items.length),
  ]);
  return {
    adminDashboardSummary: {
      __typename: 'AdminDashboardSummary',
      pendingMemberCount,
      penaltyTargetCount,
      pendingExemptionRequestCount,
      latestWeekFailCount: 0,
      latestJudgedWeekStart: null,
      heldJudgmentCount: 0,
    },
  };
};

/** 화면 계약의 뮤테이션 이름 → 배포 서버 이름 (승격만 이름이 다르다) */
const memberAction =
  (field: 'approveMember' | 'rejectMember' | 'revertMemberToPending' | 'promoteToAdmin', serverField: string = field): Op =>
  async ({ memberId }, auth) => {
    const d = await ask<Record<string, BackendAdminMember>>(
      `mutation($memberId: ID!) { ${serverField}(memberId: $memberId) { ${ADMIN_MEMBER_FIELDS} } }`,
      { memberId },
      auth,
    );
    return { [field]: toMemberRow(d[serverField]!) };
  };

/* ---------------- 프로필 ---------------- */

type BackendProfile = {
  id: string;
  nickname: string;
  githubLogin: string;
  profileImageUrl: string | null;
  postCount: number;
  commentCount: number;
  grass: { fetchedAt: string; days: { date: string; count: number }[] } | null;
  warning: { onHold: boolean; warningCount: number | null; penaltyTarget: boolean | null };
  teams: { id: string; name: string }[];
  teamWarnings: { onHold: boolean; teams: { name: string; count: number }[] };
};

/** GitHub처럼 그 사람의 최댓값 대비 4단계 (0은 0단계) */
function relativeLevel(count: number, days: { count: number }[]): number {
  if (count <= 0) return 0;
  const max = days.reduce((m, d) => Math.max(m, d.count), 0);
  return Math.max(1, Math.min(4, Math.ceil((count / max) * 4)));
}

const labelKind = (name: string) => (name === '비공개 팀' ? 'PRIVATE' : name === '삭제된 팀' ? 'DELETED' : 'PUBLIC');

const profileQuery: Op = async ({ id }, auth) => {
  const [d, v, notices] = await Promise.all([
    ask<{ profile: BackendProfile }>(
      `query($id: ID!) { profile(memberId: $id) {
        id nickname githubLogin profileImageUrl postCount commentCount
        grass { fetchedAt days { date count } }
        warning { onHold warningCount penaltyTarget }
        teams { id name }
        teamWarnings { onHold teams { name count } } } }`,
      { id },
      auth,
    ),
    loadViewer(auth),
    loadNotices(auth),
  ]);
  const p = d.profile;
  const rule = notices.find((n) => n.isSystem);
  return {
    member: {
      __typename: 'Member',
      id: p.id,
      nickname: p.nickname,
      githubLogin: p.githubLogin,
      profileImageUrl: p.profileImageUrl,
      postCount: p.postCount,
      commentCount: p.commentCount,
      grassCalendar: {
        __typename: 'GrassCalendar',
        status: p.grass ? 'OK' : 'FAILED',
        updatedAt: p.grass?.fetchedAt ?? null,
        // 배포 서버에는 총합 필드가 없어 날짜별 기여 수를 더한다
        totalContributions: (p.grass?.days ?? []).reduce((sum, g) => sum + g.count, 0),
        days: (p.grass?.days ?? []).map((g) => ({ __typename: 'GrassDay', date: g.date, count: g.count, level: relativeLevel(g.count, p.grass?.days ?? []) })),
        privateContributionSuspected: false,
      },
      warningState: {
        __typename: 'WarningState',
        // 판정 보류가 남아 있으면 경고 합계 · 팀별 경고를 서버가 계산하지 않는다 (profile.graphqls ProfileWarning.onHold)
        isOnHold: p.warning.onHold || p.teamWarnings.onHold,
        activeCount: p.warning.warningCount ?? 0,
        isPenaltyTarget: p.warning.penaltyTarget ?? false,
        consecutivePasses: 0,
        weeksUntilDeduction: null,
        byCategory: p.teamWarnings.teams.map((t) => ({
          __typename: 'CategoryWarningCount',
          label: { __typename: 'TeamLabel', kind: labelKind(t.name), name: labelKind(t.name) === 'PUBLIC' ? t.name : null },
          count: t.count,
        })),
      },
      publicTeams: p.teams.map((t) => ({
        __typename: 'Team',
        id: t.id,
        name: t.name,
        viewerRole: v.leaderTeamIds.has(t.id) ? 'LEADER' : v.teamIds.has(t.id) ? 'MEMBER' : null,
      })),
    },
    grassRuleNotice: rule ? { __typename: 'Notice', id: rule.id } : null,
  };
};

type BackendProfileWeek = { weekStart: string; weekEnd: string; result: string; verifiedDays: number | null; recordCount: number | null };

const profileHistoryQuery: Op = async ({ id, after }, auth) => {
  const { profile } = await ask<{ profile: { judgmentHistory: { items: BackendProfileWeek[]; nextCursor: string | null } } }>(
    `query($id: ID!, $after: String) { profile(memberId: $id) { judgmentHistory(after: $after) { items { weekStart weekEnd result verifiedDays recordCount } nextCursor } } }`,
    { id, after: after ?? null },
    auth,
  );
  const items = profile.judgmentHistory.items;
  // 첫 페이지 맨 위 IN_PROGRESS 행 → 첫 줄 '진행 중'. 서버는 첫 페이지에만 준다 —
  // 다음 페이지를 붙일 때 currentWeek가 null로 덮여 '진행 중' 줄이 사라지지 않게 첫 페이지를 한 번 더 본다
  const firstPage = after
    ? (
        await ask<{ profile: { judgmentHistory: { items: BackendProfileWeek[] } } }>(
          `query($id: ID!) { profile(memberId: $id) { judgmentHistory { items { weekStart weekEnd result verifiedDays recordCount } } } }`,
          { id },
          auth,
        )
      ).profile.judgmentHistory.items
    : items;
  const current = firstPage.find((i) => i.result === 'IN_PROGRESS');
  const rows = items.filter((i) => i.result !== 'IN_PROGRESS');
  return {
    member: {
      __typename: 'Member',
      id,
      currentWeek: current
        ? { __typename: 'WeekActivity', weekStart: current.weekStart, verifiedDays: current.verifiedDays, recordCount: current.recordCount }
        : null,
      judgmentHistory: {
        __typename: 'WeeklyJudgmentConnection',
        nodes: rows.map((r) => ({
          __typename: 'WeeklyJudgment',
          id: r.weekStart,
          weekStart: r.weekStart,
          status: r.result,
          skipReason: r.result === 'EXCLUDED' ? 'FIRST_WEEK' : r.result === 'EXEMPT' ? 'EXEMPTION_PERIOD' : null,
          verifiedDays: r.verifiedDays,
          recordCount: r.recordCount,
          hasActiveWarning: r.result === 'FAIL',
        })),
        pageInfo: pageInfo(profile.judgmentHistory.nextCursor),
      },
    },
  };
};

/* ---------------- 팀 만들기 · 참가 · 받은 초대 ---------------- */

type BackendTeam = { id: string; name: string; isPublic: boolean; isLeader: boolean; memberCount: number };
const TEAM_FIELDS = 'id name isPublic isLeader memberCount';
const toTeam = (t: BackendTeam) => ({
  __typename: 'Team',
  id: t.id,
  name: t.name,
  isPublic: t.isPublic,
  viewerRole: t.isLeader ? 'LEADER' : 'MEMBER',
  memberCount: t.memberCount,
});

/** 백엔드 오류 코드 → 화면 계약 코드 (같은 뜻, 이름만 다름) */
const TEAM_ERROR_ALIASES: Record<string, string> = {
  TEAM_CODE_NOT_FOUND: 'INVITE_CODE_NOT_FOUND',
  TEAM_ALREADY_JOINED: 'ALREADY_TEAM_MEMBER',
  INVITATION_ALREADY_JOINED: 'ALREADY_TEAM_MEMBER',
  INVITEE_ALREADY_MEMBER: 'ALREADY_TEAM_MEMBER',
  LEADER_LAST_MEMBER: 'LAST_MEMBER',
  EXEMPTION_REQUEST_DUPLICATE: 'EXEMPTION_DUPLICATE',
};
async function askTeam<T>(query: string, vars: Record<string, unknown>, auth: Auth): Promise<T> {
  try {
    return await ask<T>(query, vars, auth);
  } catch (e) {
    if (e instanceof BridgeError) {
      throw new BridgeError(
        e.errors.map((err) => {
          const code = err.extensions?.code;
          return code && TEAM_ERROR_ALIASES[code] ? { ...err, extensions: { ...err.extensions, code: TEAM_ERROR_ALIASES[code] } } : err;
        }),
      );
    }
    throw e;
  }
}

const teamInvitationsQuery: Op = async (_v, auth) => {
  const d = await ask<{
    me: { id: string };
    receivedTeamInvitations: {
      items: { id: string; teamId: string; teamName: string; inviter: { id: string; nickname: string }; createdAt: string }[];
    };
  }>(`{ me { id } receivedTeamInvitations { items { id teamId teamName inviter { id nickname } createdAt } } }`, {}, auth);
  const items = d.receivedTeamInvitations.items;
  return {
    me: { __typename: 'Me', id: d.me.id, pendingInvitationCount: items.length },
    myInvitations: items.map((i) => ({
      __typename: 'ReceivedInvitation',
      id: i.id,
      createdAt: i.createdAt,
      team: { __typename: 'Team', id: i.teamId, name: i.teamName },
      invitedBy: { __typename: 'Member', id: i.inviter.id, nickname: i.inviter.nickname },
    })),
  };
};

const teamRespondInvitation: Op = async ({ invitationId, accept }, auth) => {
  if (accept) {
    const d = await askTeam<{ acceptTeamInvitation: BackendTeam }>(
      `mutation($id: ID!) { acceptTeamInvitation(invitationId: $id) { ${TEAM_FIELDS} } }`,
      { id: invitationId },
      auth,
    );
    return { respondInvitation: { __typename: 'RespondInvitationPayload', invitationId, team: toTeam(d.acceptTeamInvitation) } };
  }
  await askTeam<{ declineTeamInvitation: boolean }>(`mutation($id: ID!) { declineTeamInvitation(invitationId: $id) }`, { id: invitationId }, auth);
  return { respondInvitation: { __typename: 'RespondInvitationPayload', invitationId, team: null } };
};

const teamCreate: Op = async ({ input }, auth) => {
  const i = input as { name: string; description?: string | null; isPublic: boolean };
  const d = await askTeam<{ createTeam: { team: BackendTeam; inviteCode: string } }>(
    `mutation($input: CreateTeamInput!) { createTeam(input: $input) { inviteCode team { ${TEAM_FIELDS} } } }`,
    { input: { name: i.name, description: i.description ?? null, isPublic: i.isPublic } },
    auth,
  );
  return { createTeam: { __typename: 'CreateTeamPayload', inviteCode: d.createTeam.inviteCode, team: toTeam(d.createTeam.team) } };
};

const teamJoinByInviteCode: Op = async ({ code }, auth) => {
  const d = await askTeam<{ joinTeamByCode: BackendTeam }>(`mutation($code: String!) { joinTeamByCode(code: $code) { ${TEAM_FIELDS} } }`, { code }, auth);
  return { joinTeamByInviteCode: toTeam(d.joinTeamByCode) };
};

/* ---------------- 팀 범위 · 팀 현황판 ---------------- */

/** 팀 기본 정보. 없는 팀은 화면 계약대로 team: null(E-53), 비소속은 FORBIDDEN 그대로 */
const teamScopeQuery: Op = async ({ id }, auth) => {
  const r = await callBackend<{ team: BackendTeam }>(`query($id: ID!) { team(id: $id) { ${TEAM_FIELDS} } }`, { id }, auth);
  if (r.errors?.[0]?.extensions?.code === 'NOT_FOUND') return { team: null };
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  return { team: toTeam(r.data.team) };
};

type BoardMember = {
  memberId: string;
  nickname: string;
  isMe: boolean;
  days: { date: string; hasGrass: boolean | null; hasRecord: boolean; verified: boolean | null }[];
  verifiedDays: number | null;
  recordCount: number;
  warningCount: number | null;
  status: 'PASS' | 'NOT_YET' | 'FAIL' | 'EXCLUDED';
};
const BOARD_STATUS: Record<BoardMember['status'], string> = { PASS: 'CONDITION_MET', NOT_YET: 'NOT_YET', FAIL: 'NOT_YET', EXCLUDED: 'EXCLUDED' };

const teamBoardQuery: Op = async ({ id }, auth) => {
  const r = await callBackend<{
    teamBoard: {
      weekStart: string;
      weekEnd: string;
      grassFetchedAt: string | null;
      members: BoardMember[];
      recentPosts: { id: string; type: string; title: string; createdAt: string; author: { id: string; nickname: string } }[];
    };
  }>(
    `query($id: ID!) { teamBoard(teamId: $id) {
      weekStart weekEnd grassFetchedAt
      members { memberId nickname isMe verifiedDays recordCount warningCount status days { date hasGrass hasRecord verified } }
      recentPosts { id type title createdAt author { id nickname } } } }`,
    { id },
    auth,
  );
  if (r.errors?.[0]?.extensions?.code === 'NOT_FOUND') return { team: null };
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  const b = r.data.teamBoard;
  const today = todayKst();
  return {
    team: {
      __typename: 'Team',
      id,
      currentWeekBoard: {
        __typename: 'TeamWeekBoard',
        weekStart: b.weekStart,
        weekEnd: b.weekEnd,
        grassUpdatedAt: b.grassFetchedAt,
        rows: b.members.map((m) => ({
          __typename: 'TeamWeekRow',
          member: { __typename: 'Member', id: m.memberId, nickname: m.nickname, profileImageUrl: null },
          isViewer: m.isMe,
          days: m.days.map((d) => ({
            __typename: 'DayActivity',
            date: d.date,
            grassCount: null,
            grassLevel: d.hasGrass ? 3 : d.hasGrass === false ? 0 : null,
            hasGrass: d.hasGrass ?? false,
            recordCount: null,
            hasRecord: d.hasRecord,
            verified: d.verified ?? false,
            isFuture: d.date > today,
            isToday: d.date === today,
          })),
          verifiedDays: m.verifiedDays,
          recordCount: m.recordCount,
          teamWarningCount: m.warningCount ?? 0,
          status: BOARD_STATUS[m.status],
          grassStatus: m.verifiedDays === null ? 'FAILED' : 'OK',
        })),
      },
      recentPosts: b.recentPosts.map((p) => ({
        __typename: 'Post',
        id: p.id,
        type: p.type,
        title: p.title,
        createdAt: p.createdAt,
        author: { __typename: 'Member', id: p.author.id, nickname: p.author.nickname },
      })),
    },
  };
};

/* ---------------- 팀 관리 · 나가기 · 삭제 · 개인 면제 요청 ---------------- */

type BackendTeamMember = { id: string; nickname: string; githubLogin: string; profileImageUrl: string | null; isLeader: boolean; joinedAt: string };
const TEAM_MEMBER_FIELDS = 'id nickname githubLogin profileImageUrl isLeader joinedAt';

const toMembership = (m: BackendTeamMember) => ({
  __typename: 'TeamMembership',
  role: m.isLeader ? 'LEADER' : 'MEMBER',
  joinedAt: m.joinedAt,
  member: { __typename: 'Member', id: m.id, nickname: m.nickname, githubLogin: m.githubLogin, profileImageUrl: m.profileImageUrl },
});

/** 팀원 전체 (커서를 끝까지 따라간다) */
async function loadTeamMembers(teamId: unknown, auth: Auth): Promise<BackendTeamMember[]> {
  const all: BackendTeamMember[] = [];
  let after: string | null = null;
  for (let i = 0; i < 20; i += 1) {
    const d: { teamMembers: { items: BackendTeamMember[]; nextCursor: string | null } } = await askTeam(
      `query($id: ID!, $after: String) { teamMembers(teamId: $id, after: $after) { items { ${TEAM_MEMBER_FIELDS} } nextCursor } }`,
      { id: teamId, after },
      auth,
    );
    all.push(...d.teamMembers.items);
    after = d.teamMembers.nextCursor;
    if (!after) break;
  }
  return all;
}

const teamManageQuery: Op = async ({ id }, auth) => {
  const [members, code, sent] = await Promise.all([
    loadTeamMembers(id, auth),
    askTeam<{ teamInviteCode: string }>(`query($id: ID!) { teamInviteCode(teamId: $id) }`, { id }, auth),
    askTeam<{ sentTeamInvitations: { items: { id: string; createdAt: string; invitee: { id: string; nickname: string; githubLogin: string } }[] } }>(
      `query($id: ID!) { sentTeamInvitations(teamId: $id) { items { id createdAt invitee { id nickname githubLogin } } } }`,
      { id },
      auth,
    ),
  ]);
  return {
    team: {
      __typename: 'Team',
      id,
      inviteCode: code.teamInviteCode,
      memberCount: members.length,
      members: members.map(toMembership),
      pendingInvitations: sent.sentTeamInvitations.items.map((i) => ({
        __typename: 'SentInvitation',
        id: i.id,
        createdAt: i.createdAt,
        invitee: { __typename: 'Member', ...i.invitee },
      })),
    },
  };
};

/** 팀 글 · 댓글을 한 목록으로 (최신순). 서버가 따로 주므로 첫 쪽끼리 합친다 */
const teamManagedContentsQuery: Op = async ({ id }, auth) => {
  const [posts, comments] = await Promise.all([
    askTeam<{ teamPosts: { items: { id: string; type: string; title: string; createdAt: string; author: { id: string; nickname: string } }[]; nextCursor: string | null } }>(
      `query($id: ID!) { teamPosts(teamId: $id) { items { id type title createdAt author { id nickname } } nextCursor } }`,
      { id },
      auth,
    ),
    askTeam<{ teamComments: { items: { id: string; postId: string; content: string; createdAt: string; author: { id: string; nickname: string } }[]; nextCursor: string | null } }>(
      `query($id: ID!) { teamComments(teamId: $id) { items { id postId content createdAt author { id nickname } } nextCursor } }`,
      { id },
      auth,
    ),
  ]);
  const typeOf = new Map(posts.teamPosts.items.map((p) => [p.id, p.type]));
  const rows = [
    ...posts.teamPosts.items.map((p) => ({ kind: 'POST', targetId: p.id, postId: p.id, postType: p.type, title: p.title, createdAt: p.createdAt, author: p.author })),
    ...comments.teamComments.items.map((c) => ({
      kind: 'COMMENT',
      targetId: c.id,
      postId: c.postId,
      postType: typeOf.get(c.postId) ?? 'DEVLOG',
      title: c.content.length > 40 ? `${c.content.slice(0, 40)}…` : c.content,
      createdAt: c.createdAt,
      author: c.author,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    team: {
      __typename: 'Team',
      id,
      managedContents: {
        __typename: 'ContentRowConnection',
        nodes: rows.map((r) => ({ __typename: 'ContentRow', ...r, author: { __typename: 'Member', ...r.author } })),
        pageInfo: pageInfo(null),
        totalCount: rows.length,
      },
    },
  };
};

const teamInviteMember: Op = async ({ teamId, githubLogin }, auth) => {
  const d = await askTeam<{ inviteToTeam: { id: string; createdAt: string; invitee: { id: string; nickname: string; githubLogin: string } } }>(
    `mutation($teamId: ID!, $login: String!) { inviteToTeam(teamId: $teamId, githubLogin: $login) { id createdAt invitee { id nickname githubLogin } } }`,
    { teamId, login: githubLogin },
    auth,
  );
  const i = d.inviteToTeam;
  return { inviteMember: { __typename: 'SentInvitation', id: i.id, createdAt: i.createdAt, invitee: { __typename: 'Member', ...i.invitee } } };
};

const teamCancelInvitation: Op = async ({ invitationId }, auth) =>
  ({ cancelInvitation: (await askTeam<{ cancelTeamInvitation: boolean }>(`mutation($id: ID!) { cancelTeamInvitation(invitationId: $id) }`, { id: invitationId }, auth)).cancelTeamInvitation });

const teamKickMember: Op = async ({ teamId, memberId }, auth) => {
  await askTeam(`mutation($t: ID!, $m: ID!) { kickTeamMember(teamId: $t, memberId: $m) }`, { t: teamId, m: memberId }, auth);
  const members = await loadTeamMembers(teamId, auth);
  return { kickMember: { __typename: 'Team', id: teamId, memberCount: members.length, members: members.map(toMembership) } };
};

const teamTransferLeadership: Op = async ({ teamId, memberId }, auth) => {
  const d = await askTeam<{ transferTeamLeadership: BackendTeam }>(
    `mutation($t: ID!, $m: ID!) { transferTeamLeadership(teamId: $t, newLeaderId: $m) { ${TEAM_FIELDS} } }`,
    { t: teamId, m: memberId },
    auth,
  );
  // 넘긴 뒤에는 초대코드를 볼 권한이 없다
  return { transferLeadership: { ...toTeam(d.transferTeamLeadership), inviteCode: null } };
};

const teamSetVisibility: Op = async ({ teamId, isPublic }, auth) => {
  const d = await askTeam<{ updateTeam: BackendTeam }>(
    `mutation($t: ID!, $p: Boolean!) { updateTeam(teamId: $t, input: { isPublic: $p }) { ${TEAM_FIELDS} } }`,
    { t: teamId, p: isPublic },
    auth,
  );
  return { setTeamVisibility: { __typename: 'Team', id: d.updateTeam.id, isPublic: d.updateTeam.isPublic } };
};

const teamDelete: Op = async ({ teamId }, auth) => {
  await askTeam(`mutation($t: ID!) { deleteTeam(teamId: $t) }`, { t: teamId }, auth);
  return { deleteTeam: teamId };
};

const teamLeave: Op = async ({ teamId }, auth) => {
  await askTeam(`mutation($t: ID!) { leaveTeam(teamId: $t) }`, { t: teamId }, auth);
  return { leaveTeam: teamId };
};

/** 팀장이 남의 댓글을 고칠 때 원문 */
const teamCommentForEditQuery: Op = async ({ postId }, auth) => {
  const r = await lookupPost(postId, auth);
  const post = r.post as { __typename: string; id: string; comments?: { nodes: { id: string; content: string; viewerCanEdit: boolean }[] } } | null;
  if (!post || post.__typename !== 'Post') return { post };
  return { post: { __typename: 'Post', id: post.id, comments: { __typename: 'CommentConnection', nodes: post.comments?.nodes ?? [] } } };
};

type BackendExemption = {
  id: string;
  member: { id: string; nickname: string };
  weekStart: string;
  weekEnd: string;
  status: string;
  rejectReason: string | null;
  overlapsExemptionPeriod: boolean;
  createdAt: string;
};
const EXEMPTION_FIELDS = 'id member { id nickname } weekStart weekEnd status rejectReason overlapsExemptionPeriod createdAt';
const toExemption = (e: BackendExemption) => ({ __typename: 'PersonalExemptionRequest', ...e, member: { __typename: 'Member', ...e.member } });

const teamExemptionQuery: Op = async ({ id }, auth) => {
  const [members, mine] = await Promise.all([
    loadTeamMembers(id, auth),
    askTeam<{ myPersonalExemptionRequests: { items: BackendExemption[] } }>(`{ myPersonalExemptionRequests { items { ${EXEMPTION_FIELDS} } } }`, {}, auth),
  ]);
  // 서버는 팀 구분 없이 내가 보낸 요청을 준다 → 지금 이 팀 팀원 대상만 보여 준다
  const inTeam = new Set(members.map((m) => m.id));
  return {
    team: {
      __typename: 'Team',
      id,
      members: members.map((m) => ({ __typename: 'TeamMembership', role: m.isLeader ? 'LEADER' : 'MEMBER', member: { __typename: 'Member', id: m.id, nickname: m.nickname } })),
      exemptionRequests: mine.myPersonalExemptionRequests.items.filter((e) => inTeam.has(e.member.id)).map(toExemption),
    },
  };
};

const teamRequestExemption: Op = async ({ input }, auth) => {
  const i = input as { teamId: string; memberId: string; weekStart: string; reason: string };
  const d = await askTeam<{ requestPersonalExemption: BackendExemption }>(
    `mutation($t: ID!, $m: ID!, $w: String!, $r: String!) { requestPersonalExemption(teamId: $t, memberId: $m, weekStart: $w, reason: $r) { ${EXEMPTION_FIELDS} } }`,
    { t: i.teamId, m: i.memberId, w: i.weekStart, r: i.reason },
    auth,
  );
  return { requestPersonalExemption: toExemption(d.requestPersonalExemption) };
};

/* ---------------- 관리자: 대시보드 · 경고 · 면제 · 게시물 ---------------- */

type Brief = { id: string; nickname: string; githubLogin?: string };
type Impact = {
  onHold: boolean;
  warningCountBefore: number | null;
  warningCountAfter: number | null;
  entersPenalty: boolean;
  leavesPenalty: boolean;
  recordOnly: boolean;
  affectedWeeks: number;
};
const BRIEF = 'id nickname githubLogin';
const IMPACT = 'onHold warningCountBefore warningCountAfter entersPenalty leavesPenalty recordOnly affectedWeeks';
const briefOf = (m: Brief) => ({ __typename: 'Member', profileImageUrl: null, githubLogin: '', ...m });
const teamLabel = (t: { id: string; name: string }) => ({ __typename: 'AdminTeamLabel', teamId: t.id, name: t.name, isPublic: true, isDeleted: false });
const cursorPage = (next: string | null) => pageInfo(next);

/** 서버 영향값 → 화면 RecalcPreview. 보류 중이면 숫자 비교가 없어 0으로 둔다 */
const toPreview = (member: Brief, i: Impact, basis: string | null = null) => ({
  __typename: 'RecalcPreview',
  member: briefOf(member),
  warningCountBefore: i.warningCountBefore ?? 0,
  warningCountAfter: i.warningCountAfter ?? 0,
  penaltyChange: i.entersPenalty ? 'ENTER' : i.leavesPenalty ? 'RELEASE' : 'NONE',
  affectedWeekCount: i.affectedWeeks,
  frozenByFulfillment: i.recordOnly,
  restoresWithoutCategory: false,
  basis,
});
const recalcPayload = (member: Brief) => ({ __typename: 'RecalcPayload', member: briefOf(member), judgment: null });

/** 보류 건은 서버가 판정 id를 주지 않아 회원 · 주로 id를 만든다 (재시도에 그대로 쓴다) */
const holdId = (memberId: string, weekStart: string) => `hold:${memberId}:${weekStart}`;
/** hold:{회원}:{주} → { memberId, weekStart }. 형식이 틀리면 null */
export function parseHoldId(id: string): { memberId: string; weekStart: string } | null {
  const m = /^hold:(\d+):(\d{4}-\d{2}-\d{2})$/.exec(id);
  return m ? { memberId: m[1]!, weekStart: m[2]! } : null;
}
const weekEndOf = (weekStart: string) => addDays(weekStart, 6);

type BackendHold = { member: Brief; weekStart: string; reason: string; retriesExhausted: boolean };

const adminDashboardSummaryQuery: Op = async (_v, auth) => {
  type Summary = { judgedWeekStart: string; pendingMembers: number; failedMembers: number; penaltyTargets: number; pendingExemptions: number };
  const d = await ask<{ adminDashboardSummary: Summary; adminJudgmentHolds: { items: BackendHold[]; totalCount: number } }>(
    `{ adminDashboardSummary { judgedWeekStart pendingMembers failedMembers penaltyTargets pendingExemptions }
       adminJudgmentHolds { items { member { ${BRIEF} } weekStart reason retriesExhausted } totalCount } }`,
    {},
    auth,
  );
  const s = d.adminDashboardSummary;
  return {
    adminDashboardSummary: {
      __typename: 'AdminDashboardSummary',
      pendingMemberCount: s.pendingMembers,
      latestWeekFailCount: s.failedMembers,
      latestJudgedWeekStart: s.judgedWeekStart,
      penaltyTargetCount: s.penaltyTargets,
      pendingExemptionRequestCount: s.pendingExemptions,
      heldJudgmentCount: d.adminJudgmentHolds.totalCount,
    },
    heldJudgments: d.adminJudgmentHolds.items.map((h) => ({
      __typename: 'AdminJudgmentRow',
      judgment: { __typename: 'WeeklyJudgment', id: holdId(h.member.id, h.weekStart), weekStart: h.weekStart, weekEnd: weekEndOf(h.weekStart), status: 'HOLD', holdReason: h.reason },
      member: briefOf(h.member),
      canRetry: h.reason !== 'IDENTITY_MISMATCH',
    })),
  };
};

type BackendJudgmentRow = {
  judgmentId: string;
  member: Brief;
  status: string;
  skipReason: string | null;
  holdReason: string | null;
  verifiedDays: number | null;
  recordCount: number | null;
  warningCount: number | null;
  corrected: boolean;
  manualHold: boolean;
};

const adminDashboardWeekQuery: Op = async ({ weekStart, filter, search, after }, auth) => {
  type Page = {
    weekStart: string;
    weekEnd: string;
    executedAt: string | null;
    passCount: number;
    failCount: number;
    exemptCount: number;
    firstWeekCount: number;
    holdCount: number;
    items: BackendJudgmentRow[];
    nextCursor: string | null;
  };
  const backendFilter = filter === 'FAIL' ? 'FAIL_ONLY' : filter === 'HOLD' ? 'HOLD_ONLY' : 'ALL';
  const d = await ask<{ adminJudgments: Page }>(
    `query($w: String, $k: String, $f: AdminJudgmentFilter, $a: String) {
      adminJudgments(weekStart: $w, keyword: $k, filter: $f, after: $a) {
        weekStart weekEnd executedAt passCount failCount exemptCount firstWeekCount holdCount nextCursor
        items { judgmentId member { ${BRIEF} } status skipReason holdReason verifiedDays recordCount warningCount corrected manualHold } } }`,
    { w: weekStart ?? null, k: search || null, f: backendFilter, a: after ?? null },
    auth,
  );
  const p = d.adminJudgments;
  return {
    adminJudgmentWeek: {
      __typename: 'AdminJudgmentWeek',
      weekStart: p.weekStart,
      weekEnd: p.weekEnd,
      executedAt: p.executedAt,
      counts: { __typename: 'JudgmentCounts', pass: p.passCount, fail: p.failCount, exempt: p.exemptCount, firstWeek: p.firstWeekCount, hold: p.holdCount },
      rows: {
        __typename: 'AdminJudgmentConnection',
        nodes: p.items.map((r) => ({
          __typename: 'AdminJudgmentRow',
          judgment: {
            __typename: 'WeeklyJudgment',
            id: r.status === 'HOLD' ? holdId(r.member.id, p.weekStart) : r.judgmentId,
            weekStart: p.weekStart,
            weekEnd: p.weekEnd,
            status: r.status,
            skipReason: r.skipReason,
            holdReason: r.holdReason,
            verifiedDays: r.verifiedDays,
            recordCount: r.recordCount,
            corrected: r.corrected,
          },
          member: briefOf(r.member),
          activeWarningCount: r.warningCount ?? 0,
          isPenaltyTarget: (r.warningCount ?? 0) >= 3,
          canRetry: r.status === 'HOLD' && r.holdReason !== 'IDENTITY_MISMATCH',
          canCorrect: r.status !== 'HOLD',
        })),
        pageInfo: cursorPage(p.nextCursor),
        totalCount: p.items.length,
      },
    },
  };
};

const adminCorrectionPreview: Op = async ({ judgmentId, newStatus }, auth) => {
  const d = await ask<{ previewJudgmentCorrection: { member: Brief; currentStatus: string; impact: Impact } }>(
    `query($j: ID!, $s: AdminCorrectionStatus!) { previewJudgmentCorrection(judgmentId: $j, status: $s) { member { ${BRIEF} } currentStatus impact { ${IMPACT} } } }`,
    { j: judgmentId, s: newStatus },
    auth,
  );
  const p = d.previewJudgmentCorrection;
  // basis = 미리보기 때 본 현재 결과. 반영 때 expectedStatus로 돌려준다
  return { judgmentCorrectionPreview: toPreview(p.member, p.impact, p.currentStatus) };
};

const adminCorrectJudgment: Op = async ({ input }, auth) => {
  const i = input as { judgmentId: string; newStatus: string; reason: string; expectedBasis?: string | null };
  let d: { correctJudgment: { judgmentId: string; member: Brief; status: string } };
  try {
    d = await ask(
      `mutation($in: JudgmentCorrectionInput!) { correctJudgment(input: $in) { judgmentId member { ${BRIEF} } status } }`,
      { in: { judgmentId: i.judgmentId, status: i.newStatus, reason: i.reason, expectedStatus: i.expectedBasis ?? null } },
      auth,
    );
  } catch (e) {
    // 서버의 "그 사이 판정이 바뀜"(JUDGMENT_CHANGED) = 화면 계약의 PREVIEW_STALE (미리보기를 다시 받는다)
    if (e instanceof BridgeError && e.errors.some((x) => x.extensions?.code === 'JUDGMENT_CHANGED')) {
      throw new BridgeError(e.errors.map((x) => (x.extensions?.code === 'JUDGMENT_CHANGED' ? { ...x, extensions: { ...x.extensions, code: 'PREVIEW_STALE' } } : x)));
    }
    throw e;
  }
  const c = d.correctJudgment;
  return {
    correctJudgment: {
      ...recalcPayload(c.member),
      judgment: { __typename: 'WeeklyJudgment', id: c.judgmentId, status: c.status, skipReason: null, corrected: true },
    },
  };
};

const adminRerunHeld: Op = async ({ judgmentIds }, auth) => {
  const ids = (judgmentIds as string[] | null) ?? null;
  if (!ids) {
    const d = await ask<{ retryAllJudgmentHolds: { resolved: number; stillHold: number } }>(
      `mutation { retryAllJudgmentHolds { resolved stillHold } }`,
      {},
      auth,
    );
    const r = d.retryAllJudgmentHolds;
    return { rerunHeldJudgments: { __typename: 'RerunResult', processedCount: r.resolved, stillHeldCount: r.stillHold } };
  }
  // 한 건씩 다시 판정한다. 중간에 실패해도 멈추지 않고, 앞서 처리된 건수를 버리지 않는다.
  // 형식이 틀린 보류 id(hold:{회원}:{주} 아님)는 서버에 보내지 않고 실패로 센다
  let processedCount = 0;
  let stillHeldCount = 0;
  let firstError: BridgeError | null = null;
  for (const id of ids) {
    const parsed = parseHoldId(id);
    if (!parsed) {
      stillHeldCount += 1;
      firstError ??= new BridgeError([{ message: `bad hold id: ${id}`, extensions: { code: 'INVALID_INPUT' } }]);
      continue;
    }
    try {
      const d = await ask<{ retryJudgmentHold: { resolved: boolean } }>(
        `mutation($m: ID!, $w: String!) { retryJudgmentHold(memberId: $m, weekStart: $w) { resolved } }`,
        { m: parsed.memberId, w: parsed.weekStart },
        auth,
      );
      if (d.retryJudgmentHold.resolved) processedCount += 1;
      else stillHeldCount += 1;
    } catch (e) {
      if (!(e instanceof BridgeError)) throw e;
      stillHeldCount += 1;
      firstError ??= e;
    }
  }
  // 한 건도 처리하지 못하고 오류만 났으면 그 오류를 그대로 알린다. 하나라도 처리했으면 결과를 돌려준다
  if (firstError && processedCount === 0 && stillHeldCount === ids.length && ids.length > 0) {
    const allFailed = firstError;
    throw allFailed;
  }
  return { rerunHeldJudgments: { __typename: 'RerunResult', processedCount, stillHeldCount } };
};

const adminPenaltyTargetsQuery: Op = async (_v, auth) => {
  type Target = { member: Brief; warningCount: number; reachedWeek: string; teams: { id: string; name: string }[] };
  const d = await ask<{ adminPenaltyTargets: { items: Target[] } }>(
    `{ adminPenaltyTargets { items { member { ${BRIEF} } warningCount reachedWeek teams { id name } } } }`,
    {},
    auth,
  );
  return {
    penaltyTargets: d.adminPenaltyTargets.items.map((t) => ({
      __typename: 'PenaltyTarget',
      member: briefOf(t.member),
      activeWarningCount: t.warningCount,
      reachedWeekStart: t.reachedWeek,
      reachedAt: null,
      teams: t.teams.map(teamLabel),
    })),
  };
};

const adminDeletedWarningsQuery: Op = async ({ after }, auth) => {
  type Deleted = { warningId: string; member: Brief; weekStart: string; deleteReason: string; deletedAt: string; restoreTeams: { id: string; name: string }[] };
  const d = await ask<{ adminDeletedWarnings: { items: Deleted[]; nextCursor: string | null } }>(
    `query($a: String) { adminDeletedWarnings(after: $a) { items { warningId member { ${BRIEF} } weekStart deleteReason deletedAt restoreTeams { id name } } nextCursor } }`,
    { a: after ?? null },
    auth,
  );
  const p = d.adminDeletedWarnings;
  return {
    deletedWarnings: {
      __typename: 'DeletedWarningConnection',
      nodes: p.items.map((w) => ({
        __typename: 'DeletedWarning',
        id: w.warningId,
        member: briefOf(w.member),
        weekStart: w.weekStart,
        weekEnd: weekEndOf(w.weekStart),
        deleteReason: w.deleteReason,
        deletedAt: w.deletedAt,
        restoreCategories: w.restoreTeams.map(teamLabel),
      })),
      pageInfo: cursorPage(p.nextCursor),
      totalCount: p.items.length,
    },
  };
};

const adminRestorePreview: Op = async ({ warningId }, auth) => {
  const d = await ask<{ previewWarningRestore: { member: Brief; teamDeleted: boolean; impact: Impact } }>(
    `query($w: ID!) { previewWarningRestore(warningId: $w) { member { ${BRIEF} } teamDeleted impact { ${IMPACT} } } }`,
    { w: warningId },
    auth,
  );
  const p = d.previewWarningRestore;
  return { restoreWarningPreview: { ...toPreview(p.member, p.impact), restoresWithoutCategory: p.teamDeleted } };
};

/** 백엔드 오류 코드를 화면 계약 코드로 바꿔 다시 던진다 */
async function askAliased<T>(aliases: Record<string, string>, query: string, vars: Record<string, unknown>, auth: Auth): Promise<T> {
  try {
    return await ask<T>(query, vars, auth);
  } catch (e) {
    if (!(e instanceof BridgeError)) throw e;
    throw new BridgeError(e.errors.map((x) => (x.extensions?.code && aliases[x.extensions.code] ? { ...x, extensions: { ...x.extensions, code: aliases[x.extensions.code] } } : x)));
  }
}

const adminRestoreWarning: Op = async ({ warningId }, auth) => {
  // 이미 복구된 경고(ALREADY_HANDLED) = 화면 계약의 "그 경고가 없어짐"(NOT_FOUND): 목록을 다시 읽고 창을 닫는다
  const d = await askAliased<{ restoreWarning: { member: Brief } }>(
    { ALREADY_HANDLED: 'NOT_FOUND' },
    `mutation($w: ID!) { restoreWarning(warningId: $w) { member { ${BRIEF} } } }`,
    { w: warningId },
    auth,
  );
  return { restoreWarning: recalcPayload(d.restoreWarning.member) };
};

const adminFulfillPenalty: Op = async ({ memberId }, auth) => {
  const d = await ask<{ fulfillPenalty: { member: Brief } }>(`mutation($m: ID!) { fulfillPenalty(memberId: $m) { member { ${BRIEF} } } }`, { m: memberId }, auth);
  return { fulfillPenalty: recalcPayload(d.fulfillPenalty.member) };
};

type BackendPeriod = { id: string; weekStart: string; weekEnd: string; reason: string };
const PERIOD_FIELDS = 'id weekStart weekEnd reason';
const toPeriod = (p: BackendPeriod) => ({ __typename: 'ExemptionPeriod', ...p, isPast: p.weekEnd < todayKst() });

const adminPeriodsQuery: Op = async ({ after }, auth) => {
  const d = await ask<{ exemptionPeriods: { items: BackendPeriod[]; nextCursor: string | null } }>(
    `query($a: String) { exemptionPeriods(after: $a) { items { ${PERIOD_FIELDS} } nextCursor } }`,
    { a: after ?? null },
    auth,
  );
  return { exemptionPeriods: { __typename: 'ExemptionPeriodConnection', nodes: d.exemptionPeriods.items.map(toPeriod), pageInfo: cursorPage(d.exemptionPeriods.nextCursor) } };
};

type RetroPreview = { weekStart: string; retroactive: boolean; items: { member: Brief; impact: Impact }[] };
const RETRO_FIELDS = `weekStart retroactive items { member { ${BRIEF} } impact { ${IMPACT} } }`;

/** 기간 삭제는 판정을 되돌리지 않아(서버 규칙) 영향이 없다 */
const adminPeriodPreview: Op = async ({ weekStart, removing }, auth) => {
  if (removing) {
    return { exemptionPeriodPreview: { __typename: 'ExemptionPeriodPreview', weekStart, isRetroactive: false, affectedMemberCount: 0, changes: [], basis: null } };
  }
  const d = await ask<{ previewExemptionPeriod: RetroPreview }>(`query($w: String!) { previewExemptionPeriod(weekStart: $w) { ${RETRO_FIELDS} } }`, { w: weekStart }, auth);
  const p = d.previewExemptionPeriod;
  return {
    exemptionPeriodPreview: {
      __typename: 'ExemptionPeriodPreview',
      weekStart: p.weekStart,
      isRetroactive: p.retroactive,
      affectedMemberCount: p.items.length,
      changes: p.items.map((c) => toPreview(c.member, c.impact)),
      basis: null,
    },
  };
};

const periodWrite =
  (kind: 'create' | 'update'): Op =>
  async ({ id, input }, auth) => {
    const i = input as { weekStart: string; reason: string };
    const field = kind === 'create' ? 'createExemptionPeriod' : 'updateExemptionPeriod';
    // 같은 주가 이미 있음: 서버 EXEMPTION_PERIOD_DUPLICATE = 화면 계약 EXEMPTION_DUPLICATE (그 자리 안내)
    const d = await askAliased<Record<string, BackendPeriod>>(
      { EXEMPTION_PERIOD_DUPLICATE: 'EXEMPTION_DUPLICATE' },
      kind === 'create'
        ? `mutation($in: ExemptionPeriodInput!) { createExemptionPeriod(input: $in) { ${PERIOD_FIELDS} } }`
        : `mutation($id: ID!, $in: ExemptionPeriodInput!) { updateExemptionPeriod(id: $id, input: $in) { ${PERIOD_FIELDS} } }`,
      { id, in: { weekStart: i.weekStart, reason: i.reason } },
      auth,
    );
    return { [field]: toPeriod(d[field]!) };
  };

const adminDeletePeriod: Op = async ({ id }, auth) => {
  const d = await ask<{ deleteExemptionPeriod: boolean }>(`mutation($id: ID!) { deleteExemptionPeriod(id: $id) }`, { id }, auth);
  return { deleteExemptionPeriod: d.deleteExemptionPeriod };
};

type BackendRequest = BackendExemption & { requester: Brief; reason: string; respondedAt: string | null };
const REQUEST_FIELDS = `${EXEMPTION_FIELDS} requester { ${BRIEF} } reason respondedAt`;
const toRequest = (e: BackendRequest) => ({
  ...toExemption(e),
  member: briefOf(e.member),
  requestedBy: briefOf(e.requester),
  isRetroactive: e.weekStart < mondayOf(todayKst()),
});

const adminRequestsQuery: Op = async ({ status, after }, auth) => {
  const d = await ask<{ personalExemptionRequests: { items: BackendRequest[]; nextCursor: string | null } }>(
    `query($s: PersonalExemptionStatus, $a: String) { personalExemptionRequests(status: $s, after: $a) { items { ${REQUEST_FIELDS} } nextCursor } }`,
    { s: status ?? 'PENDING', a: after ?? null },
    auth,
  );
  const p = d.personalExemptionRequests;
  return {
    personalExemptionRequests: {
      __typename: 'PersonalExemptionRequestConnection',
      nodes: p.items.map(toRequest),
      pageInfo: cursorPage(p.nextCursor),
      totalCount: p.items.length,
    },
  };
};

const adminApprovalPreview: Op = async ({ requestId }, auth) => {
  const d = await ask<{ previewPersonalExemptionApproval: RetroPreview }>(
    `query($id: ID!) { previewPersonalExemptionApproval(id: $id) { ${RETRO_FIELDS} } }`,
    { id: requestId },
    auth,
  );
  // 아직 판정 안 된 주면 영향이 없다 → 화면은 null이면 미리보기를 건너뛴다
  const c = d.previewPersonalExemptionApproval.items[0];
  return { personalExemptionApprovalPreview: c ? toPreview(c.member, c.impact) : null };
};

const requestAction =
  (kind: 'approve' | 'reject'): Op =>
  async ({ requestId, reason }, auth) => {
    const field = kind === 'approve' ? 'approvePersonalExemption' : 'rejectPersonalExemption';
    const d = await ask<Record<string, BackendRequest>>(
      kind === 'approve'
        ? `mutation($id: ID!) { approvePersonalExemption(id: $id) { ${REQUEST_FIELDS} } }`
        : `mutation($id: ID!, $r: String!) { rejectPersonalExemption(id: $id, reason: $r) { ${REQUEST_FIELDS} } }`,
      { id: requestId, r: reason },
      auth,
    );
    return { [field]: toRequest(d[field]!) };
  };

type BackendAdminPost = { kind: 'POST' | 'COMMENT'; id: string; postId: string; title: string; content: string | null; author: Brief; createdAt: string };

const adminPostsQuery: Op = async ({ filter, search, after }, auth) => {
  const backendFilter = filter === 'POST' ? 'POSTS' : filter === 'COMMENT' ? 'COMMENTS' : 'ALL';
  const d = await ask<{ adminPosts: { items: BackendAdminPost[]; nextCursor: string | null } }>(
    `query($f: AdminPostFilter, $k: String, $a: String) { adminPosts(filter: $f, keyword: $k, after: $a) { items { kind id postId title content author { ${BRIEF} } createdAt } nextCursor } }`,
    { f: backendFilter, k: search || null, a: after ?? null },
    auth,
  );
  const p = d.adminPosts;
  return {
    adminContents: {
      __typename: 'ContentRowConnection',
      nodes: p.items.map((c) => ({
        __typename: 'ContentRow',
        kind: c.kind,
        targetId: c.id,
        postId: c.postId,
        // 서버 목록에 글 종류가 없다. 화면은 이 값을 쓰지 않는다
        postType: 'TROUBLESHOOTING',
        title: c.kind === 'COMMENT' && c.content ? c.content : c.title,
        author: briefOf(c.author),
        createdAt: c.createdAt,
      })),
      pageInfo: cursorPage(p.nextCursor),
      totalCount: p.items.length,
    },
  };
};

/* ---------------- 공지 · 내 경고 ---------------- */

const NOTICE_FIELDS = 'id title content isPinned isSystem createdAt updatedAt';

/** 공지 목록 (고정 먼저 · 최신순, 서버 정렬 그대로) */
const noticeListQuery: Op = async ({ after }, auth) => {
  const { notices } = await ask<{ notices: { items: BackendNotice[]; nextCursor: string | null } }>(
    `query($after: String) { notices(after: $after) { items { ${NOTICE_FIELDS} } nextCursor } }`,
    { after: after ?? null },
    auth,
  );
  return {
    notices: {
      __typename: 'NoticeConnection',
      nodes: notices.items.map((n) => ({ __typename: 'Notice', ...n })),
      pageInfo: pageInfo(notices.nextCursor),
    },
  };
};

/** 공지 하나. 없는 공지는 화면 계약대로 null(404) */
const noticeDetailQuery: Op = async ({ id }, auth) => {
  const r = await callBackend<{ notice: BackendNotice }>(`query($id: ID!) { notice(id: $id) { ${NOTICE_FIELDS} } }`, { id }, auth);
  if (r.errors?.[0]?.extensions?.code === 'NOT_FOUND') return { notice: null };
  if (r.errors?.length || !r.data) throw new BridgeError(r.errors ?? []);
  return { notice: { __typename: 'Notice', ...r.data.notice } };
};

const noticeWrite =
  (mode: 'create' | 'update'): Op =>
  async ({ id, input }, auth) => {
    const i = input as { title: string; content: string; isPinned?: boolean };
    const field = mode === 'create' ? 'createNotice' : 'updateNotice';
    const d = await ask<Record<string, BackendNotice>>(
      mode === 'create'
        ? `mutation($input: NoticeInput!) { createNotice(input: $input) { ${NOTICE_FIELDS} } }`
        : `mutation($id: ID!, $input: NoticeInput!) { updateNotice(id: $id, input: $input) { ${NOTICE_FIELDS} } }`,
      { id, input: { title: i.title, content: i.content, isPinned: i.isPinned ?? false } },
      auth,
    );
    return { [field]: { __typename: 'Notice', ...d[field]! } };
  };

const noticeDelete: Op = async ({ id }, auth) =>
  ({ deleteNotice: (await ask<{ deleteNotice: boolean }>(`mutation($id: ID!) { deleteNotice(id: $id) }`, { id }, auth)).deleteNotice });

const noticeSetPinned: Op = async ({ id, pinned }, auth) => {
  const d = await ask<{ setNoticePinned: { id: string; isPinned: boolean } }>(
    `mutation($id: ID!, $p: Boolean!) { setNoticePinned(id: $id, isPinned: $p) { id isPinned } }`,
    { id, p: pinned },
    auth,
  );
  return { setNoticePinned: { __typename: 'Notice', ...d.setNoticePinned } };
};

const labelOfCategory = (name: string) => ({
  __typename: 'TeamLabel',
  kind: labelKind(name),
  name: labelKind(name) === 'PUBLIC' ? name : null,
});

/** 내 경고 · 벌칙 (AC-02): 요약 + 이력. 이력은 끝까지 따라가 한 목록으로 */
const warningsQuery: Op = async (_v, auth) => {
  const [state, first] = await Promise.all([
    loadWarningState(auth),
    ask<{ myWarningHistory: { onHold: boolean; items: { weekStart: string; weekEnd: string; verifiedDays: number | null; recordCount: number | null; categories: string[]; status: string }[]; nextCursor: string | null } }>(
      `{ myWarningHistory { onHold items { weekStart weekEnd verifiedDays recordCount categories status } nextCursor } }`,
      {},
      auth,
    ),
  ]);
  const items = [...first.myWarningHistory.items];
  let after = first.myWarningHistory.nextCursor;
  for (let i = 0; after && i < 10; i += 1) {
    const next: { myWarningHistory: { items: typeof items; nextCursor: string | null } } = await ask(
      `query($after: String) { myWarningHistory(after: $after) { items { weekStart weekEnd verifiedDays recordCount categories status } nextCursor } }`,
      { after },
      auth,
    );
    items.push(...next.myWarningHistory.items);
    after = next.myWarningHistory.nextCursor;
  }
  return {
    myWarnings: {
      __typename: 'MyWarnings',
      state,
      history: items.map((w) => ({
        __typename: 'WarningRecord',
        id: w.weekStart,
        weekStart: w.weekStart,
        weekEnd: w.weekEnd,
        verifiedDays: w.verifiedDays,
        recordCount: w.recordCount,
        categories: w.categories.map(labelOfCategory),
        standing: w.status,
      })),
    },
  };
};

export const BRIDGED: Record<string, Op> = {
  SessionQuery: sessionQuery,
  SessionExchangeLoginCode: exchangeLoginCode,
  SessionLogout: logout,
  HomeQuery: homeQuery,
  HomeNoticesQuery: homeNoticesQuery,
  WeeklyQuery: weeklyQuery,
  WeeklyHistoryQuery: weeklyHistoryQuery,
  TeamListQuery: teamListQuery,
  TeamInvitationsQuery: teamInvitationsQuery,
  NoticeListQuery: noticeListQuery,
  NoticeDetailQuery: noticeDetailQuery,
  AdminNoticesQuery: noticeListQuery,
  AdminNoticesEditorQuery: noticeDetailQuery,
  AdminNoticesCreate: noticeWrite('create'),
  AdminNoticesUpdate: noticeWrite('update'),
  AdminNoticesDelete: noticeDelete,
  AdminNoticesSetPinned: noticeSetPinned,
  WarningsQuery: warningsQuery,
  TeamManageQuery: teamManageQuery,
  TeamManagedContentsQuery: teamManagedContentsQuery,
  TeamInviteMember: teamInviteMember,
  TeamCancelInvitation: teamCancelInvitation,
  TeamKickMember: teamKickMember,
  TeamTransferLeadership: teamTransferLeadership,
  TeamSetVisibility: teamSetVisibility,
  TeamDelete: teamDelete,
  TeamLeave: teamLeave,
  TeamCommentForEditQuery: teamCommentForEditQuery,
  TeamUpdateComment: commentWrite('update'),
  TeamExemptionQuery: teamExemptionQuery,
  TeamRequestExemption: teamRequestExemption,
  TeamScopeQuery: teamScopeQuery,
  TeamBoardQuery: teamBoardQuery,
  TeamRespondInvitation: teamRespondInvitation,
  TeamCreate: teamCreate,
  TeamJoinByInviteCode: teamJoinByInviteCode,
  PostListQuery: postListQuery,
  PostTypeCountsQuery: postTypeCountsQuery,
  PostTagsQuery: postTagsQuery,
  PostDetailQuery: postDetailQuery,
  PostEditorPostQuery: postEditorPostQuery,
  PostEditorTeamsQuery: postEditorTeamsQuery,
  PostCreate: postWrite('create'),
  PostUpdate: postWrite('update'),
  PostDelete: postDelete,
  PostAddComment: commentWrite('add'),
  PostUpdateComment: commentWrite('update'),
  PostDeleteComment: commentDelete,
  ProfileQuery: profileQuery,
  ProfileHistoryQuery: profileHistoryQuery,
  AdminMembersQuery: adminMembersQuery,
  AdminMembersSummaryQuery: adminDashboardSummary,
  AdminLayoutCountsQuery: adminDashboardSummary,
  AdminDashboardSummaryQuery: adminDashboardSummaryQuery,
  AdminDashboardWeekQuery: adminDashboardWeekQuery,
  AdminDashboardCorrectionPreviewQuery: adminCorrectionPreview,
  AdminDashboardCorrectJudgment: adminCorrectJudgment,
  AdminDashboardRerunHeld: adminRerunHeld,
  AdminWarningsPenaltyTargetsQuery: adminPenaltyTargetsQuery,
  AdminWarningsDeletedQuery: adminDeletedWarningsQuery,
  AdminWarningsRestorePreviewQuery: adminRestorePreview,
  AdminWarningsRestoreWarning: adminRestoreWarning,
  AdminWarningsFulfillPenalty: adminFulfillPenalty,
  AdminExemptionsPeriodsQuery: adminPeriodsQuery,
  AdminExemptionsPeriodPreviewQuery: adminPeriodPreview,
  AdminExemptionsCreatePeriod: periodWrite('create'),
  AdminExemptionsUpdatePeriod: periodWrite('update'),
  AdminExemptionsDeletePeriod: adminDeletePeriod,
  AdminExemptionsRequestsQuery: adminRequestsQuery,
  AdminExemptionsSummaryQuery: adminDashboardSummaryQuery,
  AdminExemptionsApprovalPreviewQuery: adminApprovalPreview,
  AdminExemptionsApprove: requestAction('approve'),
  AdminExemptionsReject: requestAction('reject'),
  AdminPostsQuery: adminPostsQuery,
  AdminPostsDeletePost: postDelete,
  AdminPostsDeleteComment: commentDelete,
  AdminMembersApprove: memberAction('approveMember'),
  AdminMembersReject: memberAction('rejectMember'),
  AdminMembersRevert: memberAction('revertMemberToPending'),
  AdminMembersPromote: memberAction('promoteToAdmin', 'promoteMemberToAdmin'),
};

export const isBridged = (operationName: string | null | undefined): operationName is string =>
  !!operationName && operationName in BRIDGED;

/** 브리지 실행. 백엔드 오류는 { data: null, errors } 그대로 돌려준다 */
export async function runBridged(operationName: string, variables: Vars, auth: Auth) {
  try {
    return { data: await BRIDGED[operationName]!(variables, auth) };
  } catch (e) {
    if (e instanceof BridgeError) return { data: null, errors: e.errors };
    // 서버에 닿지 못함 → 전송 계층 오류로 넘겨 화면이 "인터넷 연결" 안내를 띄우게 한다
    if (e instanceof BackendUnreachable) throw e;
    return { data: null, errors: [{ message: String(e), extensions: { code: 'INTERNAL' } }] };
  }
}
