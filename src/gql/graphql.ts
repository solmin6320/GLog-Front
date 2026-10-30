/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** 이번 주 화면 상단 배너 후보. 동시에 해당하면 위에서부터 하나만 내려온다 */
export type ActivityBanner =
  /** GitHub 비공개 기여 표시가 꺼진 듯함 (E-39) */
  | 'CONTRIBUTIONS_HIDDEN'
  /** 면제 주간 (E-46) */
  | 'EXEMPTION_WEEK'
  /** 계정 생애 첫 팀 참가 주 (E-36) */
  | 'FIRST_WEEK'
  /** 잔디를 아직 못 불러옴 (E-32) */
  | 'GRASS_NOT_LOADED';

/** 정정으로 만들 수 있는 결과 (Q-05) */
export type AdminCorrectionStatus =
  | 'EXEMPT'
  | 'FAIL'
  | 'PASS';

/** 보류 이유. API_ERROR는 재시도로 풀리고 IDENTITY_MISMATCH는 본인이 다시 로그인해야 풀린다 (E-08) */
export type AdminHoldReason =
  | 'API_ERROR'
  | 'IDENTITY_MISMATCH';

export type AdminJudgmentFilter =
  | 'ALL'
  | 'FAIL_ONLY'
  | 'HOLD_ONLY';

export type AdminJudgmentStatus =
  /** 첫 참가 주 · 팀 없음 */
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  /** GitHub 조회 실패로 아직 확정하지 못함 */
  | 'HOLD'
  | 'PASS';

/** 글 + 댓글 / 글만 / 댓글만 */
export type AdminPostFilter =
  | 'ALL'
  | 'COMMENTS'
  | 'POSTS';

export type AdminPostKind =
  | 'COMMENT'
  | 'POST';

/** 판정에서 빠진 이유. NO_TEAM · FIRST_WEEK은 제외, EXEMPTION_PERIOD · PERSONAL_EXEMPTION은 면제 */
export type AdminSkipReason =
  | 'EXEMPTION_PERIOD'
  | 'FIRST_WEEK'
  | 'NO_TEAM'
  | 'PERSONAL_EXEMPTION';

export type AdminWarningDeleteReason =
  | 'KICKED'
  | 'TEAM_DELETED';

export type CreatePostInput = {
  /** https://github.com/{owner}/{repo}/commit/{sha} 형식만 허용. 실제 존재 여부는 확인하지 않는다 */
  commitUrls?: Array<string> | null | undefined;
  /** 글 종류에 해당하는 항목만 쓰이고 나머지는 무시된다 */
  sections: PostSectionsInput;
  /** 최대 5개, 개당 20자 */
  tags?: Array<string> | null | undefined;
  /** 연결할 팀 id (선택). 지금 내가 소속인 삭제되지 않은 팀만 가능하고, 아니면 POST_TEAM_INVALID */
  teamId?: string | number | null | undefined;
  /** 1~60자 */
  title: string;
  type: PostType;
};

export type CreateTeamInput = {
  /** 100자 이내 (선택) */
  description?: string | null | undefined;
  /** 생략하면 공개 */
  isPublic?: boolean | null | undefined;
  /** 1~20자 */
  name: string;
};

export type ExemptionPeriodInput = {
  /** 1~200자 */
  reason: string;
  /** 그 주 월요일 (yyyy-MM-dd) */
  weekStart: string;
};

export type JudgmentCorrectionInput = {
  /** 미리보기 때 본 현재 결과. 다르면 JUDGMENT_CHANGED */
  expectedStatus?: AdminJudgmentStatus | null | undefined;
  judgmentId: string | number;
  /** 필수, 1~500자 */
  reason: string;
  status: AdminCorrectionStatus;
};

/** 판정에서 빠진 이유. NO_TEAM·FIRST_WEEK은 제외, EXEMPTION_PERIOD·PERSONAL_EXEMPTION은 면제 */
export type JudgmentSkipReason =
  | 'EXEMPTION_PERIOD'
  | 'FIRST_WEEK'
  | 'NO_TEAM'
  | 'PERSONAL_EXEMPTION';

/** 판정 결과. HOLD는 GitHub 조회 실패로 아직 확정하지 못한 상태이고 진행 중인 주와 다르다 */
export type JudgmentStatus =
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  | 'HOLD'
  | 'PASS';

export type MemberApprovalFilter =
  | 'ALL'
  | 'PENDING'
  | 'REJECTED';

export type MemberRole =
  | 'ADMIN'
  | 'MEMBER';

export type MemberStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'REJECTED';

export type NoticeInput = {
  content: string;
  /** 상단 고정. 기본 false */
  isPinned?: boolean | null | undefined;
  /** 1~200자 */
  title: string;
};

export type PersonalExemptionStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type PostSectionsInput = {
  cause?: string | null | undefined;
  did?: string | null | undefined;
  learned?: string | null | undefined;
  problem?: string | null | undefined;
  solution?: string | null | undefined;
};

export type PostType =
  | 'DEVLOG'
  | 'TROUBLESHOOTING';

/**
 * 판정 이력의 결과 (PR-01 ⑩). PASS 통과 / FAIL 미달(경고) / EXEMPT 면제 / EXCLUDED 제외 / IN_PROGRESS 진행 중.
 * 이번 주와 아직 확정되지 않은 보류 주가 IN_PROGRESS로 나온다
 */
export type ProfileJudgmentResult =
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  | 'IN_PROGRESS'
  | 'PASS';

/** 팀 현황판 상태 칸. 미달은 주가 끝나고 판정이 확정된 뒤에만 나온다 */
export type TeamBoardStatus =
  /** 판정 제외·면제 주 (첫 참가 주·면제 주간) */
  | 'EXCLUDED'
  /** 판정이 미달로 확정됨 */
  | 'FAIL'
  /** 아직 못 채웠지만 주가 진행 중이라 만회할 수 있음 */
  | 'NOT_YET'
  /** 인증일 3일 이상 그리고 기록글 1개 이상을 이미 채움 */
  | 'PASS';

/** 모든 값을 통째로 바꾼다. 생략한 tags·commitUrls·teamId는 비워진다. 팀장이 남의 글을 고칠 때 teamId는 무시된다 */
export type UpdatePostInput = {
  commitUrls?: Array<string> | null | undefined;
  sections: PostSectionsInput;
  tags?: Array<string> | null | undefined;
  teamId?: string | number | null | undefined;
  title: string;
};

/** 경고 이력의 상태 (Q-13) */
export type WarningHistoryStatus =
  /** 벌칙 이행 이후 살아 있고 차감되지 않아 현재 경고 수에 들어간다 (유효) */
  | 'ACTIVE'
  /** 2주 연속 통과로 차감됐다 (차감됨) */
  | 'DEDUCTED'
  /** 벌칙 이행 체크 이전에 받았다. 기록만 남고 현재 경고 수에는 넣지 않는다 (이행 완료) */
  | 'FULFILLED';

export type WeeklyQueryQueryVariables = Exact<{
  weekStart?: string | null | undefined;
}>;


export type WeeklyQueryQuery = { myWeeklyActivity: { weekStart: string, currentWeek: boolean, inTeam: boolean, verifiedDays: number | null, recordCount: number, requiredVerifiedDays: number, requiredRecordCount: number, passExpected: boolean | null, grassAvailable: boolean, grassFetchedAt: string | null, banner: ActivityBanner | null, days: Array<{ date: string, hasGrass: boolean | null, grassCount: number | null, hasRecord: boolean, recordCount: number | null }>, judgment: { status: JudgmentStatus, skipReason: JudgmentSkipReason | null } | null } };

export type WeeklyHistoryQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type WeeklyHistoryQueryQuery = { myJudgmentHistory: { nextCursor: string | null, items: Array<{ weekStart: string, weekEnd: string, status: JudgmentStatus, skipReason: JudgmentSkipReason | null, verifiedDays: number | null, recordCount: number | null }> } };

export type WarningsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type WarningsQueryQuery = { myWarningSummary: { onHold: boolean, warningCount: number | null, streak: number | null, penaltyTarget: boolean | null } };

export type WarningHistoryQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type WarningHistoryQueryQuery = { myWarningHistory: { onHold: boolean, nextCursor: string | null, items: Array<{ weekStart: string, weekEnd: string, verifiedDays: number | null, recordCount: number | null, categories: Array<string>, status: WarningHistoryStatus }> } };

export type AdminDashboardSummaryQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminDashboardSummaryQueryQuery = { adminDashboardSummary: { judgedWeekStart: string, pendingMembers: number, failedMembers: number, penaltyTargets: number, pendingExemptions: number }, adminJudgmentHolds: { nextCursor: string | null, totalCount: number, identityMismatchCount: number, items: Array<{ weekStart: string, reason: AdminHoldReason, retryCount: number, retriesExhausted: boolean, member: { id: string, nickname: string } }> } };

export type AdminDashboardWeekQueryQueryVariables = Exact<{
  weekStart?: string | null | undefined;
  filter?: AdminJudgmentFilter | null | undefined;
  keyword?: string | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminDashboardWeekQueryQuery = { adminJudgments: { weekStart: string, weekEnd: string, executedAt: string | null, passCount: number, failCount: number, exemptCount: number, firstWeekCount: number, holdCount: number, nextCursor: string | null, items: Array<{ judgmentId: string, status: AdminJudgmentStatus, skipReason: AdminSkipReason | null, holdReason: AdminHoldReason | null, verifiedDays: number | null, recordCount: number | null, warningCount: number | null, corrected: boolean, manualHold: boolean, member: { id: string, nickname: string, githubLogin: string } }> } };

export type AdminDashboardCorrectionPreviewQueryQueryVariables = Exact<{
  judgmentId: string | number;
  status: AdminCorrectionStatus;
}>;


export type AdminDashboardCorrectionPreviewQueryQuery = { previewJudgmentCorrection: { judgmentId: string, currentStatus: AdminJudgmentStatus, targetStatus: AdminJudgmentStatus, impact: { onHold: boolean, warningCountBefore: number | null, warningCountAfter: number | null, entersPenalty: boolean, leavesPenalty: boolean, recordOnly: boolean, affectedWeeks: number } } };

export type AdminDashboardCorrectJudgmentMutationVariables = Exact<{
  input: JudgmentCorrectionInput;
}>;


export type AdminDashboardCorrectJudgmentMutation = { correctJudgment: { judgmentId: string, status: AdminJudgmentStatus, warningCount: number | null, penaltyTarget: boolean } };

export type AdminDashboardRetryHoldMutationVariables = Exact<{
  memberId: string | number;
  weekStart: string;
}>;


export type AdminDashboardRetryHoldMutation = { retryJudgmentHold: { status: AdminJudgmentStatus, resolved: boolean } };

export type AdminDashboardRetryAllHoldsMutationVariables = Exact<{ [key: string]: never; }>;


export type AdminDashboardRetryAllHoldsMutation = { retryAllJudgmentHolds: { attempted: number, resolved: number, stillHold: number, failed: number } };

export type AdminExemptionsPeriodsQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type AdminExemptionsPeriodsQueryQuery = { exemptionPeriods: { nextCursor: string | null, items: Array<{ id: string, weekStart: string, weekEnd: string, reason: string }> } };

export type AdminExemptionsPeriodPreviewQueryQueryVariables = Exact<{
  weekStart: string;
}>;


export type AdminExemptionsPeriodPreviewQueryQuery = { previewExemptionPeriod: { weekStart: string, retroactive: boolean, items: Array<{ currentStatus: AdminJudgmentStatus, member: { id: string, nickname: string }, impact: { onHold: boolean, warningCountBefore: number | null, warningCountAfter: number | null, entersPenalty: boolean, leavesPenalty: boolean, recordOnly: boolean, affectedWeeks: number } }> } };

export type AdminExemptionsCreatePeriodMutationVariables = Exact<{
  input: ExemptionPeriodInput;
}>;


export type AdminExemptionsCreatePeriodMutation = { createExemptionPeriod: { id: string, weekStart: string, weekEnd: string, reason: string } };

export type AdminExemptionsUpdatePeriodMutationVariables = Exact<{
  id: string | number;
  input: ExemptionPeriodInput;
}>;


export type AdminExemptionsUpdatePeriodMutation = { updateExemptionPeriod: { id: string, weekStart: string, weekEnd: string, reason: string } };

export type AdminExemptionsDeletePeriodMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminExemptionsDeletePeriodMutation = { deleteExemptionPeriod: boolean };

export type AdminExemptionsRequestsQueryQueryVariables = Exact<{
  status: PersonalExemptionStatus;
  after?: string | null | undefined;
}>;


export type AdminExemptionsRequestsQueryQuery = { personalExemptionRequests: { nextCursor: string | null, items: Array<{ id: string, weekStart: string, weekEnd: string, reason: string, status: PersonalExemptionStatus, rejectReason: string | null, createdAt: string, respondedAt: string | null, overlapsExemptionPeriod: boolean, member: { id: string, nickname: string }, requester: { id: string, nickname: string } }> } };

export type AdminExemptionsApprovalPreviewQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type AdminExemptionsApprovalPreviewQueryQuery = { previewPersonalExemptionApproval: { weekStart: string, retroactive: boolean, items: Array<{ currentStatus: AdminJudgmentStatus, member: { id: string, nickname: string }, impact: { onHold: boolean, warningCountBefore: number | null, warningCountAfter: number | null, entersPenalty: boolean, leavesPenalty: boolean, recordOnly: boolean, affectedWeeks: number } }> } };

export type AdminExemptionsApproveMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminExemptionsApproveMutation = { approvePersonalExemption: { id: string, status: PersonalExemptionStatus, respondedAt: string | null } };

export type AdminExemptionsRejectMutationVariables = Exact<{
  id: string | number;
  reason: string;
}>;


export type AdminExemptionsRejectMutation = { rejectPersonalExemption: { id: string, status: PersonalExemptionStatus, rejectReason: string | null, respondedAt: string | null } };

export type AdminExemptionsSummaryQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminExemptionsSummaryQueryQuery = { adminDashboardSummary: { pendingExemptions: number } };

export type AdminMembersQueryQueryVariables = Exact<{
  status: MemberApprovalFilter;
  keyword?: string | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminMembersQueryQuery = { adminMembers: { nextCursor: string | null, totalCount: number, items: Array<{ id: string, nickname: string, githubLogin: string, status: MemberStatus, role: MemberRole, createdAt: string }> } };

export type AdminMembersSummaryQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminMembersSummaryQueryQuery = { adminDashboardSummary: { pendingMembers: number } };

export type AdminMembersApproveMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersApproveMutation = { approveMember: { id: string, nickname: string, githubLogin: string, status: MemberStatus, role: MemberRole, createdAt: string } };

export type AdminMembersRejectMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersRejectMutation = { rejectMember: { id: string, nickname: string, githubLogin: string, status: MemberStatus, role: MemberRole, createdAt: string } };

export type AdminMembersRevertMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersRevertMutation = { revertMemberToPending: { id: string, nickname: string, githubLogin: string, status: MemberStatus, role: MemberRole, createdAt: string } };

export type AdminMembersPromoteMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersPromoteMutation = { promoteMemberToAdmin: { id: string, nickname: string, githubLogin: string, status: MemberStatus, role: MemberRole, createdAt: string } };

export type AdminNoticesQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type AdminNoticesQueryQuery = { notices: { nextCursor: string | null, items: Array<{ id: string, title: string, isPinned: boolean, isSystem: boolean, createdAt: string, updatedAt: string | null }> } };

export type AdminNoticesEditorQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type AdminNoticesEditorQueryQuery = { notice: { id: string, title: string, content: string, isPinned: boolean, isSystem: boolean } };

export type AdminNoticesCreateMutationVariables = Exact<{
  input: NoticeInput;
}>;


export type AdminNoticesCreateMutation = { createNotice: { id: string, title: string, content: string, isPinned: boolean, isSystem: boolean, createdAt: string, updatedAt: string | null } };

export type AdminNoticesUpdateMutationVariables = Exact<{
  id: string | number;
  input: NoticeInput;
}>;


export type AdminNoticesUpdateMutation = { updateNotice: { id: string, title: string, content: string, isPinned: boolean, isSystem: boolean, createdAt: string, updatedAt: string | null } };

export type AdminNoticesDeleteMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminNoticesDeleteMutation = { deleteNotice: boolean };

export type AdminNoticesSetPinnedMutationVariables = Exact<{
  id: string | number;
  isPinned: boolean;
}>;


export type AdminNoticesSetPinnedMutation = { setNoticePinned: { id: string, isPinned: boolean } };

export type AdminPostsQueryQueryVariables = Exact<{
  filter: AdminPostFilter;
  keyword?: string | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminPostsQueryQuery = { adminPosts: { nextCursor: string | null, items: Array<{ kind: AdminPostKind, id: string, postId: string, title: string, content: string | null, createdAt: string, author: { id: string, nickname: string } }> } };

export type AdminPostsDeletePostMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminPostsDeletePostMutation = { adminDeletePost: boolean };

export type AdminPostsDeleteCommentMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminPostsDeleteCommentMutation = { adminDeleteComment: boolean };

export type AdminWarningsPenaltyTargetsQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type AdminWarningsPenaltyTargetsQueryQuery = { adminPenaltyTargets: { nextCursor: string | null, totalCount: number, items: Array<{ warningCount: number, reachedWeek: string, member: { id: string, nickname: string, githubLogin: string }, teams: Array<{ id: string, name: string }> }> } };

export type AdminWarningsDeletedQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type AdminWarningsDeletedQueryQuery = { adminDeletedWarnings: { nextCursor: string | null, items: Array<{ warningId: string, weekStart: string, deleteReason: AdminWarningDeleteReason, deletedAt: string, teamDeleted: boolean, member: { id: string, nickname: string, githubLogin: string }, restoreTeams: Array<{ id: string, name: string }> }> } };

export type AdminWarningsRestorePreviewQueryQueryVariables = Exact<{
  warningId: string | number;
}>;


export type AdminWarningsRestorePreviewQueryQuery = { previewWarningRestore: { warningId: string, teamDeleted: boolean, restoreTeams: Array<{ id: string, name: string }>, impact: { onHold: boolean, warningCountBefore: number | null, warningCountAfter: number | null, entersPenalty: boolean, leavesPenalty: boolean, recordOnly: boolean, affectedWeeks: number } } };

export type AdminWarningsFulfillPenaltyMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminWarningsFulfillPenaltyMutation = { fulfillPenalty: { fulfilledAt: string, member: { id: string } } };

export type AdminWarningsRestoreWarningMutationVariables = Exact<{
  warningId: string | number;
}>;


export type AdminWarningsRestoreWarningMutation = { restoreWarning: { warningId: string, warningCount: number | null, penaltyTarget: boolean } };

export type HomeQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HomeQueryQuery = { myWeeklyActivity: { weekStart: string, currentWeek: boolean, inTeam: boolean, verifiedDays: number | null, recordCount: number, requiredVerifiedDays: number, requiredRecordCount: number, passExpected: boolean | null, grassAvailable: boolean, grassFetchedAt: string | null, banner: ActivityBanner | null, days: Array<{ date: string, hasGrass: boolean | null, grassCount: number | null, hasRecord: boolean, recordCount: number | null }> }, myWarningSummary: { onHold: boolean, warningCount: number | null, streak: number | null, penaltyTarget: boolean | null } };

export type HomeNoticesQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HomeNoticesQueryQuery = { notices: { nextCursor: string | null, items: Array<{ id: string, title: string, isPinned: boolean, createdAt: string }> } };

export type NoticeListQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type NoticeListQueryQuery = { notices: { nextCursor: string | null, items: Array<{ id: string, title: string, isPinned: boolean, createdAt: string }> } };

export type NoticeDetailQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type NoticeDetailQueryQuery = { notice: { id: string, title: string, content: string, isPinned: boolean, isSystem: boolean, createdAt: string, updatedAt: string | null } };

export type PostListQueryQueryVariables = Exact<{
  type: PostType;
  q?: string | null | undefined;
  tag?: string | null | undefined;
  after?: string | null | undefined;
}>;


export type PostListQueryQuery = { posts: { nextCursor: string | null, totalCount: number, items: Array<{ id: string, type: PostType, title: string, tags: Array<string>, isRecord: boolean, createdAt: string, commentCount: number, teamName: string | null, author: { id: string, nickname: string } }> } };

export type PostTypeCountsQueryQueryVariables = Exact<{
  q?: string | null | undefined;
  tag?: string | null | undefined;
}>;


export type PostTypeCountsQueryQuery = { troubleshooting: { totalCount: number }, devlog: { totalCount: number } };

export type PostTagsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type PostTagsQueryQuery = { popularTags: Array<{ tag: string, count: number }> };

export type PostDetailQueryQueryVariables = Exact<{
  id: string | number;
  after?: string | null | undefined;
}>;


export type PostDetailQueryQuery = { post: { id: string, authorId: string, teamId: string | null, teamName: string | null, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, writtenDate: string, createdAt: string, updatedAt: string, commentCount: number, sections: { problem: string | null, cause: string | null, solution: string | null, did: string | null, learned: string | null }, author: { id: string, nickname: string, profileImageUrl: string | null }, comments: { nextCursor: string | null, items: Array<{ id: string, authorId: string, content: string, createdAt: string, updatedAt: string, author: { id: string, nickname: string, profileImageUrl: string | null } }> } }, myTeams: Array<{ id: string, isLeader: boolean }> };

export type PostDeleteMutationVariables = Exact<{
  id: string | number;
}>;


export type PostDeleteMutation = { deletePost: boolean };

export type PostAdminDeleteMutationVariables = Exact<{
  postId: string | number;
}>;


export type PostAdminDeleteMutation = { adminDeletePost: boolean };

export type PostAddCommentMutationVariables = Exact<{
  postId: string | number;
  content: string;
}>;


export type PostAddCommentMutation = { createComment: { id: string, content: string, createdAt: string, updatedAt: string } };

export type PostUpdateCommentMutationVariables = Exact<{
  id: string | number;
  content: string;
}>;


export type PostUpdateCommentMutation = { updateComment: { id: string, content: string, updatedAt: string } };

export type PostDeleteCommentMutationVariables = Exact<{
  id: string | number;
}>;


export type PostDeleteCommentMutation = { deleteComment: boolean };

export type PostAdminDeleteCommentMutationVariables = Exact<{
  commentId: string | number;
}>;


export type PostAdminDeleteCommentMutation = { adminDeleteComment: boolean };

export type PostEditorTeamsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type PostEditorTeamsQueryQuery = { myTeams: Array<{ id: string, name: string, isPublic: boolean, isLeader: boolean }> };

export type PostEditorPostQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type PostEditorPostQueryQuery = { post: { id: string, authorId: string, teamId: string | null, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, writtenDate: string, sections: { problem: string | null, cause: string | null, solution: string | null, did: string | null, learned: string | null } } };

export type PostCreateMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type PostCreateMutation = { createPost: { id: string, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, teamId: string | null, teamName: string | null, writtenDate: string, createdAt: string, updatedAt: string, sections: { problem: string | null, cause: string | null, solution: string | null, did: string | null, learned: string | null } } };

export type PostUpdateMutationVariables = Exact<{
  id: string | number;
  input: UpdatePostInput;
}>;


export type PostUpdateMutation = { updatePost: { id: string, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, teamId: string | null, teamName: string | null, updatedAt: string, sections: { problem: string | null, cause: string | null, solution: string | null, did: string | null, learned: string | null } } };

export type ProfileQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type ProfileQueryQuery = { profile: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null, isMine: boolean, postCount: number, commentCount: number, grass: { from: string, to: string, fetchedAt: string, days: Array<{ date: string, count: number }> } | null, warning: { onHold: boolean, warningCount: number | null, penaltyTarget: boolean | null }, teamWarnings: { onHold: boolean, teams: Array<{ name: string, count: number }> }, teams: Array<{ id: string, name: string }> }, myTeams: Array<{ id: string }> };

export type ProfileHistoryQueryQueryVariables = Exact<{
  id: string | number;
  after?: string | null | undefined;
}>;


export type ProfileHistoryQueryQuery = { profile: { id: string, judgmentHistory: { nextCursor: string | null, items: Array<{ weekStart: string, weekEnd: string, result: ProfileJudgmentResult, verifiedDays: number | null, recordCount: number | null }> } } };

export type TeamListQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type TeamListQueryQuery = { receivedTeamInvitations: { nextCursor: string | null, items: Array<{ id: string }> }, myTeams: Array<{ id: string, name: string, isPublic: boolean, isLeader: boolean, memberCount: number, weekSummary: { passCount: number, notYetCount: number } }> };

export type TeamCreateMutationVariables = Exact<{
  input: CreateTeamInput;
}>;


export type TeamCreateMutation = { createTeam: { inviteCode: string, team: { id: string, name: string, isPublic: boolean, isLeader: boolean, memberCount: number } } };

export type TeamJoinByCodeMutationVariables = Exact<{
  code: string;
}>;


export type TeamJoinByCodeMutation = { joinTeamByCode: { id: string, name: string, isPublic: boolean, isLeader: boolean, memberCount: number } };

export type TeamInvitationsQueryQueryVariables = Exact<{
  after?: string | null | undefined;
}>;


export type TeamInvitationsQueryQuery = { receivedTeamInvitations: { nextCursor: string | null, items: Array<{ id: string, teamId: string, teamName: string, createdAt: string, inviter: { id: string, nickname: string } }> } };

export type TeamAcceptInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type TeamAcceptInvitationMutation = { acceptTeamInvitation: { id: string, name: string, isPublic: boolean, isLeader: boolean, memberCount: number } };

export type TeamDeclineInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type TeamDeclineInvitationMutation = { declineTeamInvitation: boolean };

export type TeamBoardQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamBoardQueryQuery = { teamBoard: { weekStart: string, weekEnd: string, grassFetchedAt: string | null, grassNotLoaded: boolean, members: Array<{ memberId: string, nickname: string, githubLogin: string, isMe: boolean, verifiedDays: number | null, recordCount: number, warningCount: number | null, status: TeamBoardStatus, days: Array<{ date: string, hasGrass: boolean | null, hasRecord: boolean, verified: boolean | null }> }>, recentPosts: Array<{ id: string, type: PostType, title: string, createdAt: string, isRecord: boolean, author: { id: string, nickname: string } }> } };

export type TeamLeaveMutationVariables = Exact<{
  teamId: string | number;
}>;


export type TeamLeaveMutation = { leaveTeam: boolean };

export type TeamManageQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamManageQueryQuery = { teamInviteCode: string, sentTeamInvitations: { nextCursor: string | null, items: Array<{ id: string, createdAt: string, invitee: { id: string, nickname: string, githubLogin: string } }> } };

export type TeamMembersQueryQueryVariables = Exact<{
  id: string | number;
  after?: string | null | undefined;
}>;


export type TeamMembersQueryQuery = { teamMembers: { nextCursor: string | null, items: Array<{ id: string, nickname: string, githubLogin: string, profileImageUrl: string | null, isLeader: boolean, joinedAt: string }> } };

export type TeamPostsQueryQueryVariables = Exact<{
  id: string | number;
  after?: string | null | undefined;
}>;


export type TeamPostsQueryQuery = { teamPosts: { nextCursor: string | null, items: Array<{ id: string, type: PostType, title: string, createdAt: string, author: { id: string, nickname: string } }> } };

export type TeamCommentsQueryQueryVariables = Exact<{
  id: string | number;
  after?: string | null | undefined;
}>;


export type TeamCommentsQueryQuery = { teamComments: { nextCursor: string | null, items: Array<{ id: string, postId: string, content: string, createdAt: string, author: { id: string, nickname: string } }> } };

export type TeamInviteMemberMutationVariables = Exact<{
  teamId: string | number;
  githubLogin: string;
}>;


export type TeamInviteMemberMutation = { inviteToTeam: { id: string, createdAt: string, invitee: { id: string, nickname: string, githubLogin: string } } };

export type TeamCancelInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type TeamCancelInvitationMutation = { cancelTeamInvitation: boolean };

export type TeamKickMemberMutationVariables = Exact<{
  teamId: string | number;
  memberId: string | number;
}>;


export type TeamKickMemberMutation = { kickTeamMember: boolean };

export type TeamTransferLeadershipMutationVariables = Exact<{
  teamId: string | number;
  newLeaderId: string | number;
}>;


export type TeamTransferLeadershipMutation = { transferTeamLeadership: { id: string, isLeader: boolean, memberCount: number } };

export type TeamSetVisibilityMutationVariables = Exact<{
  teamId: string | number;
  isPublic: boolean;
}>;


export type TeamSetVisibilityMutation = { updateTeam: { id: string, isPublic: boolean } };

export type TeamDeleteMutationVariables = Exact<{
  teamId: string | number;
}>;


export type TeamDeleteMutation = { deleteTeam: boolean };

export type TeamUpdateCommentMutationVariables = Exact<{
  id: string | number;
  content: string;
}>;


export type TeamUpdateCommentMutation = { updateComment: { id: string, content: string, updatedAt: string } };

export type TeamExemptionQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamExemptionQueryQuery = { teamMembers: { nextCursor: string | null, items: Array<{ id: string, nickname: string }> }, myPersonalExemptionRequests: { nextCursor: string | null, items: Array<{ id: string, weekStart: string, weekEnd: string, status: PersonalExemptionStatus, rejectReason: string | null, overlapsExemptionPeriod: boolean, createdAt: string, member: { id: string, nickname: string } }> } };

export type TeamRequestExemptionMutationVariables = Exact<{
  teamId: string | number;
  memberId: string | number;
  weekStart: string;
  reason: string;
}>;


export type TeamRequestExemptionMutation = { requestPersonalExemption: { id: string, weekStart: string, weekEnd: string, status: PersonalExemptionStatus, rejectReason: string | null, overlapsExemptionPeriod: boolean, createdAt: string, member: { id: string, nickname: string } } };

export type TeamScopeQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamScopeQueryQuery = { team: { id: string, name: string, isPublic: boolean, isLeader: boolean, memberCount: number } };

export type AdminLayoutCountsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminLayoutCountsQueryQuery = { adminDashboardSummary: { pendingMembers: number, penaltyTargets: number, pendingExemptions: number } };

export type SessionQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type SessionQueryQuery = { me: { id: string, githubLogin: string, nickname: string, profileImageUrl: string | null, status: MemberStatus, role: MemberRole } };

export type SessionTeamsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type SessionTeamsQueryQuery = { myTeams: Array<{ id: string }>, receivedTeamInvitations: { nextCursor: string | null, items: Array<{ id: string }> } };

export type SessionExchangeAuthCodeMutationVariables = Exact<{
  code: string;
}>;


export type SessionExchangeAuthCodeMutation = { exchangeAuthCode: { accessToken: string, expiresIn: number, me: { id: string, status: MemberStatus } } };


export const WeeklyQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WeeklyQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWeeklyActivity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeek"}},{"kind":"Field","name":{"kind":"Name","value":"inTeam"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"hasGrass"}},{"kind":"Field","name":{"kind":"Name","value":"grassCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasRecord"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"requiredVerifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"requiredRecordCount"}},{"kind":"Field","name":{"kind":"Name","value":"passExpected"}},{"kind":"Field","name":{"kind":"Name","value":"grassAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"grassFetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"banner"}},{"kind":"Field","name":{"kind":"Name","value":"judgment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}}]}}]}}]}}]} as unknown as DocumentNode<WeeklyQueryQuery, WeeklyQueryQueryVariables>;
export const WeeklyHistoryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WeeklyHistoryQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myJudgmentHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<WeeklyHistoryQueryQuery, WeeklyHistoryQueryQueryVariables>;
export const WarningsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WarningsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWarningSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"streak"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTarget"}}]}}]}}]} as unknown as DocumentNode<WarningsQueryQuery, WarningsQueryQueryVariables>;
export const WarningHistoryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WarningHistoryQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWarningHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<WarningHistoryQueryQuery, WarningHistoryQueryQueryVariables>;
export const AdminDashboardSummaryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardSummaryQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgedWeekStart"}},{"kind":"Field","name":{"kind":"Name","value":"pendingMembers"}},{"kind":"Field","name":{"kind":"Name","value":"failedMembers"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTargets"}},{"kind":"Field","name":{"kind":"Name","value":"pendingExemptions"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adminJudgmentHolds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"retryCount"}},{"kind":"Field","name":{"kind":"Name","value":"retriesExhausted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"identityMismatchCount"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardSummaryQueryQuery, AdminDashboardSummaryQueryQueryVariables>;
export const AdminDashboardWeekQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardWeekQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminJudgmentFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminJudgments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"executedAt"}},{"kind":"Field","name":{"kind":"Name","value":"passCount"}},{"kind":"Field","name":{"kind":"Name","value":"failCount"}},{"kind":"Field","name":{"kind":"Name","value":"exemptCount"}},{"kind":"Field","name":{"kind":"Name","value":"firstWeekCount"}},{"kind":"Field","name":{"kind":"Name","value":"holdCount"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgmentId"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"holdReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"corrected"}},{"kind":"Field","name":{"kind":"Name","value":"manualHold"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardWeekQueryQuery, AdminDashboardWeekQueryQueryVariables>;
export const AdminDashboardCorrectionPreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardCorrectionPreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"judgmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminCorrectionStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewJudgmentCorrection"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"judgmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"judgmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgmentId"}},{"kind":"Field","name":{"kind":"Name","value":"currentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"targetStatus"}},{"kind":"Field","name":{"kind":"Name","value":"impact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"entersPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"leavesPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"recordOnly"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeeks"}}]}}]}}]}}]} as unknown as DocumentNode<AdminDashboardCorrectionPreviewQueryQuery, AdminDashboardCorrectionPreviewQueryQueryVariables>;
export const AdminDashboardCorrectJudgmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDashboardCorrectJudgment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"JudgmentCorrectionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"correctJudgment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgmentId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTarget"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardCorrectJudgmentMutation, AdminDashboardCorrectJudgmentMutationVariables>;
export const AdminDashboardRetryHoldDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDashboardRetryHold"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retryJudgmentHold"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"resolved"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardRetryHoldMutation, AdminDashboardRetryHoldMutationVariables>;
export const AdminDashboardRetryAllHoldsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDashboardRetryAllHolds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retryAllJudgmentHolds"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"attempted"}},{"kind":"Field","name":{"kind":"Name","value":"resolved"}},{"kind":"Field","name":{"kind":"Name","value":"stillHold"}},{"kind":"Field","name":{"kind":"Name","value":"failed"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardRetryAllHoldsMutation, AdminDashboardRetryAllHoldsMutationVariables>;
export const AdminExemptionsPeriodsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsPeriodsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exemptionPeriods"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsPeriodsQueryQuery, AdminExemptionsPeriodsQueryQueryVariables>;
export const AdminExemptionsPeriodPreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsPeriodPreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"retroactive"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"impact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"entersPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"leavesPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"recordOnly"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeeks"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsPeriodPreviewQueryQuery, AdminExemptionsPeriodPreviewQueryQueryVariables>;
export const AdminExemptionsCreatePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsCreatePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExemptionPeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsCreatePeriodMutation, AdminExemptionsCreatePeriodMutationVariables>;
export const AdminExemptionsUpdatePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsUpdatePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExemptionPeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsUpdatePeriodMutation, AdminExemptionsUpdatePeriodMutationVariables>;
export const AdminExemptionsDeletePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsDeletePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminExemptionsDeletePeriodMutation, AdminExemptionsDeletePeriodMutationVariables>;
export const AdminExemptionsRequestsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsRequestsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PersonalExemptionStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personalExemptionRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requester"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"overlapsExemptionPeriod"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsRequestsQueryQuery, AdminExemptionsRequestsQueryQueryVariables>;
export const AdminExemptionsApprovalPreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsApprovalPreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewPersonalExemptionApproval"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"retroactive"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentStatus"}},{"kind":"Field","name":{"kind":"Name","value":"impact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"entersPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"leavesPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"recordOnly"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeeks"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsApprovalPreviewQueryQuery, AdminExemptionsApprovalPreviewQueryQueryVariables>;
export const AdminExemptionsApproveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsApprove"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvePersonalExemption"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsApproveMutation, AdminExemptionsApproveMutationVariables>;
export const AdminExemptionsRejectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsReject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectPersonalExemption"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsRejectMutation, AdminExemptionsRejectMutationVariables>;
export const AdminExemptionsSummaryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsSummaryQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingExemptions"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsSummaryQueryQuery, AdminExemptionsSummaryQueryQueryVariables>;
export const AdminMembersQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMembersQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MemberApprovalFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AdminMembersQueryQuery, AdminMembersQueryQueryVariables>;
export const AdminMembersSummaryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMembersSummaryQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingMembers"}}]}}]}}]} as unknown as DocumentNode<AdminMembersSummaryQueryQuery, AdminMembersSummaryQueryQueryVariables>;
export const AdminMembersApproveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersApprove"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersApproveMutation, AdminMembersApproveMutationVariables>;
export const AdminMembersRejectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersReject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersRejectMutation, AdminMembersRejectMutationVariables>;
export const AdminMembersRevertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersRevert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revertMemberToPending"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersRevertMutation, AdminMembersRevertMutationVariables>;
export const AdminMembersPromoteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersPromote"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"promoteMemberToAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersPromoteMutation, AdminMembersPromoteMutationVariables>;
export const AdminNoticesQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminNoticesQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesQueryQuery, AdminNoticesQueryQueryVariables>;
export const AdminNoticesEditorQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminNoticesEditorQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesEditorQueryQuery, AdminNoticesEditorQueryQueryVariables>;
export const AdminNoticesCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesCreateMutation, AdminNoticesCreateMutationVariables>;
export const AdminNoticesUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesUpdateMutation, AdminNoticesUpdateMutationVariables>;
export const AdminNoticesDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminNoticesDeleteMutation, AdminNoticesDeleteMutationVariables>;
export const AdminNoticesSetPinnedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesSetPinned"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPinned"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setNoticePinned"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"isPinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPinned"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesSetPinnedMutation, AdminNoticesSetPinnedMutationVariables>;
export const AdminPostsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPostsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminPostFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"keyword"},"value":{"kind":"Variable","name":{"kind":"Name","value":"keyword"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<AdminPostsQueryQuery, AdminPostsQueryQueryVariables>;
export const AdminPostsDeletePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPostsDeletePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminPostsDeletePostMutation, AdminPostsDeletePostMutationVariables>;
export const AdminPostsDeleteCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPostsDeleteComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeleteComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminPostsDeleteCommentMutation, AdminPostsDeleteCommentMutationVariables>;
export const AdminWarningsPenaltyTargetsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWarningsPenaltyTargetsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminPenaltyTargets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"reachedWeek"}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AdminWarningsPenaltyTargetsQueryQuery, AdminWarningsPenaltyTargetsQueryQueryVariables>;
export const AdminWarningsDeletedQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWarningsDeletedQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeletedWarnings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"warningId"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"deleteReason"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"restoreTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamDeleted"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<AdminWarningsDeletedQueryQuery, AdminWarningsDeletedQueryQueryVariables>;
export const AdminWarningsRestorePreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWarningsRestorePreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"previewWarningRestore"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"warningId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"warningId"}},{"kind":"Field","name":{"kind":"Name","value":"restoreTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamDeleted"}},{"kind":"Field","name":{"kind":"Name","value":"impact"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"entersPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"leavesPenalty"}},{"kind":"Field","name":{"kind":"Name","value":"recordOnly"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeeks"}}]}}]}}]}}]} as unknown as DocumentNode<AdminWarningsRestorePreviewQueryQuery, AdminWarningsRestorePreviewQueryQueryVariables>;
export const AdminWarningsFulfillPenaltyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminWarningsFulfillPenalty"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fulfillPenalty"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fulfilledAt"}}]}}]}}]} as unknown as DocumentNode<AdminWarningsFulfillPenaltyMutation, AdminWarningsFulfillPenaltyMutationVariables>;
export const AdminWarningsRestoreWarningDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminWarningsRestoreWarning"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreWarning"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"warningId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"warningId"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTarget"}}]}}]}}]} as unknown as DocumentNode<AdminWarningsRestoreWarningMutation, AdminWarningsRestoreWarningMutationVariables>;
export const HomeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomeQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWeeklyActivity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeek"}},{"kind":"Field","name":{"kind":"Name","value":"inTeam"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"hasGrass"}},{"kind":"Field","name":{"kind":"Name","value":"grassCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasRecord"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"requiredVerifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"requiredRecordCount"}},{"kind":"Field","name":{"kind":"Name","value":"passExpected"}},{"kind":"Field","name":{"kind":"Name","value":"grassAvailable"}},{"kind":"Field","name":{"kind":"Name","value":"grassFetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"banner"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myWarningSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"streak"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTarget"}}]}}]}}]} as unknown as DocumentNode<HomeQueryQuery, HomeQueryQueryVariables>;
export const HomeNoticesQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomeNoticesQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notices"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<HomeNoticesQueryQuery, HomeNoticesQueryQueryVariables>;
export const NoticeListQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NoticeListQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<NoticeListQueryQuery, NoticeListQueryQueryVariables>;
export const NoticeDetailQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NoticeDetailQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<NoticeDetailQueryQuery, NoticeDetailQueryQueryVariables>;
export const PostListQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostListQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PostType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"q"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tag"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"q"},"value":{"kind":"Variable","name":{"kind":"Name","value":"q"}}},{"kind":"Argument","name":{"kind":"Name","value":"tag"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tag"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<PostListQueryQuery, PostListQueryQueryVariables>;
export const PostTypeCountsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostTypeCountsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"q"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tag"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"troubleshooting"},"name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"TROUBLESHOOTING"}},{"kind":"Argument","name":{"kind":"Name","value":"q"},"value":{"kind":"Variable","name":{"kind":"Name","value":"q"}}},{"kind":"Argument","name":{"kind":"Name","value":"tag"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tag"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}},{"kind":"Field","alias":{"kind":"Name","value":"devlog"},"name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"EnumValue","value":"DEVLOG"}},{"kind":"Argument","name":{"kind":"Name","value":"q"},"value":{"kind":"Variable","name":{"kind":"Name","value":"q"}}},{"kind":"Argument","name":{"kind":"Name","value":"tag"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tag"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<PostTypeCountsQueryQuery, PostTypeCountsQueryQueryVariables>;
export const PostTagsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostTagsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popularTags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tag"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<PostTagsQueryQuery, PostTagsQueryQueryVariables>;
export const PostDetailQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostDetailQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"teamName"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"problem"}},{"kind":"Field","name":{"kind":"Name","value":"cause"}},{"kind":"Field","name":{"kind":"Name","value":"solution"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"learned"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"writtenDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}}]}}]}}]} as unknown as DocumentNode<PostDetailQueryQuery, PostDetailQueryQueryVariables>;
export const PostDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<PostDeleteMutation, PostDeleteMutationVariables>;
export const PostAdminDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostAdminDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}}]}]}}]} as unknown as DocumentNode<PostAdminDeleteMutation, PostAdminDeleteMutationVariables>;
export const PostAddCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostAddComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PostAddCommentMutation, PostAddCommentMutationVariables>;
export const PostUpdateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostUpdateComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PostUpdateCommentMutation, PostUpdateCommentMutationVariables>;
export const PostDeleteCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostDeleteComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<PostDeleteCommentMutation, PostDeleteCommentMutationVariables>;
export const PostAdminDeleteCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostAdminDeleteComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDeleteComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"commentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commentId"}}}]}]}}]} as unknown as DocumentNode<PostAdminDeleteCommentMutation, PostAdminDeleteCommentMutationVariables>;
export const PostEditorTeamsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostEditorTeamsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}}]}}]}}]} as unknown as DocumentNode<PostEditorTeamsQueryQuery, PostEditorTeamsQueryQueryVariables>;
export const PostEditorPostQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostEditorPostQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"authorId"}},{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"problem"}},{"kind":"Field","name":{"kind":"Name","value":"cause"}},{"kind":"Field","name":{"kind":"Name","value":"solution"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"learned"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"writtenDate"}}]}}]}}]} as unknown as DocumentNode<PostEditorPostQueryQuery, PostEditorPostQueryQueryVariables>;
export const PostCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"problem"}},{"kind":"Field","name":{"kind":"Name","value":"cause"}},{"kind":"Field","name":{"kind":"Name","value":"solution"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"learned"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"teamName"}},{"kind":"Field","name":{"kind":"Name","value":"writtenDate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PostCreateMutation, PostCreateMutationVariables>;
export const PostUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"problem"}},{"kind":"Field","name":{"kind":"Name","value":"cause"}},{"kind":"Field","name":{"kind":"Name","value":"solution"}},{"kind":"Field","name":{"kind":"Name","value":"did"}},{"kind":"Field","name":{"kind":"Name","value":"learned"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"teamName"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PostUpdateMutation, PostUpdateMutationVariables>;
export const ProfileQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isMine"}},{"kind":"Field","name":{"kind":"Name","value":"postCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"grass"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"from"}},{"kind":"Field","name":{"kind":"Name","value":"to"}},{"kind":"Field","name":{"kind":"Name","value":"fetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"warning"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTarget"}}]}},{"kind":"Field","name":{"kind":"Name","value":"teamWarnings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onHold"}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProfileQueryQuery, ProfileQueryQueryVariables>;
export const ProfileHistoryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileHistoryQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"profile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"judgmentHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]}}]} as unknown as DocumentNode<ProfileHistoryQueryQuery, ProfileHistoryQueryQueryVariables>;
export const TeamListQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamListQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receivedTeamInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"weekSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"passCount"}},{"kind":"Field","name":{"kind":"Name","value":"notYetCount"}}]}}]}}]}}]} as unknown as DocumentNode<TeamListQueryQuery, TeamListQueryQueryVariables>;
export const TeamCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteCode"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]}}]} as unknown as DocumentNode<TeamCreateMutation, TeamCreateMutationVariables>;
export const TeamJoinByCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamJoinByCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinTeamByCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamJoinByCodeMutation, TeamJoinByCodeMutationVariables>;
export const TeamInvitationsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamInvitationsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"receivedTeamInvitations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"teamName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"inviter"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<TeamInvitationsQueryQuery, TeamInvitationsQueryQueryVariables>;
export const TeamAcceptInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamAcceptInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acceptTeamInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamAcceptInvitationMutation, TeamAcceptInvitationMutationVariables>;
export const TeamDeclineInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamDeclineInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineTeamInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<TeamDeclineInvitationMutation, TeamDeclineInvitationMutationVariables>;
export const TeamBoardQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamBoardQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamBoard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"grassFetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"grassNotLoaded"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"memberId"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"isMe"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"hasGrass"}},{"kind":"Field","name":{"kind":"Name","value":"hasRecord"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"warningCount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentPosts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeamBoardQueryQuery, TeamBoardQueryQueryVariables>;
export const TeamLeaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamLeave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leaveTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}]}]}}]} as unknown as DocumentNode<TeamLeaveMutation, TeamLeaveMutationVariables>;
export const TeamManageQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamManageQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamInviteCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]},{"kind":"Field","name":{"kind":"Name","value":"sentTeamInvitations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"invitee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<TeamManageQueryQuery, TeamManageQueryQueryVariables>;
export const TeamMembersQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamMembersQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<TeamMembersQueryQuery, TeamMembersQueryQueryVariables>;
export const TeamPostsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamPostsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<TeamPostsQueryQuery, TeamPostsQueryQueryVariables>;
export const TeamCommentsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamCommentsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamComments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<TeamCommentsQueryQuery, TeamCommentsQueryQueryVariables>;
export const TeamInviteMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamInviteMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"githubLogin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteToTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"githubLogin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"githubLogin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"invitee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}}]}}]}}]} as unknown as DocumentNode<TeamInviteMemberMutation, TeamInviteMemberMutationVariables>;
export const TeamCancelInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamCancelInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelTeamInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<TeamCancelInvitationMutation, TeamCancelInvitationMutationVariables>;
export const TeamKickMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamKickMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kickTeamMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}]}]}}]} as unknown as DocumentNode<TeamKickMemberMutation, TeamKickMemberMutationVariables>;
export const TeamTransferLeadershipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamTransferLeadership"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newLeaderId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferTeamLeadership"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newLeaderId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newLeaderId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamTransferLeadershipMutation, TeamTransferLeadershipMutationVariables>;
export const TeamSetVisibilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamSetVisibility"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPublic"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"isPublic"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPublic"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}}]}}]}}]} as unknown as DocumentNode<TeamSetVisibilityMutation, TeamSetVisibilityMutationVariables>;
export const TeamDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}]}]}}]} as unknown as DocumentNode<TeamDeleteMutation, TeamDeleteMutationVariables>;
export const TeamUpdateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamUpdateComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<TeamUpdateCommentMutation, TeamUpdateCommentMutationVariables>;
export const TeamExemptionQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamExemptionQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myPersonalExemptionRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"overlapsExemptionPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<TeamExemptionQueryQuery, TeamExemptionQueryQueryVariables>;
export const TeamRequestExemptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamRequestExemption"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPersonalExemption"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}},{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"overlapsExemptionPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}}]}}]} as unknown as DocumentNode<TeamRequestExemptionMutation, TeamRequestExemptionMutationVariables>;
export const TeamScopeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamScopeQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isLeader"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamScopeQueryQuery, TeamScopeQueryQueryVariables>;
export const AdminLayoutCountsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminLayoutCountsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingMembers"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTargets"}},{"kind":"Field","name":{"kind":"Name","value":"pendingExemptions"}}]}}]}}]} as unknown as DocumentNode<AdminLayoutCountsQueryQuery, AdminLayoutCountsQueryQueryVariables>;
export const SessionQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SessionQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]} as unknown as DocumentNode<SessionQueryQuery, SessionQueryQueryVariables>;
export const SessionTeamsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SessionTeamsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"receivedTeamInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<SessionTeamsQueryQuery, SessionTeamsQueryQueryVariables>;
export const SessionExchangeAuthCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SessionExchangeAuthCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exchangeAuthCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresIn"}},{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]}}]} as unknown as DocumentNode<SessionExchangeAuthCodeMutation, SessionExchangeAuthCodeMutationVariables>;