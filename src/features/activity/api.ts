import { graphql } from '@/gql';

/**
 * AC-01 내 주간 활동 (화면설계서 5-1-21, 백엔드 judgment.graphqls). 주차는 항상 월요일 날짜로 보낸다(이번 주도 명시).
 * 판정이 끝난 주는 판정 때 저장한 값이라 grassCount · recordCount가 null이다. 화면 모델은 domain/weekView로 바꾼다.
 */
export const WeeklyQuery = graphql(`
  query WeeklyQuery($weekStart: String) {
    myWeeklyActivity(weekStart: $weekStart) {
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
      judgment {
        status
        skipReason
      }
    }
  }
`);

/** AC-01 ⑤ 지난 판정 — 주차를 옮겨도 그대로라 따로 부른다 (커서 20개) */
export const WeeklyHistoryQuery = graphql(`
  query WeeklyHistoryQuery($after: String) {
    myJudgmentHistory(after: $after) {
      items {
        weekStart
        weekEnd
        status
        skipReason
        verifiedDays
        recordCount
      }
      nextCursor
    }
  }
`);

/** AC-02 내 경고 · 벌칙 (화면설계서 5-1-22). ①②는 PR-01 ⑧과 같은 서버 계산 값이다 */
export const WarningsQuery = graphql(`
  query WarningsQuery {
    myWarningSummary {
      onHold
      warningCount
      streak
      penaltyTarget
    }
  }
`);

/** AC-02 ③ 경고 이력 (커서 20개). 보류가 남아 있으면 onHold만 true */
export const WarningHistoryQuery = graphql(`
  query WarningHistoryQuery($after: String) {
    myWarningHistory(after: $after) {
      onHold
      items {
        weekStart
        weekEnd
        verifiedDays
        recordCount
        categories
        status
      }
      nextCursor
    }
  }
`);
