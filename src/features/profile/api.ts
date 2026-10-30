import { graphql } from '@/gql';

/**
 * PR-01 프로필 (화면설계서 5-1-9). 본인 · 타인 공용 — 비공개 팀 마스킹은 서버가 해서 준다(TeamLabel · publicTeams).
 * 주간 판정 이력(⑩⑪)은 [더 보기] 때 잔디 1년치를 다시 받지 않게 ProfileHistoryQuery로 따로 부른다.
 */
export const ProfileQuery = graphql(`
  query ProfileQuery($id: ID!) {
    member(id: $id) {
      id
      nickname
      githubLogin
      profileImageUrl
      postCount
      commentCount
      grassCalendar {
        status
        updatedAt
        totalContributions
        days {
          date
          count
          level
        }
        privateContributionSuspected
      }
      warningState {
        isOnHold
        activeCount
        isPenaltyTarget
        byCategory {
          label {
            kind
            name
          }
          count
        }
      }
      publicTeams {
        id
        name
        viewerRole
      }
    }
    grassRuleNotice {
      id
    }
  }
`);

/** PR-01 ⑩⑪ — 첫 줄 '진행 중'(currentWeek) + 확정 · 보류된 주 8개씩 (usePagedList: $first · $after) */
export const ProfileHistoryQuery = graphql(`
  query ProfileHistoryQuery($id: ID!, $first: Int, $after: String) {
    member(id: $id) {
      id
      currentWeek {
        weekStart
        verifiedDays
        recordCount
      }
      judgmentHistory(first: $first, after: $after) {
        nodes {
          id
          weekStart
          status
          skipReason
          verifiedDays
          recordCount
          hasActiveWarning
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

/** PR-02 ③ 기본 이미지로 되돌리기 ([저장] 때 보낸다). 업로드는 REST(uploadProfileImage) */
export const ProfileResetImage = graphql(`
  mutation ProfileResetImage {
    resetProfileImage {
      id
      profileImageUrl
    }
  }
`);
