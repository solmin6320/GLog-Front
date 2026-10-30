import { graphql } from '@/gql';

/**
 * CM-01 홈 (화면설계서 5-1-3 · 설계서 9장, 백엔드 judgment · warning · notice).
 * 닉네임 · 팀 소속 · 받은 초대 수는 세션(useViewer)에서 읽는다 — 여기서 다시 부르지 않는다.
 * 팀 미소속(5-2-7)이면 이 쿼리를 부르지 않는다(②③④가 없다). 화면 모델은 domain/weekView로 바꾼다.
 */
export const HomeQuery = graphql(`
  query HomeQuery {
    myWeeklyActivity {
      weekStart
      currentWeek
      inTeam
      days {
        date
        hasGrass
        grassCount
        hasRecord
        recordCount
      }
      verifiedDays
      recordCount
      requiredVerifiedDays
      requiredRecordCount
      passExpected
      grassAvailable
      grassFetchedAt
      banner
    }
    myWarningSummary {
      onHold
      warningCount
      streak
      penaltyTarget
    }
  }
`);

/** CM-01 ⑦ 공지 3건 (고정 공지가 먼저 — 서버 정렬). 실패해도 화면 전체를 비우지 않게 errorPolicy 'all'로 따로 부른다 */
export const HomeNoticesQuery = graphql(`
  query HomeNoticesQuery {
    notices {
      items {
        id
        title
        isPinned
        createdAt
      }
      nextCursor
    }
  }
`);
