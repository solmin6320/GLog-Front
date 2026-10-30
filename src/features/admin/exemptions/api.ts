import { graphql } from '@/gql';

/**
 * AD-01 ②-3 면제 관리 (화면설계서 5-1-10 ②-3 · E-44 · E-45 · E-48). 연산 이름은 `AdminExemptions*`.
 * 판정이 끝난 주를 건드리는 조작(소급 면제)은 미리보기 쿼리 → 확인 → 반영 → 목록 · 탭 배지를 다시 부른다(awaitRefetchQueries).
 * 백엔드 미리보기는 등록 주 · 개인 승인만 있다. 기간 삭제 · 다른 주로 옮기기는 이미 면제로 바뀐 판정을 되돌리지 않는다.
 */

/** ⑤ 면제 기간 목록 (최근 주부터 20개씩) */
export const AdminExemptionsPeriodsQuery = graphql(`
  query AdminExemptionsPeriodsQuery($after: String) {
    exemptionPeriods(after: $after) {
      items {
        id
        weekStart
        weekEnd
        reason
      }
      nextCursor
    }
  }
`);

/** 그 주를 면제 기간으로 등록하면 바뀌는 판정 (계산만 한다). 판정 전 주면 retroactive=false · items 빈 배열 */
export const AdminExemptionsPeriodPreviewQuery = graphql(`
  query AdminExemptionsPeriodPreviewQuery($weekStart: String!) {
    previewExemptionPeriod(weekStart: $weekStart) {
      weekStart
      retroactive
      items {
        member {
          id
          nickname
        }
        currentStatus
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
  }
`);

export const AdminExemptionsCreatePeriod = graphql(`
  mutation AdminExemptionsCreatePeriod($input: ExemptionPeriodInput!) {
    createExemptionPeriod(input: $input) {
      id
      weekStart
      weekEnd
      reason
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
    }
  }
`);

export const AdminExemptionsDeletePeriod = graphql(`
  mutation AdminExemptionsDeletePeriod($id: ID!) {
    deleteExemptionPeriod(id: $id)
  }
`);

/** ⑦ 개인 면제 요청 (대기, 최신순 20개씩). 팀 이름은 묻지 않는다(②-3 ⑦ · ACC-ADM-07) */
export const AdminExemptionsRequestsQuery = graphql(`
  query AdminExemptionsRequestsQuery($status: PersonalExemptionStatus!, $after: String) {
    personalExemptionRequests(status: $status, after: $after) {
      items {
        id
        member {
          id
          nickname
        }
        requester {
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
      }
      nextCursor
    }
  }
`);

/** ⑦ 승인 미리보기 (계산만 한다). 판정 전 주면 retroactive=false */
export const AdminExemptionsApprovalPreviewQuery = graphql(`
  query AdminExemptionsApprovalPreviewQuery($id: ID!) {
    previewPersonalExemptionApproval(id: $id) {
      weekStart
      retroactive
      items {
        member {
          id
          nickname
        }
        currentStatus
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
  }
`);

export const AdminExemptionsApprove = graphql(`
  mutation AdminExemptionsApprove($id: ID!) {
    approvePersonalExemption(id: $id) {
      id
      status
      respondedAt
    }
  }
`);

export const AdminExemptionsReject = graphql(`
  mutation AdminExemptionsReject($id: ID!, $reason: String!) {
    rejectPersonalExemption(id: $id, reason: $reason) {
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
      pendingExemptions
    }
  }
`);
