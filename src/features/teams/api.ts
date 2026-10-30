/**
 * 팀 영역 GraphQL 문서 (설계서 9장 TM-01 ~ TM-08). 연산 이름은 `Team…`으로 시작한다.
 * 백엔드(GLog-Backend) team · team-board · team-post · exemption 스키마를 그대로 쓴다.
 * 팀 기본 정보(이름 · 공개 · 팀장 여부)는 TeamScope가 이미 받았으므로 TM-05 · 06 · 08은 useTeamScope()로 읽는다.
 */
import { graphql } from '@/gql';
import { SessionTeamsQuery } from '@/session/api';

/**
 * 소속 · 받은 초대 수가 바뀌는 뮤테이션 뒤에 세션(hasTeam · pendingInvitationCount)을 다시 받는다.
 * 세션은 캐시만 지켜보는(cache-only) 쿼리라 이름('SessionTeamsQuery')으로는 다시 불리지 않는다 → 문서로 넘긴다.
 */
export const REFRESH_SESSION = { query: SessionTeamsQuery } as const;

/* ------------------------------------------------------------------ */
/* TM-01 내 팀 목록                                                     */
/* ------------------------------------------------------------------ */

export const TeamListQuery = graphql(`
  query TeamListQuery {
    receivedTeamInvitations {
      items {
        id
      }
      nextCursor
    }
    myTeams {
      id
      name
      isPublic
      isLeader
      memberCount
      weekSummary {
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
        isLeader
        memberCount
      }
    }
  }
`);

export const TeamJoinMutation = graphql(`
  mutation TeamJoinByCode($code: String!) {
    joinTeamByCode(code: $code) {
      id
      name
      isPublic
      isLeader
      memberCount
    }
  }
`);

/* ------------------------------------------------------------------ */
/* TM-04 받은 초대                                                      */
/* ------------------------------------------------------------------ */

export const TeamInvitationsQuery = graphql(`
  query TeamInvitationsQuery($after: String) {
    receivedTeamInvitations(after: $after) {
      items {
        id
        teamId
        teamName
        createdAt
        inviter {
          id
          nickname
        }
      }
      nextCursor
    }
  }
`);

export const TeamAcceptInvitationMutation = graphql(`
  mutation TeamAcceptInvitation($invitationId: ID!) {
    acceptTeamInvitation(invitationId: $invitationId) {
      id
      name
      isPublic
      isLeader
      memberCount
    }
  }
`);

export const TeamDeclineInvitationMutation = graphql(`
  mutation TeamDeclineInvitation($invitationId: ID!) {
    declineTeamInvitation(invitationId: $invitationId)
  }
`);

/* ------------------------------------------------------------------ */
/* TM-05 팀 현황판                                                      */
/* ------------------------------------------------------------------ */

export const TeamBoardQuery = graphql(`
  query TeamBoardQuery($id: ID!) {
    teamBoard(teamId: $id) {
      weekStart
      weekEnd
      grassFetchedAt
      grassNotLoaded
      members {
        memberId
        nickname
        githubLogin
        isMe
        days {
          date
          hasGrass
          hasRecord
          verified
        }
        verifiedDays
        recordCount
        warningCount
        status
      }
      recentPosts {
        id
        type
        title
        createdAt
        isRecord
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
    teamInviteCode(teamId: $id)
    sentTeamInvitations(teamId: $id) {
      items {
        id
        createdAt
        invitee {
          id
          nickname
          githubLogin
        }
      }
      nextCursor
    }
  }
`);

/** TM-06 ④ 팀원 목록 — 팀장이 맨 앞, 커서 20개 */
export const TeamMembersQuery = graphql(`
  query TeamMembersQuery($id: ID!, $after: String) {
    teamMembers(teamId: $id, after: $after) {
      items {
        id
        nickname
        githubLogin
        profileImageUrl
        isLeader
        joinedAt
      }
      nextCursor
    }
  }
`);

/** TM-06 ⑧ 팀 글 — 팀장만 */
export const TeamPostsQuery = graphql(`
  query TeamPostsQuery($id: ID!, $after: String) {
    teamPosts(teamId: $id, after: $after) {
      items {
        id
        type
        title
        createdAt
        author {
          id
          nickname
        }
      }
      nextCursor
    }
  }
`);

/** TM-06 ⑧ 팀 글에 달린 댓글 — 팀장만. 본문 전체가 와서 그 자리에서 고친다 */
export const TeamCommentsQuery = graphql(`
  query TeamCommentsQuery($id: ID!, $after: String) {
    teamComments(teamId: $id, after: $after) {
      items {
        id
        postId
        content
        createdAt
        author {
          id
          nickname
        }
      }
      nextCursor
    }
  }
`);

export const TeamInviteMemberMutation = graphql(`
  mutation TeamInviteMember($teamId: ID!, $githubLogin: String!) {
    inviteToTeam(teamId: $teamId, githubLogin: $githubLogin) {
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
    cancelTeamInvitation(invitationId: $invitationId)
  }
`);

export const TeamKickMemberMutation = graphql(`
  mutation TeamKickMember($teamId: ID!, $memberId: ID!) {
    kickTeamMember(teamId: $teamId, memberId: $memberId)
  }
`);

export const TeamTransferLeadershipMutation = graphql(`
  mutation TeamTransferLeadership($teamId: ID!, $newLeaderId: ID!) {
    transferTeamLeadership(teamId: $teamId, newLeaderId: $newLeaderId) {
      id
      isLeader
      memberCount
    }
  }
`);

export const TeamSetVisibilityMutation = graphql(`
  mutation TeamSetVisibility($teamId: ID!, $isPublic: Boolean!) {
    updateTeam(teamId: $teamId, input: { isPublic: $isPublic }) {
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

/** 대상 셀렉트용 팀원 + 내가 보낸 요청. 요청에는 팀이 없어 화면이 이 팀 팀원 것만 고른다 */
export const TeamExemptionQuery = graphql(`
  query TeamExemptionQuery($id: ID!) {
    teamMembers(teamId: $id) {
      items {
        id
        nickname
      }
      nextCursor
    }
    myPersonalExemptionRequests {
      items {
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
      nextCursor
    }
  }
`);

export const TeamRequestExemptionMutation = graphql(`
  mutation TeamRequestExemption($teamId: ID!, $memberId: ID!, $weekStart: String!, $reason: String!) {
    requestPersonalExemption(teamId: $teamId, memberId: $memberId, weekStart: $weekStart, reason: $reason) {
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
