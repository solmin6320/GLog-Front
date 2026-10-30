/**
 * 백엔드 WeeklyActivity(judgment.graphqls) → 화면용 주간 모델.
 * 판정은 서버가 한다 — 여기서는 서버 값(passExpected · banner · inTeam)으로 진행 상태 이름만 고르고,
 * 오늘 · 앞으로 올 날은 세션 시계(today)로 표시한다.
 */
export type ActivityDayInput = {
  date: string;
  hasGrass?: boolean | null;
  grassCount?: number | null;
  hasRecord: boolean;
  recordCount?: number | null;
};

export type WeeklyActivityInput = {
  weekStart: string;
  currentWeek: boolean;
  inTeam: boolean;
  days: ActivityDayInput[];
  verifiedDays?: number | null;
  recordCount: number;
  requiredVerifiedDays: number;
  requiredRecordCount: number;
  passExpected?: boolean | null;
  grassAvailable: boolean;
  grassFetchedAt?: string | null;
  banner?: string | null;
  judgment?: { status: string; skipReason?: string | null } | null;
};

export type WeekDayView = {
  date: string;
  grassCount: number | null;
  grassLevel: number | null;
  hasGrass: boolean;
  recordCount: number | null;
  hasRecord: boolean;
  verified: boolean;
  isFuture: boolean;
  isToday: boolean;
};

export type LiveView = { status: string; skipReason: string | null; verifiedDaysNeeded: number; recordsNeeded: number };

export type WeekView = {
  weekStart: string;
  isCurrentWeek: boolean;
  days: WeekDayView[];
  verifiedDays: number | null;
  recordCount: number;
  /** 이번 주를 볼 때만. CONDITION_MET · NOT_YET · EXEMPT · EXCLUDED */
  live: LiveView | null;
  judgment: { status: string; skipReason: string | null } | null;
  /** 잔디 캐시가 없으면 FAILED (E-32) */
  grassStatus: 'OK' | 'FAILED';
  grassUpdatedAt: string | null;
  privateContributionSuspected: boolean;
};

/** 이번 주 잔디 칸 색 단계 — 기여 수를 그대로 0~4로 */
const levelOf = (count: number) => Math.max(0, Math.min(4, count));

function liveOf(w: WeeklyActivityInput): LiveView | null {
  if (!w.currentWeek || w.judgment) return null;
  const verifiedDaysNeeded = Math.max(0, w.requiredVerifiedDays - (w.verifiedDays ?? 0));
  const recordsNeeded = Math.max(0, w.requiredRecordCount - w.recordCount);
  const base = { verifiedDaysNeeded, recordsNeeded };
  if (!w.inTeam) return { ...base, status: 'EXCLUDED', skipReason: 'NO_TEAM' };
  if (w.banner === 'FIRST_WEEK') return { ...base, status: 'EXCLUDED', skipReason: 'FIRST_WEEK' };
  if (w.banner === 'EXEMPTION_WEEK') return { ...base, status: 'EXEMPT', skipReason: 'EXEMPTION_PERIOD' };
  return { ...base, status: w.passExpected ? 'CONDITION_MET' : 'NOT_YET', skipReason: null };
}

export function toWeekView(w: WeeklyActivityInput, today: string): WeekView {
  return {
    weekStart: w.weekStart,
    isCurrentWeek: w.currentWeek,
    days: w.days.map((d) => {
      const isFuture = d.date > today;
      const grassCount = isFuture ? null : (d.grassCount ?? null);
      const hasGrass = !isFuture && !!d.hasGrass;
      return {
        date: d.date,
        grassCount,
        grassLevel: grassCount == null ? null : levelOf(grassCount),
        hasGrass,
        recordCount: isFuture ? null : (d.recordCount ?? null),
        hasRecord: !isFuture && d.hasRecord,
        verified: !isFuture && (hasGrass || d.hasRecord),
        isFuture,
        isToday: d.date === today,
      };
    }),
    verifiedDays: w.verifiedDays ?? null,
    recordCount: w.recordCount,
    live: liveOf(w),
    judgment: w.judgment ? { status: w.judgment.status, skipReason: w.judgment.skipReason ?? null } : null,
    grassStatus: w.grassAvailable ? 'OK' : 'FAILED',
    grassUpdatedAt: w.grassFetchedAt ?? null,
    privateContributionSuspected: w.banner === 'CONTRIBUTIONS_HIDDEN',
  };
}

/** 백엔드 WarningSummary → 화면용 경고 상태. 다음 차감까지 남은 주는 연속 통과(2주 기준)로 센다 (E-41) */
export type WarningSummaryInput = {
  onHold: boolean;
  warningCount?: number | null;
  streak?: number | null;
  penaltyTarget?: boolean | null;
};

export type WarningStateView = {
  onHold: boolean;
  activeCount: number;
  isPenaltyTarget: boolean;
  consecutivePasses: number;
  /** 벌칙 대상이거나 경고 0이면 null */
  weeksUntilDeduction: number | null;
};

const DEDUCT_AFTER_PASSES = 2;

export function toWarningState(s: WarningSummaryInput): WarningStateView {
  const activeCount = s.warningCount ?? 0;
  const isPenaltyTarget = !!s.penaltyTarget;
  const consecutivePasses = s.streak ?? 0;
  return {
    onHold: s.onHold,
    activeCount,
    isPenaltyTarget,
    consecutivePasses,
    weeksUntilDeduction: activeCount > 0 && !isPenaltyTarget ? Math.max(0, DEDUCT_AFTER_PASSES - consecutivePasses) : null,
  };
}
