import { graphql } from '@/gql';

/**
 * AC-01 내 주간 활동 (화면설계서 5-1-21). 주차는 항상 월요일 날짜로 보낸다(이번 주도 명시).
 * 지난 주는 판정 때 저장한 값이라 grassCount · grassLevel · recordCount가 null이다(DayActivity 설명).
 */
export const WeeklyQuery = graphql(`
  query WeeklyQuery($weekStart: Date) {
    myWeek(weekStart: $weekStart) {
      weekStart
      isCurrentWeek
      days {
        date
        grassCount
        grassLevel
        hasGrass
        recordCount
        hasRecord
        verified
        isFuture
        isToday
      }
      verifiedDays
      recordCount
      live {
        status
        skipReason
        verifiedDaysNeeded
        recordsNeeded
      }
      judgment {
        id
        status
        skipReason
      }
      grassStatus
      grassUpdatedAt
      privateContributionSuspected
    }
    grassRuleNotice {
      id
    }
  }
`);

/** AC-01 ⑤ 지난 판정 — 주차를 옮겨도 그대로라 따로 부른다 (usePagedList: $first · $after) */
export const WeeklyHistoryQuery = graphql(`
  query WeeklyHistoryQuery($memberId: ID!, $first: Int, $after: String) {
    member(id: $memberId) {
      id
      judgmentHistory(first: $first, after: $after) {
        nodes {
          id
          weekStart
          status
          skipReason
          verifiedDays
          recordCount
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

/** AC-02 내 경고 · 벌칙 (화면설계서 5-1-22). ①②는 PR-01 ⑧과 같은 서버 값이다 */
export const WarningsQuery = graphql(`
  query WarningsQuery {
    myWarnings {
      state {
        isOnHold
        activeCount
        isPenaltyTarget
        consecutivePasses
        weeksUntilDeduction
      }
      history {
        id
        weekStart
        verifiedDays
        recordCount
        categories {
          kind
          name
        }
        standing
      }
    }
  }
`);
