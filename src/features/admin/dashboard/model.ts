/**
 * 대시보드 표시 규칙 (순수 함수). 판정 · 경고 계산은 서버 값만 쓴다 — 여기서는 라벨 · 문구 · 주차 목록만 만든다.
 */
import type {
  AdminDashboardCorrectionPreviewQueryQuery,
  AdminDashboardSummaryQueryQuery,
  AdminDashboardWeekQueryQuery,
  AdminJudgmentFilter,
  CorrectableJudgmentStatus,
  PenaltyChange,
} from '@/gql/graphql';
import { formatMD, formatWeekRange } from '@/shared/lib/format';
import { addDays } from '@/shared/lib/kst';
import type { AdminResultParam } from '@/shared/lib/paths';

export type JudgmentRow = AdminDashboardWeekQueryQuery['adminJudgmentWeek']['rows']['nodes'][number];
export type HeldRow = AdminDashboardSummaryQueryQuery['heldJudgments'][number];
export type DashboardSummary = AdminDashboardSummaryQueryQuery['adminDashboardSummary'];
export type CorrectionPreview = AdminDashboardCorrectionPreviewQueryQuery['judgmentCorrectionPreview'];

/** 판정 목록 한 번에 20행 (E-57) */
export const JUDGMENT_PAGE_SIZE = 20;
/** 주차 셀렉트: 이번 주 + 지난 12주 */
export const PAST_WEEK_OPTIONS = 12;
/** 정정 사유 최대 길이 (DB 1-14 VARCHAR(500), ACC-FIX-06) */
export const CORRECTION_REASON_MAX = 500;
/** ⑨ 보류 안내에 이름을 보여 주는 최대 수 */
export const HELD_NAMES_MAX = 5;

export const RESULT_FILTER: Record<AdminResultParam, AdminJudgmentFilter> = { all: 'ALL', fail: 'FAIL', hold: 'HOLD' };

export const RESULT_OPTIONS: { value: AdminResultParam; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'fail', label: '미달만' },
  { value: 'hold', label: '보류만' },
];

/** 정정으로 만들 수 있는 결과 3종 (기능명세서 7장 — '제외' 없음, Q-05) */
export const CORRECTABLE: readonly CorrectableJudgmentStatus[] = ['PASS', 'FAIL', 'EXEMPT'];

export const CORRECT_TO_LABEL: Record<CorrectableJudgmentStatus, string> = {
  PASS: '통과로 정정',
  FAIL: '미달로 정정',
  EXEMPT: '면제로 정정',
};

export const PENALTY_CHANGE_LABEL: Record<PenaltyChange, string> = { RELEASE: '해제', ENTER: '진입', NONE: '변화 없음' };

export const COPY = {
  /** AD-01 ⑩ 안내 (W-15) */
  previewHint: '아직 아무것도 바뀌지 않았어요. 아래 버튼을 눌러야 반영돼요.',
  /** E-58 (M-14 해요체) */
  frozen: '이미 벌칙을 이행한 주간이에요. 기록만 고치고 경고 수는 그대로 둬요.',
  /** E-50 (M-14 해요체) */
  released: '이 회원은 벌칙 대상에서 빠져요.',
  entered: '이 회원은 벌칙 대상이 돼요.',
  corrected: '정정했어요.',
  notCorrectable: '보류 중인 판정은 정정할 수 없어요.',
  notCorrectableNow: '이 판정은 지금 정정할 수 없어요.',
  /** E-32 관리자 문구 */
  heldApi: 'GitHub 응답 실패로 아직 판정하지 못했어요.',
  /** E-08 관리자 문구 (AD-01 ⑨) */
  heldIdentity: '본인이 다시 로그인해야 풀려요.',
  /** 5-4-9 */
  noTasks: '지금 처리할 일이 없어요.',
  emptyWeek: '이 주간의 판정 결과가 없어요.',
  emptyFiltered: '조건에 맞는 판정이 없어요.',
} as const;

/** E-49 (M-14 해요체): '경고가 3개에서 2개로 바뀌어요.' / 같으면 '경고 수는 2개 그대로예요.' */
export function warningChangeText(before: number, after: number): string {
  return before === after ? `경고 수는 ${after}개 그대로예요.` : `경고가 ${before}개에서 ${after}개로 바뀌어요.`;
}

export function penaltyChangeText(change: PenaltyChange): string | null {
  if (change === 'RELEASE') return COPY.released;
  if (change === 'ENTER') return COPY.entered;
  return null;
}

/** '9/21 ~ 9/27 (지난 주)' */
export function weekOptionLabel(weekStart: string, currentWeekStart: string): string {
  const range = formatWeekRange(weekStart);
  if (weekStart === currentWeekStart) return `${range} (이번 주)`;
  if (weekStart === addDays(currentWeekStart, -7)) return `${range} (지난 주)`;
  return range;
}

/** 이번 주 + 지난 12주(최신순). 범위 밖의 주(가장 최근 판정 주 · URL로 고른 주)는 끼워 넣는다. 미래 주는 뺀다 */
export function weekOptions(currentWeekStart: string, include: (string | null | undefined)[] = []): { value: string; label: string }[] {
  const weeks = new Set<string>();
  for (let i = 0; i <= PAST_WEEK_OPTIONS; i += 1) weeks.add(addDays(currentWeekStart, -7 * i));
  for (const w of include) if (w && w <= currentWeekStart) weeks.add(w);
  return [...weeks].sort((a, b) => b.localeCompare(a)).map((w) => ({ value: w, label: weekOptionLabel(w, currentWeekStart) }));
}

/** ⑤ 두 번째 카드 라벨 (M-07): 가장 최근 판정 주가 지난 주면 '지난 주 미달', 아니면 '9/14 주 미달' */
export function failKpiLabel(latestJudgedWeekStart: string | null | undefined, currentWeekStart: string): string {
  if (!latestJudgedWeekStart || latestJudgedWeekStart === addDays(currentWeekStart, -7)) return '지난 주 미달';
  return `${formatMD(latestJudgedWeekStart)} 주 미달`;
}

/** 판정이 아직 없는 주의 안내 (5-4-9). 지난 주 · 이번 주는 '월요일 오전에 실행', 그보다 오래된 주는 결과 없음 */
export function notExecutedText(weekStart: string, currentWeekStart: string): string {
  if (weekStart === currentWeekStart) return '이번 주 판정은 월요일 오전에 실행돼요.';
  if (weekStart === addDays(currentWeekStart, -7)) return '지난 주 판정은 월요일 오전에 실행돼요.';
  return COPY.emptyWeek;
}

/** E-35 토스트: '{n}명 처리했어요.' */
export function rerunToast(processedCount: number): string {
  return processedCount > 0 ? `${processedCount}명 처리했어요.` : '다시 판정할 수 있는 보류가 없어요.';
}

/** 인증일 · 기록글 칸 ('—' = 면제 · 제외 · 보류) */
export const daysText = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${n}일`);
export const recordsText = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${n}개`);
