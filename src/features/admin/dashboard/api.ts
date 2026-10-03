import { graphql } from '@/gql';

/**
 * AD-01 ②-0 대시보드 + 판정 정정 패널 + 보류 재시도 (화면설계서 5-1-10, 목업 W-15). 연산 이름은 `AdminDashboard*`.
 * 재계산 조작(정정 · 보류 재시도)은 부분 패치하지 않고 DASHBOARD_REFETCH를 다시 부른다 (설계서 3-6, awaitRefetchQueries).
 */

/** ⑤ 처리 대기 요약 4칸 + ⑧⑨ 보류(주차 무관 미해결 전부) */
export const AdminDashboardSummaryQuery = graphql(`
  query AdminDashboardSummaryQuery {
    adminDashboardSummary {
      pendingMemberCount
      latestWeekFailCount
      latestJudgedWeekStart
      penaltyTargetCount
      pendingExemptionRequestCount
      heldJudgmentCount
    }
    heldJudgments {
      judgment {
        id
        weekStart
        weekEnd
        status
        holdReason
      }
      member {
        id
        nickname
      }
      canRetry
    }
  }
`);

/** ⑥⑦ 한 주차의 판정 결과. weekStart 생략 = 가장 최근 판정 주 (M-07). 목록은 usePagedList(first · after) */
export const AdminDashboardWeekQuery = graphql(`
  query AdminDashboardWeekQuery($weekStart: Date, $filter: AdminJudgmentFilter, $search: String, $first: Int, $after: String) {
    adminJudgmentWeek(weekStart: $weekStart) {
      weekStart
      weekEnd
      executedAt
      counts {
        pass
        fail
        exempt
        firstWeek
        hold
      }
      rows(filter: $filter, search: $search, first: $first, after: $after) {
        nodes {
          judgment {
            id
            weekStart
            weekEnd
            status
            skipReason
            holdReason
            verifiedDays
            recordCount
            corrected
          }
          member {
            id
            nickname
            githubLogin
            profileImageUrl
          }
          activeWarningCount
          isPenaltyTarget
          canRetry
          canCorrect
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`);

/** ⑩ 재계산 미리보기 — 조회만 한다. 반영할 때 basis를 expectedBasis로 돌려준다 */
export const AdminDashboardCorrectionPreviewQuery = graphql(`
  query AdminDashboardCorrectionPreviewQuery($judgmentId: ID!, $newStatus: CorrectableJudgmentStatus!) {
    judgmentCorrectionPreview(judgmentId: $judgmentId, newStatus: $newStatus) {
      warningCountBefore
      warningCountAfter
      penaltyChange
      affectedWeekCount
      frozenByFulfillment
      basis
    }
  }
`);

/** ⑩ [정정하고 재계산]. 결과로 부분 패치하지 않는다 — DASHBOARD_REFETCH */
export const AdminDashboardCorrectJudgment = graphql(`
  mutation AdminDashboardCorrectJudgment($input: CorrectJudgmentInput!) {
    correctJudgment(input: $input) {
      member {
        id
      }
      judgment {
        id
        status
        skipReason
        corrected
      }
    }
  }
`);

/** ⑦ [재시도] · ⑨ [전체 재시도]. judgmentIds 생략 = 재시도할 수 있는 보류 전부 (E-35) */
export const AdminDashboardRerunHeld = graphql(`
  mutation AdminDashboardRerunHeld($judgmentIds: [ID!]) {
    rerunHeldJudgments(judgmentIds: $judgmentIds) {
      processedCount
      stillHeldCount
    }
  }
`);

/** 재계산 조작 뒤 다시 부를 조회 (판정 목록 · 요약 카드 · 메뉴 배지). 새 배열로 넘긴다(readonly 금지) */
export function dashboardRefetch(): string[] {
  return ['AdminDashboardWeekQuery', 'AdminDashboardSummaryQuery', 'AdminLayoutCountsQuery'];
}
