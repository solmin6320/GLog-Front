import { graphql } from '@/gql';

/**
 * AD-01 ②-0 대시보드 + 판정 정정 패널 + 보류 재시도 (화면설계서 5-1-10, 목업 W-15). 연산 이름은 `AdminDashboard*`.
 * 재계산 조작(정정 · 보류 재시도)은 부분 패치하지 않고 dashboardRefetch()를 다시 부른다 (설계서 3-6, awaitRefetchQueries).
 */

/** ⑤ 처리 대기 요약 4칸 + ⑧⑨ 사람이 처리해야 하는 보류 (주차 무관, 오래된 순 20개) */
export const AdminDashboardSummaryQuery = graphql(`
  query AdminDashboardSummaryQuery {
    adminDashboardSummary {
      judgedWeekStart
      pendingMembers
      failedMembers
      penaltyTargets
      pendingExemptions
    }
    adminJudgmentHolds {
      items {
        member {
          id
          nickname
        }
        weekStart
        reason
        retryCount
        retriesExhausted
      }
      nextCursor
      totalCount
      identityMismatchCount
    }
  }
`);

/** ⑥⑦ 한 주차의 판정 결과. weekStart 생략 = 직전 주(이번 월요일 판정의 대상). 20행씩 */
export const AdminDashboardWeekQuery = graphql(`
  query AdminDashboardWeekQuery($weekStart: String, $filter: AdminJudgmentFilter, $keyword: String, $after: String) {
    adminJudgments(weekStart: $weekStart, filter: $filter, keyword: $keyword, after: $after) {
      weekStart
      weekEnd
      executedAt
      passCount
      failCount
      exemptCount
      firstWeekCount
      holdCount
      items {
        judgmentId
        member {
          id
          nickname
          githubLogin
        }
        status
        skipReason
        holdReason
        verifiedDays
        recordCount
        warningCount
        corrected
        manualHold
      }
      nextCursor
    }
  }
`);

/** ⑩ 재계산 미리보기 — 계산만 한다. 정정할 수 없는 조합이면 JUDGMENT_NOT_CORRECTABLE */
export const AdminDashboardCorrectionPreviewQuery = graphql(`
  query AdminDashboardCorrectionPreviewQuery($judgmentId: ID!, $status: AdminCorrectionStatus!) {
    previewJudgmentCorrection(judgmentId: $judgmentId, status: $status) {
      judgmentId
      currentStatus
      targetStatus
      impact {
        onHold
        warningCountBefore
        warningCountAfter
        entersPenalty
        leavesPenalty
        recordOnly
        affectedWeeks
      }
    }
  }
`);

/** ⑩ [정정하고 재계산]. expectedStatus가 지금 판정과 다르면 JUDGMENT_CHANGED. 결과로 부분 패치하지 않는다 */
export const AdminDashboardCorrectJudgment = graphql(`
  mutation AdminDashboardCorrectJudgment($input: JudgmentCorrectionInput!) {
    correctJudgment(input: $input) {
      judgmentId
      status
      warningCount
      penaltyTarget
    }
  }
`);

/** ⑦ [재시도] — 보류 한 건 */
export const AdminDashboardRetryHold = graphql(`
  mutation AdminDashboardRetryHold($memberId: ID!, $weekStart: String!) {
    retryJudgmentHold(memberId: $memberId, weekStart: $weekStart) {
      status
      resolved
    }
  }
`);

/** ⑨ [전체 재시도] — 사람이 처리해야 하는 보류 전부 (E-35) */
export const AdminDashboardRetryAllHolds = graphql(`
  mutation AdminDashboardRetryAllHolds {
    retryAllJudgmentHolds {
      attempted
      resolved
      stillHold
      failed
    }
  }
`);

/** 재계산 조작 뒤 다시 부를 조회 (판정 목록 · 요약 카드 · 메뉴 배지). 새 배열로 넘긴다(readonly 금지) */
export function dashboardRefetch(): string[] {
  return ['AdminDashboardWeekQuery', 'AdminDashboardSummaryQuery', 'AdminLayoutCountsQuery'];
}
