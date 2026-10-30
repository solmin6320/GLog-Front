import { graphql } from '@/gql';

/**
 * 관리자 처리 대기 배지 (드로어 관리자 그룹 + AdminLayout 가로 탭이 같은 숫자를 쓴다).
 * 관리자 뮤테이션(승인 · 면제 · 벌칙 이행 등) 뒤에는 refetchQueries: ['AdminLayoutCountsQuery'].
 */
export const AdminLayoutCountsQuery = graphql(`
  query AdminLayoutCountsQuery {
    adminDashboardSummary {
      pendingMemberCount
      penaltyTargetCount
      pendingExemptionRequestCount
    }
  }
`);
