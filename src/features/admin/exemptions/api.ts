import { graphql } from '@/gql';

/**
 * AD-01 ②-3 면제 관리 (화면설계서 5-1-10 ②-3 · E-44 · E-45 · E-48). 연산 이름은 `AdminExemptions*`.
 * 판정이 끝난 주를 건드리는 조작(소급 면제)은 미리보기 쿼리 → 확인 → expectedBasis를 실어 반영 →
 * 목록 · 탭 배지를 다시 부른다(awaitRefetchQueries). PREVIEW_STALE이면 미리보기를 다시 받아 보여 준다 (설계서 3-6).
 */

/** ⑤ 면제 기간 목록 (최근 주부터) */
export const AdminExemptionsPeriodsQuery = graphql(`
  query AdminExemptionsPeriodsQuery($first: Int, $after: String) {
    exemptionPeriods(first: $first, after: $after) {
      nodes {
        id
        weekStart
        weekEnd
        reason
        isPast
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

/** ⑥ 등록 · 수정 · 삭제 전 영향 미리보기 (계산만 한다). 수정이면 periodId, 삭제면 removing */
export const AdminExemptionsPeriodPreviewQuery = graphql(`
  query AdminExemptionsPeriodPreviewQuery($weekStart: Date!, $periodId: ID, $removing: Boolean) {
    exemptionPeriodPreview(weekStart: $weekStart, periodId: $periodId, removing: $removing) {
      weekStart
      isRetroactive
      affectedMemberCount
      basis
      changes {
        member {
          id
          nickname
        }
        warningCountBefore
        warningCountAfter
        penaltyChange
        affectedWeekCount
        frozenByFulfillment
      }
    }
  }
`);

export const AdminExemptionsCreatePeriod = graphql(`
  mutation AdminExemptionsCreatePeriod($input: ExemptionPeriodInput!) {
    createExemptionPeriod(input: $input) {
      id
      weekStart
      weekEnd
      reason
      isPast
    }
  }
`);

export const AdminExemptionsUpdatePeriod = graphql(`
  mutation AdminExemptionsUpdatePeriod($id: ID!, $input: ExemptionPeriodInput!) {
    updateExemptionPeriod(id: $id, input: $input) {
      id
      weekStart
      weekEnd
      reason
      isPast
    }
  }
`);

export const AdminExemptionsDeletePeriod = graphql(`
  mutation AdminExemptionsDeletePeriod($id: ID!, $expectedBasis: String) {
    deleteExemptionPeriod(id: $id, expectedBasis: $expectedBasis)
  }
`);

/** ⑦ 개인 면제 요청. 팀 이름은 묻지 않는다(②-3 ⑦ · ACC-ADM-07) */
export const AdminExemptionsRequestsQuery = graphql(`
  query AdminExemptionsRequestsQuery($status: PersonalExemptionStatus!, $first: Int, $after: String) {
    personalExemptionRequests(status: $status, first: $first, after: $after) {
      nodes {
        id
        member {
          id
          nickname
          profileImageUrl
        }
        requestedBy {
          id
          nickname
        }
        weekStart
        weekEnd
        reason
        status
        rejectReason
        createdAt
        respondedAt
        overlapsExemptionPeriod
        isRetroactive
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`);

/** ⑦ 판정이 끝난 주의 승인(소급) 미리보기. 소급이 아니면 null */
export const AdminExemptionsApprovalPreviewQuery = graphql(`
  query AdminExemptionsApprovalPreviewQuery($requestId: ID!) {
    personalExemptionApprovalPreview(requestId: $requestId) {
      member {
        id
        nickname
      }
      warningCountBefore
      warningCountAfter
      penaltyChange
      affectedWeekCount
      frozenByFulfillment
      basis
    }
  }
`);

export const AdminExemptionsApprove = graphql(`
  mutation AdminExemptionsApprove($requestId: ID!, $expectedBasis: String) {
    approvePersonalExemption(requestId: $requestId, expectedBasis: $expectedBasis) {
      id
      status
      respondedAt
    }
  }
`);

export const AdminExemptionsReject = graphql(`
  mutation AdminExemptionsReject($requestId: ID!, $reason: String!) {
    rejectPersonalExemption(requestId: $requestId, reason: $reason) {
      id
      status
      rejectReason
      respondedAt
    }
  }
`);

/** ③ 패널 제목 건수 요약 — 탭 배지와 같은 값 */
export const AdminExemptionsSummaryQuery = graphql(`
  query AdminExemptionsSummaryQuery {
    adminDashboardSummary {
      pendingExemptionRequestCount
    }
  }
`);
