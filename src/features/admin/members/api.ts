import { graphql } from '@/gql';

/**
 * AD-01 ②-2 회원 · 관리자 권한 (화면설계서 5-1-10 ②-2). 가입은 승인 없이 바로 활성이라 이 탭은 회원 명단과 관리자 승격을 맡는다. 연산 이름은 `AdminMembers*`.
 * 승인 · 거절 · 되돌리기는 값 하나만 바뀌는 조작이라 낙관적으로 행을 고친다(요구사항 6-5) — cache.ts.
 * 탭 배지는 refetchQueries: [ADMIN_COUNTS_QUERY] (layouts/api.ts AdminLayoutCountsQuery를 이름으로 부른다).
 */

/** 관리자 탭 배지 쿼리 이름. features → layouts import는 의존 방향 위반이라 이름으로만 부른다 */
export const ADMIN_COUNTS_QUERY = 'AdminLayoutCountsQuery';

/** ⑤ 상태 필터 + 검색 · ⑥ 목록. 신청(첫 로그인) 오래된 순 */
export const AdminMembersQuery = graphql(`
  query AdminMembersQuery($filter: AdminMemberFilter!, $search: String, $first: Int, $after: String) {
    adminMembers(filter: $filter, search: $search, first: $first, after: $after) {
      nodes {
        member {
          id
          nickname
          githubLogin
          profileImageUrl
        }
        status
        role
        appliedAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`);

/** ③ 패널 제목 건수 요약 — 탭 배지와 같은 값(adminDashboardSummary 한 객체로 합쳐진다) */
export const AdminMembersSummaryQuery = graphql(`
  query AdminMembersSummaryQuery {
    adminDashboardSummary {
      pendingMemberCount
    }
  }
`);

/** 활성 일반 회원 → 관리자 (현재 관리자만) */
export const AdminMembersPromote = graphql(`
  mutation AdminMembersPromote($memberId: ID!) {
    promoteToAdmin(memberId: $memberId) {
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
      status
      role
      appliedAt
    }
  }
`);

/** 활성 일반 회원의 이용 정지 (현재 관리자만) */
export const AdminMembersSuspend = graphql(`
  mutation AdminMembersSuspend($memberId: ID!) {
    suspendMember(memberId: $memberId) {
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
      status
      role
      appliedAt
    }
  }
`);

/** 정지 해제 → 활성 */
export const AdminMembersUnsuspend = graphql(`
  mutation AdminMembersUnsuspend($memberId: ID!) {
    unsuspendMember(memberId: $memberId) {
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
      status
      role
      appliedAt
    }
  }
`);

/** ⑦ 승인 (기존 승인 대기 계정 정리용) */
export const AdminMembersApprove = graphql(`
  mutation AdminMembersApprove($memberId: ID!) {
    approveMember(memberId: $memberId) {
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
      status
      role
      appliedAt
    }
  }
`);

/** ⑧ 거절 (확인 다이얼로그 뒤) */
export const AdminMembersReject = graphql(`
  mutation AdminMembersReject($memberId: ID!) {
    rejectMember(memberId: $memberId) {
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
      status
      role
      appliedAt
    }
  }
`);

/** ⑧ 거절 → 승인 대기로 (즉시) */
export const AdminMembersRevert = graphql(`
  mutation AdminMembersRevert($memberId: ID!) {
    revertMemberToPending(memberId: $memberId) {
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
      status
      role
      appliedAt
    }
  }
`);
