import { graphql } from '@/gql';

/**
 * AD-01 ②-2 가입 승인 (화면설계서 5-1-10 ②-2). 연산 이름은 `AdminMembers*`.
 * 승인 · 거절 · 되돌리기는 값 하나만 바뀌는 조작이라 낙관적으로 행을 고친다(요구사항 6-5) — cache.ts.
 * 탭 배지는 refetchQueries: [ADMIN_COUNTS_QUERY] (layouts/api.ts AdminLayoutCountsQuery를 이름으로 부른다).
 */

/** 관리자 탭 배지 쿼리 이름. features → layouts import는 의존 방향 위반이라 이름으로만 부른다 */
export const ADMIN_COUNTS_QUERY = 'AdminLayoutCountsQuery';

/** ⑤ 상태 필터 + 검색 · ⑥ 목록. 신청(첫 로그인) 오래된 순 20개씩 */
export const AdminMembersQuery = graphql(`
  query AdminMembersQuery($status: MemberApprovalFilter!, $keyword: String, $after: String) {
    adminMembers(status: $status, keyword: $keyword, after: $after) {
      items {
        id
        nickname
        githubLogin
        status
        role
        createdAt
      }
      nextCursor
      totalCount
    }
  }
`);

/** ③ 패널 제목 건수 요약 — 탭 배지와 같은 값(adminDashboardSummary 한 객체로 합쳐진다) */
export const AdminMembersSummaryQuery = graphql(`
  query AdminMembersSummaryQuery {
    adminDashboardSummary {
      pendingMembers
    }
  }
`);

/** ⑦ 승인 */
export const AdminMembersApprove = graphql(`
  mutation AdminMembersApprove($memberId: ID!) {
    approveMember(memberId: $memberId) {
      id
      nickname
      githubLogin
      status
      role
      createdAt
    }
  }
`);

/** ⑧ 거절 (확인 다이얼로그 뒤) */
export const AdminMembersReject = graphql(`
  mutation AdminMembersReject($memberId: ID!) {
    rejectMember(memberId: $memberId) {
      id
      nickname
      githubLogin
      status
      role
      createdAt
    }
  }
`);

/** ⑧ 거절 → 승인 대기로 (즉시) */
export const AdminMembersRevert = graphql(`
  mutation AdminMembersRevert($memberId: ID!) {
    revertMemberToPending(memberId: $memberId) {
      id
      nickname
      githubLogin
      status
      role
      createdAt
    }
  }
`);

/** 활성 일반 회원을 관리자로 지정 (프로필 화면). 대기 · 거절 · 이미 관리자면 CONFLICT */
export const AdminMembersPromote = graphql(`
  mutation AdminMembersPromote($memberId: ID!) {
    promoteMemberToAdmin(memberId: $memberId) {
      id
      nickname
      githubLogin
      status
      role
      createdAt
    }
  }
`);
