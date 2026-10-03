import type { ExecutionResult } from 'graphql';
import { describe, expect, it } from 'vitest';
import { mockTokenFor, setMockControl, type PersonaKey } from './control';
import { seedPostId } from './db/seed';
import { db } from './db/store';
import { executeMock, mergeResolvers, schema } from './schema';

type Json = Record<string, unknown>;

async function run(query: string, as: PersonaKey | null | 'bogus' = 'member', variables?: Json) {
  const authorization = as === null ? null : as === 'bogus' ? 'Bearer mock.9999' : `Bearer ${mockTokenFor(as)}`;
  const res: ExecutionResult = await executeMock({ query, variables, authorization });
  return { data: res.data as Json | null | undefined, errors: res.errors, codes: (res.errors ?? []).map((e) => e.extensions?.code) };
}

/** 데이터가 있어야 하고 오류가 없어야 한다 */
async function ok<T = Json>(query: string, as: PersonaKey = 'member', variables?: Json): Promise<T> {
  const r = await run(query, as, variables);
  expect(r.errors?.map((e) => `${e.path?.join('.') ?? ''}: ${e.message}`) ?? []).toEqual([]);
  return r.data as T;
}

const MEMBER_FIELDS = `
  id nickname githubLogin profileImageUrl postCount commentCount
  grassCalendar { status updatedAt privateContributionSuspected days { date count level } }
  warningState { activeCount isPenaltyTarget consecutivePasses weeksUntilDeduction byCategory { label { kind name } count } }
  currentWeek { weekStart isCurrentWeek verifiedDays recordCount live { status } }
  judgmentHistory(first: 8) { nodes { id weekStart status skipReason verifiedDays recordCount corrected judgedAt hasActiveWarning } pageInfo { hasNextPage endCursor } }
  publicTeams { id name }
`;

const DAY = 'date grassCount grassLevel hasGrass recordCount hasRecord verified isFuture isToday';

const POST_FIELDS = `
  id type title sections { key body } tags commitUrls author { id nickname } publicTeam { id name }
  isRecord writtenDate inFinalizedWeek createdAt updatedAt commentCount
  comments(first: 2) { nodes { id content author { nickname } createdAt viewerCanEdit viewerCanDelete } pageInfo { hasNextPage endCursor } totalCount }
  viewerCanEdit viewerCanDelete viewerIsAuthor editTeamId
`;

const PREVIEW = 'member { id nickname } warningCountBefore warningCountAfter penaltyChange affectedWeekCount frozenByFulfillment restoresWithoutCategory basis';

const EVERY_QUERY_FIELD = /* GraphQL */ `
  query Everything($postId: ID!, $warningId: ID!) {
    clock { now currentWeekStart currentWeekEnd }
    me { id status role hasTeam pendingInvitationCount member { ${MEMBER_FIELDS} } }
    myWeek {
      weekStart weekEnd isCurrentWeek verifiedDays recordCount grassStatus grassUpdatedAt privateContributionSuspected
      days { ${DAY} }
      live { status skipReason verifiedDaysNeeded recordsNeeded }
      judgment { id status }
    }
    lastWeek: myWeek(weekStart: "2026-09-21") { verifiedDays recordCount days { ${DAY} } judgment { id status verifiedDays recordCount } }
    myWarnings {
      state { activeCount isPenaltyTarget consecutivePasses weeksUntilDeduction byCategory { label { kind name } count } }
      history { id weekStart weekEnd verifiedDays recordCount categories { kind name } standing }
    }
    myTeams {
      id name description isPublic memberCount viewerRole inviteCode leader { nickname }
      currentWeekSummary { passCount failCount notYetCount excludedCount }
    }
    myInvitations { id team { id name isPublic } invitedBy { nickname } createdAt }
    team(id: "1") {
      id name viewerRole inviteCode memberCount
      currentWeekBoard { weekStart weekEnd grassUpdatedAt rows { member { nickname } isViewer days { ${DAY} } verifiedDays recordCount teamWarningCount status grassStatus } }
      recentPosts { id title author { nickname } }
      members { member { nickname githubLogin } role joinedAt }
      pendingInvitations { id invitee { githubLogin } createdAt }
      managedContents(first: 5) { nodes { kind targetId postId postType title author { nickname } createdAt } pageInfo { hasNextPage } totalCount }
      exemptionRequests { id member { nickname } requestedBy { nickname } weekStart status rejectReason overlapsExemptionPeriod isRetroactive }
    }
    member(id: "1") { ${MEMBER_FIELDS} }
    posts(filter: { type: TROUBLESHOOTING }) { nodes { ${POST_FIELDS} } pageInfo { hasNextPage endCursor } totalCount }
    postTypeCounts(filter: { query: "Redis" }) { troubleshooting devlog }
    popularTags(type: TROUBLESHOOTING) { tag count }
    post(id: $postId) { __typename ... on Post { ${POST_FIELDS} } ... on DeletedPost { id deletedAt } }
    notices(first: 3) { nodes { id title content isPinned isSystem createdAt updatedAt } pageInfo { hasNextPage endCursor } }
    notice(id: "6") { id title }
    grassRuleNotice { id title isSystem }
    adminDashboardSummary { pendingMemberCount latestWeekFailCount latestJudgedWeekStart penaltyTargetCount pendingExemptionRequestCount heldJudgmentCount }
    adminJudgmentWeek {
      weekStart weekEnd executedAt counts { pass fail exempt firstWeek noTeam hold }
      rows(first: 20) { nodes { judgment { id status } member { nickname } activeWarningCount isPenaltyTarget canRetry canCorrect } pageInfo { hasNextPage endCursor } totalCount }
    }
    heldJudgments { judgment { id status holdReason } member { nickname } canRetry canCorrect }
    judgmentCorrectionPreview(judgmentId: "1", newStatus: PASS) { ${PREVIEW} }
    penaltyTargets { member { nickname } activeWarningCount reachedWeekStart reachedAt teams { teamId name isPublic isDeleted } }
    deletedWarnings { nodes { id member { nickname } weekStart weekEnd deleteReason deletedAt restoreCategories { teamId name isPublic isDeleted } } pageInfo { hasNextPage } totalCount }
    restoreWarningPreview(warningId: $warningId) { ${PREVIEW} }
    adminMembers(filter: ALL) { nodes { member { nickname githubLogin } status appliedAt } pageInfo { hasNextPage } totalCount }
    exemptionPeriods { nodes { id weekStart weekEnd reason createdAt updatedAt isPast } pageInfo { hasNextPage } }
    exemptionPeriodPreview(weekStart: "2026-09-21") { weekStart isRetroactive affectedMemberCount changes { ${PREVIEW} } basis }
    personalExemptionRequests { nodes { id member { nickname } requestedBy { nickname } weekStart weekEnd reason status createdAt respondedAt overlapsExemptionPeriod isRetroactive } pageInfo { hasNextPage } totalCount }
    personalExemptionApprovalPreview(requestId: "5") { ${PREVIEW} }
    adminContents(filter: ALL, first: 5) { nodes { kind targetId postId postType title author { nickname } createdAt } pageInfo { hasNextPage } totalCount }
  }
`;

describe('목 스키마', () => {
  it('SDL의 Query 필드마다 리졸버가 있다', () => {
    const sdlFields = Object.keys(schema.getQueryType()?.getFields() ?? {}).sort();
    const resolved = Object.keys(mergeResolvers().Query ?? {}).sort();
    expect(resolved).toEqual(sdlFields);
    const mutations = Object.keys(schema.getMutationType()?.getFields() ?? {}).sort();
    expect(Object.keys(mergeResolvers().Mutation ?? {}).sort()).toEqual(mutations);
  });

  it('member 페르소나로 모든 Query 필드를 오류 없이 실행한다', async () => {
    const warningId = db.warnings.find((w) => w.deleted)?.id;
    const data = await ok<Json>(EVERY_QUERY_FIELD, 'member', { postId: seedPostId('redisTtl'), warningId });
    expect(data.clock).toEqual({ now: '2026-10-01T10:00:00+09:00', currentWeekStart: '2026-09-28', currentWeekEnd: '2026-10-04' });
  });
});

describe('한동관 (member) — 목업 숫자', () => {
  it('이번 주: 월 잔디 3 · 화 잔디 1 + 기록글 · 인증일 2/3 · 기록글 1/1 → 아직', async () => {
    const d = await ok<{ myWeek: Json & { days: Json[] } }>(`{ myWeek { verifiedDays recordCount grassUpdatedAt live { status skipReason verifiedDaysNeeded recordsNeeded } days { ${DAY} } } }`);
    const w = d.myWeek;
    expect(w.days.map((x) => x.grassCount)).toEqual([3, 1, 0, 0, null, null, null]);
    expect(w.days.map((x) => x.grassLevel)).toEqual([3, 1, 0, 0, null, null, null]);
    expect(w.days.map((x) => x.hasRecord)).toEqual([false, true, false, false, false, false, false]);
    expect(w.days.map((x) => x.verified)).toEqual([true, true, false, false, false, false, false]);
    expect(w.days.map((x) => x.isToday)).toEqual([false, false, false, true, false, false, false]);
    expect(w.days.map((x) => x.isFuture)).toEqual([false, false, false, false, true, true, true]);
    expect(w.verifiedDays).toBe(2);
    expect(w.recordCount).toBe(1);
    expect(w.grassUpdatedAt).toBe('2026-10-01T06:00:00+09:00');
    expect(w.live).toEqual({ status: 'NOT_YET', skipReason: null, verifiedDaysNeeded: 1, recordsNeeded: 0 });
  });

  it('경고 1/3 · 연속 1/2 · 다음 차감까지 1주 · 카테고리 A팀 + 비공개 팀 (W-07 · W-14)', async () => {
    const d = await ok<{ myWarnings: { state: Json; history: Json[] } }>(
      `{ myWarnings { state { activeCount isPenaltyTarget consecutivePasses weeksUntilDeduction byCategory { label { kind name } count } } history { weekStart verifiedDays recordCount categories { kind name } standing } } }`,
    );
    expect(d.myWarnings.state).toEqual({
      activeCount: 1,
      isPenaltyTarget: false,
      consecutivePasses: 1,
      weeksUntilDeduction: 1,
      byCategory: [
        { label: { kind: 'PUBLIC', name: '사이드 프로젝트 A팀' }, count: 1 },
        { label: { kind: 'PRIVATE', name: null }, count: 1 },
      ],
    });
    expect(d.myWarnings.history).toEqual([
      { weekStart: '2026-09-14', verifiedDays: 1, recordCount: 0, categories: [{ kind: 'PUBLIC', name: '사이드 프로젝트 A팀' }, { kind: 'PRIVATE', name: null }], standing: 'ACTIVE' },
      { weekStart: '2026-07-13', verifiedDays: 2, recordCount: 0, categories: [{ kind: 'PUBLIC', name: '웹 프로젝트 B팀' }], standing: 'DEDUCTED' },
    ]);
  });

  it('지난 판정 5주 (W-06) · 프로필 글 12 · 댓글 34 (W-14)', async () => {
    const d = await ok<{ member: { postCount: number; commentCount: number; judgmentHistory: { nodes: Json[] } } }>(
      `{ member(id: "1") { postCount commentCount judgmentHistory { nodes { weekStart status skipReason verifiedDays recordCount hasActiveWarning } } } }`,
    );
    expect(d.member.postCount).toBe(12);
    expect(d.member.commentCount).toBe(34);
    expect(d.member.judgmentHistory.nodes).toEqual([
      { weekStart: '2026-09-21', status: 'PASS', skipReason: null, verifiedDays: 4, recordCount: 1, hasActiveWarning: false },
      { weekStart: '2026-09-14', status: 'FAIL', skipReason: null, verifiedDays: 1, recordCount: 0, hasActiveWarning: true },
      { weekStart: '2026-09-07', status: 'EXEMPT', skipReason: 'EXEMPTION_PERIOD', verifiedDays: null, recordCount: null, hasActiveWarning: false },
      { weekStart: '2026-08-31', status: 'PASS', skipReason: null, verifiedDays: 3, recordCount: 2, hasActiveWarning: false },
      { weekStart: '2026-08-24', status: 'EXCLUDED', skipReason: 'FIRST_WEEK', verifiedDays: null, recordCount: null, hasActiveWarning: false },
    ]);
  });

  it('내 팀 요약 · 받은 초대 2건 (W-08)', async () => {
    const d = await ok<{ me: Json; myTeams: Json[] }>(
      `{ me { hasTeam pendingInvitationCount } myTeams { name isPublic memberCount viewerRole currentWeekSummary { passCount failCount notYetCount } } }`,
    );
    expect(d.me).toEqual({ hasTeam: true, pendingInvitationCount: 2 });
    expect(d.myTeams).toEqual([
      { name: '사이드 프로젝트 A팀', isPublic: true, memberCount: 4, viewerRole: 'LEADER', currentWeekSummary: { passCount: 1, failCount: 0, notYetCount: 3 } },
      { name: '알고리즘 스터디', isPublic: false, memberCount: 6, viewerRole: 'MEMBER', currentWeekSummary: { passCount: 3, failCount: 0, notYetCount: 3 } },
    ]);
  });

  it('A팀 현황판 (W-09 TEAM 배열) · 초대코드 · 보낸 초대 (W-10)', async () => {
    const d = await ok<{ team: { inviteCode: string; currentWeekBoard: { rows: Json[] }; pendingInvitations: Json[]; recentPosts: Json[] } }>(
      `{ team(id: "1") { inviteCode pendingInvitations { invitee { githubLogin } } recentPosts { title } currentWeekBoard { rows { member { nickname } isViewer verifiedDays recordCount teamWarningCount status days { grassCount hasRecord } } } } }`,
    );
    expect(d.team.inviteCode).toBe('JD7K-Q2MA');
    expect(d.team.pendingInvitations).toEqual([{ invitee: { githubLogin: 'seoyeon-lee' } }]);
    const rows = d.team.currentWeekBoard.rows.map((r) => [
      (r.member as Json).nickname,
      r.isViewer,
      r.verifiedDays,
      r.recordCount,
      r.teamWarningCount,
      r.status,
      (r.days as Json[]).slice(0, 4).map((x) => `${String(x.grassCount)}${x.hasRecord ? 'r' : ''}`),
    ]);
    expect(rows).toEqual([
      ['한동관', true, 2, 1, 1, 'NOT_YET', ['3', '1r', '0', '0']],
      ['김철수', false, 4, 2, 0, 'CONDITION_MET', ['2', '0r', '3', '1r']],
      ['이영희', false, 0, 0, 2, 'NOT_YET', ['0', '0', '0', '0']],
      ['박민수', false, 4, 0, 0, 'NOT_YET', ['4', '2', '3', '1']],
    ]);
    expect(d.team.recentPosts.map((p) => p.title)).toEqual([
      'GraphQL 스키마 초안 정리',
      'Redis TTL이 적용되지 않던 문제',
      'Expo 딥링크가 안드로이드에서만 열리지 않을 때',
      '앱 탭 내비게이션 구조 잡기',
      'React Native 키보드가 입력창을 가리는 문제',
    ]);
  });
});

describe('게시판', () => {
  it('트러블슈팅 목록은 20개 넘어서 [더 보기]가 생긴다 · 첫 글은 목업 순서', async () => {
    const d = await ok<{ posts: { nodes: Json[]; pageInfo: Json; totalCount: number } }>(
      `{ posts(filter: { type: TROUBLESHOOTING }) { nodes { title isRecord commentCount publicTeam { name } author { nickname } } pageInfo { hasNextPage endCursor } totalCount } }`,
    );
    expect(d.posts.totalCount).toBeGreaterThan(20);
    expect(d.posts.nodes).toHaveLength(20);
    expect(d.posts.pageInfo.hasNextPage).toBe(true);
    expect(d.posts.nodes.slice(0, 4).map((p) => [p.title, p.isRecord, p.commentCount, (p.publicTeam as Json | null)?.name ?? null, (p.author as Json).nickname])).toEqual([
      ['Redis TTL이 적용되지 않던 문제', true, 3, '사이드 프로젝트 A팀', '한동관'],
      ['GraphQL N+1을 @BatchMapping으로 해결하기', false, 0, null, '김철수'],
      ['Expo 딥링크가 안드로이드에서만 열리지 않을 때', true, 5, '사이드 프로젝트 A팀', '박민수'],
      ['Flyway 체크섬 불일치로 서버가 안 뜨는 문제', true, 2, null, '이영희'],
    ]);
    const next = await ok<{ posts: { nodes: Json[]; pageInfo: Json } }>(
      `query($after: String) { posts(filter: { type: TROUBLESHOOTING }, after: $after) { nodes { title } pageInfo { hasNextPage } } }`,
      'member',
      { after: d.posts.pageInfo.endCursor },
    );
    expect(next.posts.nodes.length).toBe(d.posts.totalCount - 20);
    expect(next.posts.pageInfo.hasNextPage).toBe(false);
  });

  it("'Redis' 검색: 트러블슈팅 3 · 개발일지 1 (W-05)", async () => {
    const d = await ok<{ postTypeCounts: Json; posts: { nodes: Json[] } }>(
      `{ postTypeCounts(filter: { query: "Redis" }) { troubleshooting devlog } posts(filter: { type: TROUBLESHOOTING, query: "Redis" }) { nodes { title } } }`,
    );
    expect(d.postTypeCounts).toEqual({ troubleshooting: 3, devlog: 1 });
    expect(d.posts.nodes.map((p) => p.title)).toEqual([
      'Redis TTL이 적용되지 않던 문제',
      'Upstash Redis 명령 수가 갑자기 늘어난 이유',
      '헬스체크에서 캐시 서버를 뺀 이유',
    ]);
  });

  it('많이 쓰인 태그 10개는 목업 TAGS 순서', async () => {
    const d = await ok<{ popularTags: { tag: string }[] }>(`{ popularTags { tag count } }`);
    expect(d.popularTags.map((t) => t.tag)).toEqual(['Spring', 'Redis', 'GraphQL', 'React', 'Expo', 'MariaDB', 'Docker', '배포', 'Flyway', 'MongoDB']);
  });

  it('검색어 1자는 VALIDATION_FAILED(query)', async () => {
    const r = await run(`{ posts(filter: { query: "R" }) { totalCount } }`);
    expect(r.codes).toEqual(['VALIDATION_FAILED']);
    expect(r.errors?.[0]?.extensions?.field).toBe('query');
  });

  it('글 상세: 권한 플래그 · 삭제된 글 · 없는 글', async () => {
    const id = seedPostId('redisTtl');
    const mine = await ok<{ post: Json }>(`query($id: ID!) { post(id: $id) { ... on Post { viewerCanEdit viewerCanDelete viewerIsAuthor editTeamId inFinalizedWeek } } }`, 'member', { id });
    expect(mine.post).toEqual({ viewerCanEdit: true, viewerCanDelete: true, viewerIsAuthor: true, editTeamId: '1', inFinalizedWeek: false });
    const other = await ok<{ post: Json }>(`query($id: ID!) { post(id: $id) { ... on Post { viewerCanEdit viewerCanDelete viewerIsAuthor editTeamId } } }`, 'plain', { id });
    expect(other.post).toEqual({ viewerCanEdit: false, viewerCanDelete: false, viewerIsAuthor: false, editTeamId: null });
    // 팀장(한동관)은 A팀 글을 수정할 수 있지만 지울 수는 없다 — 관리자라 삭제는 된다
    const leader = await ok<{ post: Json }>(`query($id: ID!) { post(id: $id) { ... on Post { viewerCanEdit viewerCanDelete viewerIsAuthor } } }`, 'member', { id: seedPostId('expoDeeplink') });
    expect(leader.post).toEqual({ viewerCanEdit: true, viewerCanDelete: true, viewerIsAuthor: false });
    const deleted = await ok<{ post: Json }>(`query($id: ID!) { post(id: $id) { __typename ... on DeletedPost { id deletedAt } } }`, 'member', { id: seedPostId('deletedMemo') });
    expect(deleted.post.__typename).toBe('DeletedPost');
    const missing = await ok<{ post: null }>(`{ post(id: "000000000000000000000000") { __typename } }`);
    expect(missing.post).toBeNull();
    const finalized = await ok<{ post: Json }>(`query($id: ID!) { post(id: $id) { ... on Post { inFinalizedWeek } } }`, 'member', { id: seedPostId('dockerCompose') });
    expect(finalized.post.inFinalizedWeek).toBe(true);
  });

  it('마스킹: 비공개 팀(알고리즘 스터디) 글은 누구에게나 publicTeam null', async () => {
    const q = `{ posts(filter: { type: DEVLOG }) { nodes { title publicTeam { name } } } }`;
    for (const as of ['plain', 'member'] as const) {
      const d = await ok<{ posts: { nodes: Json[] } }>(q, as);
      const seg = d.posts.nodes.find((p) => p.title === '세그먼트 트리 지연 전파 정리');
      expect(seg).toEqual({ title: '세그먼트 트리 지연 전파 정리', publicTeam: null });
    }
    const forbidden = await run(`{ posts(filter: { teamId: "2" }) { totalCount } }`, 'plain');
    expect(forbidden.codes).toEqual(['FORBIDDEN']);
    const allowed = await ok<{ posts: { totalCount: number } }>(`{ posts(filter: { teamId: "2" }) { totalCount } }`, 'member');
    expect(allowed.posts.totalCount).toBeGreaterThan(0);
  });
});

describe('접근 규칙', () => {
  it('비로그인: me는 null, 그 밖은 UNAUTHENTICATED, clock은 허용', async () => {
    const me = await run(`{ me { id } clock { now } }`, null);
    expect(me.errors).toBeUndefined();
    expect(me.data).toEqual({ me: null, clock: { now: '2026-10-01T10:00:00+09:00' } });
    const week = await run(`{ myWeek { weekStart } }`, null);
    expect(week.codes).toEqual(['UNAUTHENTICATED']);
    expect(week.errors?.[0]?.extensions?.classification).toBe('UNAUTHORIZED');
    const bogus = await run(`{ me { id } }`, 'bogus');
    expect(bogus.codes).toEqual(['UNAUTHENTICATED']);
  });

  it('승인 대기: me만 되고 myTeams는 ACCOUNT_PENDING · 거절: ACCOUNT_REJECTED', async () => {
    const me = await run(`{ me { status member { nickname } } }`, 'pending');
    expect(me.data).toEqual({ me: { status: 'PENDING', member: { nickname: '정다은' } } });
    expect((await run(`{ myTeams { id } }`, 'pending')).codes).toEqual(['ACCOUNT_PENDING']);
    expect((await run(`{ myTeams { id } }`, 'rejected')).codes).toEqual(['ACCOUNT_REJECTED']);
    expect((await run(`{ me { status } }`, 'rejected')).data).toEqual({ me: { status: 'REJECTED' } });
  });

  it('관리자 아님: adminDashboardSummary는 FORBIDDEN', async () => {
    const r = await run(`{ adminDashboardSummary { pendingMemberCount } }`, 'plain');
    expect(r.codes).toEqual(['FORBIDDEN']);
    expect(r.errors?.[0]?.extensions?.classification).toBe('FORBIDDEN');
  });

  it('비소속 팀은 FORBIDDEN, 없는 팀은 null', async () => {
    expect((await run(`{ team(id: "2") { id } }`, 'plain')).codes).toEqual(['FORBIDDEN']);
    const none = await run(`{ team(id: "999") { id } }`, 'plain');
    expect(none.errors).toBeUndefined();
    expect(none.data).toEqual({ team: null });
    // 팀원은 현황판은 보지만 팀장 전용 필드는 FORBIDDEN
    expect((await run(`{ team(id: "1") { pendingInvitations { id } } }`, 'plain')).codes).toEqual(['FORBIDDEN']);
  });

  it('로그인 코드 교환: mock-<persona>만 통과, 대기 회원도 제한 토큰을 받는다', async () => {
    const q = `mutation($code: String!) { exchangeLoginCode(code: $code) { status accessToken expiresAt me { id } } }`;
    const a = await run(q, null, { code: 'mock-member' });
    expect(a.data?.exchangeLoginCode).toMatchObject({ status: 'ACTIVE', accessToken: 'mock.1', me: { id: '1' } });
    const p = await run(q, null, { code: 'mock-pending' });
    expect(p.data?.exchangeLoginCode).toMatchObject({ status: 'PENDING', accessToken: 'mock.9' });
    const r = await run(q, null, { code: 'mock-rejected' });
    expect(r.data?.exchangeLoginCode).toMatchObject({ status: 'REJECTED', accessToken: 'mock.10', me: null });
    expect((await run(q, null, { code: 'nope' })).codes).toEqual(['LOGIN_CODE_INVALID']);
  });

  it('구현 전 뮤테이션 자리(notImplemented)는 INTERNAL', async () => {
    expect((await run(`mutation { logout }`)).data).toEqual({ logout: true });
    // 특정 뮤테이션에 기대지 않는다 — 웨이브 2가 자리를 하나씩 채운다
    const { notImplemented } = await import('./resolvers/stub');
    let code: unknown;
    try {
      notImplemented();
    } catch (e) {
      code = (e as { extensions?: { code?: unknown } }).extensions?.code;
    }
    expect(code).toBe('INTERNAL');
  });
});

describe('관리자 (W-15 · W-16)', () => {
  it('대시보드 요약 · 9/21 주 판정 집계', async () => {
    const d = await ok<{ adminDashboardSummary: Json; adminJudgmentWeek: Json & { rows: Json } }>(
      `{ adminDashboardSummary { pendingMemberCount latestWeekFailCount latestJudgedWeekStart penaltyTargetCount pendingExemptionRequestCount heldJudgmentCount }
         adminJudgmentWeek { weekStart executedAt counts { pass fail exempt firstWeek noTeam hold } rows { totalCount pageInfo { hasNextPage } } } }`,
    );
    expect(d.adminDashboardSummary).toEqual({
      pendingMemberCount: 3,
      latestWeekFailCount: 4,
      latestJudgedWeekStart: '2026-09-21',
      penaltyTargetCount: 2,
      pendingExemptionRequestCount: 2,
      heldJudgmentCount: 1,
    });
    expect(d.adminJudgmentWeek).toMatchObject({
      weekStart: '2026-09-21',
      executedAt: '2026-09-28T07:00:00+09:00',
      counts: { pass: 18, fail: 4, exempt: 2, firstWeek: 1, noTeam: 0, hold: 1 },
      rows: { totalCount: 26, pageInfo: { hasNextPage: true } },
    });
  });

  it('벌칙 대상 2명 · 삭제된 경고 2건', async () => {
    const d = await ok<{ penaltyTargets: Json[]; deletedWarnings: { nodes: Json[] } }>(
      `{ penaltyTargets { member { nickname } activeWarningCount reachedWeekStart reachedAt teams { name isPublic } }
         deletedWarnings { nodes { member { nickname } weekStart deleteReason restoreCategories { name isDeleted } } } }`,
    );
    expect(d.penaltyTargets).toEqual([
      {
        member: { nickname: '박지훈' },
        activeWarningCount: 3,
        reachedWeekStart: '2026-09-21',
        reachedAt: '2026-09-28T07:00:00+09:00',
        teams: [
          { name: '사이드 프로젝트 A팀', isPublic: true },
          { name: '알고리즘 스터디', isPublic: false },
        ],
      },
      { member: { nickname: '정하늘' }, activeWarningCount: 3, reachedWeekStart: '2026-09-14', reachedAt: '2026-09-21T07:00:00+09:00', teams: [{ name: '웹 프로젝트 B팀', isPublic: true }] },
    ]);
    expect(d.deletedWarnings.nodes).toEqual([
      { member: { nickname: '이영희' }, weekStart: '2026-09-14', deleteReason: 'KICKED', restoreCategories: [{ name: '웹 프로젝트 B팀', isDeleted: false }] },
      { member: { nickname: '최유진' }, weekStart: '2026-08-31', deleteReason: 'TEAM_DELETED', restoreCategories: [{ name: '모바일 스터디', isDeleted: true }] },
    ]);
  });

  it('재계산 미리보기: 박지훈 9/21 미달 → 통과 = 경고 3 → 2 · 벌칙 해제 · 1주', async () => {
    const week = await ok<{ adminJudgmentWeek: { rows: { nodes: { judgment: { id: string }; member: { nickname: string } }[] } } }>(
      `{ adminJudgmentWeek { rows(filter: FAIL) { nodes { judgment { id } member { nickname } } } } }`,
    );
    const jid = week.adminJudgmentWeek.rows.nodes.find((r) => r.member.nickname === '박지훈')?.judgment.id;
    const d = await ok<{ judgmentCorrectionPreview: Json }>(
      `query($id: ID!) { judgmentCorrectionPreview(judgmentId: $id, newStatus: PASS) { warningCountBefore warningCountAfter penaltyChange affectedWeekCount basis } }`,
      'member',
      { id: jid },
    );
    expect(d.judgmentCorrectionPreview).toEqual({ warningCountBefore: 3, warningCountAfter: 2, penaltyChange: 'RELEASE', affectedWeekCount: 1, basis: 'v1' });
  });

  it('경고 복구 미리보기: 이영희 2 → 3 벌칙 진입 · 최유진은 삭제된 팀', async () => {
    const list = await ok<{ deletedWarnings: { nodes: { id: string; member: { nickname: string } }[] } }>(`{ deletedWarnings { nodes { id member { nickname } } } }`);
    const id = (name: string) => list.deletedWarnings.nodes.find((n) => n.member.nickname === name)?.id;
    const q = `query($id: ID!) { restoreWarningPreview(warningId: $id) { warningCountBefore warningCountAfter penaltyChange restoresWithoutCategory } }`;
    expect((await ok<{ restoreWarningPreview: Json }>(q, 'member', { id: id('이영희') })).restoreWarningPreview).toEqual({
      warningCountBefore: 2,
      warningCountAfter: 3,
      penaltyChange: 'ENTER',
      restoresWithoutCategory: false,
    });
    expect((await ok<{ restoreWarningPreview: Json }>(q, 'member', { id: id('최유진') })).restoreWarningPreview).toMatchObject({ restoresWithoutCategory: true });
  });
});

describe('페르소나 · 시각', () => {
  it('noteam(서연): 팀 없음 → 이번 주 EXCLUDED/NO_TEAM, 받은 초대 1건', async () => {
    const d = await ok<{ me: Json; myWeek: Json; myInvitations: Json[] }>(
      `{ me { hasTeam pendingInvitationCount } myWeek { verifiedDays live { status skipReason } } myInvitations { team { name } } }`,
      'noteam',
    );
    expect(d.me).toEqual({ hasTeam: false, pendingInvitationCount: 1 });
    expect(d.myWeek).toEqual({ verifiedDays: null, live: { status: 'EXCLUDED', skipReason: 'NO_TEAM' } });
    expect(d.myInvitations).toEqual([{ team: { name: '사이드 프로젝트 A팀' } }]);
  });

  it('penalty(박지훈): 경고 3 · 벌칙 대상 · 차감 없음', async () => {
    const d = await ok<{ myWarnings: { state: Json } }>(`{ myWarnings { state { activeCount isPenaltyTarget weeksUntilDeduction } } }`, 'penalty');
    expect(d.myWarnings.state).toEqual({ activeCount: 3, isPenaltyTarget: true, weeksUntilDeduction: null });
  });

  it('월요일 03:00(판정 전)에는 9/21 판정이 아직 없다', async () => {
    setMockControl({ now: '2026-09-28T03:00:00+09:00' });
    const d = await ok<{ lastWeek: Json; adminDashboardSummary: Json; myWarnings: { state: Json } }>(
      `{ lastWeek: myWeek(weekStart: "2026-09-21") { judgment { id } verifiedDays } adminDashboardSummary { latestJudgedWeekStart } myWarnings { state { activeCount } } }`,
    );
    expect(d.lastWeek.judgment).toBeNull();
    expect(d.adminDashboardSummary.latestJudgedWeekStart).toBe('2026-09-14');
    expect(d.myWarnings.state.activeCount).toBe(1);
  });

  it('잔디 강제 failed: 본인 이번 주 인증일은 null(—)', async () => {
    setMockControl({ grass: 'failed' });
    const d = await ok<{ myWeek: Json }>(`{ myWeek { grassStatus verifiedDays days { grassCount } } }`);
    expect(d.myWeek).toMatchObject({ grassStatus: 'FAILED', verifiedDays: null });
  });

  it('미래 주 · 월요일 아닌 날은 VALIDATION_FAILED', async () => {
    expect((await run(`{ myWeek(weekStart: "2026-10-05") { weekStart } }`)).codes).toEqual(['VALIDATION_FAILED']);
    expect((await run(`{ myWeek(weekStart: "2026-09-29") { weekStart } }`)).codes).toEqual(['VALIDATION_FAILED']);
    expect((await run(`{ myWeek(weekStart: "2026-13-01") { weekStart } }`)).codes).toEqual(['VALIDATION_FAILED']);
  });
});

describe('MSW 핸들러', () => {
  const gql = (query: string, token: string | null, operationName?: string) =>
    fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ query, operationName }),
    });

  it('GraphQL 요청을 목 스키마로 실행한다', async () => {
    const res = await gql(`query HomeQuery { me { member { nickname } } }`, mockTokenFor('member'), 'HomeQuery');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { me: { member: { nickname: '한동관' } } } });
  });

  it('failOnce: 그 연산만 한 번 INTERNAL, 다음엔 정상', async () => {
    setMockControl({ failOnce: 'HomeQuery' });
    const first = (await (await gql(`query HomeQuery { clock { now } }`, null, 'HomeQuery')).json()) as Json;
    expect((first.errors as Json[])[0]).toMatchObject({ path: ['clock'], extensions: { code: 'INTERNAL', classification: 'INTERNAL_ERROR' } });
    const second = (await (await gql(`query HomeQuery { clock { now } }`, null, 'HomeQuery')).json()) as Json;
    expect(second.errors).toBeUndefined();
  });

  it('failure network → 요청 실패', async () => {
    setMockControl({ failure: 'network' });
    await expect(gql(`{ clock { now } }`, null)).rejects.toThrow();
  });

  it('프로필 이미지 업로드: 형식 · 크기 검사 후 profileImageUrl', async () => {
    // jsdom의 FormData · Blob은 node fetch(undici)가 파일로 직렬화하지 못한다 → multipart 본문을 직접 만든다
    const upload = (bytes: Uint8Array, type: string, name: string, token: string | null = mockTokenFor('member')) => {
      const boundary = '----glogmockboundary';
      const head = new TextEncoder().encode(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${type}\r\n\r\n`,
      );
      const tail = new TextEncoder().encode(`\r\n--${boundary}--\r\n`);
      const body = new Uint8Array(head.length + bytes.length + tail.length);
      body.set(head, 0);
      body.set(bytes, head.length);
      body.set(tail, head.length + bytes.length);
      return fetch('http://localhost/api/members/me/profile-image', {
        method: 'POST',
        body,
        headers: { 'content-type': `multipart/form-data; boundary=${boundary}`, ...(token ? { authorization: `Bearer ${token}` } : {}) },
      });
    };
    const okRes = await upload(new Uint8Array([137, 80, 78, 71]), 'image/png', 'a.png');
    expect(okRes.status).toBe(200);
    const { profileImageUrl } = (await okRes.json()) as { profileImageUrl: string };
    expect(profileImageUrl).toMatch(/^(data:image\/png;base64,|blob:)/);
    const me = await ok<{ me: { member: { profileImageUrl: string } } }>(`{ me { member { profileImageUrl } } }`);
    expect(me.me.member.profileImageUrl).toBe(profileImageUrl);

    const bad = await upload(new Uint8Array([1]), 'image/gif', 'a.gif');
    expect(bad.status).toBe(400);
    expect(await bad.json()).toMatchObject({ code: 'VALIDATION_FAILED', field: 'file' });
    const big = await upload(new Uint8Array(5 * 1024 * 1024 + 1), 'image/jpeg', 'big.jpg');
    expect(big.status).toBe(400);
    expect((await upload(new Uint8Array([1]), 'image/png', 'a.png', null)).status).toBe(401);
  });
});
