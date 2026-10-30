/**
 * 관리자 화면 테스트용 가짜 백엔드 데이터 (F18). 모양은 백엔드 admin · exemption · member-approval · notice .graphqls 그대로.
 * 상태가 있는 목록(게시물 · 공지 · 회원 등)은 작은 메모리 저장소로 두고, 뮤테이션 응답이 그 저장소를 바꿔 재조회가 새 상태를 보게 한다.
 */
import { backend, backendError } from '@/test/backend';
import { PERSONAS, type TestPersona } from '@/test/personas';

/** AdminMemberBrief */
/** 응답 함수 인자 (backend.on의 args) */
type Args = Record<string, unknown>;

export const adminBrief = (p: Pick<TestPersona, 'id' | 'nickname' | 'githubLogin'>) => ({ id: p.id, nickname: p.nickname, githubLogin: p.githubLogin });

/** 목업 인물 (페르소나에 없는 사람들) */
export const PEOPLE = {
  member: adminBrief(PERSONAS.member),
  plain: adminBrief(PERSONAS.plain),
  noteam: adminBrief(PERSONAS.noteam),
  penalty: adminBrief(PERSONAS.penalty),
  pending: adminBrief(PERSONAS.pending),
  rejected: adminBrief(PERSONAS.rejected),
  suspended: adminBrief(PERSONAS.suspended),
  minsu: { id: '3', nickname: '이민수', githubLogin: 'minsu-lee' },
  younghee: { id: '4', nickname: '박영희', githubLogin: 'younghee-park' },
  haneul: { id: '7', nickname: '정하늘', githubLogin: 'haneul-jung' },
  sujin: { id: '8', nickname: '최수진', githubLogin: 'sujin-choi' },
} as const;

/**
 * 관리자 레이아웃 배지(AdminLayoutCountsQuery)가 묻는 세 목록의 기본값.
 * bridge의 요약은 adminMembers{totalCount} · adminPenaltyTargets{totalCount} · personalExemptionRequests{items}를 따로 묻는다.
 */
export function adminBaseline() {
  backend
    .on('adminMembers', { items: [], nextCursor: null, totalCount: 0 })
    .on('adminPenaltyTargets', { items: [], nextCursor: null, totalCount: 0 })
    .on('personalExemptionRequests', { items: [], nextCursor: null })
    .on('adminDashboardSummary', { judgedWeekStart: '2026-09-21', pendingMembers: 0, failedMembers: 0, penaltyTargets: 0, pendingExemptions: 0 })
    .on('adminJudgmentHolds', { items: [], nextCursor: null, totalCount: 0, identityMismatchCount: 0 });
}

/** 관리자 전용 필드를 일반 회원이 물으면 실서버처럼 FORBIDDEN */
export const adminOnly =
  <A extends Record<string, unknown>>(fn: (args: A) => unknown) =>
  (args: Record<string, unknown>, ctx: { viewer: TestPersona | null }) => {
    if (ctx.viewer?.role !== 'ADMIN') throw backendError('FORBIDDEN');
    return fn(args as A);
  };

/* ---------------- 게시물 관리 (adminPosts) ---------------- */

export type AdminPostItem = {
  kind: 'POST' | 'COMMENT';
  id: string;
  postId: string;
  title: string;
  content: string | null;
  author: { id: string; nickname: string; githubLogin: string };
  createdAt: string;
};

export const postItem = (id: string, title: string, author: AdminPostItem['author'], createdAt: string): AdminPostItem => ({
  kind: 'POST',
  id,
  postId: id,
  title,
  content: null,
  author,
  createdAt,
});

export const commentItem = (id: string, postId: string, postTitle: string, content: string, author: AdminPostItem['author'], createdAt: string): AdminPostItem => ({
  kind: 'COMMENT',
  id,
  postId,
  title: postTitle,
  content,
  author,
  createdAt,
});

/**
 * 게시물 관리 저장소: adminPosts(필터 · 검색) + 삭제(deletePost → FORBIDDEN → adminDeletePost, 댓글도 같다).
 * 관리자가 남의 글을 지우면 실서버는 deletePost에서 FORBIDDEN을 주고 bridge가 adminDelete*로 다시 부른다.
 */
export function installAdminPosts(initial: AdminPostItem[]) {
  const items = [...initial].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const drop = (kind: AdminPostItem['kind'], id: string) => {
    const i = items.findIndex((x) => x.kind === kind && x.id === id);
    if (i < 0) throw backendError('NOT_FOUND');
    items.splice(i, 1);
    return true;
  };
  backend
    .on(
      'adminPosts',
      adminOnly<{ filter?: string; keyword?: string | null }>(({ filter, keyword }) => {
        const k = keyword?.toLowerCase();
        return {
          items: items.filter(
            (x) =>
              (filter === 'POSTS' ? x.kind === 'POST' : filter === 'COMMENTS' ? x.kind === 'COMMENT' : true) &&
              (!k || [x.title, x.content ?? '', x.author.nickname, x.author.githubLogin].some((s) => s.toLowerCase().includes(k))),
          ),
          nextCursor: null,
        };
      }),
    )
    .on('deletePost', () => {
      throw backendError('FORBIDDEN');
    })
    .on('deleteComment', () => {
      throw backendError('FORBIDDEN');
    })
    .on('adminDeletePost', ({ postId }: Args) => drop('POST', String(postId)))
    .on('adminDeleteComment', ({ commentId }: Args) => drop('COMMENT', String(commentId)));
  return items;
}

/* ---------------- 회원 · 관리자 권한 (adminMembers · adminMemberRoster) ---------------- */

export type AdminMember = { id: string; githubLogin: string; nickname: string; status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'; role: 'MEMBER' | 'ADMIN'; createdAt: string };

const member = (p: { id: string; nickname: string; githubLogin: string }, status: AdminMember['status'], createdAt: string, role: AdminMember['role'] = 'MEMBER'): AdminMember => ({
  ...p,
  status,
  role,
  createdAt,
});

/** 목업과 같은 회원들: 활성 4명(한동관 관리자) · 승인 대기 3명 · 거절 1명 */
export const seedAdminMembers = (): AdminMember[] => [
  member(PEOPLE.member, 'ACTIVE', '2026-08-20T10:00:00+09:00', 'ADMIN'),
  member(PEOPLE.plain, 'ACTIVE', '2026-08-21T10:00:00+09:00'),
  member(PEOPLE.minsu, 'ACTIVE', '2026-08-22T10:00:00+09:00'),
  member(PEOPLE.younghee, 'ACTIVE', '2026-08-23T10:00:00+09:00'),
  member(PEOPLE.pending, 'PENDING', '2026-09-30T21:15:00+09:00'),
  member(PEOPLE.rejected, 'REJECTED', '2026-09-20T13:00:00+09:00'),
  member({ id: '13', nickname: '윤서준', githubLogin: 'seojun-yoon' }, 'PENDING', '2026-09-29T08:40:00+09:00'),
  member({ id: '12', nickname: '강지민', githubLogin: 'jimin-kang' }, 'PENDING', '2026-10-01T09:10:00+09:00'),
];

/**
 * 회원 저장소. adminMembers(status: PENDING 기본 · REJECTED · SUSPENDED · ALL=대기+거절, 신청 오래된 순),
 * adminMemberRoster(활성 전체, id 오름차순), 승인 · 거절 · 되돌리기 · 승격 · 정지 · 정지 해제.
 */
export function installAdminMembers(initial: AdminMember[] = seedAdminMembers()) {
  const rows = initial.map((m) => ({ ...m }));
  const match = (m: AdminMember, keyword: unknown) => {
    const k = typeof keyword === 'string' ? keyword.toLowerCase() : '';
    return !k || m.nickname.toLowerCase().includes(k) || m.githubLogin.toLowerCase().includes(k);
  };
  const page = (items: AdminMember[]) => ({ items: items.map((m) => ({ ...m })), nextCursor: null, totalCount: items.length });
  const change = (to: Partial<AdminMember>) => (args: Record<string, unknown>) => {
    const m = rows.find((x) => x.id === args.memberId);
    if (!m) throw backendError('NOT_FOUND');
    Object.assign(m, to);
    return { ...m };
  };
  backend
    .on(
      'adminMembers',
      adminOnly<{ status?: string; keyword?: string | null }>(({ status = 'PENDING', keyword }) =>
        page(
          rows
            .filter((m) => (status === 'ALL' ? m.status === 'PENDING' || m.status === 'REJECTED' : m.status === status) && match(m, keyword))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        ),
      ),
    )
    .on(
      'adminMemberRoster',
      adminOnly<{ keyword?: string | null }>(({ keyword }) =>
        page(rows.filter((m) => m.status === 'ACTIVE' && match(m, keyword)).sort((a, b) => Number(a.id) - Number(b.id))),
      ),
    )
    .on('approveMember', change({ status: 'ACTIVE' }))
    .on('rejectMember', change({ status: 'REJECTED' }))
    .on('revertMemberToPending', change({ status: 'PENDING' }))
    .on('promoteToAdmin', change({ role: 'ADMIN' }))
    .on('suspendMember', change({ status: 'SUSPENDED' }))
    .on('unsuspendMember', change({ status: 'ACTIVE' }));
  return rows;
}

/* ---------------- 공지 관리 (notices) ---------------- */

export type BackendNotice = { id: string; title: string; content: string; isPinned: boolean; isSystem: boolean; createdAt: string; updatedAt: string | null };

const notice = (id: string, title: string, content: string, createdAt: string, o: { pinned?: boolean; system?: boolean } = {}): BackendNotice => ({
  id,
  title,
  content,
  isPinned: !!o.pinned,
  isSystem: !!o.system,
  createdAt,
  updatedAt: null,
});

/** 목업과 같은 공지 6개. 2번(잔디 인정 규칙)은 고정 · 시스템 공지 */
export const seedNotices = (): BackendNotice[] => [
  notice('1', '잔디로그 정식 오픈', '오늘부터 잔디로그를 정식으로 써요.', '2026-08-20T10:00:00+09:00'),
  notice('2', '잔디 인정 규칙 안내', '매주 월요일 오전에 지난 한 주(월~일)를 개인 단위로 판정해요.', '2026-09-01T09:00:00+09:00', { pinned: true, system: true }),
  notice('3', 'GitHub 비공개 기여 설정 확인해 주세요', '비공개 저장소에서 작업했다면 비공개 기여 표시를 켜 주세요.', '2026-09-10T10:00:00+09:00'),
  notice('4', '추석 연휴에도 판정은 그대로 진행돼요', '연휴 주간(9/21 ~ 9/27)도 평소처럼 판정해요.\n사정이 있으면 팀장에게 개인 면제를 요청해 주세요.', '2026-09-18T15:00:00+09:00'),
  notice('5', '2학기 스터디 팀 모집', '2학기에 새로 만들 스터디 팀을 모집해요.', '2026-09-22T12:00:00+09:00'),
  notice('6', '10월 정기 모임은 10/8(목) 저녁 7시예요', '장소: 공학관 301호', '2026-09-29T18:00:00+09:00'),
];

/** 공지 저장소: notices(고정 먼저 · 최신순) · notice · create/update/delete(시스템 공지는 삭제 불가) · setNoticePinned */
export function installNotices(initial: BackendNotice[] = seedNotices(), now = '2026-10-01T10:00:00+09:00') {
  const rows = initial.map((n) => ({ ...n }));
  let nextId = 100;
  const find = (id: unknown) => {
    const n = rows.find((x) => x.id === id);
    if (!n) throw backendError('NOT_FOUND');
    return n;
  };
  type Input = { title: string; content: string; isPinned: boolean };
  backend
    .on('notices', ({ after }: Args) => {
      // 고정 먼저 · 최신순, 커서 기반 20개 (notice.graphqls)
      const all = [...rows].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.createdAt.localeCompare(a.createdAt));
      const start = typeof after === 'string' ? Number(after) : 0;
      return { items: all.slice(start, start + 20).map((n) => ({ ...n })), nextCursor: start + 20 < all.length ? String(start + 20) : null };
    })
    .on('notice', ({ id }: Args) => ({ ...find(id) }))
    .on('createNotice', ({ input }: Args) => {
      const i = input as Input;
      const n = notice(String(nextId++), i.title, i.content, now, { pinned: i.isPinned });
      rows.push(n);
      return { ...n };
    })
    .on('updateNotice', ({ id, input }: Args) => {
      const n = find(id);
      Object.assign(n, input as Input, { updatedAt: now });
      return { ...n };
    })
    .on('deleteNotice', ({ id }: Args) => {
      const n = find(id);
      if (n.isSystem) throw backendError('SYSTEM_NOTICE_UNDELETABLE');
      rows.splice(rows.indexOf(n), 1);
      return true;
    })
    .on('setNoticePinned', ({ id, isPinned }: Args) => {
      const n = find(id);
      n.isPinned = Boolean(isPinned);
      return { id: n.id, isPinned: n.isPinned };
    });
  return rows;
}

/* ---------------- 대시보드 · 판정 (admin.graphqls) ---------------- */

export type JudgmentStatus = 'PASS' | 'FAIL' | 'EXEMPT' | 'EXCLUDED' | 'HOLD';
export type JudgmentRowFx = {
  judgmentId: string;
  member: { id: string; nickname: string; githubLogin: string };
  status: JudgmentStatus;
  skipReason: string | null;
  holdReason: 'API_ERROR' | 'IDENTITY_MISMATCH' | null;
  verifiedDays: number | null;
  recordCount: number | null;
  warningCount: number | null;
  corrected: boolean;
};
export type JudgmentWeekFx = { weekStart: string; executedAt: string | null; rows: JudgmentRowFx[] };
export type PenaltyTargetFx = { member: { id: string; nickname: string; githubLogin: string }; warningCount: number; reachedWeek: string; teams: { id: string; name: string }[] };

/** 미리보기 영향값 (AdminRecalcImpact) — 테스트가 회원 · 목표 결과별로 정한다 */
export type ImpactFx = { onHold: boolean; warningCountBefore: number | null; warningCountAfter: number | null; entersPenalty: boolean; leavesPenalty: boolean; recordOnly: boolean; affectedWeeks: number };

export type JudgmentWorld = {
  weeks: JudgmentWeekFx[];
  /** 가장 최근 판정 주 (adminJudgments 기본값 · 요약 judgedWeekStart) */
  judgedWeekStart: string;
  pendingMembers: number;
  pendingExemptions: number;
  penaltyTargets: PenaltyTargetFx[];
  /** `${judgmentId}:${status}` → 영향값. 없으면 경고 수 그대로 */
  impacts: Record<string, ImpactFx>;
  /** 다음 correctJudgment 한 번을 JUDGMENT_CHANGED로 (다른 관리자가 먼저 바꿈) */
  changeBehindBack: boolean;
};

const brief = (id: string, nickname: string, githubLogin: string) => ({ id, nickname, githubLogin });
export const judgmentIdOf = (memberId: string, weekStart = '2026-09-21') => String(Number(weekStart.replaceAll('-', '').slice(4)) * 100 + Number(memberId));

const row = (weekStart: string, m: { id: string; nickname: string; githubLogin: string }, status: JudgmentStatus, o: Partial<JudgmentRowFx> = {}): JudgmentRowFx => ({
  judgmentId: judgmentIdOf(m.id, weekStart),
  member: m,
  status,
  skipReason: status === 'EXCLUDED' ? 'FIRST_WEEK' : status === 'EXEMPT' ? 'EXEMPTION_PERIOD' : null,
  holdReason: status === 'HOLD' ? 'API_ERROR' : null,
  verifiedDays: status === 'PASS' ? 4 : status === 'FAIL' ? 1 : null,
  recordCount: status === 'PASS' ? 1 : status === 'FAIL' ? 0 : null,
  warningCount: 0,
  corrected: false,
  ...o,
});

export const JIHOON = brief('6', '박지훈', 'jihoon-park');
export const HYUNWOO = brief('29', '노현우', 'hyunwoo-noh');
export const SEOYUN = brief('30', '백서윤', 'seoyun-baek');

/** 목업 W-15와 같은 9/21 주: 통과 18 · 미달 4 · 면제 2 · 첫 참가 1 · 보류 1, 9/28 07:00 실행 */
export function judgmentWorld(): JudgmentWorld {
  const w = '2026-09-21';
  const fails = [
    row(w, JIHOON, 'FAIL', { verifiedDays: 0, recordCount: 0, warningCount: 3 }),
    row(w, brief('3', '이민수', 'minsu-lee'), 'FAIL', { warningCount: 1 }),
    row(w, brief('4', '박영희', 'younghee-park'), 'FAIL', { warningCount: 2 }),
    row(w, brief('7', '정하늘', 'haneul-jung'), 'FAIL', { warningCount: 3 }),
  ];
  const passes = [
    row(w, brief('1', '한동관', 'handong-gwan'), 'PASS', { warningCount: 1 }),
    row(w, brief('2', '김철수', 'chulsoo-kim'), 'PASS'),
    row(w, SEOYUN, 'PASS'),
    ...Array.from({ length: 15 }, (_, i) => row(w, brief(String(40 + i), `회원${40 + i}`, `member-${40 + i}`), 'PASS')),
  ];
  const others = [
    row(w, brief('8', '최수진', 'sujin-choi'), 'EXEMPT'),
    row(w, brief('9', '정다은', 'daeun-jung'), 'EXEMPT'),
    row(w, brief('5', '서연', 'seoyeon-lee'), 'EXCLUDED'),
    row(w, HYUNWOO, 'HOLD', { warningCount: null }),
  ];
  return {
    weeks: [
      { weekStart: '2026-09-28', executedAt: null, rows: [] },
      { weekStart: w, executedAt: '2026-09-28T07:00:00', rows: [...fails, ...others, ...passes] },
      { weekStart: '2026-09-14', executedAt: '2026-09-21T07:00:00', rows: [row('2026-09-14', JIHOON, 'FAIL', { warningCount: 2 }), row('2026-09-14', brief('2', '김철수', 'chulsoo-kim'), 'PASS')] },
    ],
    judgedWeekStart: w,
    pendingMembers: 3,
    pendingExemptions: 2,
    penaltyTargets: [
      { member: JIHOON, warningCount: 3, reachedWeek: '2026-09-21', teams: [{ id: '1', name: '사이드 프로젝트 A팀' }] },
      { member: brief('7', '정하늘', 'haneul-jung'), warningCount: 3, reachedWeek: '2026-09-14', teams: [{ id: '3', name: '웹 프로젝트 B팀' }] },
    ],
    impacts: {
      [`${judgmentIdOf('6')}:PASS`]: { onHold: false, warningCountBefore: 3, warningCountAfter: 2, entersPenalty: false, leavesPenalty: true, recordOnly: false, affectedWeeks: 1 },
      [`${judgmentIdOf('6')}:EXEMPT`]: { onHold: false, warningCountBefore: 3, warningCountAfter: 2, entersPenalty: false, leavesPenalty: true, recordOnly: false, affectedWeeks: 1 },
    },
    changeBehindBack: false,
  };
}

const findRow = (jw: JudgmentWorld, judgmentId: unknown) => {
  for (const wk of jw.weeks) {
    const r = wk.rows.find((x) => x.judgmentId === String(judgmentId));
    if (r) return { wk, r };
  }
  throw backendError('NOT_FOUND');
};

/** 대시보드 조회 · 정정 · 보류 재시도 + 레이아웃 배지(adminMembers · adminPenaltyTargets · personalExemptionRequests) */
export function installJudgments(jw: JudgmentWorld = judgmentWorld()) {
  const PAGE = 20;
  const holds = () =>
    jw.weeks.flatMap((wk) =>
      wk.rows.filter((r) => r.status === 'HOLD').map((r) => ({ member: r.member, weekStart: wk.weekStart, reason: r.holdReason ?? 'API_ERROR', retryCount: 3, retriesExhausted: true })),
    );
  const failCount = () => jw.weeks.find((w) => w.weekStart === jw.judgedWeekStart)?.rows.filter((r) => r.status === 'FAIL').length ?? 0;
  const resolveHold = (r: JudgmentRowFx) => {
    Object.assign(r, { status: 'PASS', holdReason: null, verifiedDays: 3, recordCount: 1, warningCount: 0 });
  };
  backend
    .on('adminMembers', adminOnly(() => ({ items: [], nextCursor: null, totalCount: jw.pendingMembers })))
    .on('adminPenaltyTargets', adminOnly(() => ({ items: jw.penaltyTargets, nextCursor: null, totalCount: jw.penaltyTargets.length })))
    .on('personalExemptionRequests', adminOnly(() => ({ items: Array.from({ length: jw.pendingExemptions }, (_, i) => ({ id: String(i + 1) })), nextCursor: null })))
    .on(
      'adminDashboardSummary',
      adminOnly(() => ({
        judgedWeekStart: jw.judgedWeekStart,
        pendingMembers: jw.pendingMembers,
        failedMembers: failCount(),
        penaltyTargets: jw.penaltyTargets.length,
        pendingExemptions: jw.pendingExemptions,
      })),
    )
    .on('adminJudgmentHolds', adminOnly(() => {
      const items = holds();
      return { items, nextCursor: null, totalCount: items.length, identityMismatchCount: items.filter((h) => h.reason === 'IDENTITY_MISMATCH').length };
    }))
    .on(
      'adminJudgments',
      adminOnly<{ weekStart?: string | null; keyword?: string | null; filter?: string; after?: string | null }>(({ weekStart, keyword, filter, after }) => {
        const wk = jw.weeks.find((w) => w.weekStart === (weekStart ?? jw.judgedWeekStart)) ?? { weekStart: String(weekStart), executedAt: null, rows: [] };
        const k = keyword?.toLowerCase();
        const all = wk.rows.filter(
          (r) =>
            (filter === 'FAIL_ONLY' ? r.status === 'FAIL' : filter === 'HOLD_ONLY' ? r.status === 'HOLD' : true) &&
            (!k || r.member.nickname.toLowerCase().includes(k) || r.member.githubLogin.toLowerCase().includes(k)),
        );
        const count = (s: JudgmentStatus, skip?: string) => wk.rows.filter((r) => r.status === s && (!skip || r.skipReason === skip)).length;
        const start = after ? Number(after) : 0;
        return {
          weekStart: wk.weekStart,
          weekEnd: addDaysIso(wk.weekStart, 6),
          executedAt: wk.executedAt,
          passCount: count('PASS'),
          failCount: count('FAIL'),
          exemptCount: count('EXEMPT'),
          firstWeekCount: count('EXCLUDED', 'FIRST_WEEK'),
          holdCount: count('HOLD'),
          items: all.slice(start, start + PAGE).map((r) => ({ ...r, manualHold: r.status === 'HOLD' })),
          nextCursor: start + PAGE < all.length ? String(start + PAGE) : null,
        };
      }),
    )
    .on(
      'previewJudgmentCorrection',
      adminOnly<{ judgmentId: string; status: string }>(({ judgmentId, status }) => {
        const { wk, r } = findRow(jw, judgmentId);
        if (r.status === 'HOLD' || r.status === status) throw backendError('JUDGMENT_NOT_CORRECTABLE');
        const impact = jw.impacts[`${r.judgmentId}:${status}`] ?? {
          onHold: false,
          warningCountBefore: r.warningCount,
          warningCountAfter: r.warningCount,
          entersPenalty: false,
          leavesPenalty: false,
          recordOnly: false,
          affectedWeeks: 1,
        };
        return { judgmentId: r.judgmentId, member: r.member, weekStart: wk.weekStart, currentStatus: r.status, targetStatus: status, impact };
      }),
    )
    .on(
      'correctJudgment',
      adminOnly<{ input: { judgmentId: string; status: JudgmentStatus; reason: string; expectedStatus?: string | null } }>(({ input }) => {
        const { wk, r } = findRow(jw, input.judgmentId);
        if (jw.changeBehindBack || (input.expectedStatus && input.expectedStatus !== r.status)) {
          jw.changeBehindBack = false;
          throw backendError('JUDGMENT_CHANGED');
        }
        const impact = jw.impacts[`${r.judgmentId}:${input.status}`];
        Object.assign(r, { status: input.status, corrected: true, skipReason: null });
        if (impact && !impact.onHold && impact.warningCountAfter !== null) r.warningCount = impact.warningCountAfter;
        if (impact?.leavesPenalty) jw.penaltyTargets = jw.penaltyTargets.filter((t) => t.member.id !== r.member.id);
        return { judgmentId: r.judgmentId, member: r.member, weekStart: wk.weekStart, status: r.status, onHold: false, warningCount: r.warningCount, penaltyTarget: (r.warningCount ?? 0) >= 3 };
      }),
    )
    .on(
      'retryJudgmentHold',
      adminOnly<{ memberId: string; weekStart: string }>(({ memberId, weekStart }) => {
        const r = jw.weeks.find((w) => w.weekStart === weekStart)?.rows.find((x) => x.member.id === String(memberId));
        if (!r) throw backendError('NOT_FOUND');
        const wasHold = r.status === 'HOLD' && r.holdReason === 'API_ERROR';
        if (wasHold) resolveHold(r);
        return { member: r.member, weekStart, status: r.status, holdReason: r.holdReason, resolved: wasHold };
      }),
    )
    .on(
      'retryAllJudgmentHolds',
      adminOnly(() => {
        const targets = jw.weeks.flatMap((w) => w.rows.filter((r) => r.status === 'HOLD' && r.holdReason === 'API_ERROR'));
        const still = jw.weeks.flatMap((w) => w.rows.filter((r) => r.status === 'HOLD' && r.holdReason !== 'API_ERROR')).length;
        targets.forEach(resolveHold);
        return { attempted: targets.length, resolved: targets.length, stillHold: still, failed: 0 };
      }),
    );
  return jw;
}

function addDaysIso(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ---------------- 경고 복구 · 벌칙 (admin.graphqls) ---------------- */

export type DeletedWarningFx = {
  warningId: string;
  member: { id: string; nickname: string; githubLogin: string };
  weekStart: string;
  deleteReason: 'KICKED' | 'TEAM_DELETED';
  deletedAt: string;
  restoreTeams: { id: string; name: string }[];
  teamDeleted: boolean;
  /** 복구 미리보기 영향값 */
  impact: ImpactFx;
  /** 복구하면 벌칙 대상에 넣을 값 (entersPenalty일 때) */
  becomesTarget?: PenaltyTargetFx;
};

export const YOUNGHEE = brief('3', '이영희', 'younghee-lee');
export const YUJIN = brief('11', '최유진', 'yujin-choi');

/** 목업 W-16: 벌칙 대상 2명(박지훈 · 정하늘) + 삭제된 경고 2건(이영희 추방 · 최유진 팀 삭제) */
export function warningsWorld(jw: JudgmentWorld): DeletedWarningFx[] {
  jw.penaltyTargets = [
    { member: JIHOON, warningCount: 3, reachedWeek: '2026-09-28', teams: [{ id: '1', name: '사이드 프로젝트 A팀' }, { id: '2', name: '알고리즘 스터디' }] },
    { member: brief('7', '정하늘', 'haneul-jung'), warningCount: 3, reachedWeek: '2026-09-21', teams: [{ id: '3', name: '웹 프로젝트 B팀' }] },
  ];
  return [
    {
      warningId: '71',
      member: YOUNGHEE,
      weekStart: '2026-09-14',
      deleteReason: 'KICKED',
      deletedAt: '2026-09-25T10:00:00',
      restoreTeams: [{ id: '3', name: '웹 프로젝트 B팀' }],
      teamDeleted: false,
      impact: { onHold: false, warningCountBefore: 2, warningCountAfter: 3, entersPenalty: true, leavesPenalty: false, recordOnly: false, affectedWeeks: 2 },
      becomesTarget: { member: YOUNGHEE, warningCount: 3, reachedWeek: '2026-09-14', teams: [{ id: '3', name: '웹 프로젝트 B팀' }] },
    },
    {
      warningId: '72',
      member: YUJIN,
      weekStart: '2026-08-31',
      deleteReason: 'TEAM_DELETED',
      deletedAt: '2026-09-10T10:00:00',
      restoreTeams: [],
      teamDeleted: true,
      impact: { onHold: false, warningCountBefore: 0, warningCountAfter: 1, entersPenalty: false, leavesPenalty: false, recordOnly: false, affectedWeeks: 5 },
    },
  ];
}

/** 벌칙 이행 · 삭제된 경고 · 복구 미리보기 · 복구. 벌칙 대상 목록은 installJudgments가 jw.penaltyTargets로 낸다 */
export function installWarnings(jw: JudgmentWorld, deleted: DeletedWarningFx[]) {
  const find = (id: unknown) => deleted.find((w) => w.warningId === String(id));
  backend
    .on('adminDeletedWarnings', adminOnly(() => ({ items: deleted.map(({ impact: _i, becomesTarget: _b, ...w }) => w), nextCursor: null })))
    .on(
      'previewWarningRestore',
      adminOnly<{ warningId: string }>(({ warningId }) => {
        const w = find(warningId);
        if (!w) throw backendError('ALREADY_HANDLED');
        return { warningId: w.warningId, member: w.member, weekStart: w.weekStart, restoreTeams: w.restoreTeams, teamDeleted: w.teamDeleted, impact: w.impact };
      }),
    )
    .on(
      'restoreWarning',
      adminOnly<{ warningId: string }>(({ warningId }) => {
        const w = find(warningId);
        if (!w) throw backendError('ALREADY_HANDLED');
        deleted.splice(deleted.indexOf(w), 1);
        if (w.becomesTarget) jw.penaltyTargets.push(w.becomesTarget);
        return { warningId: w.warningId, member: w.member, weekStart: w.weekStart, onHold: false, warningCount: w.impact.warningCountAfter, penaltyTarget: !!w.becomesTarget };
      }),
    )
    .on(
      'fulfillPenalty',
      adminOnly<{ memberId: string }>(({ memberId }) => {
        const t = jw.penaltyTargets.find((x) => x.member.id === String(memberId));
        if (!t) throw backendError('NOT_PENALTY_TARGET');
        jw.penaltyTargets = jw.penaltyTargets.filter((x) => x !== t);
        return { member: t.member, fulfilledAt: '2026-10-01T10:00:00', reachedWeek: t.reachedWeek };
      }),
    );
  return deleted;
}

/* ---------------- 면제 관리 (exemption.graphqls) ---------------- */

export type PeriodFx = { id: string; weekStart: string; reason: string };
export type RequestFx = {
  id: string;
  member: { id: string; nickname: string; githubLogin: string };
  requester: { id: string; nickname: string; githubLogin: string };
  weekStart: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
};
export type ExemptionWorld = { periods: PeriodFx[]; requests: RequestFx[]; currentWeekStart: string };

/** 면제 기간 9/7(지난 주) · 10/19 · 10/26, 대기 요청 2건(한지우 → 조성민 9/28 · 한동관 → 김철수 10/5) */
export function exemptionWorld(): ExemptionWorld {
  return {
    currentWeekStart: '2026-09-28',
    periods: [
      { id: '1', weekStart: '2026-09-07', reason: '2학기 개강 주간' },
      { id: '2', weekStart: '2026-10-19', reason: '중간고사 기간' },
      { id: '3', weekStart: '2026-10-26', reason: '중간고사 기간 (2주차)' },
    ],
    requests: [
      { id: '4', member: brief('19', '조성민', 'sungmin-cho'), requester: brief('18', '한지우', 'jiwoo-han'), weekStart: '2026-09-28', reason: '예비군 훈련이 있어요.', status: 'PENDING', rejectReason: null },
      { id: '5', member: brief('2', '김철수', 'chulsoo-kim'), requester: brief('1', '한동관', 'handong-gwan'), weekStart: '2026-10-05', reason: '학회 발표 준비로 한 주 쉬어요.', status: 'PENDING', rejectReason: null },
    ],
  };
}

const retroImpact: ImpactFx = { onHold: false, warningCountBefore: 2, warningCountAfter: 1, entersPenalty: false, leavesPenalty: false, recordOnly: false, affectedWeeks: 2 };

/** 면제 기간 · 개인 면제 요청 조회 · 미리보기 · 반영. 판정이 끝난 주(이번 주 이전)만 소급(retroactive) */
export function installExemptions(ew: ExemptionWorld = exemptionWorld()) {
  let nextId = 100;
  const judged = (weekStart: string) => weekStart < ew.currentWeekStart;
  const periodOut = (p: PeriodFx) => ({ ...p, weekEnd: addDaysIso(p.weekStart, 6), createdAt: '2026-09-01T10:00:00', updatedAt: null });
  const requestOut = (r: RequestFx) => ({
    ...r,
    weekEnd: addDaysIso(r.weekStart, 6),
    respondedAt: r.status === 'PENDING' ? null : '2026-10-01T10:00:00',
    createdAt: '2026-09-30T10:00:00',
    overlapsExemptionPeriod: ew.periods.some((p) => p.weekStart === r.weekStart),
  });
  const retro = (weekStart: string, members: { id: string; nickname: string; githubLogin: string }[]) => ({
    weekStart,
    retroactive: judged(weekStart),
    items: judged(weekStart) ? members.map((member) => ({ member, currentStatus: 'FAIL', impact: retroImpact })) : [],
  });
  const findRequest = (id: unknown) => {
    const r = ew.requests.find((x) => x.id === String(id));
    if (!r) throw backendError('NOT_FOUND');
    if (r.status !== 'PENDING') throw backendError('ALREADY_HANDLED');
    return r;
  };
  backend
    .on('exemptionPeriods', adminOnly(() => ({ items: [...ew.periods].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).map(periodOut), nextCursor: null })))
    .on('previewExemptionPeriod', adminOnly<{ weekStart: string }>(({ weekStart }) => retro(weekStart, [JIHOON, brief('3', '이민수', 'minsu-lee')])))
    .on(
      'createExemptionPeriod',
      adminOnly<{ input: { weekStart: string; reason: string } }>(({ input }) => {
        if (ew.periods.some((p) => p.weekStart === input.weekStart)) throw backendError('EXEMPTION_PERIOD_DUPLICATE');
        const p = { id: String(nextId++), weekStart: input.weekStart, reason: input.reason };
        ew.periods.push(p);
        return periodOut(p);
      }),
    )
    .on(
      'updateExemptionPeriod',
      adminOnly<{ id: string; input: { weekStart: string; reason: string } }>(({ id, input }) => {
        const p = ew.periods.find((x) => x.id === String(id));
        if (!p) throw backendError('NOT_FOUND');
        Object.assign(p, input);
        return periodOut(p);
      }),
    )
    .on(
      'deleteExemptionPeriod',
      adminOnly<{ id: string }>(({ id }) => {
        ew.periods = ew.periods.filter((x) => x.id !== String(id));
        return true;
      }),
    )
    .on(
      'personalExemptionRequests',
      adminOnly<{ status?: string }>(({ status = 'PENDING' }) => ({ items: ew.requests.filter((r) => r.status === status).map(requestOut), nextCursor: null })),
    )
    .on('previewPersonalExemptionApproval', adminOnly<{ id: string }>(({ id }) => {
      const r = findRequest(id);
      return retro(r.weekStart, [r.member]);
    }))
    .on('approvePersonalExemption', adminOnly<{ id: string }>(({ id }) => {
      const r = findRequest(id);
      r.status = 'APPROVED';
      return requestOut(r);
    }))
    .on('rejectPersonalExemption', adminOnly<{ id: string; reason: string }>(({ id, reason }) => {
      if (!String(reason ?? '').trim()) throw backendError('REJECT_REASON_REQUIRED');
      const r = findRequest(id);
      Object.assign(r, { status: 'REJECTED', rejectReason: reason });
      return requestOut(r);
    }));
  return ew;
}
