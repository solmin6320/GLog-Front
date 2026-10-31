/**
 * AD-01 ②-3 면제 관리 표시 규칙 (순수 함수 · 문구). 경고 수 · 소급 여부는 서버 값만 그린다.
 */
import type {
  AdminExemptionsApprovalPreviewQueryQuery,
  AdminExemptionsPeriodPreviewQueryQuery,
  AdminExemptionsPeriodsQueryQuery,
  AdminExemptionsRequestsQueryQuery,
} from '@/gql/graphql';
import { formatWeekRange } from '@/shared/lib/format';
import { addDays, type DateString } from '@/shared/lib/kst';

export type PeriodRow = AdminExemptionsPeriodsQueryQuery['exemptionPeriods']['nodes'][number];
export type RequestRow = AdminExemptionsRequestsQueryQuery['personalExemptionRequests']['nodes'][number];
export type PeriodPreview = AdminExemptionsPeriodPreviewQueryQuery['exemptionPeriodPreview'];
export type ApprovalPreview = NonNullable<AdminExemptionsApprovalPreviewQueryQuery['personalExemptionApprovalPreview']>;

/** 면제 기간 사유 · 거절 사유 최대 길이 (schema ExemptionPeriodInput.reason · rejectPersonalExemption.reason) */
export const PERIOD_REASON_MAX = 200;
export const REJECT_REASON_MAX = 500;

export const COPY = {
  title: '면제 관리',
  pending: (n: number) => `대기 중인 요청 ${n}건`,
  register: '면제 기간 등록',

  periodsTitle: '전체 면제 기간',
  /** ACC-ADM-04 '전체 회원 적용' 안내 */
  periodsHint: '모든 회원에게 적용 · 주 단위',
  /** E-45 */
  retroNote: '지난 주간을 등록하거나 지우면 그 주 이후 모든 주차의 연속 통과와 경고 차감이 다시 계산돼요. 반영 전에 재계산 미리보기를 보여 드려요.',
  pastWeek: '지난 주간',

  requestsTitle: '개인 면제 요청',
  /** 기능명세서 7장 — 판정은 사람 단위라 모든 팀에 적용. ACC-ADM-07 — 팀 이름은 보이지 않는다 */
  requestsHint: '승인하면 그 회원이 속한 모든 팀에서 그 주 판정이 빠져요. 요청한 팀 이름은 표시하지 않아요.',
  /** E-44 */
  overlaps: '이 주간은 이미 면제 기간이에요. 따로 승인하지 않아도 돼요.',

  /** 5-4-9 · ACC-ADM-11 */
  emptyAll: '면제 기간과 대기 중인 요청이 없어요.',
  showHandled: '처리한 요청 보기',
  emptyPeriods: '등록된 면제 기간이 없어요.',
  emptyRequests: '대기 중인 요청이 없어요.',
  emptyApproved: '승인한 요청이 없어요.',
  emptyRejected: '거절한 요청이 없어요.',

  created: '등록했어요.',
  updated: '저장했어요.',
  deleted: '삭제했어요.',
  approved: '승인했어요.',
  rejected: '거절했어요.',
  duplicate: '이미 면제 기간으로 등록된 주간이에요.',
  gone: '이미 처리됐거나 없는 항목이에요.',

  /** 영향 미리보기형 (공통 요소) */
  previewFailed: '미리보기를 불러오지 못했어요.',
  retroLead: '판정이 끝난 주간이라 그 주 이후 모든 주차의 연속 통과와 경고 차감이 다시 계산돼요.',
  /** E-45 (M-14 해요체) */
  approveRetroLead: '이 회원의 이후 경고가 다시 계산돼요. 진행할까요?',
  affected: (n: number) => `판정이 바뀌는 회원 ${n}명`,
  /** 판정이 바뀌어도 경고 수가 그대로인 회원(통과 → 면제 등)은 목록에 넣지 않는다 */
  changedCaption: (n: number) => `그중 경고 수나 벌칙 대상이 바뀌는 회원 ${n}명`,
  noChange: '경고 수나 벌칙 대상이 바뀌는 회원은 없어요.',
  /** E-58 · E-59 */
  frozen: '이미 벌칙을 이행한 주간이에요. 기록만 고치고 경고 수는 그대로 둬요.',
} as const;

/** 고를 수 있는 주: 지난 8주 ~ 앞으로 16주 (월 ~ 일 단위만, ACC-ADM-04) */
export const WEEKS_BACK = 8;
export const WEEKS_AHEAD = 16;

/**
 * 주 선택지. 서버 clock의 이번 주 기준이다. 수정 중인 기간의 주가 범위 밖이어도 빠지지 않게 include로 넣는다.
 * '지난 주간' 표시는 안내일 뿐이고, 판정이 끝났는지(소급)는 미리보기의 isRetroactive가 정한다.
 */
export function weekOptions(currentWeekStart: DateString, include?: DateString): { value: string; label: string }[] {
  const weeks = new Set<string>();
  for (let i = -WEEKS_BACK; i <= WEEKS_AHEAD; i++) weeks.add(addDays(currentWeekStart, i * 7));
  if (include) weeks.add(include);
  return [...weeks].sort().map((w) => ({
    value: w,
    label: `${formatWeekRange(w)}${w === currentWeekStart ? ' (이번 주)' : w < currentWeekStart ? ` (${COPY.pastWeek})` : ''}`,
  }));
}

/** ACC-ADM-07 "{요청 팀장} → {대상 회원}" */
export function requestLine(r: Pick<RequestRow, 'requestedBy' | 'member'>): string {
  return `${r.requestedBy.nickname} → ${r.member.nickname}`;
}

/**
 * 면제 기간 · 개인 면제를 반영한 뒤 다시 부를 쿼리 (요구사항 S-8). 이 화면에 떠 있는 것만 적는다 —
 * 소급으로 바뀌는 대시보드 판정은 기본 정책(cache-and-network)이라 다시 열 때 새로 받는다.
 */
export function exemptionsRefetch(): string[] {
  return ['AdminExemptionsPeriodsQuery', 'AdminExemptionsRequestsQuery', 'AdminExemptionsSummaryQuery', 'AdminLayoutCountsQuery'];
}
