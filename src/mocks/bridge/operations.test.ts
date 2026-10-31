/**
 * 브리지 변환 단위 테스트. backend.ts의 callBackend · ask를 가짜로 바꿔
 * (가) 백엔드로 보낸 쿼리 · 변수와 (나) 프론트 계약 모양으로 바꾼 결과를 본다.
 */
import type * as BackendModule from './backend';
import type { GqlResult } from './backend';
import { BRIDGED, isBridged, runBridged } from './operations';

type Vars = Record<string, unknown>;
type Reply = GqlResult<Record<string, unknown>> | ((vars: Vars, query: string) => GqlResult<Record<string, unknown>>);

const fake = vi.hoisted(() => {
  const routes = new Map<string, unknown>();
  const calls: { field: string; query: string; vars: Record<string, unknown>; auth: string | null }[] = [];
  /** 첫 선택 집합의 첫 필드 = 루트 필드 (쿼리 머리의 변수 선언은 { 앞에 있다) */
  const rootOf = (query: string) => /\{\s*(\w+)/.exec(query)?.[1] ?? '';
  return { routes, calls, rootOf };
});

vi.mock('./backend', async (importOriginal) => {
  const actual = await importOriginal<typeof BackendModule>();
  const callBackend = async (query: string, vars: Record<string, unknown>, auth: string | null) => {
    const field = fake.rootOf(query);
    fake.calls.push({ field, query, vars, auth });
    const r = fake.routes.get(field) as Reply | undefined;
    if (!r) throw new Error(`no fake for ${field}`);
    return typeof r === 'function' ? r(vars, query) : r;
  };
  const ask = async (query: string, vars: Record<string, unknown>, auth: string | null) => {
    const r = await callBackend(query, vars, auth);
    if (r.errors?.length || !r.data) throw new actual.BridgeError(r.errors ?? [{ message: 'empty response', extensions: { code: 'INTERNAL' } }]);
    return r.data;
  };
  return { ...actual, callBackend, ask };
});

const AUTH = 'Bearer x';
const ok = (data: Record<string, unknown>): GqlResult<Record<string, unknown>> => ({ data });
const fail = (code: string, message = code): GqlResult<Record<string, unknown>> => ({
  data: null,
  errors: [{ message, extensions: { code, classification: 'BAD_REQUEST' } }],
});
const on = (field: string, reply: Reply) => fake.routes.set(field, reply);
const callsOf = (field: string) => fake.calls.filter((c) => c.field === field);

const ME = { id: '1', githubLogin: 'hdg', nickname: '한동관', profileImageUrl: null, status: 'ACTIVE', role: 'ADMIN' };
const brief = (id: string, nickname: string) => ({ id, nickname, githubLogin: `gh${id}` });

/** loadViewer · SessionQuery · TeamListQuery 모두 `{ me ...`로 시작한다 → 합친 모양으로 답한다 */
function onMe(me: Record<string, unknown> = ME, myTeams: unknown[] = [], invitations: unknown[] = []) {
  on('me', ok({ me, myTeams, receivedTeamInvitations: { items: invitations } }));
}

beforeEach(() => {
  fake.routes.clear();
  fake.calls.length = 0;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-01T10:00:00+09:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('runBridged · isBridged', () => {
  it('BRIDGED에 없는 연산은 isBridged가 false', () => {
    expect(isBridged('NoSuchQuery')).toBe(false);
    expect(isBridged(null)).toBe(false);
    expect(isBridged(undefined)).toBe(false);
    expect(isBridged('')).toBe(false);
    expect(isBridged('SessionQuery')).toBe(true);
  });

  it('BridgeError가 아닌 예외는 INTERNAL로 감싼다', async () => {
    on('notices', () => {
      throw new TypeError('boom');
    });
    const r = await runBridged('NoticeListQuery', {}, AUTH);
    expect(r).toEqual({ data: null, errors: [{ message: 'TypeError: boom', extensions: { code: 'INTERNAL' } }] });
  });

  it('백엔드에 닿지 못하면(BackendUnreachable) 감싸지 않고 던진다 → 화면은 네트워크 오류', async () => {
    const { BackendUnreachable } = await import('./backend');
    on('notices', () => {
      throw new BackendUnreachable('Failed to fetch');
    });
    await expect(runBridged('NoticeListQuery', {}, AUTH)).rejects.toBeInstanceOf(BackendUnreachable);
  });

  it('백엔드 오류는 { data: null, errors } 그대로', async () => {
    on('notices', fail('UNAUTHENTICATED', '로그인 필요'));
    const r = await runBridged('NoticeListQuery', {}, AUTH);
    expect(r.data).toBeNull();
    expect(r.errors).toEqual([{ message: '로그인 필요', extensions: { code: 'UNAUTHENTICATED', classification: 'BAD_REQUEST' } }]);
  });

  it('authorization 헤더 값을 백엔드 호출에 그대로 넘긴다', async () => {
    on('notices', ok({ notices: { items: [], nextCursor: null } }));
    await runBridged('NoticeListQuery', {}, AUTH);
    expect(callsOf('notices')[0]!.auth).toBe(AUTH);
  });
});

describe('팀 오류 코드 별칭 (TEAM_ERROR_ALIASES)', () => {
  it.each([
    ['TEAM_CODE_NOT_FOUND', 'INVITE_CODE_NOT_FOUND'],
    ['TEAM_ALREADY_JOINED', 'ALREADY_TEAM_MEMBER'],
    ['INVITATION_ALREADY_JOINED', 'ALREADY_TEAM_MEMBER'],
    ['INVITEE_ALREADY_MEMBER', 'ALREADY_TEAM_MEMBER'],
    ['LEADER_LAST_MEMBER', 'LAST_MEMBER'],
    ['EXEMPTION_REQUEST_DUPLICATE', 'EXEMPTION_DUPLICATE'],
  ])('%s → %s (메시지 · 다른 extensions는 그대로)', async (backendCode, frontCode) => {
    on('joinTeamByCode', fail(backendCode, '원문 메시지'));
    const r = await runBridged('TeamJoinByInviteCode', { code: 'ABC123' }, AUTH);
    expect(r.data).toBeNull();
    expect(r.errors).toEqual([{ message: '원문 메시지', extensions: { code: frontCode, classification: 'BAD_REQUEST' } }]);
  });

  it('별칭에 없는 코드는 바꾸지 않는다', async () => {
    on('joinTeamByCode', fail('FORBIDDEN'));
    const r = await runBridged('TeamJoinByInviteCode', { code: 'ABC123' }, AUTH);
    expect(r.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('오류가 여러 개면 각각 바꾼다', async () => {
    on('leaveTeam', {
      data: null,
      errors: [
        { message: 'a', extensions: { code: 'LEADER_LAST_MEMBER' } },
        { message: 'b', extensions: { code: 'VALIDATION_ERROR' } },
        { message: 'c' },
      ],
    });
    const r = await runBridged('TeamLeave', { teamId: '3' }, AUTH);
    expect(r.errors).toEqual([
      { message: 'a', extensions: { code: 'LAST_MEMBER' } },
      { message: 'b', extensions: { code: 'VALIDATION_ERROR' } },
      { message: 'c' },
    ]);
  });

  it('팀 연산이 아니면(askTeam을 거치지 않으면) 별칭을 쓰지 않는다', async () => {
    on('notices', fail('TEAM_CODE_NOT_FOUND'));
    const r = await runBridged('NoticeListQuery', {}, AUTH);
    expect(r.errors?.[0]?.extensions?.code).toBe('TEAM_CODE_NOT_FOUND');
  });

  it('성공하면 코드 · 변수를 보내고 Team으로 바꾼다', async () => {
    on('joinTeamByCode', ok({ joinTeamByCode: { id: '3', name: '알고리즘', isPublic: true, isLeader: false, memberCount: 4 } }));
    const r = await runBridged('TeamJoinByInviteCode', { code: 'ABC123' }, AUTH);
    expect(callsOf('joinTeamByCode')[0]!.vars).toEqual({ code: 'ABC123' });
    expect(r.data).toEqual({
      joinTeamByInviteCode: { __typename: 'Team', id: '3', name: '알고리즘', isPublic: true, viewerRole: 'MEMBER', memberCount: 4 },
    });
  });
});

describe('글 · 댓글 삭제: 작성자 삭제가 FORBIDDEN이면 관리자 삭제로', () => {
  describe.each([
    ['PostDelete', 'deletePost', 'adminDeletePost', 'adminDeletePost(postId: $id)'],
    ['AdminPostsDeletePost', 'deletePost', 'adminDeletePost', 'adminDeletePost(postId: $id)'],
    ['PostDeleteComment', 'deleteComment', 'adminDeleteComment', 'adminDeleteComment(commentId: $id)'],
    ['AdminPostsDeleteComment', 'deleteComment', 'adminDeleteComment', 'adminDeleteComment(commentId: $id)'],
  ])('%s', (op, authorField, adminField, adminSnippet) => {
    it('작성자 삭제가 되면 관리자 삭제를 부르지 않는다', async () => {
      on(authorField, ok({ [authorField]: true }));
      const r = await runBridged(op, { id: 'p1' }, AUTH);
      expect(r).toEqual({ data: { [authorField]: true } });
      expect(callsOf(authorField)[0]!.vars).toEqual({ id: 'p1' });
      expect(callsOf(adminField)).toHaveLength(0);
    });

    it('FORBIDDEN이면 같은 id로 관리자 삭제를 한 번 부른다', async () => {
      on(authorField, fail('FORBIDDEN'));
      on(adminField, ok({ [adminField]: true }));
      const r = await runBridged(op, { id: 'p1' }, AUTH);
      expect(r).toEqual({ data: { [authorField]: true } });
      const admin = callsOf(adminField);
      expect(admin).toHaveLength(1);
      expect(admin[0]!.query).toEqual(expect.stringContaining(adminSnippet));
      expect(admin[0]!.vars).toEqual({ id: 'p1' });
    });

    it('관리자 삭제도 실패하면 그 오류를 돌려준다', async () => {
      on(authorField, fail('FORBIDDEN'));
      on(adminField, fail('FORBIDDEN', '관리자 아님'));
      const r = await runBridged(op, { id: 'p1' }, AUTH);
      expect(r.data).toBeNull();
      expect(r.errors?.[0]?.message).toBe('관리자 아님');
    });

    it.each(['NOT_FOUND', 'POST_DELETED', 'INTERNAL_ERROR'])('%s는 다시 시도하지 않고 그대로 돌려준다', async (code) => {
      on(authorField, fail(code));
      const r = await runBridged(op, { id: 'p1' }, AUTH);
      expect(r.data).toBeNull();
      expect(r.errors?.[0]?.extensions?.code).toBe(code);
      expect(callsOf(adminField)).toHaveLength(0);
    });
  });
});

describe('관리자 주간 판정 (AdminDashboardWeekQuery)', () => {
  const page = (items: unknown[] = []) =>
    ok({
      adminJudgments: {
        weekStart: '2026-09-21',
        weekEnd: '2026-09-27',
        executedAt: '2026-09-28T00:10:00+09:00',
        passCount: 5,
        failCount: 2,
        exemptCount: 1,
        firstWeekCount: 1,
        holdCount: 1,
        nextCursor: null,
        items,
      },
    });

  it.each([
    [{ filter: 'FAIL' }, 'FAIL_ONLY'],
    [{ filter: 'HOLD' }, 'HOLD_ONLY'],
    [{ filter: 'ALL' }, 'ALL'],
    [{}, 'ALL'],
  ])('필터 %o → %s', async (vars, backendFilter) => {
    on('adminJudgments', page());
    await runBridged('AdminDashboardWeekQuery', vars, AUTH);
    const c = callsOf('adminJudgments')[0]!;
    expect(c.query).toEqual(expect.stringContaining('adminJudgments(weekStart: $w, keyword: $k, filter: $f, after: $a)'));
    expect(c.vars).toEqual({ w: null, k: null, f: backendFilter, a: null });
  });

  it('검색어는 keyword로, 빈 검색어는 null로 보낸다', async () => {
    on('adminJudgments', page());
    await runBridged('AdminDashboardWeekQuery', { weekStart: '2026-09-21', search: '김', after: 'c9', filter: 'FAIL' }, AUTH);
    await runBridged('AdminDashboardWeekQuery', { search: '' }, AUTH);
    const [first, second] = callsOf('adminJudgments');
    expect(first!.vars).toEqual({ w: '2026-09-21', k: '김', f: 'FAIL_ONLY', a: 'c9' });
    expect(second!.vars.k).toBeNull();
  });

  it('보류 행은 hold:{memberId}:{weekStart} id를 받고, 나머지는 judgmentId 그대로', async () => {
    const row = (over: Record<string, unknown>) => ({
      judgmentId: 'j0',
      member: brief('0', '누구'),
      status: 'PASS',
      skipReason: null,
      holdReason: null,
      verifiedDays: 5,
      recordCount: 2,
      warningCount: 0,
      corrected: false,
      manualHold: false,
      ...over,
    });
    on(
      'adminJudgments',
      page([
        row({ judgmentId: 'j1', member: brief('2', '김철수'), status: 'FAIL', warningCount: 3, corrected: true }),
        row({ judgmentId: 'ignored', member: brief('7', '보류'), status: 'HOLD', holdReason: 'GRASS_FETCH_FAILED', warningCount: null }),
        row({ judgmentId: 'ignored2', member: brief('8', '불일치'), status: 'HOLD', holdReason: 'IDENTITY_MISMATCH' }),
      ]),
    );
    const r = await runBridged('AdminDashboardWeekQuery', {}, AUTH);
    const week = (r.data as { adminJudgmentWeek: Record<string, unknown> }).adminJudgmentWeek;
    expect(week.counts).toEqual({ __typename: 'JudgmentCounts', pass: 5, fail: 2, exempt: 1, firstWeek: 1, hold: 1 });
    const rows = (week.rows as { nodes: Record<string, unknown>[]; totalCount: number; pageInfo: unknown });
    expect(rows.totalCount).toBe(3);
    expect(rows.pageInfo).toEqual({ __typename: 'PageInfo', hasNextPage: false, endCursor: null });
    expect(rows.nodes[0]).toEqual({
      __typename: 'AdminJudgmentRow',
      judgment: {
        __typename: 'WeeklyJudgment',
        id: 'j1',
        weekStart: '2026-09-21',
        weekEnd: '2026-09-27',
        status: 'FAIL',
        skipReason: null,
        holdReason: null,
        verifiedDays: 5,
        recordCount: 2,
        corrected: true,
      },
      member: { __typename: 'Member', profileImageUrl: null, id: '2', nickname: '김철수', githubLogin: 'gh2' },
      activeWarningCount: 3,
      isPenaltyTarget: true,
      canRetry: false,
      canCorrect: true,
    });
    expect(rows.nodes[1]).toMatchObject({
      judgment: { id: 'hold:7:2026-09-21', status: 'HOLD', holdReason: 'GRASS_FETCH_FAILED' },
      activeWarningCount: 0,
      isPenaltyTarget: false,
      canRetry: true,
      canCorrect: false,
    });
    expect(rows.nodes[2]).toMatchObject({ judgment: { id: 'hold:8:2026-09-21' }, canRetry: false, canCorrect: false });
  });

  it('대시보드 요약의 보류 목록도 같은 hold id · 주 끝 날짜를 만든다', async () => {
    on(
      'adminDashboardSummary',
      ok({
        adminDashboardSummary: { judgedWeekStart: '2026-09-21', pendingMembers: 2, failedMembers: 3, penaltyTargets: 1, pendingExemptions: 4 },
        adminJudgmentHolds: {
          items: [
            { member: brief('7', '보류'), weekStart: '2026-09-14', reason: 'GRASS_FETCH_FAILED', retriesExhausted: false },
            { member: brief('8', '불일치'), weekStart: '2026-09-21', reason: 'IDENTITY_MISMATCH', retriesExhausted: true },
          ],
          totalCount: 2,
        },
      }),
    );
    const r = await runBridged('AdminDashboardSummaryQuery', {}, AUTH);
    expect(r.data).toMatchObject({
      adminDashboardSummary: {
        pendingMemberCount: 2,
        latestWeekFailCount: 3,
        latestJudgedWeekStart: '2026-09-21',
        penaltyTargetCount: 1,
        pendingExemptionRequestCount: 4,
        heldJudgmentCount: 2,
      },
      heldJudgments: [
        { judgment: { id: 'hold:7:2026-09-14', weekStart: '2026-09-14', weekEnd: '2026-09-20', status: 'HOLD', holdReason: 'GRASS_FETCH_FAILED' }, canRetry: true },
        { judgment: { id: 'hold:8:2026-09-21', weekEnd: '2026-09-27' }, canRetry: false },
      ],
    });
  });
});

describe('보류 재시도 (AdminDashboardRerunHeld)', () => {
  it('hold id를 회원 · 주로 풀어 retryJudgmentHold를 한 건씩 부르고 결과를 센다', async () => {
    on('retryJudgmentHold', (vars) => ok({ retryJudgmentHold: { resolved: vars.m === '7' } }));
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: ['hold:7:2026-09-21', 'hold:8:2026-09-14'] }, AUTH);
    const calls = callsOf('retryJudgmentHold');
    expect(calls.map((c) => c.vars)).toEqual([
      { m: '7', w: '2026-09-21' },
      { m: '8', w: '2026-09-14' },
    ]);
    expect(calls[0]!.query).toEqual(expect.stringContaining('retryJudgmentHold(memberId: $m, weekStart: $w)'));
    expect(r.data).toEqual({ rerunHeldJudgments: { __typename: 'RerunResult', processedCount: 1, stillHeldCount: 1 } });
  });

  it('id 목록이 없으면 retryAllJudgmentHolds 한 번', async () => {
    on('retryAllJudgmentHolds', ok({ retryAllJudgmentHolds: { resolved: 3, stillHold: 2 } }));
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: null }, AUTH);
    expect(callsOf('retryAllJudgmentHolds')).toHaveLength(1);
    expect(callsOf('retryJudgmentHold')).toHaveLength(0);
    expect(r.data).toEqual({ rerunHeldJudgments: { __typename: 'RerunResult', processedCount: 3, stillHeldCount: 2 } });
  });

  it('빈 목록이면 아무것도 부르지 않고 0 · 0 (전체 재시도로 바뀌지 않는다)', async () => {
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: [] }, AUTH);
    expect(fake.calls).toHaveLength(0);
    expect(r.data).toEqual({ rerunHeldJudgments: { __typename: 'RerunResult', processedCount: 0, stillHeldCount: 0 } });
  });

  it('형식이 틀린 id는 서버에 보내지 않는다 — 전부 틀리면 INVALID_INPUT 오류', async () => {
    on('retryJudgmentHold', ok({ retryJudgmentHold: { resolved: true } }));
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: ['j123', 'hold:7:2026-09-21:x'] }, AUTH);
    expect(callsOf('retryJudgmentHold')).toHaveLength(0);
    expect(r.errors?.[0]?.extensions?.code).toBe('INVALID_INPUT');
  });

  it('형식이 틀린 id가 섞여 있으면 그 건만 남은 보류로 세고 나머지는 처리한다', async () => {
    on('retryJudgmentHold', ok({ retryJudgmentHold: { resolved: true } }));
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: ['hold:7:2026-09-21', 'j123'] }, AUTH);
    expect(callsOf('retryJudgmentHold').map((c) => c.vars)).toEqual([{ m: '7', w: '2026-09-21' }]);
    expect(r.data).toEqual({ rerunHeldJudgments: { __typename: 'RerunResult', processedCount: 1, stillHeldCount: 1 } });
  });

  it('중간에 실패해도 멈추지 않고 끝까지 돌며, 앞서 처리된 건수를 돌려준다', async () => {
    on('retryJudgmentHold', (vars) => (vars.m === '8' ? fail('INTERNAL_ERROR') : ok({ retryJudgmentHold: { resolved: true } })));
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: ['hold:7:2026-09-21', 'hold:8:2026-09-21', 'hold:9:2026-09-21'] }, AUTH);
    expect(callsOf('retryJudgmentHold')).toHaveLength(3);
    expect(r.errors).toBeUndefined();
    expect(r.data).toEqual({ rerunHeldJudgments: { __typename: 'RerunResult', processedCount: 2, stillHeldCount: 1 } });
  });

  it('모든 건이 오류면 첫 오류를 그대로 돌려준다', async () => {
    on('retryJudgmentHold', fail('INTERNAL_ERROR'));
    const r = await runBridged('AdminDashboardRerunHeld', { judgmentIds: ['hold:7:2026-09-21', 'hold:8:2026-09-21'] }, AUTH);
    expect(callsOf('retryJudgmentHold')).toHaveLength(2);
    expect(r.data).toBeNull();
    expect(r.errors?.[0]?.extensions?.code).toBe('INTERNAL_ERROR');
  });
});

describe('판정 정정', () => {
  const impact = { onHold: false, warningCountBefore: 2, warningCountAfter: 3, entersPenalty: true, leavesPenalty: false, recordOnly: false, affectedWeeks: 2 };

  it('미리보기: judgmentId · 새 결과를 보내고 currentStatus를 basis로 돌려준다', async () => {
    on('previewJudgmentCorrection', ok({ previewJudgmentCorrection: { member: brief('2', '김철수'), currentStatus: 'PASS', impact } }));
    const r = await runBridged('AdminDashboardCorrectionPreviewQuery', { judgmentId: 'j1', newStatus: 'FAIL' }, AUTH);
    const c = callsOf('previewJudgmentCorrection')[0]!;
    expect(c.query).toEqual(expect.stringContaining('previewJudgmentCorrection(judgmentId: $j, status: $s)'));
    expect(c.vars).toEqual({ j: 'j1', s: 'FAIL' });
    expect(r.data).toEqual({
      judgmentCorrectionPreview: {
        __typename: 'RecalcPreview',
        member: { __typename: 'Member', profileImageUrl: null, id: '2', nickname: '김철수', githubLogin: 'gh2' },
        warningCountBefore: 2,
        warningCountAfter: 3,
        penaltyChange: 'ENTER',
        affectedWeekCount: 2,
        frozenByFulfillment: false,
        restoresWithoutCategory: false,
        basis: 'PASS',
      },
    });
  });

  it('미리보기: 벌칙 해제는 RELEASE, 보류 중(null 경고 수)은 0, recordOnly는 frozenByFulfillment', async () => {
    on(
      'previewJudgmentCorrection',
      ok({
        previewJudgmentCorrection: {
          member: brief('2', '김철수'),
          currentStatus: 'FAIL',
          impact: { ...impact, onHold: true, warningCountBefore: null, warningCountAfter: null, entersPenalty: false, leavesPenalty: true, recordOnly: true },
        },
      }),
    );
    const r = await runBridged('AdminDashboardCorrectionPreviewQuery', { judgmentId: 'j1', newStatus: 'PASS' }, AUTH);
    expect(r.data).toMatchObject({
      judgmentCorrectionPreview: { warningCountBefore: 0, warningCountAfter: 0, penaltyChange: 'RELEASE', frozenByFulfillment: true, basis: 'FAIL' },
    });
  });

  it('반영: expectedBasis를 expectedStatus로 보낸다', async () => {
    on('correctJudgment', ok({ correctJudgment: { judgmentId: 'j1', member: brief('2', '김철수'), status: 'FAIL' } }));
    const r = await runBridged(
      'AdminDashboardCorrectJudgment',
      { input: { judgmentId: 'j1', newStatus: 'FAIL', reason: '기록 누락', expectedBasis: 'PASS' } },
      AUTH,
    );
    const c = callsOf('correctJudgment')[0]!;
    expect(c.query).toEqual(expect.stringContaining('correctJudgment(input: $in)'));
    expect(c.vars).toEqual({ in: { judgmentId: 'j1', status: 'FAIL', reason: '기록 누락', expectedStatus: 'PASS' } });
    expect(r.data).toEqual({
      correctJudgment: {
        __typename: 'RecalcPayload',
        member: { __typename: 'Member', profileImageUrl: null, id: '2', nickname: '김철수', githubLogin: 'gh2' },
        judgment: { __typename: 'WeeklyJudgment', id: 'j1', status: 'FAIL', skipReason: null, corrected: true },
      },
    });
  });

  it('반영: expectedBasis가 없으면 expectedStatus는 null', async () => {
    on('correctJudgment', ok({ correctJudgment: { judgmentId: 'j1', member: brief('2', '김철수'), status: 'PASS' } }));
    await runBridged('AdminDashboardCorrectJudgment', { input: { judgmentId: 'j1', newStatus: 'PASS', reason: 'r' } }, AUTH);
    expect((callsOf('correctJudgment')[0]!.vars.in as Vars).expectedStatus).toBeNull();
  });

  it('반영: 기준이 바뀌었다는 백엔드 오류(JUDGMENT_CHANGED)는 화면 계약의 PREVIEW_STALE로 바꾼다', async () => {
    on('correctJudgment', fail('JUDGMENT_CHANGED'));
    const r = await runBridged('AdminDashboardCorrectJudgment', { input: { judgmentId: 'j1', newStatus: 'PASS', reason: 'r', expectedBasis: 'FAIL' } }, AUTH);
    expect(r.errors?.[0]?.extensions?.code).toBe('PREVIEW_STALE');
  });

  it('경고 복구: 이미 처리됨(ALREADY_HANDLED)은 NOT_FOUND로 바꾼다 (화면이 목록을 다시 읽고 창을 닫는다)', async () => {
    on('restoreWarning', fail('ALREADY_HANDLED'));
    const r = await runBridged('AdminWarningsRestoreWarning', { warningId: '71' }, AUTH);
    expect(r.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });
});

describe('세션', () => {
  it('토큰이 없으면 백엔드를 부르지 않고 me: null + 지금 시각 기준 clock', async () => {
    const r = await runBridged('SessionQuery', {}, null);
    expect(fake.calls).toHaveLength(0);
    expect(r.data).toEqual({
      clock: { __typename: 'ServerClock', now: '2026-10-01T01:00:00.000Z', currentWeekStart: '2026-09-28', currentWeekEnd: '2026-10-04' },
      me: null,
    });
  });

  it('ACTIVE면 팀 유무 · 받은 초대 수를 더 묻는다', async () => {
    onMe();
    on('myTeams', ok({ myTeams: [{ id: '3' }], receivedTeamInvitations: { items: [{ id: 'i1' }, { id: 'i2' }] } }));
    const r = await runBridged('SessionQuery', {}, AUTH);
    expect(callsOf('me')[0]!.query).toEqual(expect.stringContaining('me { id githubLogin nickname profileImageUrl status role }'));
    expect((r.data as { me: unknown }).me).toEqual({
      __typename: 'Me',
      id: '1',
      status: 'ACTIVE',
      role: 'ADMIN',
      hasTeam: true,
      pendingInvitationCount: 2,
      member: { __typename: 'Member', id: '1', nickname: '한동관', githubLogin: 'hdg', profileImageUrl: null },
    });
  });

  it('ACTIVE인데 팀이 없으면 hasTeam false', async () => {
    onMe();
    on('myTeams', ok({ myTeams: [], receivedTeamInvitations: { items: [] } }));
    const r = await runBridged('SessionQuery', {}, AUTH);
    expect((r.data as { me: Record<string, unknown> }).me).toMatchObject({ hasTeam: false, pendingInvitationCount: 0 });
  });

  it('PENDING이면 팀 · 초대를 묻지 않고 false · 0', async () => {
    onMe({ ...ME, id: '9', status: 'PENDING', role: 'MEMBER' });
    const r = await runBridged('SessionQuery', {}, AUTH);
    expect(callsOf('myTeams')).toHaveLength(0);
    expect((r.data as { me: Record<string, unknown> }).me).toMatchObject({ id: '9', status: 'PENDING', role: 'MEMBER', hasTeam: false, pendingInvitationCount: 0 });
  });
});

describe('로그인 코드 교환 (SessionExchangeLoginCode)', () => {
  it('ACCOUNT_REJECTED는 오류가 아니라 REJECTED 응답', async () => {
    on('exchangeAuthCode', fail('ACCOUNT_REJECTED'));
    const r = await runBridged('SessionExchangeLoginCode', { code: 'c0de' }, null);
    expect(callsOf('exchangeAuthCode')[0]!.vars).toEqual({ code: 'c0de' });
    expect(r).toEqual({
      data: { exchangeLoginCode: { __typename: 'AuthPayload', status: 'REJECTED', accessToken: null, expiresAt: null, me: null } },
    });
  });

  it('성공하면 expiresIn(초)을 지금 기준 expiresAt으로 바꾼다', async () => {
    on('exchangeAuthCode', ok({ exchangeAuthCode: { accessToken: 'tok', expiresIn: 3600, me: ME } }));
    const r = await runBridged('SessionExchangeLoginCode', { code: 'c0de' }, null);
    expect(r.data).toEqual({
      exchangeLoginCode: {
        __typename: 'AuthPayload',
        status: 'ACTIVE',
        accessToken: 'tok',
        expiresAt: '2026-10-01T02:00:00.000Z',
        me: {
          __typename: 'Me',
          id: '1',
          status: 'ACTIVE',
          role: 'ADMIN',
          hasTeam: false,
          pendingInvitationCount: 0,
          member: { __typename: 'Member', id: '1', nickname: '한동관', githubLogin: 'hdg', profileImageUrl: null },
        },
      },
    });
  });

  it('다른 오류는 그대로', async () => {
    on('exchangeAuthCode', fail('INVALID_AUTH_CODE'));
    const r = await runBridged('SessionExchangeLoginCode', { code: 'x' }, null);
    expect(r.errors?.[0]?.extensions?.code).toBe('INVALID_AUTH_CODE');
  });
});

describe('팀 목록 (TeamListQuery)', () => {
  it('isLeader → viewerRole, weekSummary → currentWeekSummary, 초대 수', async () => {
    onMe(
      { id: '1' },
      [
        { id: '3', name: '알고리즘', isPublic: true, isLeader: true, memberCount: 5, weekSummary: { passCount: 2, notYetCount: 3 } },
        { id: '4', name: '비밀', isPublic: false, isLeader: false, memberCount: 2, weekSummary: { passCount: 0, notYetCount: 2 } },
      ],
      [{ id: 'i1' }],
    );
    const r = await runBridged('TeamListQuery', {}, AUTH);
    expect(callsOf('me')[0]!.query).toEqual(expect.stringContaining('myTeams { id name isPublic isLeader memberCount weekSummary { passCount notYetCount } }'));
    expect(r.data).toEqual({
      me: { __typename: 'Me', id: '1', pendingInvitationCount: 1 },
      myTeams: [
        { __typename: 'Team', id: '3', name: '알고리즘', isPublic: true, viewerRole: 'LEADER', memberCount: 5, currentWeekSummary: { __typename: 'TeamWeekSummary', passCount: 2, notYetCount: 3 } },
        { __typename: 'Team', id: '4', name: '비밀', isPublic: false, viewerRole: 'MEMBER', memberCount: 2, currentWeekSummary: { __typename: 'TeamWeekSummary', passCount: 0, notYetCount: 2 } },
      ],
    });
  });
});

describe('게시판 목록 (PostListQuery)', () => {
  const post = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    authorId: '2',
    author: { id: '2', nickname: '김철수', profileImageUrl: null },
    teamId: '3',
    teamName: '알고리즘',
    type: 'TROUBLESHOOTING',
    title: '빌드 실패',
    sections: { problem: '문제', cause: null, solution: '해결', did: null, learned: null },
    tags: ['vite'],
    isRecord: true,
    createdAt: '2026-09-30T10:00:00+09:00',
    updatedAt: '2026-09-30T10:00:00+09:00',
    commentCount: 2,
    ...over,
  });

  it('필터 · 커서를 posts 인자로 보내고 nextCursor를 pageInfo로', async () => {
    on('posts', ok({ posts: { items: [], nextCursor: 'n2', totalCount: 21 } }));
    onMe({ id: '1', role: 'MEMBER' });
    const r = await runBridged('PostListQuery', { filter: { type: 'DEVLOG', tag: 'react', query: '훅' }, after: 'n1' }, AUTH);
    const c = callsOf('posts')[0]!;
    expect(c.query).toEqual(expect.stringContaining('posts(type: $type, tag: $tag, q: $q, after: $after)'));
    expect(c.vars).toEqual({ type: 'DEVLOG', tag: 'react', q: '훅', after: 'n1' });
    expect(r.data).toEqual({
      posts: { __typename: 'PostConnection', nodes: [], pageInfo: { __typename: 'PageInfo', hasNextPage: true, endCursor: 'n2' }, totalCount: 21 },
    });
  });

  it('필터가 비면 TROUBLESHOOTING · null, 마지막 쪽은 hasNextPage false', async () => {
    on('posts', ok({ posts: { items: [], nextCursor: null, totalCount: 0 } }));
    onMe({ id: '1', role: 'MEMBER' });
    const r = await runBridged('PostListQuery', { filter: {} }, AUTH);
    expect(callsOf('posts')[0]!.vars).toEqual({ type: 'TROUBLESHOOTING', tag: null, q: null, after: null });
    expect((r.data as { posts: { pageInfo: unknown } }).posts.pageInfo).toEqual({ __typename: 'PageInfo', hasNextPage: false, endCursor: null });
  });

  it('글 노드: 섹션 배열 · 권한 · 수정 안 한 글의 updatedAt null', async () => {
    on('posts', ok({ posts: { items: [post(), post({ id: 'p2', authorId: '5', author: { id: '5', nickname: '서연', profileImageUrl: null }, teamId: null, teamName: null, updatedAt: '2026-09-30T11:00:00+09:00' })], nextCursor: null, totalCount: 2 } }));
    // 보는 사람: 일반 회원 1, 팀 3의 팀장
    onMe({ id: '1', role: 'MEMBER' }, [{ id: '3', isLeader: true }]);
    const r = await runBridged('PostListQuery', { filter: {} }, AUTH);
    const [a, b] = (r.data as { posts: { nodes: Record<string, unknown>[] } }).posts.nodes;
    expect(a).toEqual({
      __typename: 'Post',
      id: 'p1',
      type: 'TROUBLESHOOTING',
      title: '빌드 실패',
      sections: [
        { __typename: 'PostSection', key: 'PROBLEM', body: '문제' },
        { __typename: 'PostSection', key: 'CAUSE', body: null },
        { __typename: 'PostSection', key: 'SOLUTION', body: '해결' },
      ],
      tags: ['vite'],
      author: { __typename: 'Member', id: '2', nickname: '김철수', profileImageUrl: null },
      publicTeam: { __typename: 'Team', id: '3', name: '알고리즘' },
      isRecord: true,
      inFinalizedWeek: false,
      createdAt: '2026-09-30T10:00:00+09:00',
      updatedAt: null,
      commentCount: 2,
      viewerCanEdit: true,
      viewerCanDelete: false,
      viewerIsAuthor: false,
      editTeamId: '3',
    });
    expect(b).toMatchObject({ publicTeam: null, updatedAt: '2026-09-30T11:00:00+09:00', viewerCanEdit: false, viewerCanDelete: false, editTeamId: null });
  });

  it('관리자는 남의 글도 viewerCanDelete', async () => {
    on('posts', ok({ posts: { items: [post({ teamId: null, teamName: null })], nextCursor: null, totalCount: 1 } }));
    onMe({ id: '1', role: 'ADMIN' });
    const r = await runBridged('PostListQuery', { filter: {} }, AUTH);
    expect((r.data as { posts: { nodes: Record<string, unknown>[] } }).posts.nodes[0]).toMatchObject({ viewerCanEdit: false, viewerCanDelete: true });
  });
});

describe('공지 목록 (NoticeListQuery)', () => {
  it('after를 보내고 Notice · pageInfo로 바꾼다', async () => {
    const n = { id: 'n1', title: '규칙', content: '본문', isPinned: true, isSystem: true, createdAt: '2026-09-01T00:00:00+09:00', updatedAt: null };
    on('notices', ok({ notices: { items: [n], nextCursor: 'c2' } }));
    const r = await runBridged('NoticeListQuery', { after: 'c1' }, AUTH);
    const c = callsOf('notices')[0]!;
    expect(c.query).toEqual(expect.stringContaining('notices(after: $after)'));
    expect(c.vars).toEqual({ after: 'c1' });
    expect(r.data).toEqual({
      notices: { __typename: 'NoticeConnection', nodes: [{ __typename: 'Notice', ...n }], pageInfo: { __typename: 'PageInfo', hasNextPage: true, endCursor: 'c2' } },
    });
  });

  it('AdminNoticesQuery도 같은 변환을 쓴다', () => {
    expect(BRIDGED.AdminNoticesQuery).toBe(BRIDGED.NoticeListQuery);
  });
});

describe('내 경고 (WarningsQuery)', () => {
  const hist = (weekStart: string, categories: string[] = ['알고리즘']) => ({
    weekStart,
    weekEnd: '2026-09-27',
    verifiedDays: 2,
    recordCount: 0,
    categories,
    status: 'ACTIVE',
  });

  it('보류 중(onHold: 경고 수 · 벌칙 null)이면 isOnHold로 알리고 숫자는 0 · false, 이력은 커서를 끝까지 따라간다', async () => {
    on('myWarningSummary', ok({ myWarningSummary: { onHold: true, warningCount: null, streak: null, penaltyTarget: null } }));
    on('myWarningHistory', (vars) =>
      vars.after === 'c2'
        ? ok({ myWarningHistory: { items: [hist('2026-09-07', ['비공개 팀', '삭제된 팀'])], nextCursor: null } })
        : ok({ myWarningHistory: { onHold: true, items: [hist('2026-09-21')], nextCursor: 'c2' } }),
    );
    const r = await runBridged('WarningsQuery', {}, AUTH);
    const calls = callsOf('myWarningHistory');
    expect(calls[0]!.query).toEqual(expect.stringContaining('myWarningHistory { onHold items'));
    expect(calls.map((c) => c.vars)).toEqual([{}, { after: 'c2' }]);
    const w = (r.data as { myWarnings: { state: unknown; history: unknown[] } }).myWarnings;
    expect(callsOf('myWarningSummary')[0]!.query).toEqual(expect.stringContaining('onHold'));
    expect(w.state).toEqual({ __typename: 'WarningState', isOnHold: true, activeCount: 0, isPenaltyTarget: false, consecutivePasses: 0, weeksUntilDeduction: null, byCategory: [] });
    expect(w.history).toEqual([
      {
        __typename: 'WarningRecord',
        id: '2026-09-21',
        weekStart: '2026-09-21',
        weekEnd: '2026-09-27',
        verifiedDays: 2,
        recordCount: 0,
        categories: [{ __typename: 'TeamLabel', kind: 'PUBLIC', name: '알고리즘' }],
        standing: 'ACTIVE',
      },
      expect.objectContaining({
        id: '2026-09-07',
        categories: [
          { __typename: 'TeamLabel', kind: 'PRIVATE', name: null },
          { __typename: 'TeamLabel', kind: 'DELETED', name: null },
        ],
      }),
    ]);
  });

  it('경고가 있으면 남은 차감 주 = 2 - 연속 통과, 벌칙 대상이면 null', async () => {
    on('myWarningHistory', ok({ myWarningHistory: { onHold: false, items: [], nextCursor: null } }));
    on('myWarningSummary', ok({ myWarningSummary: { warningCount: 2, streak: 1, penaltyTarget: false } }));
    const a = await runBridged('WarningsQuery', {}, AUTH);
    expect((a.data as { myWarnings: { state: unknown } }).myWarnings.state).toMatchObject({ activeCount: 2, consecutivePasses: 1, weeksUntilDeduction: 1 });
    on('myWarningSummary', ok({ myWarningSummary: { warningCount: 3, streak: 0, penaltyTarget: true } }));
    const b = await runBridged('WarningsQuery', {}, AUTH);
    expect((b.data as { myWarnings: { state: unknown } }).myWarnings.state).toMatchObject({ activeCount: 3, isPenaltyTarget: true, weeksUntilDeduction: null });
  });
});

describe('프로필 (ProfileQuery)', () => {
  it('memberId로 묻고 잔디 단계 · 팀별 경고 라벨 · 보는 사람 기준 팀 역할로 바꾼다', async () => {
    on(
      'profile',
      ok({
        profile: {
          id: '2',
          nickname: '김철수',
          githubLogin: 'kim',
          profileImageUrl: null,
          postCount: 4,
          commentCount: 7,
          grass: { fetchedAt: '2026-10-01T09:00:00+09:00', totalContributions: 13, days: [{ date: '2026-09-29', count: 0 }, { date: '2026-09-30', count: 3 }, { date: '2026-10-01', count: 10 }] },
          warning: { onHold: false, warningCount: 2, penaltyTarget: false },
          teams: [{ id: '3', name: '알고리즘' }, { id: '4', name: '웹' }, { id: '5', name: '남의 팀' }],
          teamWarnings: { onHold: false, teams: [{ name: '알고리즘', count: 1 }, { name: '비공개 팀', count: 1 }] },
        },
      }),
    );
    onMe({ id: '1', role: 'MEMBER' }, [{ id: '3', isLeader: true }, { id: '4', isLeader: false }]);
    on('notices', ok({ notices: { items: [{ id: 'rule', isSystem: true }], nextCursor: null } }));
    const r = await runBridged('ProfileQuery', { id: '2' }, AUTH);
    const c = callsOf('profile')[0]!;
    expect(c.query).toEqual(expect.stringContaining('profile(memberId: $id)'));
    expect(c.vars).toEqual({ id: '2' });
    const m = (r.data as { member: Record<string, unknown> }).member;
    expect(m).toMatchObject({ id: '2', nickname: '김철수', githubLogin: 'kim', postCount: 4, commentCount: 7 });
    expect(m.grassCalendar).toEqual({
      __typename: 'GrassCalendar',
      status: 'OK',
      updatedAt: '2026-10-01T09:00:00+09:00',
      totalContributions: 13,
      days: [
        { __typename: 'GrassDay', date: '2026-09-29', count: 0, level: 0 },
        { __typename: 'GrassDay', date: '2026-09-30', count: 3, level: 2 },
        { __typename: 'GrassDay', date: '2026-10-01', count: 10, level: 4 },
      ],
      privateContributionSuspected: false,
    });
    expect(m.warningState).toEqual({
      __typename: 'WarningState',
      isOnHold: false,
      activeCount: 2,
      isPenaltyTarget: false,
      consecutivePasses: 0,
      weeksUntilDeduction: null,
      byCategory: [
        { __typename: 'CategoryWarningCount', label: { __typename: 'TeamLabel', kind: 'PUBLIC', name: '알고리즘' }, count: 1 },
        { __typename: 'CategoryWarningCount', label: { __typename: 'TeamLabel', kind: 'PRIVATE', name: null }, count: 1 },
      ],
    });
    expect(m.publicTeams).toEqual([
      { __typename: 'Team', id: '3', name: '알고리즘', viewerRole: 'LEADER' },
      { __typename: 'Team', id: '4', name: '웹', viewerRole: 'MEMBER' },
      { __typename: 'Team', id: '5', name: '남의 팀', viewerRole: null },
    ]);
    expect((r.data as { grassRuleNotice: unknown }).grassRuleNotice).toEqual({ __typename: 'Notice', id: 'rule' });
  });

  it('잔디를 못 받았으면(grass null) FAILED · 빈 달력, 보류 중 경고 수는 0', async () => {
    on(
      'profile',
      ok({
        profile: {
          id: '6',
          nickname: '박지훈',
          githubLogin: 'park',
          profileImageUrl: null,
          postCount: 0,
          commentCount: 0,
          grass: null,
          warning: { onHold: true, warningCount: null, penaltyTarget: null },
          teams: [],
          teamWarnings: { onHold: true, teams: [] },
        },
      }),
    );
    onMe({ id: '1', role: 'MEMBER' });
    on('notices', ok({ notices: { items: [], nextCursor: null } }));
    const r = await runBridged('ProfileQuery', { id: '6' }, AUTH);
    const m = (r.data as { member: Record<string, unknown> }).member;
    expect(m.grassCalendar).toMatchObject({ status: 'FAILED', updatedAt: null, totalContributions: 0, days: [] });
    expect(m.warningState).toMatchObject({ activeCount: 0, isPenaltyTarget: false, byCategory: [] });
    expect((r.data as { grassRuleNotice: unknown }).grassRuleNotice).toBeNull();
  });
});
