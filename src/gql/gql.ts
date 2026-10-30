/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query WeeklyQuery($weekStart: String) {\n    myWeeklyActivity(weekStart: $weekStart) {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n      judgment {\n        status\n        skipReason\n      }\n    }\n  }\n": typeof types.WeeklyQueryDocument,
    "\n  query WeeklyHistoryQuery($after: String) {\n    myJudgmentHistory(after: $after) {\n      items {\n        weekStart\n        weekEnd\n        status\n        skipReason\n        verifiedDays\n        recordCount\n      }\n      nextCursor\n    }\n  }\n": typeof types.WeeklyHistoryQueryDocument,
    "\n  query WarningsQuery {\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n": typeof types.WarningsQueryDocument,
    "\n  query WarningHistoryQuery($after: String) {\n    myWarningHistory(after: $after) {\n      onHold\n      items {\n        weekStart\n        weekEnd\n        verifiedDays\n        recordCount\n        categories\n        status\n      }\n      nextCursor\n    }\n  }\n": typeof types.WarningHistoryQueryDocument,
    "\n  query AdminDashboardSummaryQuery {\n    adminDashboardSummary {\n      judgedWeekStart\n      pendingMembers\n      failedMembers\n      penaltyTargets\n      pendingExemptions\n    }\n    adminJudgmentHolds {\n      items {\n        member {\n          id\n          nickname\n        }\n        weekStart\n        reason\n        retryCount\n        retriesExhausted\n      }\n      nextCursor\n      totalCount\n      identityMismatchCount\n    }\n  }\n": typeof types.AdminDashboardSummaryQueryDocument,
    "\n  query AdminDashboardWeekQuery($weekStart: String, $filter: AdminJudgmentFilter, $keyword: String, $after: String) {\n    adminJudgments(weekStart: $weekStart, filter: $filter, keyword: $keyword, after: $after) {\n      weekStart\n      weekEnd\n      executedAt\n      passCount\n      failCount\n      exemptCount\n      firstWeekCount\n      holdCount\n      items {\n        judgmentId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        status\n        skipReason\n        holdReason\n        verifiedDays\n        recordCount\n        warningCount\n        corrected\n        manualHold\n      }\n      nextCursor\n    }\n  }\n": typeof types.AdminDashboardWeekQueryDocument,
    "\n  query AdminDashboardCorrectionPreviewQuery($judgmentId: ID!, $status: AdminCorrectionStatus!) {\n    previewJudgmentCorrection(judgmentId: $judgmentId, status: $status) {\n      judgmentId\n      currentStatus\n      targetStatus\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n": typeof types.AdminDashboardCorrectionPreviewQueryDocument,
    "\n  mutation AdminDashboardCorrectJudgment($input: JudgmentCorrectionInput!) {\n    correctJudgment(input: $input) {\n      judgmentId\n      status\n      warningCount\n      penaltyTarget\n    }\n  }\n": typeof types.AdminDashboardCorrectJudgmentDocument,
    "\n  mutation AdminDashboardRetryHold($memberId: ID!, $weekStart: String!) {\n    retryJudgmentHold(memberId: $memberId, weekStart: $weekStart) {\n      status\n      resolved\n    }\n  }\n": typeof types.AdminDashboardRetryHoldDocument,
    "\n  mutation AdminDashboardRetryAllHolds {\n    retryAllJudgmentHolds {\n      attempted\n      resolved\n      stillHold\n      failed\n    }\n  }\n": typeof types.AdminDashboardRetryAllHoldsDocument,
    "\n  query AdminExemptionsPeriodsQuery($after: String) {\n    exemptionPeriods(after: $after) {\n      items {\n        id\n        weekStart\n        weekEnd\n        reason\n      }\n      nextCursor\n    }\n  }\n": typeof types.AdminExemptionsPeriodsQueryDocument,
    "\n  query AdminExemptionsPeriodPreviewQuery($weekStart: String!) {\n    previewExemptionPeriod(weekStart: $weekStart) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n": typeof types.AdminExemptionsPeriodPreviewQueryDocument,
    "\n  mutation AdminExemptionsCreatePeriod($input: ExemptionPeriodInput!) {\n    createExemptionPeriod(input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n": typeof types.AdminExemptionsCreatePeriodDocument,
    "\n  mutation AdminExemptionsUpdatePeriod($id: ID!, $input: ExemptionPeriodInput!) {\n    updateExemptionPeriod(id: $id, input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n": typeof types.AdminExemptionsUpdatePeriodDocument,
    "\n  mutation AdminExemptionsDeletePeriod($id: ID!) {\n    deleteExemptionPeriod(id: $id)\n  }\n": typeof types.AdminExemptionsDeletePeriodDocument,
    "\n  query AdminExemptionsRequestsQuery($status: PersonalExemptionStatus!, $after: String) {\n    personalExemptionRequests(status: $status, after: $after) {\n      items {\n        id\n        member {\n          id\n          nickname\n        }\n        requester {\n          id\n          nickname\n        }\n        weekStart\n        weekEnd\n        reason\n        status\n        rejectReason\n        createdAt\n        respondedAt\n        overlapsExemptionPeriod\n      }\n      nextCursor\n    }\n  }\n": typeof types.AdminExemptionsRequestsQueryDocument,
    "\n  query AdminExemptionsApprovalPreviewQuery($id: ID!) {\n    previewPersonalExemptionApproval(id: $id) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n": typeof types.AdminExemptionsApprovalPreviewQueryDocument,
    "\n  mutation AdminExemptionsApprove($id: ID!) {\n    approvePersonalExemption(id: $id) {\n      id\n      status\n      respondedAt\n    }\n  }\n": typeof types.AdminExemptionsApproveDocument,
    "\n  mutation AdminExemptionsReject($id: ID!, $reason: String!) {\n    rejectPersonalExemption(id: $id, reason: $reason) {\n      id\n      status\n      rejectReason\n      respondedAt\n    }\n  }\n": typeof types.AdminExemptionsRejectDocument,
    "\n  query AdminExemptionsSummaryQuery {\n    adminDashboardSummary {\n      pendingExemptions\n    }\n  }\n": typeof types.AdminExemptionsSummaryQueryDocument,
    "\n  query AdminMembersQuery($status: MemberApprovalFilter!, $keyword: String, $after: String) {\n    adminMembers(status: $status, keyword: $keyword, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        status\n        role\n        createdAt\n      }\n      nextCursor\n      totalCount\n    }\n  }\n": typeof types.AdminMembersQueryDocument,
    "\n  query AdminMembersSummaryQuery {\n    adminDashboardSummary {\n      pendingMembers\n    }\n  }\n": typeof types.AdminMembersSummaryQueryDocument,
    "\n  mutation AdminMembersApprove($memberId: ID!) {\n    approveMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": typeof types.AdminMembersApproveDocument,
    "\n  mutation AdminMembersReject($memberId: ID!) {\n    rejectMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": typeof types.AdminMembersRejectDocument,
    "\n  mutation AdminMembersRevert($memberId: ID!) {\n    revertMemberToPending(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": typeof types.AdminMembersRevertDocument,
    "\n  mutation AdminMembersPromote($memberId: ID!) {\n    promoteMemberToAdmin(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": typeof types.AdminMembersPromoteDocument,
    "\n  query AdminNoticesQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        isSystem\n        createdAt\n        updatedAt\n      }\n      nextCursor\n    }\n  }\n": typeof types.AdminNoticesQueryDocument,
    "\n  query AdminNoticesEditorQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n    }\n  }\n": typeof types.AdminNoticesEditorQueryDocument,
    "\n  mutation AdminNoticesCreate($input: NoticeInput!) {\n    createNotice(input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminNoticesCreateDocument,
    "\n  mutation AdminNoticesUpdate($id: ID!, $input: NoticeInput!) {\n    updateNotice(id: $id, input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.AdminNoticesUpdateDocument,
    "\n  mutation AdminNoticesDelete($id: ID!) {\n    deleteNotice(id: $id)\n  }\n": typeof types.AdminNoticesDeleteDocument,
    "\n  mutation AdminNoticesSetPinned($id: ID!, $isPinned: Boolean!) {\n    setNoticePinned(id: $id, isPinned: $isPinned) {\n      id\n      isPinned\n    }\n  }\n": typeof types.AdminNoticesSetPinnedDocument,
    "\n  query AdminPostsQuery($filter: AdminPostFilter!, $keyword: String, $after: String) {\n    adminPosts(filter: $filter, keyword: $keyword, after: $after) {\n      items {\n        kind\n        id\n        postId\n        title\n        content\n        author {\n          id\n          nickname\n        }\n        createdAt\n      }\n      nextCursor\n    }\n  }\n": typeof types.AdminPostsQueryDocument,
    "\n  mutation AdminPostsDeletePost($id: ID!) {\n    adminDeletePost(postId: $id)\n  }\n": typeof types.AdminPostsDeletePostDocument,
    "\n  mutation AdminPostsDeleteComment($id: ID!) {\n    adminDeleteComment(commentId: $id)\n  }\n": typeof types.AdminPostsDeleteCommentDocument,
    "\n  query AdminWarningsPenaltyTargetsQuery($after: String) {\n    adminPenaltyTargets(after: $after) {\n      items {\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        warningCount\n        reachedWeek\n        teams {\n          id\n          name\n        }\n      }\n      nextCursor\n      totalCount\n    }\n  }\n": typeof types.AdminWarningsPenaltyTargetsQueryDocument,
    "\n  query AdminWarningsDeletedQuery($after: String) {\n    adminDeletedWarnings(after: $after) {\n      items {\n        warningId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        weekStart\n        deleteReason\n        deletedAt\n        restoreTeams {\n          id\n          name\n        }\n        teamDeleted\n      }\n      nextCursor\n    }\n  }\n": typeof types.AdminWarningsDeletedQueryDocument,
    "\n  query AdminWarningsRestorePreviewQuery($warningId: ID!) {\n    previewWarningRestore(warningId: $warningId) {\n      warningId\n      restoreTeams {\n        id\n        name\n      }\n      teamDeleted\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n": typeof types.AdminWarningsRestorePreviewQueryDocument,
    "\n  mutation AdminWarningsFulfillPenalty($memberId: ID!) {\n    fulfillPenalty(memberId: $memberId) {\n      member {\n        id\n      }\n      fulfilledAt\n    }\n  }\n": typeof types.AdminWarningsFulfillPenaltyDocument,
    "\n  mutation AdminWarningsRestoreWarning($warningId: ID!) {\n    restoreWarning(warningId: $warningId) {\n      warningId\n      warningCount\n      penaltyTarget\n    }\n  }\n": typeof types.AdminWarningsRestoreWarningDocument,
    "\n  query HomeQuery {\n    myWeeklyActivity {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n    }\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n": typeof types.HomeQueryDocument,
    "\n  query HomeNoticesQuery {\n    notices {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n": typeof types.HomeNoticesQueryDocument,
    "\n  query NoticeListQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n": typeof types.NoticeListQueryDocument,
    "\n  query NoticeDetailQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.NoticeDetailQueryDocument,
    "\n  query PostListQuery($type: PostType!, $q: String, $tag: String, $after: String) {\n    posts(type: $type, q: $q, tag: $tag, after: $after) {\n      items {\n        id\n        type\n        title\n        tags\n        isRecord\n        createdAt\n        commentCount\n        author {\n          id\n          nickname\n        }\n        teamName\n      }\n      nextCursor\n      totalCount\n    }\n  }\n": typeof types.PostListQueryDocument,
    "\n  query PostTypeCountsQuery($q: String, $tag: String) {\n    troubleshooting: posts(type: TROUBLESHOOTING, q: $q, tag: $tag) {\n      totalCount\n    }\n    devlog: posts(type: DEVLOG, q: $q, tag: $tag) {\n      totalCount\n    }\n  }\n": typeof types.PostTypeCountsQueryDocument,
    "\n  query PostTagsQuery {\n    popularTags {\n      tag\n      count\n    }\n  }\n": typeof types.PostTagsQueryDocument,
    "\n  query PostDetailQuery($id: ID!, $after: String) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      teamName\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      author {\n        id\n        nickname\n        profileImageUrl\n      }\n      isRecord\n      writtenDate\n      createdAt\n      updatedAt\n      commentCount\n      comments(after: $after) {\n        items {\n          id\n          authorId\n          content\n          createdAt\n          updatedAt\n          author {\n            id\n            nickname\n            profileImageUrl\n          }\n        }\n        nextCursor\n      }\n    }\n    myTeams {\n      id\n      isLeader\n    }\n  }\n": typeof types.PostDetailQueryDocument,
    "\n  mutation PostDelete($id: ID!) {\n    deletePost(id: $id)\n  }\n": typeof types.PostDeleteDocument,
    "\n  mutation PostAdminDelete($postId: ID!) {\n    adminDeletePost(postId: $postId)\n  }\n": typeof types.PostAdminDeleteDocument,
    "\n  mutation PostAddComment($postId: ID!, $content: String!) {\n    createComment(postId: $postId, content: $content) {\n      id\n      content\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PostAddCommentDocument,
    "\n  mutation PostUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n": typeof types.PostUpdateCommentDocument,
    "\n  mutation PostDeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n": typeof types.PostDeleteCommentDocument,
    "\n  mutation PostAdminDeleteComment($commentId: ID!) {\n    adminDeleteComment(commentId: $commentId)\n  }\n": typeof types.PostAdminDeleteCommentDocument,
    "\n  query PostEditorTeamsQuery {\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n    }\n  }\n": typeof types.PostEditorTeamsQueryDocument,
    "\n  query PostEditorPostQuery($id: ID!) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      writtenDate\n    }\n  }\n": typeof types.PostEditorPostQueryDocument,
    "\n  mutation PostCreate($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      writtenDate\n      createdAt\n      updatedAt\n    }\n  }\n": typeof types.PostCreateDocument,
    "\n  mutation PostUpdate($id: ID!, $input: UpdatePostInput!) {\n    updatePost(id: $id, input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      updatedAt\n    }\n  }\n": typeof types.PostUpdateDocument,
    "\n  query ProfileQuery($id: ID!) {\n    profile(memberId: $id) {\n      id\n      nickname\n      githubLogin\n      profileImageUrl\n      isMine\n      postCount\n      commentCount\n      grass {\n        from\n        to\n        fetchedAt\n        days {\n          date\n          count\n        }\n      }\n      warning {\n        onHold\n        warningCount\n        penaltyTarget\n      }\n      teamWarnings {\n        onHold\n        teams {\n          name\n          count\n        }\n      }\n      teams {\n        id\n        name\n      }\n    }\n    myTeams {\n      id\n    }\n  }\n": typeof types.ProfileQueryDocument,
    "\n  query ProfileHistoryQuery($id: ID!, $after: String) {\n    profile(memberId: $id) {\n      id\n      judgmentHistory(after: $after) {\n        items {\n          weekStart\n          weekEnd\n          result\n          verifiedDays\n          recordCount\n        }\n        nextCursor\n      }\n    }\n  }\n": typeof types.ProfileHistoryQueryDocument,
    "\n  query TeamListQuery {\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n      weekSummary {\n        passCount\n        notYetCount\n      }\n    }\n  }\n": typeof types.TeamListQueryDocument,
    "\n  mutation TeamCreate($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      inviteCode\n      team {\n        id\n        name\n        isPublic\n        isLeader\n        memberCount\n      }\n    }\n  }\n": typeof types.TeamCreateDocument,
    "\n  mutation TeamJoinByCode($code: String!) {\n    joinTeamByCode(code: $code) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n": typeof types.TeamJoinByCodeDocument,
    "\n  query TeamInvitationsQuery($after: String) {\n    receivedTeamInvitations(after: $after) {\n      items {\n        id\n        teamId\n        teamName\n        createdAt\n        inviter {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": typeof types.TeamInvitationsQueryDocument,
    "\n  mutation TeamAcceptInvitation($invitationId: ID!) {\n    acceptTeamInvitation(invitationId: $invitationId) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n": typeof types.TeamAcceptInvitationDocument,
    "\n  mutation TeamDeclineInvitation($invitationId: ID!) {\n    declineTeamInvitation(invitationId: $invitationId)\n  }\n": typeof types.TeamDeclineInvitationDocument,
    "\n  query TeamBoardQuery($id: ID!) {\n    teamBoard(teamId: $id) {\n      weekStart\n      weekEnd\n      grassFetchedAt\n      grassNotLoaded\n      members {\n        memberId\n        nickname\n        githubLogin\n        isMe\n        days {\n          date\n          hasGrass\n          hasRecord\n          verified\n        }\n        verifiedDays\n        recordCount\n        warningCount\n        status\n      }\n      recentPosts {\n        id\n        type\n        title\n        createdAt\n        isRecord\n        author {\n          id\n          nickname\n        }\n      }\n    }\n  }\n": typeof types.TeamBoardQueryDocument,
    "\n  mutation TeamLeave($teamId: ID!) {\n    leaveTeam(teamId: $teamId)\n  }\n": typeof types.TeamLeaveDocument,
    "\n  query TeamManageQuery($id: ID!) {\n    teamInviteCode(teamId: $id)\n    sentTeamInvitations(teamId: $id) {\n      items {\n        id\n        createdAt\n        invitee {\n          id\n          nickname\n          githubLogin\n        }\n      }\n      nextCursor\n    }\n  }\n": typeof types.TeamManageQueryDocument,
    "\n  query TeamMembersQuery($id: ID!, $after: String) {\n    teamMembers(teamId: $id, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        profileImageUrl\n        isLeader\n        joinedAt\n      }\n      nextCursor\n    }\n  }\n": typeof types.TeamMembersQueryDocument,
    "\n  query TeamPostsQuery($id: ID!, $after: String) {\n    teamPosts(teamId: $id, after: $after) {\n      items {\n        id\n        type\n        title\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": typeof types.TeamPostsQueryDocument,
    "\n  query TeamCommentsQuery($id: ID!, $after: String) {\n    teamComments(teamId: $id, after: $after) {\n      items {\n        id\n        postId\n        content\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": typeof types.TeamCommentsQueryDocument,
    "\n  mutation TeamInviteMember($teamId: ID!, $githubLogin: String!) {\n    inviteToTeam(teamId: $teamId, githubLogin: $githubLogin) {\n      id\n      createdAt\n      invitee {\n        id\n        nickname\n        githubLogin\n      }\n    }\n  }\n": typeof types.TeamInviteMemberDocument,
    "\n  mutation TeamCancelInvitation($invitationId: ID!) {\n    cancelTeamInvitation(invitationId: $invitationId)\n  }\n": typeof types.TeamCancelInvitationDocument,
    "\n  mutation TeamKickMember($teamId: ID!, $memberId: ID!) {\n    kickTeamMember(teamId: $teamId, memberId: $memberId)\n  }\n": typeof types.TeamKickMemberDocument,
    "\n  mutation TeamTransferLeadership($teamId: ID!, $newLeaderId: ID!) {\n    transferTeamLeadership(teamId: $teamId, newLeaderId: $newLeaderId) {\n      id\n      isLeader\n      memberCount\n    }\n  }\n": typeof types.TeamTransferLeadershipDocument,
    "\n  mutation TeamSetVisibility($teamId: ID!, $isPublic: Boolean!) {\n    updateTeam(teamId: $teamId, input: { isPublic: $isPublic }) {\n      id\n      isPublic\n    }\n  }\n": typeof types.TeamSetVisibilityDocument,
    "\n  mutation TeamDelete($teamId: ID!) {\n    deleteTeam(teamId: $teamId)\n  }\n": typeof types.TeamDeleteDocument,
    "\n  mutation TeamUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n": typeof types.TeamUpdateCommentDocument,
    "\n  query TeamExemptionQuery($id: ID!) {\n    teamMembers(teamId: $id) {\n      items {\n        id\n        nickname\n      }\n      nextCursor\n    }\n    myPersonalExemptionRequests {\n      items {\n        id\n        weekStart\n        weekEnd\n        status\n        rejectReason\n        overlapsExemptionPeriod\n        createdAt\n        member {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": typeof types.TeamExemptionQueryDocument,
    "\n  mutation TeamRequestExemption($teamId: ID!, $memberId: ID!, $weekStart: String!, $reason: String!) {\n    requestPersonalExemption(teamId: $teamId, memberId: $memberId, weekStart: $weekStart, reason: $reason) {\n      id\n      weekStart\n      weekEnd\n      status\n      rejectReason\n      overlapsExemptionPeriod\n      createdAt\n      member {\n        id\n        nickname\n      }\n    }\n  }\n": typeof types.TeamRequestExemptionDocument,
    "\n  query TeamScopeQuery($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n": typeof types.TeamScopeQueryDocument,
    "\n  query AdminLayoutCountsQuery {\n    adminDashboardSummary {\n      pendingMembers\n      penaltyTargets\n      pendingExemptions\n    }\n  }\n": typeof types.AdminLayoutCountsQueryDocument,
    "\n  query SessionQuery {\n    me {\n      id\n      githubLogin\n      nickname\n      profileImageUrl\n      status\n      role\n    }\n  }\n": typeof types.SessionQueryDocument,
    "\n  query SessionTeamsQuery {\n    myTeams {\n      id\n    }\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n  }\n": typeof types.SessionTeamsQueryDocument,
    "\n  mutation SessionExchangeAuthCode($code: String!) {\n    exchangeAuthCode(code: $code) {\n      accessToken\n      expiresIn\n      me {\n        id\n        status\n      }\n    }\n  }\n": typeof types.SessionExchangeAuthCodeDocument,
};
const documents: Documents = {
    "\n  query WeeklyQuery($weekStart: String) {\n    myWeeklyActivity(weekStart: $weekStart) {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n      judgment {\n        status\n        skipReason\n      }\n    }\n  }\n": types.WeeklyQueryDocument,
    "\n  query WeeklyHistoryQuery($after: String) {\n    myJudgmentHistory(after: $after) {\n      items {\n        weekStart\n        weekEnd\n        status\n        skipReason\n        verifiedDays\n        recordCount\n      }\n      nextCursor\n    }\n  }\n": types.WeeklyHistoryQueryDocument,
    "\n  query WarningsQuery {\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n": types.WarningsQueryDocument,
    "\n  query WarningHistoryQuery($after: String) {\n    myWarningHistory(after: $after) {\n      onHold\n      items {\n        weekStart\n        weekEnd\n        verifiedDays\n        recordCount\n        categories\n        status\n      }\n      nextCursor\n    }\n  }\n": types.WarningHistoryQueryDocument,
    "\n  query AdminDashboardSummaryQuery {\n    adminDashboardSummary {\n      judgedWeekStart\n      pendingMembers\n      failedMembers\n      penaltyTargets\n      pendingExemptions\n    }\n    adminJudgmentHolds {\n      items {\n        member {\n          id\n          nickname\n        }\n        weekStart\n        reason\n        retryCount\n        retriesExhausted\n      }\n      nextCursor\n      totalCount\n      identityMismatchCount\n    }\n  }\n": types.AdminDashboardSummaryQueryDocument,
    "\n  query AdminDashboardWeekQuery($weekStart: String, $filter: AdminJudgmentFilter, $keyword: String, $after: String) {\n    adminJudgments(weekStart: $weekStart, filter: $filter, keyword: $keyword, after: $after) {\n      weekStart\n      weekEnd\n      executedAt\n      passCount\n      failCount\n      exemptCount\n      firstWeekCount\n      holdCount\n      items {\n        judgmentId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        status\n        skipReason\n        holdReason\n        verifiedDays\n        recordCount\n        warningCount\n        corrected\n        manualHold\n      }\n      nextCursor\n    }\n  }\n": types.AdminDashboardWeekQueryDocument,
    "\n  query AdminDashboardCorrectionPreviewQuery($judgmentId: ID!, $status: AdminCorrectionStatus!) {\n    previewJudgmentCorrection(judgmentId: $judgmentId, status: $status) {\n      judgmentId\n      currentStatus\n      targetStatus\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n": types.AdminDashboardCorrectionPreviewQueryDocument,
    "\n  mutation AdminDashboardCorrectJudgment($input: JudgmentCorrectionInput!) {\n    correctJudgment(input: $input) {\n      judgmentId\n      status\n      warningCount\n      penaltyTarget\n    }\n  }\n": types.AdminDashboardCorrectJudgmentDocument,
    "\n  mutation AdminDashboardRetryHold($memberId: ID!, $weekStart: String!) {\n    retryJudgmentHold(memberId: $memberId, weekStart: $weekStart) {\n      status\n      resolved\n    }\n  }\n": types.AdminDashboardRetryHoldDocument,
    "\n  mutation AdminDashboardRetryAllHolds {\n    retryAllJudgmentHolds {\n      attempted\n      resolved\n      stillHold\n      failed\n    }\n  }\n": types.AdminDashboardRetryAllHoldsDocument,
    "\n  query AdminExemptionsPeriodsQuery($after: String) {\n    exemptionPeriods(after: $after) {\n      items {\n        id\n        weekStart\n        weekEnd\n        reason\n      }\n      nextCursor\n    }\n  }\n": types.AdminExemptionsPeriodsQueryDocument,
    "\n  query AdminExemptionsPeriodPreviewQuery($weekStart: String!) {\n    previewExemptionPeriod(weekStart: $weekStart) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n": types.AdminExemptionsPeriodPreviewQueryDocument,
    "\n  mutation AdminExemptionsCreatePeriod($input: ExemptionPeriodInput!) {\n    createExemptionPeriod(input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n": types.AdminExemptionsCreatePeriodDocument,
    "\n  mutation AdminExemptionsUpdatePeriod($id: ID!, $input: ExemptionPeriodInput!) {\n    updateExemptionPeriod(id: $id, input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n": types.AdminExemptionsUpdatePeriodDocument,
    "\n  mutation AdminExemptionsDeletePeriod($id: ID!) {\n    deleteExemptionPeriod(id: $id)\n  }\n": types.AdminExemptionsDeletePeriodDocument,
    "\n  query AdminExemptionsRequestsQuery($status: PersonalExemptionStatus!, $after: String) {\n    personalExemptionRequests(status: $status, after: $after) {\n      items {\n        id\n        member {\n          id\n          nickname\n        }\n        requester {\n          id\n          nickname\n        }\n        weekStart\n        weekEnd\n        reason\n        status\n        rejectReason\n        createdAt\n        respondedAt\n        overlapsExemptionPeriod\n      }\n      nextCursor\n    }\n  }\n": types.AdminExemptionsRequestsQueryDocument,
    "\n  query AdminExemptionsApprovalPreviewQuery($id: ID!) {\n    previewPersonalExemptionApproval(id: $id) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n": types.AdminExemptionsApprovalPreviewQueryDocument,
    "\n  mutation AdminExemptionsApprove($id: ID!) {\n    approvePersonalExemption(id: $id) {\n      id\n      status\n      respondedAt\n    }\n  }\n": types.AdminExemptionsApproveDocument,
    "\n  mutation AdminExemptionsReject($id: ID!, $reason: String!) {\n    rejectPersonalExemption(id: $id, reason: $reason) {\n      id\n      status\n      rejectReason\n      respondedAt\n    }\n  }\n": types.AdminExemptionsRejectDocument,
    "\n  query AdminExemptionsSummaryQuery {\n    adminDashboardSummary {\n      pendingExemptions\n    }\n  }\n": types.AdminExemptionsSummaryQueryDocument,
    "\n  query AdminMembersQuery($status: MemberApprovalFilter!, $keyword: String, $after: String) {\n    adminMembers(status: $status, keyword: $keyword, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        status\n        role\n        createdAt\n      }\n      nextCursor\n      totalCount\n    }\n  }\n": types.AdminMembersQueryDocument,
    "\n  query AdminMembersSummaryQuery {\n    adminDashboardSummary {\n      pendingMembers\n    }\n  }\n": types.AdminMembersSummaryQueryDocument,
    "\n  mutation AdminMembersApprove($memberId: ID!) {\n    approveMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": types.AdminMembersApproveDocument,
    "\n  mutation AdminMembersReject($memberId: ID!) {\n    rejectMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": types.AdminMembersRejectDocument,
    "\n  mutation AdminMembersRevert($memberId: ID!) {\n    revertMemberToPending(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": types.AdminMembersRevertDocument,
    "\n  mutation AdminMembersPromote($memberId: ID!) {\n    promoteMemberToAdmin(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n": types.AdminMembersPromoteDocument,
    "\n  query AdminNoticesQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        isSystem\n        createdAt\n        updatedAt\n      }\n      nextCursor\n    }\n  }\n": types.AdminNoticesQueryDocument,
    "\n  query AdminNoticesEditorQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n    }\n  }\n": types.AdminNoticesEditorQueryDocument,
    "\n  mutation AdminNoticesCreate($input: NoticeInput!) {\n    createNotice(input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminNoticesCreateDocument,
    "\n  mutation AdminNoticesUpdate($id: ID!, $input: NoticeInput!) {\n    updateNotice(id: $id, input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n": types.AdminNoticesUpdateDocument,
    "\n  mutation AdminNoticesDelete($id: ID!) {\n    deleteNotice(id: $id)\n  }\n": types.AdminNoticesDeleteDocument,
    "\n  mutation AdminNoticesSetPinned($id: ID!, $isPinned: Boolean!) {\n    setNoticePinned(id: $id, isPinned: $isPinned) {\n      id\n      isPinned\n    }\n  }\n": types.AdminNoticesSetPinnedDocument,
    "\n  query AdminPostsQuery($filter: AdminPostFilter!, $keyword: String, $after: String) {\n    adminPosts(filter: $filter, keyword: $keyword, after: $after) {\n      items {\n        kind\n        id\n        postId\n        title\n        content\n        author {\n          id\n          nickname\n        }\n        createdAt\n      }\n      nextCursor\n    }\n  }\n": types.AdminPostsQueryDocument,
    "\n  mutation AdminPostsDeletePost($id: ID!) {\n    adminDeletePost(postId: $id)\n  }\n": types.AdminPostsDeletePostDocument,
    "\n  mutation AdminPostsDeleteComment($id: ID!) {\n    adminDeleteComment(commentId: $id)\n  }\n": types.AdminPostsDeleteCommentDocument,
    "\n  query AdminWarningsPenaltyTargetsQuery($after: String) {\n    adminPenaltyTargets(after: $after) {\n      items {\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        warningCount\n        reachedWeek\n        teams {\n          id\n          name\n        }\n      }\n      nextCursor\n      totalCount\n    }\n  }\n": types.AdminWarningsPenaltyTargetsQueryDocument,
    "\n  query AdminWarningsDeletedQuery($after: String) {\n    adminDeletedWarnings(after: $after) {\n      items {\n        warningId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        weekStart\n        deleteReason\n        deletedAt\n        restoreTeams {\n          id\n          name\n        }\n        teamDeleted\n      }\n      nextCursor\n    }\n  }\n": types.AdminWarningsDeletedQueryDocument,
    "\n  query AdminWarningsRestorePreviewQuery($warningId: ID!) {\n    previewWarningRestore(warningId: $warningId) {\n      warningId\n      restoreTeams {\n        id\n        name\n      }\n      teamDeleted\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n": types.AdminWarningsRestorePreviewQueryDocument,
    "\n  mutation AdminWarningsFulfillPenalty($memberId: ID!) {\n    fulfillPenalty(memberId: $memberId) {\n      member {\n        id\n      }\n      fulfilledAt\n    }\n  }\n": types.AdminWarningsFulfillPenaltyDocument,
    "\n  mutation AdminWarningsRestoreWarning($warningId: ID!) {\n    restoreWarning(warningId: $warningId) {\n      warningId\n      warningCount\n      penaltyTarget\n    }\n  }\n": types.AdminWarningsRestoreWarningDocument,
    "\n  query HomeQuery {\n    myWeeklyActivity {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n    }\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n": types.HomeQueryDocument,
    "\n  query HomeNoticesQuery {\n    notices {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n": types.HomeNoticesQueryDocument,
    "\n  query NoticeListQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n": types.NoticeListQueryDocument,
    "\n  query NoticeDetailQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n": types.NoticeDetailQueryDocument,
    "\n  query PostListQuery($type: PostType!, $q: String, $tag: String, $after: String) {\n    posts(type: $type, q: $q, tag: $tag, after: $after) {\n      items {\n        id\n        type\n        title\n        tags\n        isRecord\n        createdAt\n        commentCount\n        author {\n          id\n          nickname\n        }\n        teamName\n      }\n      nextCursor\n      totalCount\n    }\n  }\n": types.PostListQueryDocument,
    "\n  query PostTypeCountsQuery($q: String, $tag: String) {\n    troubleshooting: posts(type: TROUBLESHOOTING, q: $q, tag: $tag) {\n      totalCount\n    }\n    devlog: posts(type: DEVLOG, q: $q, tag: $tag) {\n      totalCount\n    }\n  }\n": types.PostTypeCountsQueryDocument,
    "\n  query PostTagsQuery {\n    popularTags {\n      tag\n      count\n    }\n  }\n": types.PostTagsQueryDocument,
    "\n  query PostDetailQuery($id: ID!, $after: String) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      teamName\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      author {\n        id\n        nickname\n        profileImageUrl\n      }\n      isRecord\n      writtenDate\n      createdAt\n      updatedAt\n      commentCount\n      comments(after: $after) {\n        items {\n          id\n          authorId\n          content\n          createdAt\n          updatedAt\n          author {\n            id\n            nickname\n            profileImageUrl\n          }\n        }\n        nextCursor\n      }\n    }\n    myTeams {\n      id\n      isLeader\n    }\n  }\n": types.PostDetailQueryDocument,
    "\n  mutation PostDelete($id: ID!) {\n    deletePost(id: $id)\n  }\n": types.PostDeleteDocument,
    "\n  mutation PostAdminDelete($postId: ID!) {\n    adminDeletePost(postId: $postId)\n  }\n": types.PostAdminDeleteDocument,
    "\n  mutation PostAddComment($postId: ID!, $content: String!) {\n    createComment(postId: $postId, content: $content) {\n      id\n      content\n      createdAt\n      updatedAt\n    }\n  }\n": types.PostAddCommentDocument,
    "\n  mutation PostUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n": types.PostUpdateCommentDocument,
    "\n  mutation PostDeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n": types.PostDeleteCommentDocument,
    "\n  mutation PostAdminDeleteComment($commentId: ID!) {\n    adminDeleteComment(commentId: $commentId)\n  }\n": types.PostAdminDeleteCommentDocument,
    "\n  query PostEditorTeamsQuery {\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n    }\n  }\n": types.PostEditorTeamsQueryDocument,
    "\n  query PostEditorPostQuery($id: ID!) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      writtenDate\n    }\n  }\n": types.PostEditorPostQueryDocument,
    "\n  mutation PostCreate($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      writtenDate\n      createdAt\n      updatedAt\n    }\n  }\n": types.PostCreateDocument,
    "\n  mutation PostUpdate($id: ID!, $input: UpdatePostInput!) {\n    updatePost(id: $id, input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      updatedAt\n    }\n  }\n": types.PostUpdateDocument,
    "\n  query ProfileQuery($id: ID!) {\n    profile(memberId: $id) {\n      id\n      nickname\n      githubLogin\n      profileImageUrl\n      isMine\n      postCount\n      commentCount\n      grass {\n        from\n        to\n        fetchedAt\n        days {\n          date\n          count\n        }\n      }\n      warning {\n        onHold\n        warningCount\n        penaltyTarget\n      }\n      teamWarnings {\n        onHold\n        teams {\n          name\n          count\n        }\n      }\n      teams {\n        id\n        name\n      }\n    }\n    myTeams {\n      id\n    }\n  }\n": types.ProfileQueryDocument,
    "\n  query ProfileHistoryQuery($id: ID!, $after: String) {\n    profile(memberId: $id) {\n      id\n      judgmentHistory(after: $after) {\n        items {\n          weekStart\n          weekEnd\n          result\n          verifiedDays\n          recordCount\n        }\n        nextCursor\n      }\n    }\n  }\n": types.ProfileHistoryQueryDocument,
    "\n  query TeamListQuery {\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n      weekSummary {\n        passCount\n        notYetCount\n      }\n    }\n  }\n": types.TeamListQueryDocument,
    "\n  mutation TeamCreate($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      inviteCode\n      team {\n        id\n        name\n        isPublic\n        isLeader\n        memberCount\n      }\n    }\n  }\n": types.TeamCreateDocument,
    "\n  mutation TeamJoinByCode($code: String!) {\n    joinTeamByCode(code: $code) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n": types.TeamJoinByCodeDocument,
    "\n  query TeamInvitationsQuery($after: String) {\n    receivedTeamInvitations(after: $after) {\n      items {\n        id\n        teamId\n        teamName\n        createdAt\n        inviter {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": types.TeamInvitationsQueryDocument,
    "\n  mutation TeamAcceptInvitation($invitationId: ID!) {\n    acceptTeamInvitation(invitationId: $invitationId) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n": types.TeamAcceptInvitationDocument,
    "\n  mutation TeamDeclineInvitation($invitationId: ID!) {\n    declineTeamInvitation(invitationId: $invitationId)\n  }\n": types.TeamDeclineInvitationDocument,
    "\n  query TeamBoardQuery($id: ID!) {\n    teamBoard(teamId: $id) {\n      weekStart\n      weekEnd\n      grassFetchedAt\n      grassNotLoaded\n      members {\n        memberId\n        nickname\n        githubLogin\n        isMe\n        days {\n          date\n          hasGrass\n          hasRecord\n          verified\n        }\n        verifiedDays\n        recordCount\n        warningCount\n        status\n      }\n      recentPosts {\n        id\n        type\n        title\n        createdAt\n        isRecord\n        author {\n          id\n          nickname\n        }\n      }\n    }\n  }\n": types.TeamBoardQueryDocument,
    "\n  mutation TeamLeave($teamId: ID!) {\n    leaveTeam(teamId: $teamId)\n  }\n": types.TeamLeaveDocument,
    "\n  query TeamManageQuery($id: ID!) {\n    teamInviteCode(teamId: $id)\n    sentTeamInvitations(teamId: $id) {\n      items {\n        id\n        createdAt\n        invitee {\n          id\n          nickname\n          githubLogin\n        }\n      }\n      nextCursor\n    }\n  }\n": types.TeamManageQueryDocument,
    "\n  query TeamMembersQuery($id: ID!, $after: String) {\n    teamMembers(teamId: $id, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        profileImageUrl\n        isLeader\n        joinedAt\n      }\n      nextCursor\n    }\n  }\n": types.TeamMembersQueryDocument,
    "\n  query TeamPostsQuery($id: ID!, $after: String) {\n    teamPosts(teamId: $id, after: $after) {\n      items {\n        id\n        type\n        title\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": types.TeamPostsQueryDocument,
    "\n  query TeamCommentsQuery($id: ID!, $after: String) {\n    teamComments(teamId: $id, after: $after) {\n      items {\n        id\n        postId\n        content\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": types.TeamCommentsQueryDocument,
    "\n  mutation TeamInviteMember($teamId: ID!, $githubLogin: String!) {\n    inviteToTeam(teamId: $teamId, githubLogin: $githubLogin) {\n      id\n      createdAt\n      invitee {\n        id\n        nickname\n        githubLogin\n      }\n    }\n  }\n": types.TeamInviteMemberDocument,
    "\n  mutation TeamCancelInvitation($invitationId: ID!) {\n    cancelTeamInvitation(invitationId: $invitationId)\n  }\n": types.TeamCancelInvitationDocument,
    "\n  mutation TeamKickMember($teamId: ID!, $memberId: ID!) {\n    kickTeamMember(teamId: $teamId, memberId: $memberId)\n  }\n": types.TeamKickMemberDocument,
    "\n  mutation TeamTransferLeadership($teamId: ID!, $newLeaderId: ID!) {\n    transferTeamLeadership(teamId: $teamId, newLeaderId: $newLeaderId) {\n      id\n      isLeader\n      memberCount\n    }\n  }\n": types.TeamTransferLeadershipDocument,
    "\n  mutation TeamSetVisibility($teamId: ID!, $isPublic: Boolean!) {\n    updateTeam(teamId: $teamId, input: { isPublic: $isPublic }) {\n      id\n      isPublic\n    }\n  }\n": types.TeamSetVisibilityDocument,
    "\n  mutation TeamDelete($teamId: ID!) {\n    deleteTeam(teamId: $teamId)\n  }\n": types.TeamDeleteDocument,
    "\n  mutation TeamUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n": types.TeamUpdateCommentDocument,
    "\n  query TeamExemptionQuery($id: ID!) {\n    teamMembers(teamId: $id) {\n      items {\n        id\n        nickname\n      }\n      nextCursor\n    }\n    myPersonalExemptionRequests {\n      items {\n        id\n        weekStart\n        weekEnd\n        status\n        rejectReason\n        overlapsExemptionPeriod\n        createdAt\n        member {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n": types.TeamExemptionQueryDocument,
    "\n  mutation TeamRequestExemption($teamId: ID!, $memberId: ID!, $weekStart: String!, $reason: String!) {\n    requestPersonalExemption(teamId: $teamId, memberId: $memberId, weekStart: $weekStart, reason: $reason) {\n      id\n      weekStart\n      weekEnd\n      status\n      rejectReason\n      overlapsExemptionPeriod\n      createdAt\n      member {\n        id\n        nickname\n      }\n    }\n  }\n": types.TeamRequestExemptionDocument,
    "\n  query TeamScopeQuery($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n": types.TeamScopeQueryDocument,
    "\n  query AdminLayoutCountsQuery {\n    adminDashboardSummary {\n      pendingMembers\n      penaltyTargets\n      pendingExemptions\n    }\n  }\n": types.AdminLayoutCountsQueryDocument,
    "\n  query SessionQuery {\n    me {\n      id\n      githubLogin\n      nickname\n      profileImageUrl\n      status\n      role\n    }\n  }\n": types.SessionQueryDocument,
    "\n  query SessionTeamsQuery {\n    myTeams {\n      id\n    }\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n  }\n": types.SessionTeamsQueryDocument,
    "\n  mutation SessionExchangeAuthCode($code: String!) {\n    exchangeAuthCode(code: $code) {\n      accessToken\n      expiresIn\n      me {\n        id\n        status\n      }\n    }\n  }\n": types.SessionExchangeAuthCodeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WeeklyQuery($weekStart: String) {\n    myWeeklyActivity(weekStart: $weekStart) {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n      judgment {\n        status\n        skipReason\n      }\n    }\n  }\n"): (typeof documents)["\n  query WeeklyQuery($weekStart: String) {\n    myWeeklyActivity(weekStart: $weekStart) {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n      judgment {\n        status\n        skipReason\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WeeklyHistoryQuery($after: String) {\n    myJudgmentHistory(after: $after) {\n      items {\n        weekStart\n        weekEnd\n        status\n        skipReason\n        verifiedDays\n        recordCount\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query WeeklyHistoryQuery($after: String) {\n    myJudgmentHistory(after: $after) {\n      items {\n        weekStart\n        weekEnd\n        status\n        skipReason\n        verifiedDays\n        recordCount\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WarningsQuery {\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n"): (typeof documents)["\n  query WarningsQuery {\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query WarningHistoryQuery($after: String) {\n    myWarningHistory(after: $after) {\n      onHold\n      items {\n        weekStart\n        weekEnd\n        verifiedDays\n        recordCount\n        categories\n        status\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query WarningHistoryQuery($after: String) {\n    myWarningHistory(after: $after) {\n      onHold\n      items {\n        weekStart\n        weekEnd\n        verifiedDays\n        recordCount\n        categories\n        status\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminDashboardSummaryQuery {\n    adminDashboardSummary {\n      judgedWeekStart\n      pendingMembers\n      failedMembers\n      penaltyTargets\n      pendingExemptions\n    }\n    adminJudgmentHolds {\n      items {\n        member {\n          id\n          nickname\n        }\n        weekStart\n        reason\n        retryCount\n        retriesExhausted\n      }\n      nextCursor\n      totalCount\n      identityMismatchCount\n    }\n  }\n"): (typeof documents)["\n  query AdminDashboardSummaryQuery {\n    adminDashboardSummary {\n      judgedWeekStart\n      pendingMembers\n      failedMembers\n      penaltyTargets\n      pendingExemptions\n    }\n    adminJudgmentHolds {\n      items {\n        member {\n          id\n          nickname\n        }\n        weekStart\n        reason\n        retryCount\n        retriesExhausted\n      }\n      nextCursor\n      totalCount\n      identityMismatchCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminDashboardWeekQuery($weekStart: String, $filter: AdminJudgmentFilter, $keyword: String, $after: String) {\n    adminJudgments(weekStart: $weekStart, filter: $filter, keyword: $keyword, after: $after) {\n      weekStart\n      weekEnd\n      executedAt\n      passCount\n      failCount\n      exemptCount\n      firstWeekCount\n      holdCount\n      items {\n        judgmentId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        status\n        skipReason\n        holdReason\n        verifiedDays\n        recordCount\n        warningCount\n        corrected\n        manualHold\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query AdminDashboardWeekQuery($weekStart: String, $filter: AdminJudgmentFilter, $keyword: String, $after: String) {\n    adminJudgments(weekStart: $weekStart, filter: $filter, keyword: $keyword, after: $after) {\n      weekStart\n      weekEnd\n      executedAt\n      passCount\n      failCount\n      exemptCount\n      firstWeekCount\n      holdCount\n      items {\n        judgmentId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        status\n        skipReason\n        holdReason\n        verifiedDays\n        recordCount\n        warningCount\n        corrected\n        manualHold\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminDashboardCorrectionPreviewQuery($judgmentId: ID!, $status: AdminCorrectionStatus!) {\n    previewJudgmentCorrection(judgmentId: $judgmentId, status: $status) {\n      judgmentId\n      currentStatus\n      targetStatus\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminDashboardCorrectionPreviewQuery($judgmentId: ID!, $status: AdminCorrectionStatus!) {\n    previewJudgmentCorrection(judgmentId: $judgmentId, status: $status) {\n      judgmentId\n      currentStatus\n      targetStatus\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDashboardCorrectJudgment($input: JudgmentCorrectionInput!) {\n    correctJudgment(input: $input) {\n      judgmentId\n      status\n      warningCount\n      penaltyTarget\n    }\n  }\n"): (typeof documents)["\n  mutation AdminDashboardCorrectJudgment($input: JudgmentCorrectionInput!) {\n    correctJudgment(input: $input) {\n      judgmentId\n      status\n      warningCount\n      penaltyTarget\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDashboardRetryHold($memberId: ID!, $weekStart: String!) {\n    retryJudgmentHold(memberId: $memberId, weekStart: $weekStart) {\n      status\n      resolved\n    }\n  }\n"): (typeof documents)["\n  mutation AdminDashboardRetryHold($memberId: ID!, $weekStart: String!) {\n    retryJudgmentHold(memberId: $memberId, weekStart: $weekStart) {\n      status\n      resolved\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminDashboardRetryAllHolds {\n    retryAllJudgmentHolds {\n      attempted\n      resolved\n      stillHold\n      failed\n    }\n  }\n"): (typeof documents)["\n  mutation AdminDashboardRetryAllHolds {\n    retryAllJudgmentHolds {\n      attempted\n      resolved\n      stillHold\n      failed\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminExemptionsPeriodsQuery($after: String) {\n    exemptionPeriods(after: $after) {\n      items {\n        id\n        weekStart\n        weekEnd\n        reason\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query AdminExemptionsPeriodsQuery($after: String) {\n    exemptionPeriods(after: $after) {\n      items {\n        id\n        weekStart\n        weekEnd\n        reason\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminExemptionsPeriodPreviewQuery($weekStart: String!) {\n    previewExemptionPeriod(weekStart: $weekStart) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminExemptionsPeriodPreviewQuery($weekStart: String!) {\n    previewExemptionPeriod(weekStart: $weekStart) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminExemptionsCreatePeriod($input: ExemptionPeriodInput!) {\n    createExemptionPeriod(input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n"): (typeof documents)["\n  mutation AdminExemptionsCreatePeriod($input: ExemptionPeriodInput!) {\n    createExemptionPeriod(input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminExemptionsUpdatePeriod($id: ID!, $input: ExemptionPeriodInput!) {\n    updateExemptionPeriod(id: $id, input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n"): (typeof documents)["\n  mutation AdminExemptionsUpdatePeriod($id: ID!, $input: ExemptionPeriodInput!) {\n    updateExemptionPeriod(id: $id, input: $input) {\n      id\n      weekStart\n      weekEnd\n      reason\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminExemptionsDeletePeriod($id: ID!) {\n    deleteExemptionPeriod(id: $id)\n  }\n"): (typeof documents)["\n  mutation AdminExemptionsDeletePeriod($id: ID!) {\n    deleteExemptionPeriod(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminExemptionsRequestsQuery($status: PersonalExemptionStatus!, $after: String) {\n    personalExemptionRequests(status: $status, after: $after) {\n      items {\n        id\n        member {\n          id\n          nickname\n        }\n        requester {\n          id\n          nickname\n        }\n        weekStart\n        weekEnd\n        reason\n        status\n        rejectReason\n        createdAt\n        respondedAt\n        overlapsExemptionPeriod\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query AdminExemptionsRequestsQuery($status: PersonalExemptionStatus!, $after: String) {\n    personalExemptionRequests(status: $status, after: $after) {\n      items {\n        id\n        member {\n          id\n          nickname\n        }\n        requester {\n          id\n          nickname\n        }\n        weekStart\n        weekEnd\n        reason\n        status\n        rejectReason\n        createdAt\n        respondedAt\n        overlapsExemptionPeriod\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminExemptionsApprovalPreviewQuery($id: ID!) {\n    previewPersonalExemptionApproval(id: $id) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminExemptionsApprovalPreviewQuery($id: ID!) {\n    previewPersonalExemptionApproval(id: $id) {\n      weekStart\n      retroactive\n      items {\n        member {\n          id\n          nickname\n        }\n        currentStatus\n        impact {\n          onHold\n          warningCountBefore\n          warningCountAfter\n          entersPenalty\n          leavesPenalty\n          recordOnly\n          affectedWeeks\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminExemptionsApprove($id: ID!) {\n    approvePersonalExemption(id: $id) {\n      id\n      status\n      respondedAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminExemptionsApprove($id: ID!) {\n    approvePersonalExemption(id: $id) {\n      id\n      status\n      respondedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminExemptionsReject($id: ID!, $reason: String!) {\n    rejectPersonalExemption(id: $id, reason: $reason) {\n      id\n      status\n      rejectReason\n      respondedAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminExemptionsReject($id: ID!, $reason: String!) {\n    rejectPersonalExemption(id: $id, reason: $reason) {\n      id\n      status\n      rejectReason\n      respondedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminExemptionsSummaryQuery {\n    adminDashboardSummary {\n      pendingExemptions\n    }\n  }\n"): (typeof documents)["\n  query AdminExemptionsSummaryQuery {\n    adminDashboardSummary {\n      pendingExemptions\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminMembersQuery($status: MemberApprovalFilter!, $keyword: String, $after: String) {\n    adminMembers(status: $status, keyword: $keyword, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        status\n        role\n        createdAt\n      }\n      nextCursor\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  query AdminMembersQuery($status: MemberApprovalFilter!, $keyword: String, $after: String) {\n    adminMembers(status: $status, keyword: $keyword, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        status\n        role\n        createdAt\n      }\n      nextCursor\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminMembersSummaryQuery {\n    adminDashboardSummary {\n      pendingMembers\n    }\n  }\n"): (typeof documents)["\n  query AdminMembersSummaryQuery {\n    adminDashboardSummary {\n      pendingMembers\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminMembersApprove($memberId: ID!) {\n    approveMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminMembersApprove($memberId: ID!) {\n    approveMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminMembersReject($memberId: ID!) {\n    rejectMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminMembersReject($memberId: ID!) {\n    rejectMember(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminMembersRevert($memberId: ID!) {\n    revertMemberToPending(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminMembersRevert($memberId: ID!) {\n    revertMemberToPending(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminMembersPromote($memberId: ID!) {\n    promoteMemberToAdmin(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminMembersPromote($memberId: ID!) {\n    promoteMemberToAdmin(memberId: $memberId) {\n      id\n      nickname\n      githubLogin\n      status\n      role\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminNoticesQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        isSystem\n        createdAt\n        updatedAt\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query AdminNoticesQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        isSystem\n        createdAt\n        updatedAt\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminNoticesEditorQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n    }\n  }\n"): (typeof documents)["\n  query AdminNoticesEditorQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminNoticesCreate($input: NoticeInput!) {\n    createNotice(input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminNoticesCreate($input: NoticeInput!) {\n    createNotice(input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminNoticesUpdate($id: ID!, $input: NoticeInput!) {\n    updateNotice(id: $id, input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminNoticesUpdate($id: ID!, $input: NoticeInput!) {\n    updateNotice(id: $id, input: $input) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminNoticesDelete($id: ID!) {\n    deleteNotice(id: $id)\n  }\n"): (typeof documents)["\n  mutation AdminNoticesDelete($id: ID!) {\n    deleteNotice(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminNoticesSetPinned($id: ID!, $isPinned: Boolean!) {\n    setNoticePinned(id: $id, isPinned: $isPinned) {\n      id\n      isPinned\n    }\n  }\n"): (typeof documents)["\n  mutation AdminNoticesSetPinned($id: ID!, $isPinned: Boolean!) {\n    setNoticePinned(id: $id, isPinned: $isPinned) {\n      id\n      isPinned\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminPostsQuery($filter: AdminPostFilter!, $keyword: String, $after: String) {\n    adminPosts(filter: $filter, keyword: $keyword, after: $after) {\n      items {\n        kind\n        id\n        postId\n        title\n        content\n        author {\n          id\n          nickname\n        }\n        createdAt\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query AdminPostsQuery($filter: AdminPostFilter!, $keyword: String, $after: String) {\n    adminPosts(filter: $filter, keyword: $keyword, after: $after) {\n      items {\n        kind\n        id\n        postId\n        title\n        content\n        author {\n          id\n          nickname\n        }\n        createdAt\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminPostsDeletePost($id: ID!) {\n    adminDeletePost(postId: $id)\n  }\n"): (typeof documents)["\n  mutation AdminPostsDeletePost($id: ID!) {\n    adminDeletePost(postId: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminPostsDeleteComment($id: ID!) {\n    adminDeleteComment(commentId: $id)\n  }\n"): (typeof documents)["\n  mutation AdminPostsDeleteComment($id: ID!) {\n    adminDeleteComment(commentId: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminWarningsPenaltyTargetsQuery($after: String) {\n    adminPenaltyTargets(after: $after) {\n      items {\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        warningCount\n        reachedWeek\n        teams {\n          id\n          name\n        }\n      }\n      nextCursor\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  query AdminWarningsPenaltyTargetsQuery($after: String) {\n    adminPenaltyTargets(after: $after) {\n      items {\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        warningCount\n        reachedWeek\n        teams {\n          id\n          name\n        }\n      }\n      nextCursor\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminWarningsDeletedQuery($after: String) {\n    adminDeletedWarnings(after: $after) {\n      items {\n        warningId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        weekStart\n        deleteReason\n        deletedAt\n        restoreTeams {\n          id\n          name\n        }\n        teamDeleted\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query AdminWarningsDeletedQuery($after: String) {\n    adminDeletedWarnings(after: $after) {\n      items {\n        warningId\n        member {\n          id\n          nickname\n          githubLogin\n        }\n        weekStart\n        deleteReason\n        deletedAt\n        restoreTeams {\n          id\n          name\n        }\n        teamDeleted\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminWarningsRestorePreviewQuery($warningId: ID!) {\n    previewWarningRestore(warningId: $warningId) {\n      warningId\n      restoreTeams {\n        id\n        name\n      }\n      teamDeleted\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n"): (typeof documents)["\n  query AdminWarningsRestorePreviewQuery($warningId: ID!) {\n    previewWarningRestore(warningId: $warningId) {\n      warningId\n      restoreTeams {\n        id\n        name\n      }\n      teamDeleted\n      impact {\n        onHold\n        warningCountBefore\n        warningCountAfter\n        entersPenalty\n        leavesPenalty\n        recordOnly\n        affectedWeeks\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminWarningsFulfillPenalty($memberId: ID!) {\n    fulfillPenalty(memberId: $memberId) {\n      member {\n        id\n      }\n      fulfilledAt\n    }\n  }\n"): (typeof documents)["\n  mutation AdminWarningsFulfillPenalty($memberId: ID!) {\n    fulfillPenalty(memberId: $memberId) {\n      member {\n        id\n      }\n      fulfilledAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AdminWarningsRestoreWarning($warningId: ID!) {\n    restoreWarning(warningId: $warningId) {\n      warningId\n      warningCount\n      penaltyTarget\n    }\n  }\n"): (typeof documents)["\n  mutation AdminWarningsRestoreWarning($warningId: ID!) {\n    restoreWarning(warningId: $warningId) {\n      warningId\n      warningCount\n      penaltyTarget\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeQuery {\n    myWeeklyActivity {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n    }\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n"): (typeof documents)["\n  query HomeQuery {\n    myWeeklyActivity {\n      weekStart\n      currentWeek\n      inTeam\n      days {\n        date\n        hasGrass\n        grassCount\n        hasRecord\n        recordCount\n      }\n      verifiedDays\n      recordCount\n      requiredVerifiedDays\n      requiredRecordCount\n      passExpected\n      grassAvailable\n      grassFetchedAt\n      banner\n    }\n    myWarningSummary {\n      onHold\n      warningCount\n      streak\n      penaltyTarget\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeNoticesQuery {\n    notices {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query HomeNoticesQuery {\n    notices {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NoticeListQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query NoticeListQuery($after: String) {\n    notices(after: $after) {\n      items {\n        id\n        title\n        isPinned\n        createdAt\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NoticeDetailQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  query NoticeDetailQuery($id: ID!) {\n    notice(id: $id) {\n      id\n      title\n      content\n      isPinned\n      isSystem\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PostListQuery($type: PostType!, $q: String, $tag: String, $after: String) {\n    posts(type: $type, q: $q, tag: $tag, after: $after) {\n      items {\n        id\n        type\n        title\n        tags\n        isRecord\n        createdAt\n        commentCount\n        author {\n          id\n          nickname\n        }\n        teamName\n      }\n      nextCursor\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  query PostListQuery($type: PostType!, $q: String, $tag: String, $after: String) {\n    posts(type: $type, q: $q, tag: $tag, after: $after) {\n      items {\n        id\n        type\n        title\n        tags\n        isRecord\n        createdAt\n        commentCount\n        author {\n          id\n          nickname\n        }\n        teamName\n      }\n      nextCursor\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PostTypeCountsQuery($q: String, $tag: String) {\n    troubleshooting: posts(type: TROUBLESHOOTING, q: $q, tag: $tag) {\n      totalCount\n    }\n    devlog: posts(type: DEVLOG, q: $q, tag: $tag) {\n      totalCount\n    }\n  }\n"): (typeof documents)["\n  query PostTypeCountsQuery($q: String, $tag: String) {\n    troubleshooting: posts(type: TROUBLESHOOTING, q: $q, tag: $tag) {\n      totalCount\n    }\n    devlog: posts(type: DEVLOG, q: $q, tag: $tag) {\n      totalCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PostTagsQuery {\n    popularTags {\n      tag\n      count\n    }\n  }\n"): (typeof documents)["\n  query PostTagsQuery {\n    popularTags {\n      tag\n      count\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PostDetailQuery($id: ID!, $after: String) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      teamName\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      author {\n        id\n        nickname\n        profileImageUrl\n      }\n      isRecord\n      writtenDate\n      createdAt\n      updatedAt\n      commentCount\n      comments(after: $after) {\n        items {\n          id\n          authorId\n          content\n          createdAt\n          updatedAt\n          author {\n            id\n            nickname\n            profileImageUrl\n          }\n        }\n        nextCursor\n      }\n    }\n    myTeams {\n      id\n      isLeader\n    }\n  }\n"): (typeof documents)["\n  query PostDetailQuery($id: ID!, $after: String) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      teamName\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      author {\n        id\n        nickname\n        profileImageUrl\n      }\n      isRecord\n      writtenDate\n      createdAt\n      updatedAt\n      commentCount\n      comments(after: $after) {\n        items {\n          id\n          authorId\n          content\n          createdAt\n          updatedAt\n          author {\n            id\n            nickname\n            profileImageUrl\n          }\n        }\n        nextCursor\n      }\n    }\n    myTeams {\n      id\n      isLeader\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostDelete($id: ID!) {\n    deletePost(id: $id)\n  }\n"): (typeof documents)["\n  mutation PostDelete($id: ID!) {\n    deletePost(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostAdminDelete($postId: ID!) {\n    adminDeletePost(postId: $postId)\n  }\n"): (typeof documents)["\n  mutation PostAdminDelete($postId: ID!) {\n    adminDeletePost(postId: $postId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostAddComment($postId: ID!, $content: String!) {\n    createComment(postId: $postId, content: $content) {\n      id\n      content\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation PostAddComment($postId: ID!, $content: String!) {\n    createComment(postId: $postId, content: $content) {\n      id\n      content\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation PostUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostDeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n"): (typeof documents)["\n  mutation PostDeleteComment($id: ID!) {\n    deleteComment(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostAdminDeleteComment($commentId: ID!) {\n    adminDeleteComment(commentId: $commentId)\n  }\n"): (typeof documents)["\n  mutation PostAdminDeleteComment($commentId: ID!) {\n    adminDeleteComment(commentId: $commentId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PostEditorTeamsQuery {\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n    }\n  }\n"): (typeof documents)["\n  query PostEditorTeamsQuery {\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PostEditorPostQuery($id: ID!) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      writtenDate\n    }\n  }\n"): (typeof documents)["\n  query PostEditorPostQuery($id: ID!) {\n    post(id: $id) {\n      id\n      authorId\n      teamId\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      writtenDate\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostCreate($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      writtenDate\n      createdAt\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation PostCreate($input: CreatePostInput!) {\n    createPost(input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      writtenDate\n      createdAt\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation PostUpdate($id: ID!, $input: UpdatePostInput!) {\n    updatePost(id: $id, input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation PostUpdate($id: ID!, $input: UpdatePostInput!) {\n    updatePost(id: $id, input: $input) {\n      id\n      type\n      title\n      sections {\n        problem\n        cause\n        solution\n        did\n        learned\n      }\n      tags\n      commitUrls\n      isRecord\n      teamId\n      teamName\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProfileQuery($id: ID!) {\n    profile(memberId: $id) {\n      id\n      nickname\n      githubLogin\n      profileImageUrl\n      isMine\n      postCount\n      commentCount\n      grass {\n        from\n        to\n        fetchedAt\n        days {\n          date\n          count\n        }\n      }\n      warning {\n        onHold\n        warningCount\n        penaltyTarget\n      }\n      teamWarnings {\n        onHold\n        teams {\n          name\n          count\n        }\n      }\n      teams {\n        id\n        name\n      }\n    }\n    myTeams {\n      id\n    }\n  }\n"): (typeof documents)["\n  query ProfileQuery($id: ID!) {\n    profile(memberId: $id) {\n      id\n      nickname\n      githubLogin\n      profileImageUrl\n      isMine\n      postCount\n      commentCount\n      grass {\n        from\n        to\n        fetchedAt\n        days {\n          date\n          count\n        }\n      }\n      warning {\n        onHold\n        warningCount\n        penaltyTarget\n      }\n      teamWarnings {\n        onHold\n        teams {\n          name\n          count\n        }\n      }\n      teams {\n        id\n        name\n      }\n    }\n    myTeams {\n      id\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProfileHistoryQuery($id: ID!, $after: String) {\n    profile(memberId: $id) {\n      id\n      judgmentHistory(after: $after) {\n        items {\n          weekStart\n          weekEnd\n          result\n          verifiedDays\n          recordCount\n        }\n        nextCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProfileHistoryQuery($id: ID!, $after: String) {\n    profile(memberId: $id) {\n      id\n      judgmentHistory(after: $after) {\n        items {\n          weekStart\n          weekEnd\n          result\n          verifiedDays\n          recordCount\n        }\n        nextCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamListQuery {\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n      weekSummary {\n        passCount\n        notYetCount\n      }\n    }\n  }\n"): (typeof documents)["\n  query TeamListQuery {\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n    myTeams {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n      weekSummary {\n        passCount\n        notYetCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamCreate($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      inviteCode\n      team {\n        id\n        name\n        isPublic\n        isLeader\n        memberCount\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TeamCreate($input: CreateTeamInput!) {\n    createTeam(input: $input) {\n      inviteCode\n      team {\n        id\n        name\n        isPublic\n        isLeader\n        memberCount\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamJoinByCode($code: String!) {\n    joinTeamByCode(code: $code) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n"): (typeof documents)["\n  mutation TeamJoinByCode($code: String!) {\n    joinTeamByCode(code: $code) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamInvitationsQuery($after: String) {\n    receivedTeamInvitations(after: $after) {\n      items {\n        id\n        teamId\n        teamName\n        createdAt\n        inviter {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query TeamInvitationsQuery($after: String) {\n    receivedTeamInvitations(after: $after) {\n      items {\n        id\n        teamId\n        teamName\n        createdAt\n        inviter {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamAcceptInvitation($invitationId: ID!) {\n    acceptTeamInvitation(invitationId: $invitationId) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n"): (typeof documents)["\n  mutation TeamAcceptInvitation($invitationId: ID!) {\n    acceptTeamInvitation(invitationId: $invitationId) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamDeclineInvitation($invitationId: ID!) {\n    declineTeamInvitation(invitationId: $invitationId)\n  }\n"): (typeof documents)["\n  mutation TeamDeclineInvitation($invitationId: ID!) {\n    declineTeamInvitation(invitationId: $invitationId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamBoardQuery($id: ID!) {\n    teamBoard(teamId: $id) {\n      weekStart\n      weekEnd\n      grassFetchedAt\n      grassNotLoaded\n      members {\n        memberId\n        nickname\n        githubLogin\n        isMe\n        days {\n          date\n          hasGrass\n          hasRecord\n          verified\n        }\n        verifiedDays\n        recordCount\n        warningCount\n        status\n      }\n      recentPosts {\n        id\n        type\n        title\n        createdAt\n        isRecord\n        author {\n          id\n          nickname\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TeamBoardQuery($id: ID!) {\n    teamBoard(teamId: $id) {\n      weekStart\n      weekEnd\n      grassFetchedAt\n      grassNotLoaded\n      members {\n        memberId\n        nickname\n        githubLogin\n        isMe\n        days {\n          date\n          hasGrass\n          hasRecord\n          verified\n        }\n        verifiedDays\n        recordCount\n        warningCount\n        status\n      }\n      recentPosts {\n        id\n        type\n        title\n        createdAt\n        isRecord\n        author {\n          id\n          nickname\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamLeave($teamId: ID!) {\n    leaveTeam(teamId: $teamId)\n  }\n"): (typeof documents)["\n  mutation TeamLeave($teamId: ID!) {\n    leaveTeam(teamId: $teamId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamManageQuery($id: ID!) {\n    teamInviteCode(teamId: $id)\n    sentTeamInvitations(teamId: $id) {\n      items {\n        id\n        createdAt\n        invitee {\n          id\n          nickname\n          githubLogin\n        }\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query TeamManageQuery($id: ID!) {\n    teamInviteCode(teamId: $id)\n    sentTeamInvitations(teamId: $id) {\n      items {\n        id\n        createdAt\n        invitee {\n          id\n          nickname\n          githubLogin\n        }\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamMembersQuery($id: ID!, $after: String) {\n    teamMembers(teamId: $id, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        profileImageUrl\n        isLeader\n        joinedAt\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query TeamMembersQuery($id: ID!, $after: String) {\n    teamMembers(teamId: $id, after: $after) {\n      items {\n        id\n        nickname\n        githubLogin\n        profileImageUrl\n        isLeader\n        joinedAt\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamPostsQuery($id: ID!, $after: String) {\n    teamPosts(teamId: $id, after: $after) {\n      items {\n        id\n        type\n        title\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query TeamPostsQuery($id: ID!, $after: String) {\n    teamPosts(teamId: $id, after: $after) {\n      items {\n        id\n        type\n        title\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamCommentsQuery($id: ID!, $after: String) {\n    teamComments(teamId: $id, after: $after) {\n      items {\n        id\n        postId\n        content\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query TeamCommentsQuery($id: ID!, $after: String) {\n    teamComments(teamId: $id, after: $after) {\n      items {\n        id\n        postId\n        content\n        createdAt\n        author {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamInviteMember($teamId: ID!, $githubLogin: String!) {\n    inviteToTeam(teamId: $teamId, githubLogin: $githubLogin) {\n      id\n      createdAt\n      invitee {\n        id\n        nickname\n        githubLogin\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TeamInviteMember($teamId: ID!, $githubLogin: String!) {\n    inviteToTeam(teamId: $teamId, githubLogin: $githubLogin) {\n      id\n      createdAt\n      invitee {\n        id\n        nickname\n        githubLogin\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamCancelInvitation($invitationId: ID!) {\n    cancelTeamInvitation(invitationId: $invitationId)\n  }\n"): (typeof documents)["\n  mutation TeamCancelInvitation($invitationId: ID!) {\n    cancelTeamInvitation(invitationId: $invitationId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamKickMember($teamId: ID!, $memberId: ID!) {\n    kickTeamMember(teamId: $teamId, memberId: $memberId)\n  }\n"): (typeof documents)["\n  mutation TeamKickMember($teamId: ID!, $memberId: ID!) {\n    kickTeamMember(teamId: $teamId, memberId: $memberId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamTransferLeadership($teamId: ID!, $newLeaderId: ID!) {\n    transferTeamLeadership(teamId: $teamId, newLeaderId: $newLeaderId) {\n      id\n      isLeader\n      memberCount\n    }\n  }\n"): (typeof documents)["\n  mutation TeamTransferLeadership($teamId: ID!, $newLeaderId: ID!) {\n    transferTeamLeadership(teamId: $teamId, newLeaderId: $newLeaderId) {\n      id\n      isLeader\n      memberCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamSetVisibility($teamId: ID!, $isPublic: Boolean!) {\n    updateTeam(teamId: $teamId, input: { isPublic: $isPublic }) {\n      id\n      isPublic\n    }\n  }\n"): (typeof documents)["\n  mutation TeamSetVisibility($teamId: ID!, $isPublic: Boolean!) {\n    updateTeam(teamId: $teamId, input: { isPublic: $isPublic }) {\n      id\n      isPublic\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamDelete($teamId: ID!) {\n    deleteTeam(teamId: $teamId)\n  }\n"): (typeof documents)["\n  mutation TeamDelete($teamId: ID!) {\n    deleteTeam(teamId: $teamId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n"): (typeof documents)["\n  mutation TeamUpdateComment($id: ID!, $content: String!) {\n    updateComment(id: $id, content: $content) {\n      id\n      content\n      updatedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamExemptionQuery($id: ID!) {\n    teamMembers(teamId: $id) {\n      items {\n        id\n        nickname\n      }\n      nextCursor\n    }\n    myPersonalExemptionRequests {\n      items {\n        id\n        weekStart\n        weekEnd\n        status\n        rejectReason\n        overlapsExemptionPeriod\n        createdAt\n        member {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query TeamExemptionQuery($id: ID!) {\n    teamMembers(teamId: $id) {\n      items {\n        id\n        nickname\n      }\n      nextCursor\n    }\n    myPersonalExemptionRequests {\n      items {\n        id\n        weekStart\n        weekEnd\n        status\n        rejectReason\n        overlapsExemptionPeriod\n        createdAt\n        member {\n          id\n          nickname\n        }\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TeamRequestExemption($teamId: ID!, $memberId: ID!, $weekStart: String!, $reason: String!) {\n    requestPersonalExemption(teamId: $teamId, memberId: $memberId, weekStart: $weekStart, reason: $reason) {\n      id\n      weekStart\n      weekEnd\n      status\n      rejectReason\n      overlapsExemptionPeriod\n      createdAt\n      member {\n        id\n        nickname\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TeamRequestExemption($teamId: ID!, $memberId: ID!, $weekStart: String!, $reason: String!) {\n    requestPersonalExemption(teamId: $teamId, memberId: $memberId, weekStart: $weekStart, reason: $reason) {\n      id\n      weekStart\n      weekEnd\n      status\n      rejectReason\n      overlapsExemptionPeriod\n      createdAt\n      member {\n        id\n        nickname\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TeamScopeQuery($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n"): (typeof documents)["\n  query TeamScopeQuery($id: ID!) {\n    team(id: $id) {\n      id\n      name\n      isPublic\n      isLeader\n      memberCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AdminLayoutCountsQuery {\n    adminDashboardSummary {\n      pendingMembers\n      penaltyTargets\n      pendingExemptions\n    }\n  }\n"): (typeof documents)["\n  query AdminLayoutCountsQuery {\n    adminDashboardSummary {\n      pendingMembers\n      penaltyTargets\n      pendingExemptions\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SessionQuery {\n    me {\n      id\n      githubLogin\n      nickname\n      profileImageUrl\n      status\n      role\n    }\n  }\n"): (typeof documents)["\n  query SessionQuery {\n    me {\n      id\n      githubLogin\n      nickname\n      profileImageUrl\n      status\n      role\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SessionTeamsQuery {\n    myTeams {\n      id\n    }\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n  }\n"): (typeof documents)["\n  query SessionTeamsQuery {\n    myTeams {\n      id\n    }\n    receivedTeamInvitations {\n      items {\n        id\n      }\n      nextCursor\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SessionExchangeAuthCode($code: String!) {\n    exchangeAuthCode(code: $code) {\n      accessToken\n      expiresIn\n      me {\n        id\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SessionExchangeAuthCode($code: String!) {\n    exchangeAuthCode(code: $code) {\n      accessToken\n      expiresIn\n      me {\n        id\n        status\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;