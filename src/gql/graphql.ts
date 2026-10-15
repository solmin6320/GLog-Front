/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
/** AD-01 ②-5 ⑤ 종류 필터: 글 + 댓글 / 글만 / 댓글만 */
export type AdminContentFilter =
  | 'ALL'
  | 'COMMENT'
  | 'POST';

/** AD-01 ⑥ 결과 필터: 전체 / 미달만 / 보류만 */
export type AdminJudgmentFilter =
  | 'ALL'
  | 'FAIL'
  | 'HOLD';

/** AD-01 ②-2 ⑤ 상태 필터: 승인 대기 / 거절 / 전체 (추측: '전체' = 대기 + 거절) */
export type AdminMemberFilter =
  | 'ALL'
  | 'PENDING'
  | 'REJECTED';

/** 글 + 댓글 혼합 목록의 행 종류 (AD-01 ②-5, TM-06 ⑧) */
export type ContentKind =
  | 'COMMENT'
  | 'POST';

export type CorrectJudgmentInput = {
  expectedBasis?: string | null | undefined;
  judgmentId: string | number;
  newStatus: CorrectableJudgmentStatus;
  /** 필수(DB 1-14) */
  reason: string;
};

/** DB judgment_correction.after_status (1-14). 정정으로 만들 수 있는 결과 3종(기능명세서 7장) [Q-05: B안이면 EXCLUDED 추가] */
export type CorrectableJudgmentStatus =
  | 'EXEMPT'
  | 'FAIL'
  | 'PASS';

/**
 * 글 작성 (BD-04). 필수 항목이 비어도 저장은 허용(E-24 추측) — isRecord는 서버가 계산한다(DB 1-5).
 * type과 맞지 않는 section key는 VALIDATION_FAILED.
 */
export type CreatePostInput = {
  commitUrls: Array<string>;
  sections: Array<PostSectionInput>;
  tags: Array<string>;
  /** 본인이 속한 팀만. null = 연결 안 함(BD-04 ⑨) */
  teamId?: string | number | null | undefined;
  /** 1~60자(BD-04 ③ 제안). 제목만 진짜 필수 */
  title: string;
  type: PostType;
};

export type CreateTeamInput = {
  /** 100자 이내(TM-02 ② 제안). DB는 200자 */
  description?: string | null | undefined;
  /** 기본 공개(TM-02 ③) */
  isPublic: boolean;
  /** 1~20자(TM-02 ① 제안) */
  name: string;
};

export type ExemptionPeriodInput = {
  expectedBasis?: string | null | undefined;
  reason: string;
  weekStart: string;
};

/**
 * 잔디 조회 상태 (제안). 실패를 오류가 아니라 데이터로 내려 화면 일부만 대체한다.
 * FAILED = E-32 "잔디를 아직 못 불러왔어요" / IDENTITY_MISMATCH = E-08 "GitHub 아이디가 바뀌었어요"
 */
export type GrassFetchStatus =
  | 'FAILED'
  | 'IDENTITY_MISMATCH'
  | 'OK';

/** DB weekly_judgment.hold_reason (1-6). IDENTITY_MISMATCH는 재시도로 풀리지 않는다(E-08) */
export type HoldReason =
  | 'API_ERROR'
  | 'IDENTITY_MISMATCH';

/** DB weekly_judgment.status (1-6). HOLD는 확정 상태가 아니다(E-35) */
export type JudgmentStatus =
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  | 'HOLD'
  | 'PASS';

/**
 * 판정 전(진행 중) 주의 상태 (제안)
 * 확정 판정(JudgmentStatus)과 섞지 않는다 — '보류는 진행 중과 다른 상태'(AD-01 ②-0 비고).
 * TM-05 상태 칸: CONDITION_MET="통과", NOT_YET="아직", EXCLUDED/EXEMPT="제외"(TM-05 비고 제안)
 * CM-01 ③ · AC-01 ④: CONDITION_MET="이번 주는 통과 예정이에요"
 */
export type LiveWeekStatus =
  | 'CONDITION_MET'
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'NOT_YET';

/** DB member.role (1-1) */
export type MemberRole =
  | 'ADMIN'
  | 'MEMBER';

/** DB member.status (1-1) */
export type MemberStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'REJECTED';

export type NoticeInput = {
  content: string;
  isPinned: boolean;
  title: string;
};

/** 재계산 미리보기의 벌칙 대상 변화 (AD-01 ⑩ '벌칙 진입·해제', E-42 · E-50) */
export type PenaltyChange =
  | 'ENTER'
  | 'NONE'
  | 'RELEASE';

/** DB personal_exemption.status (1-13). 초대(DECLINED)와 단어가 다르지만 DB 그대로 둔다 */
export type PersonalExemptionStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

/** BD-01 · 헤더 검색(5-1-0-1) 공통 필터. 헤더 검색은 서버에 따로 묻지 않고 이 필터로 BD-01에 들어온다 */
export type PostFilter = {
  /** [Q-12] PR-01 ⑥ '작성자 필터' */
  authorId?: string | number | null | undefined;
  /** 제목 · 내용 · 태그 검색. 앞뒤 공백 제거 후 2~50자(E-61 · E-63) */
  query?: string | null | undefined;
  tag?: string | null | undefined;
  /** [Q-12] TM-05 ⑧ '전체보기(팀 필터)'. A안이면 사용, B안이면 남겨두고 쓰지 않는다 */
  teamId?: string | number | null | undefined;
  /** null이면 종류 무관(관리자 · 프로필용) */
  type?: PostType | null | undefined;
};

export type PostSectionInput = {
  body?: string | null | undefined;
  key: PostSectionKey;
};

/**
 * posts.sections 의 키(DB 3-1: problem/cause/solution/did/learned)를 enum으로 올린 것 (제안)
 * TROUBLESHOOTING = PROBLEM · CAUSE · SOLUTION / DEVLOG = DID · LEARNED (기능명세서 3장 작성 항목)
 */
export type PostSectionKey =
  | 'CAUSE'
  | 'DID'
  | 'LEARNED'
  | 'PROBLEM'
  | 'SOLUTION';

/** DB post_index.post_type · posts.type (1-5, 3-1). URL 쿼리(?type=troubleshooting|devlog)는 소문자이므로 라우터에서 변환한다 */
export type PostType =
  | 'DEVLOG'
  | 'TROUBLESHOOTING';

export type RequestPersonalExemptionInput = {
  /** 이 팀 팀원 또는 본인(TM-08 ①) */
  memberId: string | number;
  /** 200자 이내(TM-08 ③ 제안). DB는 500자 */
  reason: string;
  teamId: string | number;
  /** 이번 주 · 다음 주(TM-08 ② 제안) */
  weekStart: string;
};

/**
 * DB weekly_judgment.skip_reason (1-6).
 * EXCLUDED ↔ NO_TEAM · FIRST_WEEK / EXEMPT ↔ EXEMPTION_PERIOD · PERSONAL_EXEMPTION (DB 1-6 대응표, 고정)
 * 화면: FIRST_WEEK = "첫 참가"(AC-01 ⑤ · 목업 W-06 배지), NO_TEAM = "제외"
 */
export type SkipReason =
  | 'EXEMPTION_PERIOD'
  | 'FIRST_WEEK'
  | 'NO_TEAM'
  | 'PERSONAL_EXEMPTION';

/**
 * 경고 카테고리·게시글 팀 표기 종류 (제안)
 * PRIVATE → "비공개 팀"(열람자 구분 없이 무조건, E-23) / DELETED → "삭제된 팀"(기능명세서 6장, E-43)
 */
export type TeamLabelKind =
  | 'DELETED'
  | 'PRIVATE'
  | 'PUBLIC';

/** 팀 단위 역할. 권한 판정은 항상 (회원, 팀) 쌍이다(화면설계서 5-2-1) */
export type TeamRole =
  | 'LEADER'
  | 'MEMBER';

/**
 * 글 수정. 종류는 바꿀 수 없다(BD-04 ② 제안).
 * 전체 치환(필드 전부 보냄) 방식 (제안) — 'teamId 생략'과 'teamId: null(연결 해제)'을 헷갈리지 않기 위해.
 * 팀장이 남의 글을 수정할 때 teamId는 서버가 무시한다(BD-04 비고: ②⑨ 비활성).
 */
export type UpdatePostInput = {
  commitUrls: Array<string>;
  sections: Array<PostSectionInput>;
  tags: Array<string>;
  teamId?: string | number | null | undefined;
  title: string;
};

/**
 * DB warning.delete_reason (1-9).
 * [충돌] FC-04는 정정·소급 면제로 '회수'된 경고를 사유를 구분해 저장한다고 적었으나 DB에는 이 두 값뿐이다.
 * 회수를 소프트 삭제로 남긴다면 RETRACTED 같은 값이 필요하다 (제안 — 계약서 9장 C-03)
 */
export type WarningDeleteReason =
  | 'KICKED'
  | 'TEAM_DELETED';

/**
 * 경고 한 건의 현재 상태 (추측 — DB 4-3 재계산 결과에서 파생, 저장 컬럼 아님)
 * ACTIVE="유효" · DEDUCTED="차감됨" (AC-02 ③, 목업 W-07)
 * FULFILLED="이행 완료" [Q-13 A안일 때만 쓴다. B안이면 이 값은 내려오지 않고 이력에서 빠진다]
 * 소프트 삭제된 경고는 회원 화면에 나오지 않는다(AC-02 ③).
 */
export type WarningStanding =
  | 'ACTIVE'
  | 'DEDUCTED'
  | 'FULFILLED';

export type WeeklyQueryQueryVariables = Exact<{
  weekStart?: string | null | undefined;
}>;


export type WeeklyQueryQuery = { myWeek: { weekStart: string, isCurrentWeek: boolean, verifiedDays: number | null, recordCount: number | null, grassStatus: GrassFetchStatus, grassUpdatedAt: string | null, privateContributionSuspected: boolean, days: Array<{ date: string, grassCount: number | null, grassLevel: number | null, hasGrass: boolean, recordCount: number | null, hasRecord: boolean, verified: boolean, isFuture: boolean, isToday: boolean }>, live: { status: LiveWeekStatus, skipReason: SkipReason | null, verifiedDaysNeeded: number, recordsNeeded: number } | null, judgment: { id: string, status: JudgmentStatus, skipReason: SkipReason | null } | null }, grassRuleNotice: { id: string } | null };

export type WeeklyHistoryQueryQueryVariables = Exact<{
  memberId: string | number;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type WeeklyHistoryQueryQuery = { member: { id: string, judgmentHistory: { nodes: Array<{ id: string, weekStart: string, status: JudgmentStatus, skipReason: SkipReason | null, verifiedDays: number | null, recordCount: number | null }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } } | null };

export type WarningsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type WarningsQueryQuery = { myWarnings: { state: { activeCount: number, isPenaltyTarget: boolean, consecutivePasses: number, weeksUntilDeduction: number | null }, history: Array<{ id: string, weekStart: string, verifiedDays: number | null, recordCount: number | null, standing: WarningStanding, categories: Array<{ kind: TeamLabelKind, name: string | null }> }> } };

export type AdminDashboardSummaryQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminDashboardSummaryQueryQuery = { adminDashboardSummary: { pendingMemberCount: number, latestWeekFailCount: number, latestJudgedWeekStart: string | null, penaltyTargetCount: number, pendingExemptionRequestCount: number, heldJudgmentCount: number }, heldJudgments: Array<{ canRetry: boolean, judgment: { id: string, weekStart: string, weekEnd: string, status: JudgmentStatus, holdReason: HoldReason | null }, member: { id: string, nickname: string } }> };

export type AdminDashboardWeekQueryQueryVariables = Exact<{
  weekStart?: string | null | undefined;
  filter?: AdminJudgmentFilter | null | undefined;
  search?: string | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminDashboardWeekQueryQuery = { adminJudgmentWeek: { weekStart: string, weekEnd: string, executedAt: string | null, counts: { pass: number, fail: number, exempt: number, firstWeek: number, hold: number }, rows: { totalCount: number, nodes: Array<{ activeWarningCount: number, isPenaltyTarget: boolean, canRetry: boolean, canCorrect: boolean, judgment: { id: string, weekStart: string, weekEnd: string, status: JudgmentStatus, skipReason: SkipReason | null, holdReason: HoldReason | null, verifiedDays: number | null, recordCount: number | null, corrected: boolean }, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } } };

export type AdminDashboardCorrectionPreviewQueryQueryVariables = Exact<{
  judgmentId: string | number;
  newStatus: CorrectableJudgmentStatus;
}>;


export type AdminDashboardCorrectionPreviewQueryQuery = { judgmentCorrectionPreview: { warningCountBefore: number, warningCountAfter: number, penaltyChange: PenaltyChange, affectedWeekCount: number, frozenByFulfillment: boolean, basis: string | null } };

export type AdminDashboardCorrectJudgmentMutationVariables = Exact<{
  input: CorrectJudgmentInput;
}>;


export type AdminDashboardCorrectJudgmentMutation = { correctJudgment: { member: { id: string }, judgment: { id: string, status: JudgmentStatus, skipReason: SkipReason | null, corrected: boolean } | null } };

export type AdminDashboardRerunHeldMutationVariables = Exact<{
  judgmentIds?: Array<string | number> | string | number | null | undefined;
}>;


export type AdminDashboardRerunHeldMutation = { rerunHeldJudgments: { processedCount: number, stillHeldCount: number } };

export type AdminExemptionsPeriodsQueryQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminExemptionsPeriodsQueryQuery = { exemptionPeriods: { nodes: Array<{ id: string, weekStart: string, weekEnd: string, reason: string, isPast: boolean }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type AdminExemptionsPeriodPreviewQueryQueryVariables = Exact<{
  weekStart: string;
  periodId?: string | number | null | undefined;
  removing?: boolean | null | undefined;
}>;


export type AdminExemptionsPeriodPreviewQueryQuery = { exemptionPeriodPreview: { weekStart: string, isRetroactive: boolean, affectedMemberCount: number, basis: string | null, changes: Array<{ warningCountBefore: number, warningCountAfter: number, penaltyChange: PenaltyChange, affectedWeekCount: number, frozenByFulfillment: boolean, member: { id: string, nickname: string } }> } };

export type AdminExemptionsCreatePeriodMutationVariables = Exact<{
  input: ExemptionPeriodInput;
}>;


export type AdminExemptionsCreatePeriodMutation = { createExemptionPeriod: { id: string, weekStart: string, weekEnd: string, reason: string, isPast: boolean } };

export type AdminExemptionsUpdatePeriodMutationVariables = Exact<{
  id: string | number;
  input: ExemptionPeriodInput;
}>;


export type AdminExemptionsUpdatePeriodMutation = { updateExemptionPeriod: { id: string, weekStart: string, weekEnd: string, reason: string, isPast: boolean } };

export type AdminExemptionsDeletePeriodMutationVariables = Exact<{
  id: string | number;
  expectedBasis?: string | null | undefined;
}>;


export type AdminExemptionsDeletePeriodMutation = { deleteExemptionPeriod: string };

export type AdminExemptionsRequestsQueryQueryVariables = Exact<{
  status: PersonalExemptionStatus;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminExemptionsRequestsQueryQuery = { personalExemptionRequests: { totalCount: number, nodes: Array<{ id: string, weekStart: string, weekEnd: string, reason: string, status: PersonalExemptionStatus, rejectReason: string | null, createdAt: string, respondedAt: string | null, overlapsExemptionPeriod: boolean, isRetroactive: boolean, member: { id: string, nickname: string, profileImageUrl: string | null }, requestedBy: { id: string, nickname: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type AdminExemptionsApprovalPreviewQueryQueryVariables = Exact<{
  requestId: string | number;
}>;


export type AdminExemptionsApprovalPreviewQueryQuery = { personalExemptionApprovalPreview: { warningCountBefore: number, warningCountAfter: number, penaltyChange: PenaltyChange, affectedWeekCount: number, frozenByFulfillment: boolean, basis: string | null, member: { id: string, nickname: string } } | null };

export type AdminExemptionsApproveMutationVariables = Exact<{
  requestId: string | number;
  expectedBasis?: string | null | undefined;
}>;


export type AdminExemptionsApproveMutation = { approvePersonalExemption: { id: string, status: PersonalExemptionStatus, respondedAt: string | null } };

export type AdminExemptionsRejectMutationVariables = Exact<{
  requestId: string | number;
  reason: string;
}>;


export type AdminExemptionsRejectMutation = { rejectPersonalExemption: { id: string, status: PersonalExemptionStatus, rejectReason: string | null, respondedAt: string | null } };

export type AdminExemptionsSummaryQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminExemptionsSummaryQueryQuery = { adminDashboardSummary: { pendingExemptionRequestCount: number } };

export type AdminMembersQueryQueryVariables = Exact<{
  filter: AdminMemberFilter;
  search?: string | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminMembersQueryQuery = { adminMembers: { totalCount: number, nodes: Array<{ status: MemberStatus, appliedAt: string, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type AdminMembersSummaryQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminMembersSummaryQueryQuery = { adminDashboardSummary: { pendingMemberCount: number } };

export type AdminMembersApproveMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersApproveMutation = { approveMember: { status: MemberStatus, appliedAt: string, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } } };

export type AdminMembersRejectMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersRejectMutation = { rejectMember: { status: MemberStatus, appliedAt: string, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } } };

export type AdminMembersRevertMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminMembersRevertMutation = { revertMemberToPending: { status: MemberStatus, appliedAt: string, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } } };

export type AdminNoticesQueryQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminNoticesQueryQuery = { notices: { nodes: Array<{ id: string, title: string, isPinned: boolean, isSystem: boolean, createdAt: string, updatedAt: string | null }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type AdminNoticesEditorQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type AdminNoticesEditorQueryQuery = { notice: { id: string, title: string, content: string, isPinned: boolean, isSystem: boolean } | null };

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


export type AdminNoticesDeleteMutation = { deleteNotice: string };

export type AdminNoticesSetPinnedMutationVariables = Exact<{
  id: string | number;
  pinned: boolean;
}>;


export type AdminNoticesSetPinnedMutation = { setNoticePinned: { id: string, isPinned: boolean } };

export type AdminPostsQueryQueryVariables = Exact<{
  filter: AdminContentFilter;
  search?: string | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminPostsQueryQuery = { adminContents: { totalCount: number, nodes: Array<{ kind: ContentKind, targetId: string, postId: string, postType: PostType, title: string, createdAt: string, author: { id: string, nickname: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type AdminPostsDeletePostMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminPostsDeletePostMutation = { deletePost: string };

export type AdminPostsDeleteCommentMutationVariables = Exact<{
  id: string | number;
}>;


export type AdminPostsDeleteCommentMutation = { deleteComment: string };

export type AdminWarningsPenaltyTargetsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminWarningsPenaltyTargetsQueryQuery = { penaltyTargets: Array<{ activeWarningCount: number, reachedWeekStart: string, reachedAt: string | null, member: { id: string, nickname: string, profileImageUrl: string | null }, teams: Array<{ teamId: string, name: string, isPublic: boolean, isDeleted: boolean }> }> };

export type AdminWarningsDeletedQueryQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type AdminWarningsDeletedQueryQuery = { deletedWarnings: { totalCount: number, nodes: Array<{ id: string, weekStart: string, weekEnd: string, deleteReason: WarningDeleteReason, deletedAt: string, member: { id: string, nickname: string, profileImageUrl: string | null }, restoreCategories: Array<{ teamId: string, name: string, isPublic: boolean, isDeleted: boolean }> }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type AdminWarningsRestorePreviewQueryQueryVariables = Exact<{
  warningId: string | number;
}>;


export type AdminWarningsRestorePreviewQueryQuery = { restoreWarningPreview: { warningCountBefore: number, warningCountAfter: number, penaltyChange: PenaltyChange, frozenByFulfillment: boolean, restoresWithoutCategory: boolean, basis: string | null } };

export type AdminWarningsFulfillPenaltyMutationVariables = Exact<{
  memberId: string | number;
}>;


export type AdminWarningsFulfillPenaltyMutation = { fulfillPenalty: { member: { id: string } } };

export type AdminWarningsRestoreWarningMutationVariables = Exact<{
  warningId: string | number;
  expectedBasis?: string | null | undefined;
}>;


export type AdminWarningsRestoreWarningMutation = { restoreWarning: { member: { id: string } } };

export type HomeQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HomeQueryQuery = { myWeek: { weekStart: string, verifiedDays: number | null, recordCount: number | null, grassStatus: GrassFetchStatus, grassUpdatedAt: string | null, privateContributionSuspected: boolean, days: Array<{ date: string, grassCount: number | null, grassLevel: number | null, hasGrass: boolean, recordCount: number | null, hasRecord: boolean, verified: boolean, isFuture: boolean, isToday: boolean }>, live: { status: LiveWeekStatus, skipReason: SkipReason | null, verifiedDaysNeeded: number, recordsNeeded: number } | null }, myWarnings: { state: { activeCount: number, isPenaltyTarget: boolean, weeksUntilDeduction: number | null } }, grassRuleNotice: { id: string } | null };

export type HomeNoticesQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type HomeNoticesQueryQuery = { notices: { nodes: Array<{ id: string, title: string, isPinned: boolean, createdAt: string }> } };

export type NoticeListQueryQueryVariables = Exact<{
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type NoticeListQueryQuery = { notices: { nodes: Array<{ id: string, title: string, isPinned: boolean, createdAt: string }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type NoticeDetailQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type NoticeDetailQueryQuery = { notice: { id: string, title: string, content: string, isPinned: boolean, isSystem: boolean, createdAt: string, updatedAt: string | null } | null };

export type PostListQueryQueryVariables = Exact<{
  filter: PostFilter;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type PostListQueryQuery = { posts: { totalCount: number, nodes: Array<{ id: string, type: PostType, title: string, tags: Array<string>, isRecord: boolean, createdAt: string, commentCount: number, author: { id: string, nickname: string }, publicTeam: { id: string, name: string } | null }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type PostTypeCountsQueryQueryVariables = Exact<{
  filter: PostFilter;
}>;


export type PostTypeCountsQueryQuery = { postTypeCounts: { troubleshooting: number, devlog: number } };

export type PostTagsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type PostTagsQueryQuery = { popularTags: Array<{ tag: string, count: number }> };

export type PostDetailQueryQueryVariables = Exact<{
  id: string | number;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type PostDetailQueryQuery = { post:
    | { __typename: 'DeletedPost', id: string, deletedAt: string | null }
    | { __typename: 'Post', id: string, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, inFinalizedWeek: boolean, createdAt: string, updatedAt: string | null, commentCount: number, viewerCanEdit: boolean, viewerCanDelete: boolean, viewerIsAuthor: boolean, sections: Array<{ key: PostSectionKey, body: string | null }>, author: { id: string, nickname: string, profileImageUrl: string | null }, publicTeam: { id: string, name: string } | null, comments: { totalCount: number, nodes: Array<{ id: string, content: string, createdAt: string, updatedAt: string | null, viewerCanEdit: boolean, viewerCanDelete: boolean, author: { id: string, nickname: string, profileImageUrl: string | null } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } }
   | null };

export type PostDeleteMutationVariables = Exact<{
  id: string | number;
}>;


export type PostDeleteMutation = { deletePost: string };

export type PostAddCommentMutationVariables = Exact<{
  postId: string | number;
  content: string;
}>;


export type PostAddCommentMutation = { addComment: { id: string, content: string, createdAt: string, updatedAt: string | null } };

export type PostUpdateCommentMutationVariables = Exact<{
  id: string | number;
  content: string;
}>;


export type PostUpdateCommentMutation = { updateComment: { id: string, content: string, updatedAt: string | null } };

export type PostDeleteCommentMutationVariables = Exact<{
  id: string | number;
}>;


export type PostDeleteCommentMutation = { deleteComment: string };

export type PostEditorTeamsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type PostEditorTeamsQueryQuery = { clock: { now: string, currentWeekStart: string, currentWeekEnd: string }, myTeams: Array<{ id: string, name: string, isPublic: boolean }> };

export type PostEditorPostQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type PostEditorPostQueryQuery = { post:
    | { __typename: 'DeletedPost', id: string }
    | { __typename: 'Post', id: string, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, inFinalizedWeek: boolean, viewerCanEdit: boolean, viewerIsAuthor: boolean, editTeamId: string | null, sections: Array<{ key: PostSectionKey, body: string | null }> }
   | null };

export type PostCreateMutationVariables = Exact<{
  input: CreatePostInput;
}>;


export type PostCreateMutation = { createPost: { id: string, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, createdAt: string, updatedAt: string | null, editTeamId: string | null, sections: Array<{ key: PostSectionKey, body: string | null }> } };

export type PostUpdateMutationVariables = Exact<{
  id: string | number;
  input: UpdatePostInput;
}>;


export type PostUpdateMutation = { updatePost: { id: string, type: PostType, title: string, tags: Array<string>, commitUrls: Array<string>, isRecord: boolean, inFinalizedWeek: boolean, updatedAt: string | null, editTeamId: string | null, sections: Array<{ key: PostSectionKey, body: string | null }>, publicTeam: { id: string, name: string } | null } };

export type ProfileQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type ProfileQueryQuery = { member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null, postCount: number, commentCount: number, grassCalendar: { status: GrassFetchStatus, updatedAt: string | null, privateContributionSuspected: boolean, days: Array<{ date: string, count: number, level: number }> }, warningState: { activeCount: number, isPenaltyTarget: boolean, byCategory: Array<{ count: number, label: { kind: TeamLabelKind, name: string | null } }> }, publicTeams: Array<{ id: string, name: string, viewerRole: TeamRole | null }> } | null, grassRuleNotice: { id: string } | null };

export type ProfileHistoryQueryQueryVariables = Exact<{
  id: string | number;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type ProfileHistoryQueryQuery = { member: { id: string, currentWeek: { weekStart: string, verifiedDays: number | null, recordCount: number | null } | null, judgmentHistory: { nodes: Array<{ id: string, weekStart: string, status: JudgmentStatus, skipReason: SkipReason | null, verifiedDays: number | null, recordCount: number | null, hasActiveWarning: boolean }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } } | null };

export type ProfileResetImageMutationVariables = Exact<{ [key: string]: never; }>;


export type ProfileResetImageMutation = { resetProfileImage: { id: string, profileImageUrl: string | null } };

export type TeamListQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type TeamListQueryQuery = { me: { id: string, pendingInvitationCount: number } | null, myTeams: Array<{ id: string, name: string, isPublic: boolean, viewerRole: TeamRole | null, memberCount: number, currentWeekSummary: { passCount: number, notYetCount: number } }> };

export type TeamCreateMutationVariables = Exact<{
  input: CreateTeamInput;
}>;


export type TeamCreateMutation = { createTeam: { inviteCode: string, team: { id: string, name: string, isPublic: boolean, viewerRole: TeamRole | null, memberCount: number } } };

export type TeamJoinByInviteCodeMutationVariables = Exact<{
  code: string;
}>;


export type TeamJoinByInviteCodeMutation = { joinTeamByInviteCode: { id: string, name: string, isPublic: boolean, viewerRole: TeamRole | null, memberCount: number } };

export type TeamInvitationsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type TeamInvitationsQueryQuery = { me: { id: string, pendingInvitationCount: number } | null, myInvitations: Array<{ id: string, createdAt: string, team: { id: string, name: string }, invitedBy: { id: string, nickname: string } }> };

export type TeamRespondInvitationMutationVariables = Exact<{
  invitationId: string | number;
  accept: boolean;
}>;


export type TeamRespondInvitationMutation = { respondInvitation: { invitationId: string, team: { id: string, name: string, isPublic: boolean, viewerRole: TeamRole | null, memberCount: number } | null } };

export type TeamBoardQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamBoardQueryQuery = { team: { id: string, currentWeekBoard: { weekStart: string, weekEnd: string, grassUpdatedAt: string | null, rows: Array<{ isViewer: boolean, verifiedDays: number | null, recordCount: number, teamWarningCount: number, status: LiveWeekStatus, grassStatus: GrassFetchStatus, member: { id: string, nickname: string, profileImageUrl: string | null }, days: Array<{ date: string, grassCount: number | null, grassLevel: number | null, hasGrass: boolean, recordCount: number | null, hasRecord: boolean, verified: boolean, isFuture: boolean, isToday: boolean }> }> }, recentPosts: Array<{ id: string, type: PostType, title: string, createdAt: string, author: { id: string, nickname: string } }> } | null };

export type TeamLeaveMutationVariables = Exact<{
  teamId: string | number;
}>;


export type TeamLeaveMutation = { leaveTeam: string };

export type TeamManageQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamManageQueryQuery = { team: { id: string, inviteCode: string | null, memberCount: number, members: Array<{ role: TeamRole, joinedAt: string, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } }>, pendingInvitations: Array<{ id: string, createdAt: string, invitee: { id: string, nickname: string, githubLogin: string } }> } | null };

export type TeamManagedContentsQueryQueryVariables = Exact<{
  id: string | number;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type TeamManagedContentsQueryQuery = { team: { id: string, managedContents: { totalCount: number, nodes: Array<{ kind: ContentKind, targetId: string, postId: string, postType: PostType, title: string, createdAt: string, author: { id: string, nickname: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } } | null };

export type TeamInviteMemberMutationVariables = Exact<{
  teamId: string | number;
  githubLogin: string;
}>;


export type TeamInviteMemberMutation = { inviteMember: { id: string, createdAt: string, invitee: { id: string, nickname: string, githubLogin: string } } };

export type TeamCancelInvitationMutationVariables = Exact<{
  invitationId: string | number;
}>;


export type TeamCancelInvitationMutation = { cancelInvitation: string };

export type TeamKickMemberMutationVariables = Exact<{
  teamId: string | number;
  memberId: string | number;
}>;


export type TeamKickMemberMutation = { kickMember: { id: string, memberCount: number, members: Array<{ role: TeamRole, joinedAt: string, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } }> } };

export type TeamTransferLeadershipMutationVariables = Exact<{
  teamId: string | number;
  memberId: string | number;
}>;


export type TeamTransferLeadershipMutation = { transferLeadership: { id: string, viewerRole: TeamRole | null, inviteCode: string | null, memberCount: number } };

export type TeamSetVisibilityMutationVariables = Exact<{
  teamId: string | number;
  isPublic: boolean;
}>;


export type TeamSetVisibilityMutation = { setTeamVisibility: { id: string, isPublic: boolean } };

export type TeamDeleteMutationVariables = Exact<{
  teamId: string | number;
}>;


export type TeamDeleteMutation = { deleteTeam: string };

export type TeamCommentForEditQueryQueryVariables = Exact<{
  postId: string | number;
}>;


export type TeamCommentForEditQueryQuery = { post:
    | { id: string, comments: { nodes: Array<{ id: string, content: string, viewerCanEdit: boolean }> } }
    | Record<PropertyKey, never>
   | null };

export type TeamUpdateCommentMutationVariables = Exact<{
  id: string | number;
  content: string;
}>;


export type TeamUpdateCommentMutation = { updateComment: { id: string, content: string, updatedAt: string | null } };

export type TeamExemptionQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamExemptionQueryQuery = { team: { id: string, members: Array<{ role: TeamRole, member: { id: string, nickname: string } }>, exemptionRequests: Array<{ id: string, weekStart: string, weekEnd: string, status: PersonalExemptionStatus, rejectReason: string | null, overlapsExemptionPeriod: boolean, createdAt: string, member: { id: string, nickname: string } }> } | null };

export type TeamRequestExemptionMutationVariables = Exact<{
  input: RequestPersonalExemptionInput;
}>;


export type TeamRequestExemptionMutation = { requestPersonalExemption: { id: string, weekStart: string, weekEnd: string, status: PersonalExemptionStatus, rejectReason: string | null, overlapsExemptionPeriod: boolean, createdAt: string, member: { id: string, nickname: string } } };

export type TeamScopeQueryQueryVariables = Exact<{
  id: string | number;
}>;


export type TeamScopeQueryQuery = { team: { id: string, name: string, isPublic: boolean, viewerRole: TeamRole | null, memberCount: number } | null };

export type AdminLayoutCountsQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type AdminLayoutCountsQueryQuery = { adminDashboardSummary: { pendingMemberCount: number, penaltyTargetCount: number, pendingExemptionRequestCount: number } };

export type SessionQueryQueryVariables = Exact<{ [key: string]: never; }>;


export type SessionQueryQuery = { clock: { now: string, currentWeekStart: string, currentWeekEnd: string }, me: { id: string, status: MemberStatus, role: MemberRole, hasTeam: boolean, pendingInvitationCount: number, member: { id: string, nickname: string, githubLogin: string, profileImageUrl: string | null } } | null };

export type SessionExchangeLoginCodeMutationVariables = Exact<{
  code: string;
}>;


export type SessionExchangeLoginCodeMutation = { exchangeLoginCode: { status: MemberStatus, accessToken: string | null, expiresAt: string | null } };

export type SessionLogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type SessionLogoutMutation = { logout: boolean };


export const WeeklyQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WeeklyQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWeek"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"isCurrentWeek"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"grassCount"}},{"kind":"Field","name":{"kind":"Name","value":"grassLevel"}},{"kind":"Field","name":{"kind":"Name","value":"hasGrass"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasRecord"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"isFuture"}},{"kind":"Field","name":{"kind":"Name","value":"isToday"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"live"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDaysNeeded"}},{"kind":"Field","name":{"kind":"Name","value":"recordsNeeded"}}]}},{"kind":"Field","name":{"kind":"Name","value":"judgment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"grassStatus"}},{"kind":"Field","name":{"kind":"Name","value":"grassUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"privateContributionSuspected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"grassRuleNotice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<WeeklyQueryQuery, WeeklyQueryQueryVariables>;
export const WeeklyHistoryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WeeklyHistoryQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"judgmentHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]}}]} as unknown as DocumentNode<WeeklyHistoryQueryQuery, WeeklyHistoryQueryQueryVariables>;
export const WarningsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WarningsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWarnings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPenaltyTarget"}},{"kind":"Field","name":{"kind":"Name","value":"consecutivePasses"}},{"kind":"Field","name":{"kind":"Name","value":"weeksUntilDeduction"}}]}},{"kind":"Field","name":{"kind":"Name","value":"history"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"standing"}}]}}]}}]}}]} as unknown as DocumentNode<WarningsQueryQuery, WarningsQueryQueryVariables>;
export const AdminDashboardSummaryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardSummaryQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingMemberCount"}},{"kind":"Field","name":{"kind":"Name","value":"latestWeekFailCount"}},{"kind":"Field","name":{"kind":"Name","value":"latestJudgedWeekStart"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTargetCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingExemptionRequestCount"}},{"kind":"Field","name":{"kind":"Name","value":"heldJudgmentCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"heldJudgments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"holdReason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"canRetry"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardSummaryQueryQuery, AdminDashboardSummaryQueryQueryVariables>;
export const AdminDashboardWeekQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardWeekQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminJudgmentFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminJudgmentWeek"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"executedAt"}},{"kind":"Field","name":{"kind":"Name","value":"counts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pass"}},{"kind":"Field","name":{"kind":"Name","value":"fail"}},{"kind":"Field","name":{"kind":"Name","value":"exempt"}},{"kind":"Field","name":{"kind":"Name","value":"firstWeek"}},{"kind":"Field","name":{"kind":"Name","value":"hold"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"holdReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"corrected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activeWarningCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPenaltyTarget"}},{"kind":"Field","name":{"kind":"Name","value":"canRetry"}},{"kind":"Field","name":{"kind":"Name","value":"canCorrect"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<AdminDashboardWeekQueryQuery, AdminDashboardWeekQueryQueryVariables>;
export const AdminDashboardCorrectionPreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminDashboardCorrectionPreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"judgmentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CorrectableJudgmentStatus"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"judgmentCorrectionPreview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"judgmentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"judgmentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"newStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyChange"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeekCount"}},{"kind":"Field","name":{"kind":"Name","value":"frozenByFulfillment"}},{"kind":"Field","name":{"kind":"Name","value":"basis"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardCorrectionPreviewQueryQuery, AdminDashboardCorrectionPreviewQueryQueryVariables>;
export const AdminDashboardCorrectJudgmentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDashboardCorrectJudgment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CorrectJudgmentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"correctJudgment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"judgment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"corrected"}}]}}]}}]}}]} as unknown as DocumentNode<AdminDashboardCorrectJudgmentMutation, AdminDashboardCorrectJudgmentMutationVariables>;
export const AdminDashboardRerunHeldDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminDashboardRerunHeld"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"judgmentIds"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rerunHeldJudgments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"judgmentIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"judgmentIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processedCount"}},{"kind":"Field","name":{"kind":"Name","value":"stillHeldCount"}}]}}]}}]} as unknown as DocumentNode<AdminDashboardRerunHeldMutation, AdminDashboardRerunHeldMutationVariables>;
export const AdminExemptionsPeriodsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsPeriodsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exemptionPeriods"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"isPast"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsPeriodsQueryQuery, AdminExemptionsPeriodsQueryQueryVariables>;
export const AdminExemptionsPeriodPreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsPeriodPreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"removing"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exemptionPeriodPreview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"weekStart"},"value":{"kind":"Variable","name":{"kind":"Name","value":"weekStart"}}},{"kind":"Argument","name":{"kind":"Name","value":"periodId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"periodId"}}},{"kind":"Argument","name":{"kind":"Name","value":"removing"},"value":{"kind":"Variable","name":{"kind":"Name","value":"removing"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"isRetroactive"}},{"kind":"Field","name":{"kind":"Name","value":"affectedMemberCount"}},{"kind":"Field","name":{"kind":"Name","value":"basis"}},{"kind":"Field","name":{"kind":"Name","value":"changes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyChange"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeekCount"}},{"kind":"Field","name":{"kind":"Name","value":"frozenByFulfillment"}}]}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsPeriodPreviewQueryQuery, AdminExemptionsPeriodPreviewQueryQueryVariables>;
export const AdminExemptionsCreatePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsCreatePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExemptionPeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"isPast"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsCreatePeriodMutation, AdminExemptionsCreatePeriodMutationVariables>;
export const AdminExemptionsUpdatePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsUpdatePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ExemptionPeriodInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"isPast"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsUpdatePeriodMutation, AdminExemptionsUpdatePeriodMutationVariables>;
export const AdminExemptionsDeletePeriodDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsDeletePeriod"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedBasis"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteExemptionPeriod"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedBasis"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedBasis"}}}]}]}}]} as unknown as DocumentNode<AdminExemptionsDeletePeriodMutation, AdminExemptionsDeletePeriodMutationVariables>;
export const AdminExemptionsRequestsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsRequestsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PersonalExemptionStatus"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personalExemptionRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"requestedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}},{"kind":"Field","name":{"kind":"Name","value":"overlapsExemptionPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"isRetroactive"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsRequestsQueryQuery, AdminExemptionsRequestsQueryQueryVariables>;
export const AdminExemptionsApprovalPreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsApprovalPreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personalExemptionApprovalPreview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyChange"}},{"kind":"Field","name":{"kind":"Name","value":"affectedWeekCount"}},{"kind":"Field","name":{"kind":"Name","value":"frozenByFulfillment"}},{"kind":"Field","name":{"kind":"Name","value":"basis"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsApprovalPreviewQueryQuery, AdminExemptionsApprovalPreviewQueryQueryVariables>;
export const AdminExemptionsApproveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsApprove"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedBasis"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvePersonalExemption"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedBasis"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedBasis"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsApproveMutation, AdminExemptionsApproveMutationVariables>;
export const AdminExemptionsRejectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminExemptionsReject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reason"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectPersonalExemption"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}},{"kind":"Argument","name":{"kind":"Name","value":"reason"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reason"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"respondedAt"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsRejectMutation, AdminExemptionsRejectMutationVariables>;
export const AdminExemptionsSummaryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminExemptionsSummaryQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingExemptionRequestCount"}}]}}]}}]} as unknown as DocumentNode<AdminExemptionsSummaryQueryQuery, AdminExemptionsSummaryQueryQueryVariables>;
export const AdminMembersQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMembersQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminMemberFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminMembers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AdminMembersQueryQuery, AdminMembersQueryQueryVariables>;
export const AdminMembersSummaryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminMembersSummaryQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingMemberCount"}}]}}]}}]} as unknown as DocumentNode<AdminMembersSummaryQueryQuery, AdminMembersSummaryQueryQueryVariables>;
export const AdminMembersApproveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersApprove"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersApproveMutation, AdminMembersApproveMutationVariables>;
export const AdminMembersRejectDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersReject"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rejectMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersRejectMutation, AdminMembersRejectMutationVariables>;
export const AdminMembersRevertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminMembersRevert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revertMemberToPending"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"appliedAt"}}]}}]}}]} as unknown as DocumentNode<AdminMembersRevertMutation, AdminMembersRevertMutationVariables>;
export const AdminNoticesQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminNoticesQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<AdminNoticesQueryQuery, AdminNoticesQueryQueryVariables>;
export const AdminNoticesEditorQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminNoticesEditorQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesEditorQueryQuery, AdminNoticesEditorQueryQueryVariables>;
export const AdminNoticesCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesCreateMutation, AdminNoticesCreateMutationVariables>;
export const AdminNoticesUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"NoticeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesUpdateMutation, AdminNoticesUpdateMutationVariables>;
export const AdminNoticesDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminNoticesDeleteMutation, AdminNoticesDeleteMutationVariables>;
export const AdminNoticesSetPinnedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminNoticesSetPinned"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setNoticePinned"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"pinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]}}]} as unknown as DocumentNode<AdminNoticesSetPinnedMutation, AdminNoticesSetPinnedMutationVariables>;
export const AdminPostsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminPostsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminContentFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"postType"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AdminPostsQueryQuery, AdminPostsQueryQueryVariables>;
export const AdminPostsDeletePostDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPostsDeletePost"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminPostsDeletePostMutation, AdminPostsDeletePostMutationVariables>;
export const AdminPostsDeleteCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminPostsDeleteComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<AdminPostsDeleteCommentMutation, AdminPostsDeleteCommentMutationVariables>;
export const AdminWarningsPenaltyTargetsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWarningsPenaltyTargetsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"penaltyTargets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"activeWarningCount"}},{"kind":"Field","name":{"kind":"Name","value":"reachedWeekStart"}},{"kind":"Field","name":{"kind":"Name","value":"reachedAt"}},{"kind":"Field","name":{"kind":"Name","value":"teams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}}]}}]}}]}}]} as unknown as DocumentNode<AdminWarningsPenaltyTargetsQueryQuery, AdminWarningsPenaltyTargetsQueryQueryVariables>;
export const AdminWarningsDeletedQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWarningsDeletedQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletedWarnings"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"deleteReason"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"restoreCategories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"teamId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"isDeleted"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<AdminWarningsDeletedQueryQuery, AdminWarningsDeletedQueryQueryVariables>;
export const AdminWarningsRestorePreviewQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminWarningsRestorePreviewQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreWarningPreview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"warningId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"warningCountBefore"}},{"kind":"Field","name":{"kind":"Name","value":"warningCountAfter"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyChange"}},{"kind":"Field","name":{"kind":"Name","value":"frozenByFulfillment"}},{"kind":"Field","name":{"kind":"Name","value":"restoresWithoutCategory"}},{"kind":"Field","name":{"kind":"Name","value":"basis"}}]}}]}}]} as unknown as DocumentNode<AdminWarningsRestorePreviewQueryQuery, AdminWarningsRestorePreviewQueryQueryVariables>;
export const AdminWarningsFulfillPenaltyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminWarningsFulfillPenalty"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fulfillPenalty"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AdminWarningsFulfillPenaltyMutation, AdminWarningsFulfillPenaltyMutationVariables>;
export const AdminWarningsRestoreWarningDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AdminWarningsRestoreWarning"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"expectedBasis"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"restoreWarning"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"warningId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"warningId"}}},{"kind":"Argument","name":{"kind":"Name","value":"expectedBasis"},"value":{"kind":"Variable","name":{"kind":"Name","value":"expectedBasis"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AdminWarningsRestoreWarningMutation, AdminWarningsRestoreWarningMutationVariables>;
export const HomeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomeQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myWeek"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"grassCount"}},{"kind":"Field","name":{"kind":"Name","value":"grassLevel"}},{"kind":"Field","name":{"kind":"Name","value":"hasGrass"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasRecord"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"isFuture"}},{"kind":"Field","name":{"kind":"Name","value":"isToday"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"live"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDaysNeeded"}},{"kind":"Field","name":{"kind":"Name","value":"recordsNeeded"}}]}},{"kind":"Field","name":{"kind":"Name","value":"grassStatus"}},{"kind":"Field","name":{"kind":"Name","value":"grassUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"privateContributionSuspected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myWarnings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPenaltyTarget"}},{"kind":"Field","name":{"kind":"Name","value":"weeksUntilDeduction"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"grassRuleNotice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<HomeQueryQuery, HomeQueryQueryVariables>;
export const HomeNoticesQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HomeNoticesQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"3"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<HomeNoticesQueryQuery, HomeNoticesQueryQueryVariables>;
export const NoticeListQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NoticeListQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notices"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<NoticeListQueryQuery, NoticeListQueryQueryVariables>;
export const NoticeDetailQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NoticeDetailQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"isSystem"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<NoticeDetailQueryQuery, NoticeDetailQueryQueryVariables>;
export const PostListQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostListQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PostFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"posts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]} as unknown as DocumentNode<PostListQueryQuery, PostListQueryQueryVariables>;
export const PostTypeCountsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostTypeCountsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PostFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"postTypeCounts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"troubleshooting"}},{"kind":"Field","name":{"kind":"Name","value":"devlog"}}]}}]}}]} as unknown as DocumentNode<PostTypeCountsQueryQuery, PostTypeCountsQueryQueryVariables>;
export const PostTagsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostTagsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"popularTags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"10"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tag"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<PostTagsQueryQuery, PostTagsQueryQueryVariables>;
export const PostDetailQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostDetailQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"body"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"inFinalizedWeek"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanEdit"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanDelete"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsAuthor"}},{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanEdit"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanDelete"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeletedPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"deletedAt"}}]}}]}}]}}]} as unknown as DocumentNode<PostDetailQueryQuery, PostDetailQueryQueryVariables>;
export const PostDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deletePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<PostDeleteMutation, PostDeleteMutationVariables>;
export const PostAddCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostAddComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"postId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PostAddCommentMutation, PostAddCommentMutationVariables>;
export const PostUpdateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostUpdateComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<PostUpdateCommentMutation, PostUpdateCommentMutationVariables>;
export const PostDeleteCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostDeleteComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<PostDeleteCommentMutation, PostDeleteCommentMutationVariables>;
export const PostEditorTeamsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostEditorTeamsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clock"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"now"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeekStart"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeekEnd"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}}]}}]}}]} as unknown as DocumentNode<PostEditorTeamsQueryQuery, PostEditorTeamsQueryQueryVariables>;
export const PostEditorPostQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PostEditorPostQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"body"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"inFinalizedWeek"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanEdit"}},{"kind":"Field","name":{"kind":"Name","value":"viewerIsAuthor"}},{"kind":"Field","name":{"kind":"Name","value":"editTeamId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeletedPost"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<PostEditorPostQueryQuery, PostEditorPostQueryQueryVariables>;
export const PostCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createPost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"body"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"editTeamId"}}]}}]}}]} as unknown as DocumentNode<PostCreateMutation, PostCreateMutationVariables>;
export const PostUpdateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PostUpdate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePostInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updatePost"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"sections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"body"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"commitUrls"}},{"kind":"Field","name":{"kind":"Name","value":"isRecord"}},{"kind":"Field","name":{"kind":"Name","value":"inFinalizedWeek"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"editTeamId"}},{"kind":"Field","name":{"kind":"Name","value":"publicTeam"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<PostUpdateMutation, PostUpdateMutationVariables>;
export const ProfileQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"postCount"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}},{"kind":"Field","name":{"kind":"Name","value":"grassCalendar"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"level"}}]}},{"kind":"Field","name":{"kind":"Name","value":"privateContributionSuspected"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warningState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activeCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPenaltyTarget"}},{"kind":"Field","name":{"kind":"Name","value":"byCategory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"publicTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"grassRuleNotice"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ProfileQueryQuery, ProfileQueryQueryVariables>;
export const ProfileHistoryQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProfileHistoryQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeek"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"judgmentHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"skipReason"}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasActiveWarning"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProfileHistoryQueryQuery, ProfileHistoryQueryQueryVariables>;
export const ProfileResetImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProfileResetImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resetProfileImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}}]}}]} as unknown as DocumentNode<ProfileResetImageMutation, ProfileResetImageMutationVariables>;
export const TeamListQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamListQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvitationCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myTeams"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeekSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"passCount"}},{"kind":"Field","name":{"kind":"Name","value":"notYetCount"}}]}}]}}]}}]} as unknown as DocumentNode<TeamListQueryQuery, TeamListQueryQueryVariables>;
export const TeamCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTeamInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteCode"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]}}]} as unknown as DocumentNode<TeamCreateMutation, TeamCreateMutationVariables>;
export const TeamJoinByInviteCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamJoinByInviteCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"joinTeamByInviteCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamJoinByInviteCodeMutation, TeamJoinByInviteCodeMutationVariables>;
export const TeamInvitationsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamInvitationsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvitationCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"myInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"invitedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}}]}}]} as unknown as DocumentNode<TeamInvitationsQueryQuery, TeamInvitationsQueryQueryVariables>;
export const TeamRespondInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamRespondInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"accept"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"respondInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"accept"},"value":{"kind":"Variable","name":{"kind":"Name","value":"accept"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"invitationId"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]}}]} as unknown as DocumentNode<TeamRespondInvitationMutation, TeamRespondInvitationMutationVariables>;
export const TeamBoardQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamBoardQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeekBoard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"grassUpdatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}},{"kind":"Field","name":{"kind":"Name","value":"isViewer"}},{"kind":"Field","name":{"kind":"Name","value":"days"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"grassCount"}},{"kind":"Field","name":{"kind":"Name","value":"grassLevel"}},{"kind":"Field","name":{"kind":"Name","value":"hasGrass"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasRecord"}},{"kind":"Field","name":{"kind":"Name","value":"verified"}},{"kind":"Field","name":{"kind":"Name","value":"isFuture"}},{"kind":"Field","name":{"kind":"Name","value":"isToday"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verifiedDays"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"teamWarningCount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"grassStatus"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"recentPosts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"5"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeamBoardQueryQuery, TeamBoardQueryQueryVariables>;
export const TeamLeaveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamLeave"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leaveTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}]}]}}]} as unknown as DocumentNode<TeamLeaveMutation, TeamLeaveMutationVariables>;
export const TeamManageQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamManageQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"inviteCode"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvitations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"invitee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeamManageQueryQuery, TeamManageQueryQueryVariables>;
export const TeamManagedContentsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamManagedContentsQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"first"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"managedContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"Variable","name":{"kind":"Name","value":"first"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"targetId"}},{"kind":"Field","name":{"kind":"Name","value":"postId"}},{"kind":"Field","name":{"kind":"Name","value":"postType"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"author"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}}]} as unknown as DocumentNode<TeamManagedContentsQueryQuery, TeamManagedContentsQueryQueryVariables>;
export const TeamInviteMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamInviteMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"githubLogin"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"inviteMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"githubLogin"},"value":{"kind":"Variable","name":{"kind":"Name","value":"githubLogin"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"invitee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}}]}}]}}]}}]} as unknown as DocumentNode<TeamInviteMemberMutation, TeamInviteMemberMutationVariables>;
export const TeamCancelInvitationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamCancelInvitation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelInvitation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"invitationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"invitationId"}}}]}]}}]} as unknown as DocumentNode<TeamCancelInvitationMutation, TeamCancelInvitationMutationVariables>;
export const TeamKickMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamKickMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kickMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"joinedAt"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeamKickMemberMutation, TeamKickMemberMutationVariables>;
export const TeamTransferLeadershipDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamTransferLeadership"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transferLeadership"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"memberId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"memberId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}},{"kind":"Field","name":{"kind":"Name","value":"inviteCode"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamTransferLeadershipMutation, TeamTransferLeadershipMutationVariables>;
export const TeamSetVisibilityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamSetVisibility"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPublic"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setTeamVisibility"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}},{"kind":"Argument","name":{"kind":"Name","value":"isPublic"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPublic"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}}]}}]}}]} as unknown as DocumentNode<TeamSetVisibilityMutation, TeamSetVisibilityMutationVariables>;
export const TeamDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTeam"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"teamId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"teamId"}}}]}]}}]} as unknown as DocumentNode<TeamDeleteMutation, TeamDeleteMutationVariables>;
export const TeamCommentForEditQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamCommentForEditQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"postId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"post"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"postId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Post"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"comments"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"first"},"value":{"kind":"IntValue","value":"100"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"nodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"viewerCanEdit"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeamCommentForEditQueryQuery, TeamCommentForEditQueryQueryVariables>;
export const TeamUpdateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamUpdateComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<TeamUpdateCommentMutation, TeamUpdateCommentMutationVariables>;
export const TeamExemptionQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamExemptionQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"members"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"exemptionRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"overlapsExemptionPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TeamExemptionQueryQuery, TeamExemptionQueryQueryVariables>;
export const TeamRequestExemptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TeamRequestExemption"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RequestPersonalExemptionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestPersonalExemption"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"weekStart"}},{"kind":"Field","name":{"kind":"Name","value":"weekEnd"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"rejectReason"}},{"kind":"Field","name":{"kind":"Name","value":"overlapsExemptionPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}}]}}]}}]}}]} as unknown as DocumentNode<TeamRequestExemptionMutation, TeamRequestExemptionMutationVariables>;
export const TeamScopeQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TeamScopeQuery"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"team"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isPublic"}},{"kind":"Field","name":{"kind":"Name","value":"viewerRole"}},{"kind":"Field","name":{"kind":"Name","value":"memberCount"}}]}}]}}]} as unknown as DocumentNode<TeamScopeQueryQuery, TeamScopeQueryQueryVariables>;
export const AdminLayoutCountsQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminLayoutCountsQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminDashboardSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pendingMemberCount"}},{"kind":"Field","name":{"kind":"Name","value":"penaltyTargetCount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingExemptionRequestCount"}}]}}]}}]} as unknown as DocumentNode<AdminLayoutCountsQueryQuery, AdminLayoutCountsQueryQueryVariables>;
export const SessionQueryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SessionQuery"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clock"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"now"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeekStart"}},{"kind":"Field","name":{"kind":"Name","value":"currentWeekEnd"}}]}},{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"hasTeam"}},{"kind":"Field","name":{"kind":"Name","value":"pendingInvitationCount"}},{"kind":"Field","name":{"kind":"Name","value":"member"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"nickname"}},{"kind":"Field","name":{"kind":"Name","value":"githubLogin"}},{"kind":"Field","name":{"kind":"Name","value":"profileImageUrl"}}]}}]}}]}}]} as unknown as DocumentNode<SessionQueryQuery, SessionQueryQueryVariables>;
export const SessionExchangeLoginCodeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SessionExchangeLoginCode"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exchangeLoginCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"accessToken"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]} as unknown as DocumentNode<SessionExchangeLoginCodeMutation, SessionExchangeLoginCodeMutationVariables>;
export const SessionLogoutDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SessionLogout"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logout"}}]}}]} as unknown as DocumentNode<SessionLogoutMutation, SessionLogoutMutationVariables>;