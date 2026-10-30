import { graphql } from '@/gql';

/**
 * PR-01 프로필 (화면설계서 5-1-9, 백엔드 profile.graphqls). 본인 · 타인 공용 — 비공개 팀은 서버가 빼거나 가려서 준다.
 * 주간 판정 이력(⑩⑪)은 [더 보기] 때 잔디 1년치를 다시 받지 않게 ProfileHistoryQuery로 따로 부른다.
 * myTeams는 ⑫ 소속 팀 중 내가 들어갈 수 있는 팀에만 현황판 링크를 달려고 받는다.
 */
export const ProfileQuery = graphql(`
  query ProfileQuery($id: ID!) {
    profile(memberId: $id) {
      id
      nickname
      githubLogin
      profileImageUrl
      isMine
      postCount
      commentCount
      grass {
        from
        to
        fetchedAt
        days {
          date
          count
        }
      }
      warning {
        onHold
        warningCount
        penaltyTarget
      }
      teamWarnings {
        onHold
        teams {
          name
          count
        }
      }
      teams {
        id
        name
      }
    }
    myTeams {
      id
    }
  }
`);

/** PR-01 ⑩⑪ — 첫 페이지 맨 위에 이번 주 IN_PROGRESS가 붙고, 확정 · 보류된 주를 20개씩 (커서) */
export const ProfileHistoryQuery = graphql(`
  query ProfileHistoryQuery($id: ID!, $after: String) {
    profile(memberId: $id) {
      id
      judgmentHistory(after: $after) {
        items {
          weekStart
          weekEnd
          result
          verifiedDays
          recordCount
        }
        nextCursor
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
