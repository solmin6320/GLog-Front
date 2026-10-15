import { graphql } from '@/gql';

/**
 * AD-01 ②-1 경고 복구 · 벌칙 (화면설계서 5-1-10, 목업 W-16). 연산 이름은 `AdminWarnings*`.
 * 팀 실명(AdminTeamLabel)은 관리자 화면 중 이 탭에서만 가져온다 (기능명세서 9장 · ACC-PEN-02).
 * 이행 체크 · 경고 복구는 재계산 조작이다 — 부분 패치하지 않고 WARNINGS_REFETCH를 다시 부른다 (설계서 3-6).
 */

/** ⑤ 벌칙 대상 (경고 3회 도달). 경고가 붙은 팀은 비공개여도 실명 */
export const AdminWarningsPenaltyTargetsQuery = graphql(`
  query AdminWarningsPenaltyTargetsQuery {
    penaltyTargets {
      member {
        id
        nickname
        profileImageUrl
      }
      activeWarningCount
      reachedWeekStart
      reachedAt
      teams {
        teamId
        name
        isPublic
        isDeleted
      }
    }
  }
`);

/** ⑦ 삭제된 경고 (추방 · 팀 삭제). 정정 · 소급 면제로 회수된 경고는 오지 않는다. usePagedList(first · after) */
export const AdminWarningsDeletedQuery = graphql(`
  query AdminWarningsDeletedQuery($first: Int, $after: String) {
    deletedWarnings(first: $first, after: $after) {
      nodes {
        id
        member {
          id
          nickname
          profileImageUrl
        }
        weekStart
        weekEnd
        deleteReason
        deletedAt
        restoreCategories {
          teamId
          name
          isPublic
          isDeleted
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`);

/** ⑧ 복구 미리보기 (E-42 · E-43 · E-59) — 조회만 한다. 반영할 때 basis를 expectedBasis로 돌려준다 */
export const AdminWarningsRestorePreviewQuery = graphql(`
  query AdminWarningsRestorePreviewQuery($warningId: ID!) {
    restoreWarningPreview(warningId: $warningId) {
      warningCountBefore
      warningCountAfter
      penaltyChange
      frozenByFulfillment
      restoresWithoutCategory
      basis
    }
  }
`);

/** ⑥ 이행 완료 — 되돌릴 수 없는 고정점(E-58) */
export const AdminWarningsFulfillPenalty = graphql(`
  mutation AdminWarningsFulfillPenalty($memberId: ID!) {
    fulfillPenalty(memberId: $memberId) {
      member {
        id
      }
    }
  }
`);

/** ⑧ 복구 */
export const AdminWarningsRestoreWarning = graphql(`
  mutation AdminWarningsRestoreWarning($warningId: ID!, $expectedBasis: String) {
    restoreWarning(warningId: $warningId, expectedBasis: $expectedBasis) {
      member {
        id
      }
    }
  }
`);

/** 이행 체크 · 복구 뒤 다시 부를 조회 (두 목록 + 메뉴 배지). 새 배열로 넘긴다(readonly 금지) */
export function warningsRefetch(): string[] {
  return ['AdminWarningsPenaltyTargetsQuery', 'AdminWarningsDeletedQuery', 'AdminLayoutCountsQuery'];
}
