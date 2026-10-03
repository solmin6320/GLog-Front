/**
 * 팀 영역 GraphQL 문서 (설계서 9장 TM-01 ~ TM-08). 연산 이름은 `Team…`으로 시작한다.
 * 팀 기본 정보(이름 · 공개 · 내 역할)는 TeamScope가 이미 받았으므로 TM-05 · 06 · 08은 useTeamScope()로 읽는다.
 */
import { graphql } from '@/gql';
import { SessionQuery } from '@/session/api';

/**
 * 소속 · 받은 초대 수가 바뀌는 뮤테이션 뒤에 세션(hasTeam · pendingInvitationCount)을 다시 받는다.
 * 세션은 캐시만 지켜보는(cache-only) 쿼리라 이름('SessionQuery')으로는 다시 불리지 않는다 → 문서로 넘긴다.
 */
export const REFRESH_SESSION = { query: SessionQuery } as const;

/* ------------------------------------------------------------------ */
/* TM-01 내 팀 목록                                                     */
/* ------------------------------------------------------------------ */

export const TeamListQuery = graphql(`
  query TeamListQuery {
    me {
      id
      pendingInvitationCount
    }
    myTeams {
      id
      name
      isPublic
      viewerRole
      memberCount
      currentWeekSummary {
        passCount
        notYetCount
      }
    }
  }
`);

/* ------------------------------------------------------------------ */
/* TM-02 팀 생성 · TM-03 팀 참가                                         */
/* ------------------------------------------------------------------ */

export const TeamCreateMutation = graphql(`
  mutation TeamCreate($input: CreateTeamInput!) {
    createTeam(input: $input) {
      inviteCode
      team {
        id
        name
        isPublic
        viewerRole
        memberCount
      }
    }
  }
`);

export const TeamJoinMutation = graphql(`
  mutation TeamJoinByInviteCode($code: String!) {
    joinTeamByInviteCode(code: $code) {
      id
      name
      isPublic
      viewerRole
      memberCount
    }
  }
`);

/* ------------------------------------------------------------------ */
/* TM-04 받은 초대                                                      */
/* ------------------------------------------------------------------ */

export const TeamInvitationsQuery = graphql(`
  query TeamInvitationsQuery {
    me {
      id
      pendingInvitationCount
    }
    myInvitations {
      id
      createdAt
      team {
        id
        name
      }
      invitedBy {
        id
        nickname
      }
    }
  }
`);

export const TeamRespondInvitationMutation = graphql(`
  mutation TeamRespondInvitation($invitationId: ID!, $accept: Boolean!) {
    respondInvitation(invitationId: $invitationId, accept: $accept) {
      invitationId
      team {
        id
        name
        isPublic
        viewerRole
        memberCount
      }
    }
  }
`);

/* ------------------------------------------------------------------ */
/* TM-05 팀 현황판                                                      */
/* ------------------------------------------------------------------ */

export const TeamBoardQuery = graphql(`
  query TeamBoardQuery($id: ID!) {
    team(id: $id) {
      id
      currentWeekBoard {
        weekStart
        weekEnd
        grassUpdatedAt
        rows {
          member {
            id
            nickname
            profileImageUrl
          }
          isViewer
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
          teamWarningCount
          status
          grassStatus
        }
      }
      recentPosts(first: 5) {
        id
        type
        title
        createdAt
        author {
          id
          nickname
        }
      }
    }
  }
`);

export const TeamLeaveMutation = graphql(`
  mutation TeamLeave($teamId: ID!) {
    leaveTeam(teamId: $teamId)
  }
`);

/* ------------------------------------------------------------------ */
/* TM-06 팀 관리                                                        */
/* ------------------------------------------------------------------ */

export const TeamManageQuery = graphql(`
  query TeamManageQuery($id: ID!) {
    team(id: $id) {
      id
      inviteCode
      memberCount
      members {
        role
        joinedAt
        member {
          id
          nickname
          githubLogin
          profileImageUrl
        }
      }
      pendingInvitations {
        id
        createdAt
        invitee {
          id
          nickname
          githubLogin
        }
      }
    }
  }
`);

export const TeamManagedContentsQuery = graphql(`
  query TeamManagedContentsQuery($id: ID!, $first: Int, $after: String) {
    team(id: $id) {
      id
      managedContents(first: $first, after: $after) {
        nodes {
          kind
          targetId
          postId
          postType
          title
          createdAt
          author {
            id
            nickname
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
`);

export const TeamInviteMemberMutation = graphql(`
  mutation TeamInviteMember($teamId: ID!, $githubLogin: String!) {
    inviteMember(teamId: $teamId, githubLogin: $githubLogin) {
      id
      createdAt
      invitee {
        id
        nickname
        githubLogin
      }
    }
  }
`);

export const TeamCancelInvitationMutation = graphql(`
  mutation TeamCancelInvitation($invitationId: ID!) {
    cancelInvitation(invitationId: $invitationId)
  }
`);

export const TeamKickMemberMutation = graphql(`
  mutation TeamKickMember($teamId: ID!, $memberId: ID!) {
    kickMember(teamId: $teamId, memberId: $memberId) {
      id
      memberCount
      members {
        role
        joinedAt
        member {
          id
          nickname
          githubLogin
          profileImageUrl
        }
      }
    }
  }
`);

export const TeamTransferLeadershipMutation = graphql(`
  mutation TeamTransferLeadership($teamId: ID!, $memberId: ID!) {
    transferLeadership(teamId: $teamId, memberId: $memberId) {
      id
      viewerRole
      inviteCode
      memberCount
    }
  }
`);

export const TeamSetVisibilityMutation = graphql(`
  mutation TeamSetVisibility($teamId: ID!, $isPublic: Boolean!) {
    setTeamVisibility(teamId: $teamId, isPublic: $isPublic) {
      id
      isPublic
    }
  }
`);

export const TeamDeleteMutation = graphql(`
  mutation TeamDelete($teamId: ID!) {
    deleteTeam(teamId: $teamId)
  }
`);

/** TM-06 ⑧ 댓글 인라인 수정 — 목록 줄에는 본문 앞부분만 있어 고치기 전에 전체 본문을 받는다 */
export const TeamCommentForEditQuery = graphql(`
  query TeamCommentForEditQuery($postId: ID!) {
    post(id: $postId) {
      ... on Post {
        id
        comments(first: 100) {
          nodes {
            id
            content
            viewerCanEdit
          }
        }
      }
    }
  }
`);

export const TeamUpdateCommentMutation = graphql(`
  mutation TeamUpdateComment($id: ID!, $content: String!) {
    updateComment(id: $id, content: $content) {
      id
      content
      updatedAt
    }
  }
`);

/* ------------------------------------------------------------------ */
/* TM-08 개인 면제 요청                                                 */
/* ------------------------------------------------------------------ */

export const TeamExemptionQuery = graphql(`
  query TeamExemptionQuery($id: ID!) {
    team(id: $id) {
      id
      members {
        role
        member {
          id
          nickname
        }
      }
      exemptionRequests {
        id
        weekStart
        weekEnd
        status
        rejectReason
        overlapsExemptionPeriod
        createdAt
        member {
          id
          nickname
        }
      }
    }
  }
`);

export const TeamRequestExemptionMutation = graphql(`
  mutation TeamRequestExemption($input: RequestPersonalExemptionInput!) {
    requestPersonalExemption(input: $input) {
      id
      weekStart
      weekEnd
      status
      rejectReason
      overlapsExemptionPeriod
      createdAt
      member {
        id
        nickname
      }
    }
  }
`);
