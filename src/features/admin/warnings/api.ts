import { graphql } from '@/gql';

/**
 * AD-01 ②-1 경고 복구 · 벌칙 (화면설계서 5-1-10, 목업 W-16). 연산 이름은 `AdminWarnings*`.
 * 팀 실명(AdminWarningTeam)은 관리자 화면 중 이 탭에서만 가져온다 (기능명세서 9장 · ACC-PEN-02).
 * 이행 체크 · 경고 복구는 재계산 조작이다 — 부분 패치하지 않고 warningsRefetch()를 다시 부른다 (설계서 3-6).
 */

/** ⑤ 벌칙 대상 (경고 3개 이상, 도달 주가 오래된 순 20명씩). 경고가 붙은 팀은 비공개여도 실명 */
export const AdminWarningsPenaltyTargetsQuery = graphql(`
  query AdminWarningsPenaltyTargetsQuery($after: String) {
    adminPenaltyTargets(after: $after) {
      items {
        member {
          id
          nickname
          githubLogin
        }
        warningCount
        reachedWeek
        teams {
          id
          name
        }
      }
      nextCursor
      totalCount
    }
  }
`);

/** ⑦ 삭제된 경고 (추방 · 팀 삭제, 최근 삭제 순 20개씩). 정정 · 소급 면제로 회수된 경고는 오지 않는다 */
export const AdminWarningsDeletedQuery = graphql(`
  query AdminWarningsDeletedQuery($after: String) {
    adminDeletedWarnings(after: $after) {
      items {
        warningId
        member {
          id
          nickname
          githubLogin
        }
        weekStart
        deleteReason
        deletedAt
        restoreTeams {
          id
          name
        }
        teamDeleted
      }
      nextCursor
    }
  }
`);

/** ⑧ 복구 미리보기 (E-42 · E-43 · E-59) — 계산만 한다 */
export const AdminWarningsRestorePreviewQuery = graphql(`
  query AdminWarningsRestorePreviewQuery($warningId: ID!) {
    previewWarningRestore(warningId: $warningId) {
      warningId
      restoreTeams {
        id
        name
      }
      teamDeleted
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

/** ⑥ 이행 완료 — 되돌릴 수 없는 고정점(E-58) */
export const AdminWarningsFulfillPenalty = graphql(`
  mutation AdminWarningsFulfillPenalty($memberId: ID!) {
    fulfillPenalty(memberId: $memberId) {
      member {
        id
      }
      fulfilledAt
    }
  }
`);

/** ⑧ 복구 */
export const AdminWarningsRestoreWarning = graphql(`
  mutation AdminWarningsRestoreWarning($warningId: ID!) {
    restoreWarning(warningId: $warningId) {
      warningId
      warningCount
      penaltyTarget
    }
  }
`);

/** 이행 체크 · 복구 뒤 다시 부를 조회 (두 목록 + 메뉴 배지). 새 배열로 넘긴다(readonly 금지) */
export function warningsRefetch(): string[] {
  return ['AdminWarningsPenaltyTargetsQuery', 'AdminWarningsDeletedQuery', 'AdminLayoutCountsQuery'];
}
