export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

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

/** 날짜별 인증 한 행. null은 알 수 없음(안 불러왔거나 갱신 전이거나 저장하지 않은 값) */
export type ActivityDay = {
  __typename?: 'ActivityDay';
  date: Scalars['String']['output'];
  /** 잔디 기여 수. 판정이 끝난 주는 저장하지 않아 null */
  grassCount: Maybe<Scalars['Int']['output']>;
  hasGrass: Maybe<Scalars['Boolean']['output']>;
  hasRecord: Scalars['Boolean']['output'];
  /** 기록글 수. 판정이 끝난 주는 저장하지 않아 null */
  recordCount: Maybe<Scalars['Int']['output']>;
};

/** 정정으로 만들 수 있는 결과 (Q-05) */
export type AdminCorrectionStatus =
  | 'EXEMPT'
  | 'FAIL'
  | 'PASS';

export type AdminDashboardSummary = {
  __typename?: 'AdminDashboardSummary';
  /** judgedWeekStart의 미달 판정 수 */
  failedMembers: Scalars['Int']['output'];
  /** 이번 주 미달이 세는 판정 주 월요일 (직전 주) */
  judgedWeekStart: Scalars['String']['output'];
  penaltyTargets: Scalars['Int']['output'];
  pendingExemptions: Scalars['Int']['output'];
  pendingMembers: Scalars['Int']['output'];
};

/** restoreTeams는 복구하면 되살아나는 카테고리. teamDeleted면 그런 팀이 없어 '삭제된 팀'으로 표시된다 (E-43) */
export type AdminDeletedWarning = {
  __typename?: 'AdminDeletedWarning';
  deleteReason: AdminWarningDeleteReason;
  deletedAt: Scalars['String']['output'];
  member: AdminMemberBrief;
  restoreTeams: Array<AdminWarningTeam>;
  teamDeleted: Scalars['Boolean']['output'];
  warningId: Scalars['ID']['output'];
  /** 경고를 받은 주 월요일 */
  weekStart: Scalars['String']['output'];
};

export type AdminDeletedWarningPage = {
  __typename?: 'AdminDeletedWarningPage';
  items: Array<AdminDeletedWarning>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

export type AdminHold = {
  __typename?: 'AdminHold';
  member: AdminMemberBrief;
  reason: AdminHoldReason;
  /** 자동 재시도 3회를 다 썼는가 */
  retriesExhausted: Scalars['Boolean']['output'];
  retryCount: Scalars['Int']['output'];
  weekStart: Scalars['String']['output'];
};

export type AdminHoldPage = {
  __typename?: 'AdminHoldPage';
  /** 그중 본인이 다시 로그인해야 풀리는 건수 */
  identityMismatchCount: Scalars['Int']['output'];
  items: Array<AdminHold>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
  totalCount: Scalars['Int']['output'];
};

/** 보류 이유. API_ERROR는 재시도로 풀리고 IDENTITY_MISMATCH는 본인이 다시 로그인해야 풀린다 (E-08) */
export type AdminHoldReason =
  | 'API_ERROR'
  | 'IDENTITY_MISMATCH';

export type AdminHoldRerunSummary = {
  __typename?: 'AdminHoldRerunSummary';
  attempted: Scalars['Int']['output'];
  failed: Scalars['Int']['output'];
  resolved: Scalars['Int']['output'];
  stillHold: Scalars['Int']['output'];
};

export type AdminHoldRetryResult = {
  __typename?: 'AdminHoldRetryResult';
  holdReason: Maybe<AdminHoldReason>;
  member: AdminMemberBrief;
  /** 이번 재시도로 보류가 풀려 확정됐는가 */
  resolved: Scalars['Boolean']['output'];
  status: AdminJudgmentStatus;
  weekStart: Scalars['String']['output'];
};

export type AdminJudgmentFilter =
  | 'ALL'
  | 'FAIL_ONLY'
  | 'HOLD_ONLY';

/**
 * 한 주의 집계와 회원별 결과. executedAt은 그 주 판정이 확정된 마지막 시각(KST, 없으면 null).
 * holdCount는 사람이 처리해야 하는 보류만 센다
 */
export type AdminJudgmentPage = {
  __typename?: 'AdminJudgmentPage';
  executedAt: Maybe<Scalars['String']['output']>;
  exemptCount: Scalars['Int']['output'];
  failCount: Scalars['Int']['output'];
  firstWeekCount: Scalars['Int']['output'];
  holdCount: Scalars['Int']['output'];
  items: Array<AdminJudgmentRow>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
  passCount: Scalars['Int']['output'];
  weekEnd: Scalars['String']['output'];
  weekStart: Scalars['String']['output'];
};

/** 판정 결과 한 행. warningCount는 보류 주가 남은 회원이면 null. manualHold는 사람이 처리해야 하는 보류 */
export type AdminJudgmentRow = {
  __typename?: 'AdminJudgmentRow';
  corrected: Scalars['Boolean']['output'];
  holdReason: Maybe<AdminHoldReason>;
  judgmentId: Scalars['ID']['output'];
  manualHold: Scalars['Boolean']['output'];
  member: AdminMemberBrief;
  recordCount: Maybe<Scalars['Int']['output']>;
  skipReason: Maybe<AdminSkipReason>;
  status: AdminJudgmentStatus;
  verifiedDays: Maybe<Scalars['Int']['output']>;
  warningCount: Maybe<Scalars['Int']['output']>;
};

export type AdminJudgmentStatus =
  /** 첫 참가 주 · 팀 없음 */
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  /** GitHub 조회 실패로 아직 확정하지 못함 */
  | 'HOLD'
  | 'PASS';

export type AdminMember = {
  __typename?: 'AdminMember';
  /** 신청 시각 (KST, ISO-8601) */
  createdAt: Scalars['String']['output'];
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  role: MemberRole;
  status: MemberStatus;
};

/** 이름 · GitHub 아이디 (관리자 목록에 붙는 회원 표시) */
export type AdminMemberBrief = {
  __typename?: 'AdminMemberBrief';
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
};

export type AdminMemberPage = {
  __typename?: 'AdminMemberPage';
  items: Array<AdminMember>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
  /** 현재 조건의 전체 건수 */
  totalCount: Scalars['Int']['output'];
};

export type AdminPenaltyFulfillment = {
  __typename?: 'AdminPenaltyFulfillment';
  /** 이행 체크 시각 (KST, ISO-8601) */
  fulfilledAt: Scalars['String']['output'];
  member: AdminMemberBrief;
  reachedWeek: Scalars['String']['output'];
};

export type AdminPenaltyTarget = {
  __typename?: 'AdminPenaltyTarget';
  member: AdminMemberBrief;
  /** 경고가 3개에 도달한 주 월요일 */
  reachedWeek: Scalars['String']['output'];
  teams: Array<AdminWarningTeam>;
  /** 3을 넘을 수 있다 */
  warningCount: Scalars['Int']['output'];
};

export type AdminPenaltyTargetPage = {
  __typename?: 'AdminPenaltyTargetPage';
  items: Array<AdminPenaltyTarget>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
  totalCount: Scalars['Int']['output'];
};

/** 글 + 댓글 / 글만 / 댓글만 */
export type AdminPostFilter =
  | 'ALL'
  | 'COMMENTS'
  | 'POSTS';

/**
 * 게시물 관리 한 행. 글이면 id와 postId가 같고 content는 null.
 * 댓글이면 title에 글 제목, content에 댓글 내용(앞 100자)이 담기고 postId로 글 상세에 이동한다
 */
export type AdminPostItem = {
  __typename?: 'AdminPostItem';
  author: AdminMemberBrief;
  content: Maybe<Scalars['String']['output']>;
  /** 작성 시각 (KST, ISO-8601) */
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  kind: AdminPostKind;
  postId: Scalars['ID']['output'];
  title: Scalars['String']['output'];
};

export type AdminPostKind =
  | 'COMMENT'
  | 'POST';

export type AdminPostPage = {
  __typename?: 'AdminPostPage';
  items: Array<AdminPostItem>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/**
 * 정정 · 소급 면제 · 경고 복구의 재계산 영향.
 * onHold면 보류 중인 주가 있어 경고 수를 비교하지 않는다(null). recordOnly면 벌칙 이행 이전 주라 기록만 바뀌고 경고 수는 그대로다 (E-58 · E-59)
 */
export type AdminRecalcImpact = {
  __typename?: 'AdminRecalcImpact';
  /** 그 주 이후 다시 계산되는 판정 수 */
  affectedWeeks: Scalars['Int']['output'];
  /** 벌칙 대상에 새로 들어간다 (E-42) */
  entersPenalty: Scalars['Boolean']['output'];
  /** 벌칙 대상에서 빠진다 (E-50) */
  leavesPenalty: Scalars['Boolean']['output'];
  onHold: Scalars['Boolean']['output'];
  recordOnly: Scalars['Boolean']['output'];
  warningCountAfter: Maybe<Scalars['Int']['output']>;
  warningCountBefore: Maybe<Scalars['Int']['output']>;
};

/** 복구를 반영한 뒤 그 회원의 경고 상태. warningCount는 보류 주가 남아 있으면 null */
export type AdminRestoredWarning = {
  __typename?: 'AdminRestoredWarning';
  member: AdminMemberBrief;
  onHold: Scalars['Boolean']['output'];
  penaltyTarget: Scalars['Boolean']['output'];
  warningCount: Maybe<Scalars['Int']['output']>;
  warningId: Scalars['ID']['output'];
  weekStart: Scalars['String']['output'];
};

/** 판정에서 빠진 이유. NO_TEAM · FIRST_WEEK은 제외, EXEMPTION_PERIOD · PERSONAL_EXEMPTION은 면제 */
export type AdminSkipReason =
  | 'EXEMPTION_PERIOD'
  | 'FIRST_WEEK'
  | 'NO_TEAM'
  | 'PERSONAL_EXEMPTION';

export type AdminWarningDeleteReason =
  | 'KICKED'
  | 'TEAM_DELETED';

/** impact.entersPenalty면 '다시 벌칙 대상이 됩니다'(E-42), impact.recordOnly면 '기록만 되살립니다'(E-59), teamDeleted면 '삭제된 팀으로 표시됩니다'(E-43) */
export type AdminWarningRestorePreview = {
  __typename?: 'AdminWarningRestorePreview';
  impact: AdminRecalcImpact;
  member: AdminMemberBrief;
  restoreTeams: Array<AdminWarningTeam>;
  teamDeleted: Scalars['Boolean']['output'];
  warningId: Scalars['ID']['output'];
  weekStart: Scalars['String']['output'];
};

/** 경고에 붙은 팀. 이 화면에서는 비공개 팀도 실명이다 */
export type AdminWarningTeam = {
  __typename?: 'AdminWarningTeam';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Scalars['String']['output'];
  /** 액세스 토큰 유효 시간(초) */
  expiresIn: Scalars['Int']['output'];
  me: Me;
};

export type BoardAuthor = {
  __typename?: 'BoardAuthor';
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  profileImageUrl: Maybe<Scalars['String']['output']>;
};

export type Comment = {
  __typename?: 'Comment';
  author: BoardAuthor;
  authorId: Scalars['ID']['output'];
  content: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  postId: Scalars['ID']['output'];
  updatedAt: Scalars['String']['output'];
};

export type CommentPage = {
  __typename?: 'CommentPage';
  items: Array<Comment>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/** 정정 반영 뒤의 판정과 그 회원의 경고 상태. warningCount는 보류 주가 남아 있으면 null */
export type CorrectedJudgment = {
  __typename?: 'CorrectedJudgment';
  judgmentId: Scalars['ID']['output'];
  member: AdminMemberBrief;
  onHold: Scalars['Boolean']['output'];
  penaltyTarget: Scalars['Boolean']['output'];
  status: AdminJudgmentStatus;
  warningCount: Maybe<Scalars['Int']['output']>;
  weekStart: Scalars['String']['output'];
};

export type CreatePostInput = {
  /** https://github.com/{owner}/{repo}/commit/{sha} 형식만 허용. 실제 존재 여부는 확인하지 않는다 */
  commitUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  /** 글 종류에 해당하는 항목만 쓰이고 나머지는 무시된다 */
  sections: PostSectionsInput;
  /** 최대 5개, 개당 20자 */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  /** 연결할 팀 id (선택). 지금 내가 소속인 삭제되지 않은 팀만 가능하고, 아니면 POST_TEAM_INVALID */
  teamId?: InputMaybe<Scalars['ID']['input']>;
  /** 1~60자 */
  title: Scalars['String']['input'];
  type: PostType;
};

export type CreateTeamInput = {
  /** 100자 이내 (선택) */
  description?: InputMaybe<Scalars['String']['input']>;
  /** 생략하면 공개 */
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  /** 1~20자 */
  name: Scalars['String']['input'];
};

/** 팀 생성 결과. 초대코드는 이때 한 번 보여준다. 이후에는 팀장이 teamInviteCode로 다시 확인한다 */
export type CreateTeamPayload = {
  __typename?: 'CreateTeamPayload';
  inviteCode: Scalars['String']['output'];
  team: Team;
};

export type ExemptionPeriod = {
  __typename?: 'ExemptionPeriod';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  reason: Scalars['String']['output'];
  updatedAt: Maybe<Scalars['String']['output']>;
  /** 그 주 일요일 (yyyy-MM-dd) */
  weekEnd: Scalars['String']['output'];
  /** 그 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};

export type ExemptionPeriodInput = {
  /** 1~200자 */
  reason: Scalars['String']['input'];
  /** 그 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['input'];
};

export type ExemptionPeriodPage = {
  __typename?: 'ExemptionPeriodPage';
  items: Array<ExemptionPeriod>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

export type JudgmentCorrectionInput = {
  /** 미리보기 때 본 현재 결과. 다르면 JUDGMENT_CHANGED */
  expectedStatus?: InputMaybe<AdminJudgmentStatus>;
  judgmentId: Scalars['ID']['input'];
  /** 필수, 1~500자 */
  reason: Scalars['String']['input'];
  status: AdminCorrectionStatus;
};

export type JudgmentCorrectionPreview = {
  __typename?: 'JudgmentCorrectionPreview';
  currentStatus: AdminJudgmentStatus;
  impact: AdminRecalcImpact;
  judgmentId: Scalars['ID']['output'];
  member: AdminMemberBrief;
  targetStatus: AdminJudgmentStatus;
  weekStart: Scalars['String']['output'];
};

export type JudgmentHistoryItem = {
  __typename?: 'JudgmentHistoryItem';
  corrected: Scalars['Boolean']['output'];
  holdReason: Maybe<JudgmentHoldReason>;
  recordCount: Maybe<Scalars['Int']['output']>;
  skipReason: Maybe<JudgmentSkipReason>;
  status: JudgmentStatus;
  verifiedDays: Maybe<Scalars['Int']['output']>;
  weekEnd: Scalars['String']['output'];
  weekStart: Scalars['String']['output'];
};

export type JudgmentHistoryPage = {
  __typename?: 'JudgmentHistoryPage';
  items: Array<JudgmentHistoryItem>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/** 보류 이유. API_ERROR는 재시도로 풀리고 IDENTITY_MISMATCH는 본인이 다시 로그인해야 풀린다 */
export type JudgmentHoldReason =
  | 'API_ERROR'
  | 'IDENTITY_MISMATCH';

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

export type Me = {
  __typename?: 'Me';
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  profileImageUrl: Maybe<Scalars['String']['output']>;
  role: MemberRole;
  status: MemberStatus;
};

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

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * 받은 초대를 수락해 바로 참가한다 (TM-04).
   * 이미 다른 경로로 참가했으면 INVITATION_ALREADY_JOINED, 팀이 없어졌으면 TEAM_GONE (둘 다 초대는 정리된다).
   * 추방됐던 팀으로 돌아오면 그 팀 경고 카테고리가 복원된다
   */
  acceptTeamInvitation: Team;
  /** 댓글을 삭제한다 (관리자, 소프트 삭제). 없거나 이미 삭제된 댓글은 NOT_FOUND. 관리자 행동 로그가 남는다 */
  adminDeleteComment: Scalars['Boolean']['output'];
  /** 글을 삭제한다 (관리자, 소프트 삭제). 이미 삭제된 글은 POST_DELETED, 없는 글은 NOT_FOUND. 관리자 행동 로그가 남는다 */
  adminDeletePost: Scalars['Boolean']['output'];
  /** 승인 대기 회원을 승인한다 */
  approveMember: AdminMember;
  /** 개인 면제 요청을 승인한다 (관리자). 이미 판정된 주면 그 회원의 통과·미달이 면제로 바뀐다. 이미 처리된 요청은 ALREADY_HANDLED */
  approvePersonalExemption: PersonalExemption;
  /** 보낸 초대를 철회한다 (팀장과 시스템 관리자만). 대기 중인 초대만 */
  cancelTeamInvitation: Scalars['Boolean']['output'];
  /**
   * 판정을 정정하고 경고를 다시 계산한다 (관리자). 결과는 통과·미달·면제 셋뿐이고 사유는 필수(1~500자).
   * 제외(첫 참가·팀 없음) 판정은 면제로만 정정한다. 이력과 관리자 행동 로그가 남는다.
   * expectedStatus가 지금 판정과 다르면 JUDGMENT_CHANGED
   */
  correctJudgment: CorrectedJudgment;
  /** 댓글을 쓴다. 삭제된 글에는 달 수 없다 (1~500자) */
  createComment: Comment;
  /**
   * 면제 기간을 등록한다 (관리자). 이미 판정된 주면 그 주 통과·미달 판정이 면제로 바뀌고 경고가 다시 계산된다.
   * 같은 주가 있으면 EXEMPTION_PERIOD_DUPLICATE
   */
  createExemptionPeriod: ExemptionPeriod;
  /** 공지를 작성한다 (관리자) */
  createNotice: Notice;
  /** 글을 쓴다. 필수 항목을 모두 채우지 않아도 저장되지만 기록글로 인정되지 않는다(isRecord=false) */
  createPost: Post;
  /** 팀을 만든다. 만든 사람이 팀장이고, 초대코드가 이때 한 번 발급된다 (TM-02) */
  createTeam: CreateTeamPayload;
  /** 받은 초대를 거절한다 */
  declineTeamInvitation: Scalars['Boolean']['output'];
  /** 댓글을 지운다 (작성자 본인만, 소프트 삭제). 팀장도 지울 수 없다 */
  deleteComment: Scalars['Boolean']['output'];
  /** 면제 기간을 지운다 (관리자). 이미 면제로 바뀐 판정은 되돌리지 않는다 */
  deleteExemptionPeriod: Scalars['Boolean']['output'];
  /** 공지를 삭제한다. 잔디 인정 규칙 공지(isSystem)는 SYSTEM_NOTICE_UNDELETABLE로 거부한다 (관리자) */
  deleteNotice: Scalars['Boolean']['output'];
  /** 글을 지운다 (작성자 본인만, 소프트 삭제). 팀장도 지울 수 없다 */
  deletePost: Scalars['Boolean']['output'];
  /** 팀을 삭제한다 (팀장과 시스템 관리자만). 글은 남고 팀 연결만 끊기며, 팀 경고 카테고리가 빠진다 */
  deleteTeam: Scalars['Boolean']['output'];
  /** GitHub 로그인 뒤 받은 일회용 코드를 액세스 토큰으로 바꾼다. 코드는 한 번만 쓸 수 있다 */
  exchangeAuthCode: AuthPayload;
  /**
   * 벌칙 이행을 체크한다 (관리자). 경고 0 · 연속 통과 0이 되고 되돌릴 수 없는 고정점이 된다 (E-58).
   * 벌칙 대상이 아니면 NOT_PENALTY_TARGET. 관리자 행동 로그가 남는다
   */
  fulfillPenalty: AdminPenaltyFulfillment;
  /**
   * GitHub 아이디로 초대한다 (팀장과 시스템 관리자만, TM-06). 가입한(승인된) 회원만 찾는다.
   * 없는 아이디 INVITEE_NOT_FOUND, 이미 팀원 INVITEE_ALREADY_MEMBER, 대기 중인 초대가 이미 있으면 INVITATION_DUPLICATE.
   * 추방한 사람도 초대할 수 있다 (초대코드 차단과 무관)
   */
  inviteToTeam: SentTeamInvitation;
  /**
   * 초대코드로 참가한다 (TM-03). 대소문자 구분 없음.
   * 없는 코드 TEAM_CODE_NOT_FOUND, 이미 참가 TEAM_ALREADY_JOINED, 추방 후 1년 차단 TEAM_JOIN_BLOCKED(남은 기간은 알려주지 않는다)
   */
  joinTeamByCode: Team;
  /** 팀원을 추방한다 (팀장과 시스템 관리자만). 그 팀 경고 카테고리가 빠지고, 이 팀 초대코드로는 1년간 재참가할 수 없다. 팀장은 누가 시켜도 추방할 수 없다(위임 후 추방) */
  kickTeamMember: Scalars['Boolean']['output'];
  /**
   * 팀에서 나간다 (자진 탈퇴, 경고는 유지). 팀장은 나갈 수 없다:
   * 넘길 팀원이 있으면 LEADER_MUST_TRANSFER, 혼자면 LEADER_LAST_MEMBER(팀 삭제만 가능)
   */
  leaveTeam: Scalars['Boolean']['output'];
  /** 활성 일반 회원을 관리자로 지정한다. 승인 대기·거절 회원과 이미 관리자인 회원은 CONFLICT. 관리자 행동 로그가 남는다 */
  promoteMemberToAdmin: AdminMember;
  /** 승인 대기 회원을 거절한다. 관리자 행동 로그가 남는다 */
  rejectMember: AdminMember;
  /** 개인 면제 요청을 거절한다 (관리자). 사유 필수(1~500자, E-48) */
  rejectPersonalExemption: PersonalExemption;
  /**
   * 개인 면제를 요청한다 (그 팀의 팀장만, TM-08). memberId는 그 팀의 팀원이거나 팀장 본인.
   * 같은 회원·주간에 대기·승인 건이 있으면 EXEMPTION_REQUEST_DUPLICATE, 팀장이 아니면 FORBIDDEN.
   * 사유는 1~200자, weekStart는 월요일 yyyy-MM-dd
   */
  requestPersonalExemption: PersonalExemption;
  /**
   * 삭제된 경고를 복구한다 (관리자). 삭제 표시를 풀고 아직 있는 팀의 카테고리를 되살린 뒤 경고를 다시 계산한다.
   * 벌칙 이행 이전 주의 경고는 기록만 되살아난다 (E-59). 이미 복구됐으면 ALREADY_HANDLED. 관리자 행동 로그가 남는다
   */
  restoreWarning: AdminRestoredWarning;
  /** 사람이 처리해야 하는 보류 건만 모두 다시 판정한다 (관리자, E-35). 확정된 건은 건드리지 않는다 */
  retryAllJudgmentHolds: AdminHoldRerunSummary;
  /** 보류 한 건을 다시 판정한다 (관리자). 이미 확정된 건은 건너뛰고 현재 결과를 돌려준다. 판정 행이 없으면 NOT_FOUND */
  retryJudgmentHold: AdminHoldRetryResult;
  /** 거절된 회원을 승인 대기로 되돌린다 */
  revertMemberToPending: AdminMember;
  /** 상단 고정을 켜고 끈다 (관리자) */
  setNoticePinned: Notice;
  /** 팀장을 다른 팀원에게 넘긴다 (팀장과 시스템 관리자만). 새 팀장은 현재 팀원이어야 하고, 되돌릴 수 없다 */
  transferTeamLeadership: Team;
  /** 댓글을 고친다 (작성자 본인 또는 그 글이 연결된 팀의 현재 팀장) */
  updateComment: Comment;
  /**
   * 면제 기간의 주차·사유를 고친다 (관리자). 다른 주로 옮기면 새 주에 소급 면제가 걸린다.
   * 이미 면제로 바뀐 판정은 되돌리지 않는다(확정 판정은 정정으로만 바뀐다)
   */
  updateExemptionPeriod: ExemptionPeriod;
  /** 공지를 수정한다. isPinned를 생략하면 고정이 풀린다 (관리자) */
  updateNotice: Notice;
  /**
   * 글을 고친다 (작성자 본인 또는 그 글이 연결된 팀의 현재 팀장). 글 종류와 작성일은 바뀌지 않는다.
   * 팀장이 남의 글을 고칠 때는 teamId를 읽지 않고 기존 팀 연결을 유지한다. 그 밖의 사람은 FORBIDDEN
   */
  updatePost: Post;
  /** 팀의 공개·비공개를 바꾼다 (팀장과 시스템 관리자만, TM-06 ⑦). 이름·소개 수정은 제공하지 않는다 */
  updateTeam: Team;
};


export type MutationAcceptTeamInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationAdminDeleteCommentArgs = {
  commentId: Scalars['ID']['input'];
};


export type MutationAdminDeletePostArgs = {
  postId: Scalars['ID']['input'];
};


export type MutationApproveMemberArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationApprovePersonalExemptionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelTeamInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationCorrectJudgmentArgs = {
  input: JudgmentCorrectionInput;
};


export type MutationCreateCommentArgs = {
  content: Scalars['String']['input'];
  postId: Scalars['ID']['input'];
};


export type MutationCreateExemptionPeriodArgs = {
  input: ExemptionPeriodInput;
};


export type MutationCreateNoticeArgs = {
  input: NoticeInput;
};


export type MutationCreatePostArgs = {
  input: CreatePostInput;
};


export type MutationCreateTeamArgs = {
  input: CreateTeamInput;
};


export type MutationDeclineTeamInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationDeleteCommentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteExemptionPeriodArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteNoticeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeletePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTeamArgs = {
  teamId: Scalars['ID']['input'];
};


export type MutationExchangeAuthCodeArgs = {
  code: Scalars['String']['input'];
};


export type MutationFulfillPenaltyArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationInviteToTeamArgs = {
  githubLogin: Scalars['String']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationJoinTeamByCodeArgs = {
  code: Scalars['String']['input'];
};


export type MutationKickTeamMemberArgs = {
  memberId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationLeaveTeamArgs = {
  teamId: Scalars['ID']['input'];
};


export type MutationPromoteMemberToAdminArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationRejectMemberArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationRejectPersonalExemptionArgs = {
  id: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationRequestPersonalExemptionArgs = {
  memberId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
  teamId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};


export type MutationRestoreWarningArgs = {
  warningId: Scalars['ID']['input'];
};


export type MutationRetryJudgmentHoldArgs = {
  memberId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};


export type MutationRevertMemberToPendingArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationSetNoticePinnedArgs = {
  id: Scalars['ID']['input'];
  isPinned: Scalars['Boolean']['input'];
};


export type MutationTransferTeamLeadershipArgs = {
  newLeaderId: Scalars['ID']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationUpdateCommentArgs = {
  content: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationUpdateExemptionPeriodArgs = {
  id: Scalars['ID']['input'];
  input: ExemptionPeriodInput;
};


export type MutationUpdateNoticeArgs = {
  id: Scalars['ID']['input'];
  input: NoticeInput;
};


export type MutationUpdatePostArgs = {
  id: Scalars['ID']['input'];
  input: UpdatePostInput;
};


export type MutationUpdateTeamArgs = {
  input: UpdateTeamInput;
  teamId: Scalars['ID']['input'];
};

export type Notice = {
  __typename?: 'Notice';
  content: Scalars['String']['output'];
  /** 작성 시각 (KST, ISO-8601) */
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isPinned: Scalars['Boolean']['output'];
  /** 잔디 인정 규칙 공지. 삭제할 수 없다 */
  isSystem: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
  /** 수정 시각 (KST, ISO-8601). 수정 전에는 null */
  updatedAt: Maybe<Scalars['String']['output']>;
};

export type NoticeInput = {
  content: Scalars['String']['input'];
  /** 상단 고정. 기본 false */
  isPinned?: InputMaybe<Scalars['Boolean']['input']>;
  /** 1~200자 */
  title: Scalars['String']['input'];
};

export type NoticePage = {
  __typename?: 'NoticePage';
  items: Array<Notice>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/** 개인 면제 요청 한 건. 팀 이름은 싣지 않는다 */
export type PersonalExemption = {
  __typename?: 'PersonalExemption';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** 면제 대상 */
  member: AdminMemberBrief;
  /** 그 주가 이미 전체 면제 기간이다 (E-44). 두 면제는 독립으로 보존되고 따로 승인하지 않아도 판정에서 빠진다 */
  overlapsExemptionPeriod: Scalars['Boolean']['output'];
  reason: Scalars['String']['output'];
  /** 거절됐을 때만 값이 있다 */
  rejectReason: Maybe<Scalars['String']['output']>;
  /** 요청한 팀장 */
  requester: AdminMemberBrief;
  respondedAt: Maybe<Scalars['String']['output']>;
  status: PersonalExemptionStatus;
  weekEnd: Scalars['String']['output'];
  weekStart: Scalars['String']['output'];
};

export type PersonalExemptionPage = {
  __typename?: 'PersonalExemptionPage';
  items: Array<PersonalExemption>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

export type PersonalExemptionStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED';

export type Post = {
  __typename?: 'Post';
  author: BoardAuthor;
  /** 작성자 회원 id. 본인 글 여부(수정·삭제 버튼) 판단에 쓴다 */
  authorId: Scalars['ID']['output'];
  commentCount: Scalars['Int']['output'];
  /** 댓글 목록. 오래된 순, 커서 기반 20개. 대댓글 없음 */
  comments: CommentPage;
  commitUrls: Array<Scalars['String']['output']>;
  /** 작성 시각 (KST, ISO-8601) */
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** 필수 항목을 모두 채웠는가. false면 '인증 미포함' 배지 (E-25) */
  isRecord: Scalars['Boolean']['output'];
  sections: PostSections;
  /** 정규화된 태그(앞뒤 공백 제거, 소문자). 글당 최대 5개 */
  tags: Array<Scalars['String']['output']>;
  /** 연결된 팀 id. 없으면 null. 팀 이름은 teamName(team.graphqls에서 확장, 비공개 팀은 숨김) */
  teamId: Maybe<Scalars['ID']['output']>;
  /** 연결된 팀 이름. 비공개 팀·삭제된 팀·연결 없는 글은 null (열람자와 무관, E-23) */
  teamName: Maybe<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: PostType;
  /** 수정 시각 (KST, ISO-8601). 수정 전에는 createdAt과 같다 */
  updatedAt: Scalars['String']['output'];
  /** 최초 저장일(KST, yyyy-MM-dd). 수정해도 바뀌지 않는다 */
  writtenDate: Scalars['String']['output'];
};


export type PostCommentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};

export type PostPage = {
  __typename?: 'PostPage';
  items: Array<Post>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
  /** 현재 조건(종류·태그·검색어)의 전체 글 수. 요청했을 때만 센다 */
  totalCount: Scalars['Int']['output'];
};

/** 종류별 본문 항목. 트러블슈팅은 problem·cause·solution, 개발일지는 did·learned만 값이 있다 */
export type PostSections = {
  __typename?: 'PostSections';
  cause: Maybe<Scalars['String']['output']>;
  did: Maybe<Scalars['String']['output']>;
  learned: Maybe<Scalars['String']['output']>;
  problem: Maybe<Scalars['String']['output']>;
  solution: Maybe<Scalars['String']['output']>;
};

export type PostSectionsInput = {
  cause?: InputMaybe<Scalars['String']['input']>;
  did?: InputMaybe<Scalars['String']['input']>;
  learned?: InputMaybe<Scalars['String']['input']>;
  problem?: InputMaybe<Scalars['String']['input']>;
  solution?: InputMaybe<Scalars['String']['input']>;
};

export type PostType =
  | 'DEVLOG'
  | 'TROUBLESHOOTING';

export type Profile = {
  __typename?: 'Profile';
  /** 삭제되지 않은 댓글 수 (MongoDB 집계) */
  commentCount: Scalars['Int']['output'];
  githubLogin: Scalars['String']['output'];
  /** GitHub 잔디. 캐시가 없으면 null (E-32). 하루 한 번 갱신한 캐시이고 이 쿼리가 GitHub를 부르지 않는다 */
  grass: Maybe<ProfileGrass>;
  id: Scalars['ID']['output'];
  /** 내 프로필인가 (프로필 수정 · 관리자 메뉴 버튼 노출 판단) */
  isMine: Scalars['Boolean']['output'];
  /**
   * 주간 판정 이력 (PR-01 ⑩). 최근 주부터 커서 기반 20개 (E-57).
   * 첫 페이지 맨 위에는 이번 주 IN_PROGRESS 행이 하나 더 붙는다(판정 대상 주이고 아직 판정 전일 때만, 20개에 세지 않는다).
   * 팀이 없던 주(제외 · NO_TEAM)는 나오지 않고 첫 참가 주와 면제 주는 나온다. 판정 기록이 없으면 빈 목록이다 (팀 미소속 · 첫 주, EX-PR01-03)
   */
  judgmentHistory: ProfileJudgmentPage;
  /** GitHub 계정 이름. 수정할 수 없다 */
  nickname: Scalars['String']['output'];
  /** 삭제되지 않은 글 수 (MongoDB 집계) */
  postCount: Scalars['Int']['output'];
  /** S3 주소. null이면 기본 이미지 */
  profileImageUrl: Maybe<Scalars['String']['output']>;
  /**
   * 팀별 경고 (PR-01 ⑨). 경고 1개에 팀이 여러 개 붙으므로 중복 집계이고, 줄마다 센 값을 더한 합계는 누적 경고 수와 다를 수 있다.
   * ⑧ 경고 합계와 같은 기준으로 센다: 현재 경고 수에 들어가는 경고만 세고 이행 완료·차감된 경고는 뺀다.
   * 경고가 없으면 빈 목록이고, 판정 보류가 남아 있으면 계산하지 않아 onHold만 true다
   */
  teamWarnings: ProfileTeamWarnings;
  /** 소속 팀. 공개 팀만 나오고 비공개 팀은 빠진다 */
  teams: Array<ProfileTeam>;
  /** 경고 합계 카드 (n / 3) */
  warning: ProfileWarning;
};


export type ProfileJudgmentHistoryArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};

export type ProfileGrass = {
  __typename?: 'ProfileGrass';
  /** 날짜 오름차순, 날짜마다 기여 수 (0이면 잔디 없음) */
  days: Array<ProfileGrassDay>;
  /** 갱신 기준 시각 (KST, ISO-8601). '오늘 오전 6시 기준'에 쓴다 */
  fetchedAt: Scalars['String']['output'];
  /** 캐시가 덮는 첫 날 (yyyy-MM-dd) */
  from: Scalars['String']['output'];
  /** 캐시가 덮는 마지막 날 (yyyy-MM-dd) */
  to: Scalars['String']['output'];
};

export type ProfileGrassDay = {
  __typename?: 'ProfileGrassDay';
  count: Scalars['Int']['output'];
  date: Scalars['String']['output'];
};

export type ProfileJudgmentPage = {
  __typename?: 'ProfileJudgmentPage';
  items: Array<ProfileJudgmentWeek>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

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

/** 판정 이력 한 행. 면제·제외 주와 보류 주는 인증일·기록글이 null이다 (AC-01 ⑤ '—') */
export type ProfileJudgmentWeek = {
  __typename?: 'ProfileJudgmentWeek';
  recordCount: Maybe<Scalars['Int']['output']>;
  result: ProfileJudgmentResult;
  /** 인증일 수. 진행 중인 이번 주는 잔디 캐시가 없으면 null */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  /** 그 주 일요일 (yyyy-MM-dd) */
  weekEnd: Scalars['String']['output'];
  /** 그 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};

export type ProfileTeam = {
  __typename?: 'ProfileTeam';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

/** {팀 이름} {count}회. 비공개 팀은 '비공개 팀', 삭제된 팀은 '삭제된 팀'으로 나오고 열람자를 구분하지 않는다. 비공개·삭제된 팀은 여러 팀이어도 한 줄이다 */
export type ProfileTeamWarning = {
  __typename?: 'ProfileTeamWarning';
  count: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type ProfileTeamWarnings = {
  __typename?: 'ProfileTeamWarnings';
  onHold: Scalars['Boolean']['output'];
  /** 공개 팀(이름순) → 비공개 팀 → 삭제된 팀 순 */
  teams: Array<ProfileTeamWarning>;
};

/** 저장된 카운트가 아니라 판정 이력을 처음부터 다시 훑어 계산한 값. 보류 주가 남아 있으면 onHold만 true이고 나머지는 null */
export type ProfileWarning = {
  __typename?: 'ProfileWarning';
  onHold: Scalars['Boolean']['output'];
  /** 경고 3개 이상이면 벌칙 대상 (E-40) */
  penaltyTarget: Maybe<Scalars['Boolean']['output']>;
  /** 벌칙 이행 이후 살아 있고 차감되지 않은 경고 수. 3을 넘을 수 있다 */
  warningCount: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  /** 처리 대기 요약 (AD-01 ⑤). 메뉴 배지도 같은 값을 쓴다 */
  adminDashboardSummary: AdminDashboardSummary;
  /**
   * 삭제 표시된 경고 목록 (추방 · 팀 삭제). 삭제가 최근인 순 커서 기반 20개.
   * 정정 · 소급 면제로 미달이 아니게 된 주의 경고는 나오지 않는다
   */
  adminDeletedWarnings: AdminDeletedWarningPage;
  /** 보류 목록 (AD-01 ⑨). 사람이 처리해야 하는 보류만 오래된 순 커서 기반 20개. totalCount가 0이면 보류 표시를 그리지 않는다 */
  adminJudgmentHolds: AdminHoldPage;
  /**
   * 주차별 판정 결과 (AD-01 ⑥⑦⑧). weekStart를 생략하면 직전 주(이번 월요일 판정의 대상), 월요일이 아니면 INVALID_INPUT.
   * keyword는 닉네임·GitHub 아이디 부분 일치(50자 이하). 집계는 검색·필터와 무관한 그 주 전체 값이고 팀 이름은 싣지 않는다
   */
  adminJudgments: AdminJudgmentPage;
  /** 가입 승인 탭 목록. 오래된 신청부터 커서 기반 20개 */
  adminMembers: AdminMemberPage;
  /** 벌칙 대상 목록 (경고 3개 이상). 도달한 주가 오래된 순 커서 기반 20명. 이 화면에서만 비공개 팀도 실명으로 보인다 */
  adminPenaltyTargets: AdminPenaltyTargetPage;
  /**
   * 글 · 댓글 목록 (관리자). 삭제되지 않은 것을 최신순 커서 기반 20개로 한 줄에 섞어 보여준다.
   * keyword는 제목 · 내용 · 작성자(닉네임 · GitHub 아이디) 부분 일치(50자 이하). 팀 정보는 싣지 않는다
   */
  adminPosts: AdminPostPage;
  /** 면제 기간 목록 (관리자). 주차 최신순 커서 기반 20개 */
  exemptionPeriods: ExemptionPeriodPage;
  /** 내 계정 정보. 승인 대기·거절 계정도 호출할 수 있다 */
  me: Me;
  /** 내 지난 판정 목록 (AC-01 ⑤). 최근 주부터 커서 기반 20개 */
  myJudgmentHistory: JudgmentHistoryPage;
  /** 내가 보낸 개인 면제 요청 목록 (TM-08 ⑤). 최신순 커서 기반 20개 */
  myPersonalExemptionRequests: PersonalExemptionPage;
  /** 내 팀 목록 (TM-01). 참가한 순서(오래된 순). TM-01이 페이지 대신 계속 쌓는 목록이라 커서 없이 전부 준다. 비공개 팀도 본인에게는 실제 이름 */
  myTeams: Array<Team>;
  /**
   * 내 경고 이력. 최근 주부터 커서 기반 20개 (E-57).
   * 경고 수를 저장하지 않고 판정 이력을 처음부터 다시 훑은 결과로 상태를 정한다.
   * 삭제 표시된 경고와 정정·소급 면제로 미달이 아니게 된 주의 경고는 나오지 않는다.
   * 판정 보류가 남아 있으면 상태를 정할 수 없어 onHold만 true이고 items는 비어 있다
   */
  myWarningHistory: WarningHistoryPage;
  /**
   * 내 경고 요약. 저장된 카운트가 아니라 판정 이력을 처음부터 다시 훑어 계산한 값이다.
   * 판정 보류가 남아 있으면 계산을 미뤄 onHold만 true이고 숫자는 null이다
   */
  myWarningSummary: WarningSummary;
  /**
   * 내 주간 활동. weekStart는 월요일 날짜(yyyy-MM-dd), 생략하면 이번 주, 미래 주는 INVALID_INPUT.
   * 잔디는 하루 한 번 새벽에 갱신한 캐시를 그대로 보여주고 이 쿼리가 GitHub를 부르지 않는다(grassFetchedAt이 갱신 기준 시각).
   * 기록글 수는 실시간이다. 판정이 끝난 주는 판정 시점에 저장한 값을 보여준다
   */
  myWeeklyActivity: WeeklyActivity;
  /** 공지 상세. 없는 공지는 NOT_FOUND */
  notice: Notice;
  /** 공지 목록. 고정 공지가 위, 그 아래 최신순. 커서 기반 20개 */
  notices: NoticePage;
  /** 개인 면제 요청 목록 (관리자). 기본은 대기 건. 상태별 최신순 커서 기반 20개 */
  personalExemptionRequests: PersonalExemptionPage;
  /** 태그 필터에 보여줄 많이 쓰인 태그 상위 10개. type을 생략하면 두 종류 전체 */
  popularTags: Array<TagCount>;
  /** 글 상세. 없으면 NOT_FOUND, 삭제된 글은 POST_DELETED */
  post: Post;
  /**
   * 게시판 목록. 최신순, 커서 기반 20개.
   * tag는 정확히 일치하는 태그, q는 제목·내용·태그 검색(앞뒤 공백 제외 2~50자, 공백으로 나눈 단어를 모두 포함한 글).
   * q·tag는 함께 쓰면 둘 다 만족하는 글만 나온다
   */
  posts: PostPage;
  /**
   * 그 주를 면제 기간으로 등록하면 바뀌는 판정과 영향 미리보기 (관리자, E-45). 계산만 하고 아무것도 바꾸지 않는다.
   * 아직 판정되지 않은 주는 retroactive=false이고 items가 비어 있다. 월요일이 아니면 INVALID_INPUT
   */
  previewExemptionPeriod: RetroExemptionPreview;
  /**
   * 판정 정정 재계산 미리보기 (대시보드 정정 패널, E-49 · E-50 · E-58). 계산만 하고 아무것도 바꾸지 않는다.
   * 정정할 수 없는 판정(보류, 같은 결과, 제외를 면제가 아닌 결과로)은 JUDGMENT_NOT_CORRECTABLE
   */
  previewJudgmentCorrection: JudgmentCorrectionPreview;
  /**
   * 개인 면제를 승인하면 바뀌는 판정과 영향 미리보기 (관리자, E-45). 계산만 하고 아무것도 바꾸지 않는다.
   * 이미 처리된 요청은 ALREADY_HANDLED
   */
  previewPersonalExemptionApproval: RetroExemptionPreview;
  /**
   * 경고를 복구하면 바뀌는 수치 미리보기 (E-42 · E-43 · E-59). 계산만 하고 아무것도 바꾸지 않는다.
   * 삭제된 경고가 아니면 ALREADY_HANDLED, 복구 대상이 아니면 NOT_FOUND
   */
  previewWarningRestore: AdminWarningRestorePreview;
  /** 프로필 (승인된 회원 누구나, 본인 · 타인 같은 모양). 없는 회원이나 승인되지 않은 회원은 NOT_FOUND */
  profile: Profile;
  /** 받은 초대 목록 (TM-04). 최신순, 커서 기반 20개. 비공개 팀이어도 초대받은 당사자에게는 실제 팀 이름 */
  receivedTeamInvitations: ReceivedTeamInvitationPage;
  /** 보낸 초대 중 대기 중인 목록 (TM-06). 그 팀의 팀장과 시스템 관리자만. 최신순, 커서 기반 20개 */
  sentTeamInvitations: SentTeamInvitationPage;
  /** 팀 기본 정보. 그 팀의 팀원·팀장과 시스템 관리자만 볼 수 있다. 팀원이 아닌 시스템 관리자의 joinedAt은 null */
  team: Team;
  /**
   * 팀 현황판 (TM-05). 그 팀의 현재 팀원·팀장과 시스템 관리자만 볼 수 있다 (그 밖의 비소속 FORBIDDEN, 없거나 삭제된 팀은 관리자도 NOT_FOUND).
   * 인증일·잔디는 새벽 갱신 시점 값(grassFetchedAt이 기준 시각)이고, 기록글 수·경고 수는 조회할 때 읽는다.
   * 잔디를 못 불러온 팀원은 인증일이 null이고 나머지 값은 그대로 내려온다
   */
  teamBoard: TeamBoard;
  /** 팀에 연결된 글에 달린 댓글 목록 (TM-06 ⑧). 팀장만. 최신순, 커서 기반 20개. 댓글이 달린 글은 postId로 안다 */
  teamComments: TeamCommentPage;
  /** 초대코드 다시 확인 (TM-06). 그 팀의 팀장과 시스템 관리자만. 코드는 생성할 때 한 번 정해지고 재발급은 없다 */
  teamInviteCode: Scalars['String']['output'];
  /** 팀원 목록 (TM-06). 그 팀의 팀원·팀장과 시스템 관리자만. 팀장이 맨 앞, 나머지는 참가한 순서. 커서 기반 20개 */
  teamMembers: TeamMemberPage;
  /** 팀에 연결된 글 목록 (TM-06 ⑧). 팀장만. 최신순, 커서 기반 20개 */
  teamPosts: TeamPostPage;
};


export type QueryAdminDeletedWarningsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminJudgmentHoldsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminJudgmentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminJudgmentFilter>;
  keyword: InputMaybe<Scalars['String']['input']>;
  weekStart: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminMembersArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  keyword: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<MemberApprovalFilter>;
};


export type QueryAdminPenaltyTargetsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminPostsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminPostFilter>;
  keyword: InputMaybe<Scalars['String']['input']>;
};


export type QueryExemptionPeriodsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyJudgmentHistoryArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyPersonalExemptionRequestsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyWarningHistoryArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryMyWeeklyActivityArgs = {
  weekStart: InputMaybe<Scalars['String']['input']>;
};


export type QueryNoticeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNoticesArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryPersonalExemptionRequestsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<PersonalExemptionStatus>;
};


export type QueryPopularTagsArgs = {
  type: InputMaybe<PostType>;
};


export type QueryPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPostsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  q: InputMaybe<Scalars['String']['input']>;
  tag: InputMaybe<Scalars['String']['input']>;
  type: PostType;
};


export type QueryPreviewExemptionPeriodArgs = {
  weekStart: Scalars['String']['input'];
};


export type QueryPreviewJudgmentCorrectionArgs = {
  judgmentId: Scalars['ID']['input'];
  status: AdminCorrectionStatus;
};


export type QueryPreviewPersonalExemptionApprovalArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPreviewWarningRestoreArgs = {
  warningId: Scalars['ID']['input'];
};


export type QueryProfileArgs = {
  memberId: Scalars['ID']['input'];
};


export type QueryReceivedTeamInvitationsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QuerySentTeamInvitationsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};


export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTeamBoardArgs = {
  teamId: Scalars['ID']['input'];
};


export type QueryTeamCommentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};


export type QueryTeamInviteCodeArgs = {
  teamId: Scalars['ID']['input'];
};


export type QueryTeamMembersArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};


export type QueryTeamPostsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  teamId: Scalars['ID']['input'];
};

export type ReceivedTeamInvitation = {
  __typename?: 'ReceivedTeamInvitation';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** 초대한 팀장 */
  inviter: TeamPerson;
  teamId: Scalars['ID']['output'];
  teamName: Scalars['String']['output'];
};

export type ReceivedTeamInvitationPage = {
  __typename?: 'ReceivedTeamInvitationPage';
  items: Array<ReceivedTeamInvitation>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

export type RetroExemptionImpact = {
  __typename?: 'RetroExemptionImpact';
  /** 면제로 바뀌기 전 판정 (통과 또는 미달) */
  currentStatus: AdminJudgmentStatus;
  impact: AdminRecalcImpact;
  member: AdminMemberBrief;
};

/** 소급 면제 미리보기. retroactive=false면 아직 판정 전이라 바뀌는 판정이 없다 */
export type RetroExemptionPreview = {
  __typename?: 'RetroExemptionPreview';
  items: Array<RetroExemptionImpact>;
  retroactive: Scalars['Boolean']['output'];
  weekStart: Scalars['String']['output'];
};

export type SentTeamInvitation = {
  __typename?: 'SentTeamInvitation';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  invitee: TeamPerson;
};

export type SentTeamInvitationPage = {
  __typename?: 'SentTeamInvitationPage';
  items: Array<SentTeamInvitation>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

export type TagCount = {
  __typename?: 'TagCount';
  count: Scalars['Int']['output'];
  tag: Scalars['String']['output'];
};

export type Team = {
  __typename?: 'Team';
  createdAt: Scalars['String']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** 내가 이 팀의 팀장인가 */
  isLeader: Scalars['Boolean']['output'];
  isPublic: Scalars['Boolean']['output'];
  /** 내가 이 팀에 참가한 시각 (KST, ISO-8601). 팀원이 아닌 시스템 관리자는 null */
  joinedAt: Maybe<Scalars['String']['output']>;
  leader: TeamPerson;
  memberCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  /** 이번 주 요약 (TM-01 ⑧). 내 팀 목록에서 팀마다 불러도 쿼리가 팀 수만큼 늘지 않는다. 팀 조회가 허용된 시스템 관리자에게도 열린다 */
  weekSummary: TeamWeekSummary;
};

export type TeamBoard = {
  __typename?: 'TeamBoard';
  /** 잔디 갱신 기준 시각 (KST, ISO-8601). 잔디 캐시가 있는 팀원 중 가장 오래된 시각이고, 하나도 없으면 null */
  grassFetchedAt: Maybe<Scalars['String']['output']>;
  /** 잔디를 못 불러온 팀원이 있는가 (E-32 배너) */
  grassNotLoaded: Scalars['Boolean']['output'];
  /** 팀장이 맨 앞, 나머지는 참가한 순서 */
  members: Array<TeamBoardMember>;
  /** 이 팀에 연결된 글 최신 5건. 필수 항목이 빈 글도 포함한다(isRecord로 구분) */
  recentPosts: Array<TeamBoardPost>;
  /** 이번 주 일요일 (yyyy-MM-dd) */
  weekEnd: Scalars['String']['output'];
  /** 이번 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};

/** 날짜별 한 칸. null은 알 수 없음(잔디를 못 불러왔거나 캐시 구간 밖) */
export type TeamBoardDay = {
  __typename?: 'TeamBoardDay';
  date: Scalars['String']['output'];
  hasGrass: Maybe<Scalars['Boolean']['output']>;
  hasRecord: Scalars['Boolean']['output'];
  /** 인증일인가 (잔디 또는 기록글). 둘 다 없는데 잔디를 모르면 null */
  verified: Maybe<Scalars['Boolean']['output']>;
};

export type TeamBoardMember = {
  __typename?: 'TeamBoardMember';
  /** 월~일 7행 */
  days: Array<TeamBoardDay>;
  githubLogin: Scalars['String']['output'];
  /** 내 행인가 */
  isMe: Scalars['Boolean']['output'];
  memberId: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  /** 이번 주 기록글 수. 팀 연결과 무관한 개인 기준 */
  recordCount: Scalars['Int']['output'];
  status: TeamBoardStatus;
  /** 인증일 수 (잔디 또는 기록글이 있는 날, 같은 날 둘 다여도 1일). 잔디를 못 불러와 알 수 없으면 null */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  /** 이 팀 카테고리가 붙은 지금 경고 수. 차감된 경고·벌칙 이행 이전 경고는 세지 않고, 다른 팀 경고와 벌칙 대상 여부는 담지 않는다. 판정 보류가 남아 알 수 없으면 null */
  warningCount: Maybe<Scalars['Int']['output']>;
};

/** 이 팀에 연결된 글 한 줄 (말머리·제목·작성자·날짜) */
export type TeamBoardPost = {
  __typename?: 'TeamBoardPost';
  author: BoardAuthor;
  /** 작성 시각 (KST, ISO-8601) */
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** 필수 항목을 모두 채운 기록글인가. false면 인증 미포함 글 */
  isRecord: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
  type: PostType;
};

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

export type TeamCommentPage = {
  __typename?: 'TeamCommentPage';
  items: Array<Comment>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

export type TeamMember = {
  __typename?: 'TeamMember';
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isLeader: Scalars['Boolean']['output'];
  /** 이 팀에 참가한 시각 (KST, ISO-8601) */
  joinedAt: Scalars['String']['output'];
  nickname: Scalars['String']['output'];
  profileImageUrl: Maybe<Scalars['String']['output']>;
};

export type TeamMemberPage = {
  __typename?: 'TeamMemberPage';
  items: Array<TeamMember>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/** 이름만 보여주는 회원 정보 */
export type TeamPerson = {
  __typename?: 'TeamPerson';
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  profileImageUrl: Maybe<Scalars['String']['output']>;
};

export type TeamPostPage = {
  __typename?: 'TeamPostPage';
  items: Array<Post>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/** 이번 주 요약. 판정 제외·면제인 팀원은 어느 쪽에도 세지 않는다 */
export type TeamWeekSummary = {
  __typename?: 'TeamWeekSummary';
  /** 판정 제외·면제 인원. 통과·미달·아직 어디에도 세지 않는다 */
  excludedCount: Scalars['Int']['output'];
  /** 판정이 미달로 확정된 인원. 주가 끝나기 전에는 0 */
  failCount: Scalars['Int']['output'];
  /** 아직 못 채웠지만 주가 진행 중인 인원 */
  notYetCount: Scalars['Int']['output'];
  passCount: Scalars['Int']['output'];
  /** 이번 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};

/** 모든 값을 통째로 바꾼다. 생략한 tags·commitUrls·teamId는 비워진다. 팀장이 남의 글을 고칠 때 teamId는 무시된다 */
export type UpdatePostInput = {
  commitUrls?: InputMaybe<Array<Scalars['String']['input']>>;
  sections: PostSectionsInput;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  teamId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

export type UpdateTeamInput = {
  isPublic: Scalars['Boolean']['input'];
};

/** 경고 이력 표 한 행 */
export type WarningHistoryItem = {
  __typename?: 'WarningHistoryItem';
  /** 팀 카테고리 표시 이름. 공개 팀은 이름, 비공개 팀은 '비공개 팀', 삭제된 팀은 '삭제된 팀'. 열람자를 구분하지 않는다 */
  categories: Array<Scalars['String']['output']>;
  /** 사유: 기록글 수. 알 수 없으면 null */
  recordCount: Maybe<Scalars['Int']['output']>;
  status: WarningHistoryStatus;
  /** 사유: 인증일 수. 알 수 없으면 null */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  /** 그 주 일요일 (yyyy-MM-dd) */
  weekEnd: Scalars['String']['output'];
  /** 경고를 받은 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};

export type WarningHistoryPage = {
  __typename?: 'WarningHistoryPage';
  items: Array<WarningHistoryItem>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
  /** 판정 보류가 남아 있어 계산을 미룬 상태 */
  onHold: Scalars['Boolean']['output'];
};

/** 경고 이력의 상태 (Q-13) */
export type WarningHistoryStatus =
  /** 벌칙 이행 이후 살아 있고 차감되지 않아 현재 경고 수에 들어간다 (유효) */
  | 'ACTIVE'
  /** 2주 연속 통과로 차감됐다 (차감됨) */
  | 'DEDUCTED'
  /** 벌칙 이행 체크 이전에 받았다. 기록만 남고 현재 경고 수에는 넣지 않는다 (이행 완료) */
  | 'FULFILLED';

export type WarningSummary = {
  __typename?: 'WarningSummary';
  /** 보류 중인 주차 월요일 목록 (yyyy-MM-dd) */
  holdWeeks: Array<Scalars['String']['output']>;
  onHold: Scalars['Boolean']['output'];
  /** 경고가 3개에 도달한 주 월요일 (yyyy-MM-dd). 벌칙 대상일 때만 */
  penaltyReachedWeek: Maybe<Scalars['String']['output']>;
  /** 경고 3개 이상이면 벌칙 대상. 이 상태에서는 연속 통과해도 차감되지 않는다 */
  penaltyTarget: Maybe<Scalars['Boolean']['output']>;
  /** 지금 연속 통과 수. 2가 되면 경고 1개를 차감하고 0으로 돌아간다. 벌칙 대상이면 쌓지 않아 0 */
  streak: Maybe<Scalars['Int']['output']>;
  /** 벌칙 이행 이후 살아 있고 차감되지 않은 경고 수. 3을 넘을 수 있다 */
  warningCount: Maybe<Scalars['Int']['output']>;
};

/** 한 주의 판정 결과. 제외·면제·보류 주는 인증일·기록글이 null */
export type WeekJudgment = {
  __typename?: 'WeekJudgment';
  /** 관리자 정정을 거쳤는가 */
  corrected: Scalars['Boolean']['output'];
  holdReason: Maybe<JudgmentHoldReason>;
  /** 확정 시각 (KST, ISO-8601) */
  judgedAt: Maybe<Scalars['String']['output']>;
  recordCount: Maybe<Scalars['Int']['output']>;
  skipReason: Maybe<JudgmentSkipReason>;
  status: JudgmentStatus;
  verifiedDays: Maybe<Scalars['Int']['output']>;
};

export type WeeklyActivity = {
  __typename?: 'WeeklyActivity';
  /** 이번 주를 볼 때 배너 하나. 없으면 null */
  banner: Maybe<ActivityBanner>;
  currentWeek: Scalars['Boolean']['output'];
  /** 월~일 7행 */
  days: Array<ActivityDay>;
  /** 잔디 캐시가 있는가 */
  grassAvailable: Scalars['Boolean']['output'];
  /** 잔디 갱신 기준 시각 (KST, ISO-8601). 저장된 판정을 보여줄 때는 null */
  grassFetchedAt: Maybe<Scalars['String']['output']>;
  /** 지금 소속된 팀이 있는가. 없으면 판정 대상이 아니다 */
  inTeam: Scalars['Boolean']['output'];
  /** 그 주의 판정 결과. 아직 판정 전이면 null */
  judgment: Maybe<WeekJudgment>;
  /** 이번 주 통과 예정인가. 이번 주를 볼 때만 있고 인증일을 모르면 null */
  passExpected: Maybe<Scalars['Boolean']['output']>;
  recordCount: Scalars['Int']['output'];
  requiredRecordCount: Scalars['Int']['output'];
  requiredVerifiedDays: Scalars['Int']['output'];
  /** 인증일 수. 잔디를 못 불러와 알 수 없으면 null */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  /** 그 주 일요일 (yyyy-MM-dd) */
  weekEnd: Scalars['String']['output'];
  /** 그 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};
