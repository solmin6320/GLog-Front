/**
 * 프로필(PR-01) 픽스처 (F18). 백엔드 profile · profile-history · profile-warning.graphqls 모양.
 * `profile(memberId)` 하나가 기본 정보 · 잔디 · 경고 · 팀별 경고 · 판정 이력을 모두 준다(중첩 필드).
 * 판정 이력의 커서(after)는 중첩 인자라 요청 변수(ctx.vars.after)에서 읽는다.
 */
import { addDays } from '@/shared/lib/kst';
import { backend, backendError, type BackendCtx } from '../backend';
import { PERSONAS, type TestPersona } from '../personas';

export type ProfileWeek = { weekStart: string; weekEnd: string; result: 'PASS' | 'FAIL' | 'EXEMPT' | 'EXCLUDED' | 'IN_PROGRESS'; verifiedDays: number | null; recordCount: number | null };
export type ProfileFx = {
  id: string;
  nickname: string;
  githubLogin: string;
  profileImageUrl: string | null;
  postCount: number;
  commentCount: number;
  grass: { fetchedAt: string; totalContributions: number; days: { date: string; count: number }[] } | null;
  warning: { onHold: boolean; warningCount: number | null; penaltyTarget: boolean | null };
  teams: { id: string; name: string }[];
  teamWarnings: { onHold: boolean; teams: { name: string; count: number }[] };
  history: ProfileWeek[];
};

const week = (weekStart: string, result: ProfileWeek['result'], verifiedDays: number | null, recordCount: number | null): ProfileWeek => ({
  weekStart,
  weekEnd: addDays(weekStart, 6),
  result,
  verifiedDays,
  recordCount,
});

/** 1년치 잔디 (오늘 오전 6시 갱신) */
const grassYear = () => ({
  fetchedAt: '2026-10-01T06:00:00',
  totalContributions: 120,
  days: Array.from({ length: 365 }, (_, i) => ({ date: addDays('2025-10-02', i), count: i % 3 === 0 ? 2 : i % 7 === 0 ? 5 : 0 })),
});

const base = (p: TestPersona) => ({ id: p.id, nickname: p.nickname, githubLogin: p.githubLogin, profileImageUrl: p.profileImageUrl });

/** 한동관(1) · 김철수(2) · 박지훈(6) — 목업 W-14 값 */
export function profiles(): Record<string, ProfileFx> {
  return {
    '1': {
      ...base(PERSONAS.member),
      postCount: 12,
      commentCount: 34,
      grass: grassYear(),
      warning: { onHold: false, warningCount: 1, penaltyTarget: false },
      teams: [{ id: '1', name: '사이드 프로젝트 A팀' }],
      teamWarnings: { onHold: false, teams: [{ name: '사이드 프로젝트 A팀', count: 1 }, { name: '비공개 팀', count: 1 }] },
      history: [
        week('2026-09-28', 'IN_PROGRESS', 2, 1),
        week('2026-09-21', 'PASS', 4, 1),
        week('2026-09-14', 'FAIL', 1, 0),
        week('2026-09-07', 'EXEMPT', null, null),
        week('2026-08-31', 'PASS', 3, 2),
        week('2026-08-24', 'EXCLUDED', null, null),
      ],
    },
    '2': {
      ...base(PERSONAS.plain),
      postCount: 5,
      commentCount: 8,
      grass: grassYear(),
      warning: { onHold: false, warningCount: 0, penaltyTarget: false },
      teams: [{ id: '1', name: '사이드 프로젝트 A팀' }],
      teamWarnings: { onHold: false, teams: [] },
      history: [week('2026-09-28', 'IN_PROGRESS', 3, 1), week('2026-09-21', 'PASS', 4, 2), week('2026-09-14', 'PASS', 3, 1)],
    },
    '6': {
      ...base(PERSONAS.penalty),
      postCount: 1,
      commentCount: 0,
      grass: grassYear(),
      warning: { onHold: false, warningCount: 3, penaltyTarget: true },
      // 박지훈의 소속 팀은 비공개 팀뿐 → 서버가 공개 팀만 준다
      teams: [],
      teamWarnings: { onHold: false, teams: [{ name: '비공개 팀', count: 3 }, { name: '사이드 프로젝트 A팀', count: 2 }] },
      history: [week('2026-09-28', 'IN_PROGRESS', 0, 0), week('2026-09-21', 'FAIL', 0, 0)],
    },
  };
}

export { week as profileWeek };

/** profile(memberId) — 없는 회원은 NOT_FOUND. 판정 이력은 20개씩(첫 페이지 맨 위 IN_PROGRESS는 세지 않음) */
export function installProfiles(all: Record<string, ProfileFx> = profiles()) {
  backend.on('profile', ({ memberId }: Record<string, unknown>, ctx: BackendCtx) => {
    const p = all[String(memberId)];
    if (!p) throw backendError('NOT_FOUND');
    const after = typeof ctx.vars.after === 'string' ? Number(ctx.vars.after) : 0;
    const progress = p.history.filter((h) => h.result === 'IN_PROGRESS');
    const done = p.history.filter((h) => h.result !== 'IN_PROGRESS');
    const page = done.slice(after, after + 20);
    const { history: _h, ...rest } = p;
    return {
      ...rest,
      isMine: ctx.viewer?.id === p.id,
      judgmentHistory: { items: after ? page : [...progress, ...page], nextCursor: after + 20 < done.length ? String(after + 20) : null },
    };
  });
  return all;
}
