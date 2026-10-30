/**
 * 주간 활동 · 판정 · 경고 픽스처 (F18). 백엔드 judgment · warning · warning-history.graphqls 모양.
 * 기준 시각은 TEST_NOW(2026-10-01 목 10:00 KST) — 이번 주 9/28 ~ 10/4.
 */
import { addDays } from '@/shared/lib/kst';
import { backend, backendError } from '../backend';

export const THIS_WEEK = '2026-09-28';
/** 이번 주 잔디 갱신 기준 (오늘 오전 6시) */
export const GRASS_FETCHED_AT = '2026-10-01T06:00:00+09:00';

type Day = { date: string; hasGrass: boolean | null; grassCount: number | null; hasRecord: boolean; recordCount: number | null };

/** 이번 주 하루 (잔디 칸 수 · 기록글 수를 안다) */
const liveDay = (date: string, grass: number, records = 0): Day => ({
  date,
  hasGrass: grass > 0,
  grassCount: grass,
  hasRecord: records > 0,
  recordCount: records,
});
/** 아직 오지 않은 날 */
const futureDay = (date: string): Day => ({ date, hasGrass: null, grassCount: null, hasRecord: false, recordCount: 0 });
/** 판정이 끝난 주의 하루 (칸 수 · 글 수는 저장하지 않는다) */
const judgedDay = (date: string, grass: boolean, record: boolean): Day => ({
  date,
  hasGrass: grass,
  grassCount: null,
  hasRecord: record,
  recordCount: null,
});

type Judgment = {
  status: 'PASS' | 'FAIL' | 'EXEMPT' | 'EXCLUDED' | 'HOLD';
  skipReason: string | null;
  holdReason: string | null;
  verifiedDays: number | null;
  recordCount: number | null;
  corrected: boolean;
  judgedAt: string | null;
};

const judgment = (status: Judgment['status'], verifiedDays: number | null, recordCount: number | null, skipReason: string | null = null) => ({
  status,
  skipReason,
  holdReason: null,
  verifiedDays,
  recordCount,
  corrected: false,
});

/** 이번 주 myWeeklyActivity — 한동관: 월 잔디 3 · 화 잔디 1 + 기록글 1 · 인증일 2/3 · 기록글 1/1 */
export function currentWeek(o: Partial<Record<string, unknown>> = {}) {
  return {
    weekStart: THIS_WEEK,
    weekEnd: addDays(THIS_WEEK, 6),
    currentWeek: true,
    inTeam: true,
    days: [
      liveDay('2026-09-28', 3),
      liveDay('2026-09-29', 1, 1),
      liveDay('2026-09-30', 0),
      liveDay('2026-10-01', 0),
      futureDay('2026-10-02'),
      futureDay('2026-10-03'),
      futureDay('2026-10-04'),
    ],
    verifiedDays: 2,
    recordCount: 1,
    requiredVerifiedDays: 3,
    requiredRecordCount: 1,
    passExpected: false,
    grassAvailable: true,
    grassFetchedAt: GRASS_FETCHED_AT,
    banner: null,
    judgment: null,
    ...o,
  };
}

/** 판정이 끝난 지난 주 (판정 때 저장한 값) */
function pastWeek(weekStart: string, marks: [boolean, boolean][], j: Judgment) {
  return {
    weekStart,
    weekEnd: addDays(weekStart, 6),
    currentWeek: false,
    inTeam: true,
    days: marks.map(([g, r], i) => judgedDay(addDays(weekStart, i), g, r)),
    verifiedDays: j.verifiedDays,
    recordCount: j.recordCount ?? 0,
    requiredVerifiedDays: 3,
    requiredRecordCount: 1,
    passExpected: null,
    grassAvailable: true,
    grassFetchedAt: null,
    banner: null,
    judgment: j,
  };
}

const NONE: [boolean, boolean] = [false, false];

/** 9/21 주: 통과 (월 · 화 · 목 · 토 인증, 기록글 1) */
export const WEEK_0921 = pastWeek(
  '2026-09-21',
  [[true, true], [true, false], NONE, [true, false], NONE, [true, false], NONE],
  { ...judgment('PASS', 4, 1), judgedAt: '2026-09-28T07:00:00+09:00' },
);
/** 9/14 주: 미달 (인증 1일, 기록글 0) */
export const WEEK_0914 = pastWeek(
  '2026-09-14',
  [NONE, NONE, [true, false], NONE, NONE, NONE, NONE],
  { ...judgment('FAIL', 1, 0), judgedAt: '2026-09-21T07:00:00+09:00' },
);

/** myWeeklyActivity(weekStart) — null이면 이번 주, 모르는 주는 실서버처럼 INVALID_INPUT */
export function weeklyActivity(current = currentWeek()) {
  const weeks: Record<string, unknown> = { [WEEK_0921.weekStart]: WEEK_0921, [WEEK_0914.weekStart]: WEEK_0914 };
  return ({ weekStart }: Record<string, unknown>) => {
    if (weekStart == null || weekStart === THIS_WEEK) return current;
    const w = weeks[String(weekStart)];
    if (!w) throw backendError('INVALID_INPUT');
    return w;
  };
}

const historyItem = (weekStart: string, j: ReturnType<typeof judgment>) => ({ weekStart, weekEnd: addDays(weekStart, 6), ...j });

/** myJudgmentHistory — 한동관: 통과 · 미달 · 면제 · 통과 · 첫 참가 */
export const MEMBER_JUDGMENT_HISTORY = [
  historyItem('2026-09-21', judgment('PASS', 4, 1)),
  historyItem('2026-09-14', judgment('FAIL', 1, 0)),
  historyItem('2026-09-07', judgment('EXEMPT', null, null, 'EXEMPTION_PERIOD')),
  historyItem('2026-08-31', judgment('PASS', 3, 2)),
  historyItem('2026-08-24', judgment('EXCLUDED', null, null, 'FIRST_WEEK')),
];

export const judgmentHistory = (items = MEMBER_JUDGMENT_HISTORY) => ({ items, nextCursor: null });

/** myWarningSummary */
export const warningSummary = (warningCount: number, streak: number, penaltyTarget = warningCount >= 3) => ({
  onHold: false,
  holdWeeks: [],
  warningCount,
  streak,
  penaltyTarget,
  penaltyReachedWeek: penaltyTarget ? '2026-09-14' : null,
});
export const MEMBER_WARNINGS = warningSummary(1, 1);
export const PENALTY_WARNINGS = warningSummary(3, 0);
export const NO_WARNINGS = warningSummary(0, 0);

/** myWarningHistory 한 행 */
export const warningItem = (
  weekStart: string,
  categories: string[],
  status: 'ACTIVE' | 'DEDUCTED' | 'FULFILLED',
  verifiedDays: number | null = 1,
  recordCount: number | null = 0,
) => ({ weekStart, weekEnd: addDays(weekStart, 6), verifiedDays, recordCount, categories, status });

/** 한동관 경고 이력: 9/14 유효(공개 팀 + 비공개 팀) · 7/13 차감됨 */
export const MEMBER_WARNING_HISTORY = [
  warningItem('2026-09-14', ['사이드 프로젝트 A팀', '비공개 팀'], 'ACTIVE'),
  warningItem('2026-07-13', ['웹 프로젝트 B팀'], 'DEDUCTED', 2, 0),
];

export const warningHistory = (items = MEMBER_WARNING_HISTORY) => ({ onHold: false, items, nextCursor: null });

/** 내 주간 활동 화면(AC-01) 한 벌 — 이번 주 · 지난 주 · 판정 이력 · 공지 */
export function installActivity() {
  backend.on('myWeeklyActivity', weeklyActivity()).on('myJudgmentHistory', judgmentHistory());
}
