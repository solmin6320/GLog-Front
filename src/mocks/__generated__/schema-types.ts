export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /**
   * yyyy-MM-dd. 항상 한국시간(Asia/Seoul) 날짜다(기능명세서 5장, DB 1-0).
   * 주차는 그 주 월요일 Date 하나로 식별한다(DB 1-0 주차 표기).
   */
  Date: { input: string; output: string; }
  /**
   * ISO-8601 + 오프셋. 예: 2026-09-29T14:20:00+09:00 (제안)
   * DB DATETIME은 KST 값이라 서버가 +09:00 오프셋을 붙여 보낸다.
   */
  DateTime: { input: string; output: string; }
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

/** AD-01 ②-5 ⑤ 종류 필터: 글 + 댓글 / 글만 / 댓글만 */
export type AdminContentFilter =
  | 'ALL'
  | 'COMMENT'
  | 'POST';

/** AD-01 ⑤ 처리 대기 요약 + 관리자 메뉴 배지를 한 번에 (인수인계 5-1 'adminDashboardSummary', AD-01 비고 '배지 숫자는 한 번에 받아 공유') */
export type AdminDashboardSummary = {
  __typename?: 'AdminDashboardSummary';
  /** 자동 재시도가 소진된 미해결 보류 수 — 주차 무관 합계 (제안) */
  heldJudgmentCount: Scalars['Int']['output'];
  latestJudgedWeekStart: Maybe<Scalars['Date']['output']>;
  /**
   * ⑤ '이번 주 미달' — 가장 최근에 실행된 판정 주의 미달 수 (추측)
   * 목요일 화면(목업 W-15)에서 보이는 판정은 지난 주(9/21~9/27)이므로 용어가 모호하다(계약서 9장 C-13)
   */
  latestWeekFailCount: Scalars['Int']['output'];
  penaltyTargetCount: Scalars['Int']['output'];
  pendingExemptionRequestCount: Scalars['Int']['output'];
  pendingMemberCount: Scalars['Int']['output'];
};

export type AdminJudgmentConnection = {
  __typename?: 'AdminJudgmentConnection';
  nodes: Array<AdminJudgmentRow>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** AD-01 ⑥ 결과 필터: 전체 / 미달만 / 보류만 */
export type AdminJudgmentFilter =
  | 'ALL'
  | 'FAIL'
  | 'HOLD';

/** AD-01 ⑦ 회원별 행. 팀 이름은 넣지 않는다(기능명세서 9장) */
export type AdminJudgmentRow = {
  __typename?: 'AdminJudgmentRow';
  /** '누적 경고' 열 — 그 주 당시가 아니라 현재 값 */
  activeWarningCount: Scalars['Int']['output'];
  /** 확정 상태면 true → [정정]. HOLD면 false → [재시도](AD-01 ⑦) */
  canCorrect: Scalars['Boolean']['output'];
  /** HOLD 이고 API_ERROR일 때만 true. IDENTITY_MISMATCH는 재시도해도 안 풀린다(E-08) */
  canRetry: Scalars['Boolean']['output'];
  isPenaltyTarget: Scalars['Boolean']['output'];
  judgment: WeeklyJudgment;
  member: Member;
};

/** AD-01 ⑥⑦ 한 주차의 판정 결과 */
export type AdminJudgmentWeek = {
  __typename?: 'AdminJudgmentWeek';
  counts: JudgmentCounts;
  /** 판정 실행 시각. 판정 전 주간이면 null → '이번 주 판정은 월요일 오전에 실행돼요.'(5-4-9) */
  executedAt: Maybe<Scalars['DateTime']['output']>;
  /** 회원 검색: 닉네임 · GitHub 아이디(AD-01 ⑥) */
  rows: AdminJudgmentConnection;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};


/** AD-01 ⑥⑦ 한 주차의 판정 결과 */
export type AdminJudgmentWeekRowsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminJudgmentFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};

export type AdminMemberBrief = {
  __typename?: 'AdminMemberBrief';
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
};

export type AdminMemberConnection = {
  __typename?: 'AdminMemberConnection';
  nodes: Array<AdminMemberRow>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** AD-01 ②-2 ⑤ 상태 필터: 승인 대기 / 거절 / 전체 (추측: '전체' = 대기 + 거절) */
export type AdminMemberFilter =
  | 'ALL'
  | 'PENDING'
  | 'REJECTED';

/** AD-01 ②-2 가입 승인 행. status는 이 타입에서만 노출 */
export type AdminMemberRow = {
  __typename?: 'AdminMemberRow';
  /** 신청 = 첫 로그인 시각(DB member.created_at) */
  appliedAt: Scalars['DateTime']['output'];
  member: Member;
  status: MemberStatus;
};

/** 관리자 전용 팀 표기. 비공개 팀도 실명이다 — 경고 복구 · 벌칙 화면에만 쓴다(기능명세서 9장, AD-01 ②-1) */
export type AdminTeamLabel = {
  __typename?: 'AdminTeamLabel';
  isDeleted: Scalars['Boolean']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  teamId: Scalars['ID']['output'];
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

export type CategoryWarningCount = {
  __typename?: 'CategoryWarningCount';
  count: Scalars['Int']['output'];
  label: TeamLabel;
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

/** 글 + 댓글 혼합 목록의 행 종류 (AD-01 ②-5, TM-06 ⑧) */
export type ContentKind =
  | 'COMMENT'
  | 'POST';

/**
 * 글 · 댓글 혼합 목록의 한 줄 (AD-01 ②-5 ⑥, TM-06 ⑧) (제안)
 * 글과 댓글이 같은 목록에 섞이므로 정규화하지 않도록 id 필드를 두지 않는다(targetId 사용).
 * 팀 열은 두지 않는다(AD-01 ②-5 비고: 비공개 팀 이름 유출 경로 차단).
 */
export type ContentRow = {
  __typename?: 'ContentRow';
  author: Member;
  createdAt: Scalars['DateTime']['output'];
  kind: ContentKind;
  /** 댓글이면 그 댓글이 달린 글 id. 클릭 → BD-03 */
  postId: Scalars['ID']['output'];
  postType: PostType;
  /** 글 id 또는 댓글 id */
  targetId: Scalars['ID']['output'];
  /** 글이면 제목, 댓글이면 본문 앞부분 (추측) */
  title: Scalars['String']['output'];
};

export type ContentRowConnection = {
  __typename?: 'ContentRowConnection';
  nodes: Array<ContentRow>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type CorrectJudgmentInput = {
  expectedBasis?: InputMaybe<Scalars['String']['input']>;
  judgmentId: Scalars['ID']['input'];
  newStatus: CorrectableJudgmentStatus;
  /** 필수(DB 1-14) */
  reason: Scalars['String']['input'];
};

/** DB judgment_correction.after_status (1-14). 정정으로 만들 수 있는 결과 3종(기능명세서 7장) [Q-05: B안이면 EXCLUDED 추가] */
export type CorrectableJudgmentStatus =
  | 'EXEMPT'
  | 'FAIL'
  | 'PASS';

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

/**
 * 요일 한 칸 (CM-01 ② 점 7칸, AC-01 ② 표, TM-05 ⑥ 점 7칸)
 * 지난 주차는 DB judgment_day(1-8) 값이라 boolean만 있다 → grassCount · grassLevel · recordCount는 null.
 * [충돌] 목업 W-06의 '잔디 3칸 / 기록글 1개' 같은 개수는 이번 주에만 그릴 수 있다(계약서 9장 C-07)
 */
export type DayActivity = {
  __typename?: 'DayActivity';
  date: Scalars['Date']['output'];
  grassCount: Maybe<Scalars['Int']['output']>;
  grassLevel: Maybe<Scalars['Int']['output']>;
  hasGrass: Scalars['Boolean']['output'];
  hasRecord: Scalars['Boolean']['output'];
  /** '아직 오지 않은 날이에요'(목업 W-06) */
  isFuture: Scalars['Boolean']['output'];
  isToday: Scalars['Boolean']['output'];
  recordCount: Maybe<Scalars['Int']['output']>;
  /** hasGrass OR hasRecord. 같은 날 둘 다여도 1일(기능명세서 5장) */
  verified: Scalars['Boolean']['output'];
};

/** AD-01 ②-1 ⑦ 삭제된 경고(추방 · 팀 삭제로 카테고리가 모두 빠진 것). 회수된 경고는 나오지 않는다 */
export type DeletedWarning = {
  __typename?: 'DeletedWarning';
  deleteReason: WarningDeleteReason;
  deletedAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  member: Member;
  /** '복구 후 카테고리'. isDeleted 팀은 '삭제된 팀' */
  restoreCategories: Array<AdminTeamLabel>;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};

export type DeletedWarningConnection = {
  __typename?: 'DeletedWarningConnection';
  nodes: Array<DeletedWarning>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** DB exemption_period (1-12). 주 단위, 전체 회원 적용 */
export type ExemptionPeriod = {
  __typename?: 'ExemptionPeriod';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** 이미 판정이 끝난 주인가 — 수정 · 삭제 시 소급 재계산 대상(DB 1-12, E-45) */
  isPast: Scalars['Boolean']['output'];
  reason: Scalars['String']['output'];
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};

export type ExemptionPeriodConnection = {
  __typename?: 'ExemptionPeriodConnection';
  nodes: Array<ExemptionPeriod>;
  pageInfo: PageInfo;
};

export type ExemptionPeriodInput = {
  expectedBasis?: InputMaybe<Scalars['String']['input']>;
  reason: Scalars['String']['input'];
  weekStart: Scalars['Date']['input'];
};

/** 면제 기간 소급 등록 · 수정 · 삭제 미리보기 (제안 — 인수인계의 신설 5개에 없던 것) */
export type ExemptionPeriodPreview = {
  __typename?: 'ExemptionPeriodPreview';
  affectedMemberCount: Scalars['Int']['output'];
  basis: Maybe<Scalars['String']['output']>;
  changes: Array<RecalcPreview>;
  /** 이미 판정된 주인가. false면 재계산 없음 → 바로 등록 */
  isRetroactive: Scalars['Boolean']['output'];
  weekStart: Scalars['Date']['output'];
};

export type GrassCalendar = {
  __typename?: 'GrassCalendar';
  /** 최근 12개월(53주 × 7일) (PR-01 ⑦) */
  days: Array<GrassDay>;
  /** E-39 비공개 기여 꺼짐 추정: 총 기여 0인데 기록글만 있음 (추측 — 감지 기간 미정) */
  privateContributionSuspected: Scalars['Boolean']['output'];
  status: GrassFetchStatus;
  /** 갱신 기준 시각. 화면에 '오늘 오전 6시 기준'으로 표기(5-2-6). 한 번도 성공 못 했으면 null */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

/** 하루치 잔디. level은 GitHub contributionLevel을 0~4로 옮긴 값(목업 heat()의 h0~h4) (제안) */
export type GrassDay = {
  __typename?: 'GrassDay';
  count: Scalars['Int']['output'];
  date: Scalars['Date']['output'];
  level: Scalars['Int']['output'];
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

/** AD-01 ⑦ 집계: 통과 · 미달 · 면제 · 첫 참가 (+ 보류 ⑧) */
export type JudgmentCounts = {
  __typename?: 'JudgmentCounts';
  exempt: Scalars['Int']['output'];
  fail: Scalars['Int']['output'];
  firstWeek: Scalars['Int']['output'];
  /** 0이면 보류 관련 표시를 하지 않는다(AD-01 ⑧) */
  hold: Scalars['Int']['output'];
  /** 팀 없음 제외 — 화면 집계에는 없다 (추측: 목록 기본 필터에서도 뺀다) */
  noTeam: Scalars['Int']['output'];
  pass: Scalars['Int']['output'];
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

/** DB weekly_judgment.status (1-6). HOLD는 확정 상태가 아니다(E-35) */
export type JudgmentStatus =
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  | 'HOLD'
  | 'PASS';

/** 이번 주 진행 상태 (판정 전) (제안) */
export type LiveWeekState = {
  __typename?: 'LiveWeekState';
  recordsNeeded: Scalars['Int']['output'];
  /** EXCLUDED → FIRST_WEEK(E-36) / EXEMPT → EXEMPTION_PERIOD · PERSONAL_EXEMPTION(E-46) */
  skipReason: Maybe<SkipReason>;
  status: LiveWeekStatus;
  /** 통과까지 남은 인증일 수 'n일 더 인증하면 통과!'(CM-01 ③). 프론트 계산도 가능하지만 앱과 규칙을 한 곳에 둔다 */
  verifiedDaysNeeded: Scalars['Int']['output'];
};

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

export type Me = {
  __typename?: 'Me';
  githubLogin: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  profileImageUrl: Maybe<Scalars['String']['output']>;
  role: MemberRole;
  status: MemberStatus;
};

/**
 * 회원 공개 프로필. 작성자·팀원 표시와 PR-01이 같은 정규화 단위(Member:{id})를 쓴다.
 * status·role은 여기 두지 않는다 — 본인은 Me, 관리자는 AdminMemberRow로만 본다 (제안)
 */
export type Member = {
  __typename?: 'Member';
  commentCount: Scalars['Int']['output'];
  /** PR-01 ⑩ 첫 줄 '진행 중'. 이번 주 판정 대상이 아니면(팀 미소속) null */
  currentWeek: Maybe<WeekActivity>;
  /** GitHub 아이디. 로그인마다 최신값으로 갱신(DB 1-1). PR-01 ③ */
  githubLogin: Scalars['String']['output'];
  /** PR-01 ⑦ 최근 12개월 잔디. 하루 1회 캐시 값(기능명세서 5장, 5-2-6) */
  grassCalendar: GrassCalendar;
  id: Scalars['ID']['output'];
  /** PR-01 ⑩ · AC-01 ⑤ 확정·보류된 주차 이력, 최신순. 기본 8주(PR-01 ⑩ 제안) [Q-06] */
  judgmentHistory: WeeklyJudgmentConnection;
  /** 표시 이름(DB nickname). PR-01 ② */
  nickname: Scalars['String']['output'];
  /** PR-01 ⑥ (DB 4-5: MongoDB 집계, 삭제 글 제외) */
  postCount: Scalars['Int']['output'];
  /** null이면 기본 이미지(DB 1-1, 기능명세서 8장) */
  profileImageUrl: Maybe<Scalars['String']['output']>;
  /** PR-01 ⑫ 공개 팀만. 비공개 팀은 항목째 뺀다(기능명세서 2장, PR-01 비고) */
  publicTeams: Array<Team>;
  /** PR-01 ⑧⑨ · CM-01 ④ · AC-02 ①② — 타인 프로필에서도 같은 값을 보인다(PR-01 '상태: 타인') */
  warningState: WarningState;
};


/**
 * 회원 공개 프로필. 작성자·팀원 표시와 PR-01이 같은 정규화 단위(Member:{id})를 쓴다.
 * status·role은 여기 두지 않는다 — 본인은 Me, 관리자는 AdminMemberRow로만 본다 (제안)
 */
export type MemberJudgmentHistoryArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

/** DB member.role (1-1) */
export type MemberRole =
  | 'ADMIN'
  | 'MEMBER';

/** DB member.status (1-1) */
export type MemberStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'REJECTED';

export type Mutation = {
  __typename?: 'Mutation';
  /** 받은 초대를 수락해 바로 참가한다 (TM-04). INVITATION_ALREADY_JOINED · TEAM_GONE */
  acceptTeamInvitation: Team;
  /** 댓글을 삭제한다 (관리자, 소프트 삭제). 없거나 이미 삭제된 댓글은 NOT_FOUND. 관리자 행동 로그가 남는다 */
  adminDeleteComment: Scalars['Boolean']['output'];
  /** 글을 삭제한다 (관리자, 소프트 삭제). 이미 삭제된 글은 POST_DELETED, 없는 글은 NOT_FOUND. 관리자 행동 로그가 남는다 */
  adminDeletePost: Scalars['Boolean']['output'];
  approveMember: AdminMemberRow;
  /** AD-01 ②-3 ⑦ [승인]. 소급이면 미리보기 후 (추측) */
  approvePersonalExemption: PersonalExemptionRequest;
  /** 보낸 초대를 철회한다 (팀장과 시스템 관리자만) */
  cancelTeamInvitation: Scalars['Boolean']['output'];
  /** AD-01 ⑩ [정정하고 재계산]. 사유 필수. 연쇄 재계산(E-49 · E-50 · E-58 · E-60) */
  correctJudgment: RecalcPayload;
  /** 댓글을 쓴다. 삭제된 글에는 달 수 없다 (1~500자) */
  createComment: Comment;
  /** 과거 주간이면 exemptionPeriodPreview를 먼저 거친다(AD-01 ②-3 ⑥, E-45) */
  createExemptionPeriod: ExemptionPeriod;
  createNotice: Notice;
  /** 글을 쓴다. 필수 항목을 모두 채우지 않아도 저장되지만 기록글로 인정되지 않는다(isRecord=false) */
  createPost: Post;
  /** 팀을 만든다. 만든 사람이 팀장이고, 초대코드가 이때 한 번 발급된다 (TM-02) */
  createTeam: CreateTeamPayload;
  /** 받은 초대를 거절한다 */
  declineTeamInvitation: Scalars['Boolean']['output'];
  /** 댓글을 지운다 (작성자 본인만, 소프트 삭제). 팀장도 지울 수 없다 */
  deleteComment: Scalars['Boolean']['output'];
  /** [미결] 이미 판정된 주의 면제 기간을 지우면 그 주를 어떻게 판정할지 명세에 없다(계약서 9장 C-05) */
  deleteExemptionPeriod: Scalars['ID']['output'];
  /** isSystem이면 SYSTEM_NOTICE_UNDELETABLE(EX-AD01-02) */
  deleteNotice: Scalars['Boolean']['output'];
  /** 글을 지운다 (작성자 본인만, 소프트 삭제). 팀장도 지울 수 없다 */
  deletePost: Scalars['Boolean']['output'];
  /** 팀을 삭제한다 (팀장과 시스템 관리자만) */
  deleteTeam: Scalars['Boolean']['output'];
  /** GitHub 로그인 뒤 받은 일회용 코드를 액세스 토큰으로 바꾼다. 한 번만 쓸 수 있다. 재사용 · 만료 AUTH_CODE_INVALID, 거절 회원 ACCOUNT_REJECTED */
  exchangeAuthCode: AuthPayload;
  /** AD-01 ②-1 ⑥ 되돌릴 수 없는 고정점(E-58). 경고 0 · 연속 0 [Q-10 ⓓ] */
  fulfillPenalty: RecalcPayload;
  /** GitHub 아이디로 초대한다 (TM-06). INVITEE_NOT_FOUND · INVITEE_ALREADY_MEMBER · INVITATION_DUPLICATE */
  inviteToTeam: SentTeamInvitation;
  /** 초대코드로 참가한다 (TM-03). TEAM_CODE_NOT_FOUND · TEAM_ALREADY_JOINED · TEAM_JOIN_BLOCKED */
  joinTeamByCode: Team;
  /** 팀원을 추방한다 (팀장과 시스템 관리자만) */
  kickTeamMember: Scalars['Boolean']['output'];
  /** 팀에서 나간다. 팀장은 LEADER_MUST_TRANSFER, 혼자면 LEADER_LAST_MEMBER */
  leaveTeam: Scalars['Boolean']['output'];
  /** 확인 다이얼로그 후. 감사 기록 대상(기능명세서 9장) */
  rejectMember: AdminMemberRow;
  /** 거절 사유 필수(E-48 제안) */
  rejectPersonalExemption: PersonalExemptionRequest;
  /** 개인 면제를 요청한다 (그 팀의 팀장만, TM-08). EXEMPTION_REQUEST_DUPLICATE. weekStart는 월요일 yyyy-MM-dd */
  requestPersonalExemption: PersonalExemption;
  /** AD-01 ⑦ [재시도] · ⑨ [전체 재시도]. judgmentIds 생략 = 재시도 가능한 보류 전부. 확정 건은 건드리지 않는다(E-35) */
  rerunHeldJudgments: RerunResult;
  /** PR-02 ③ 기본 이미지로. 파일 업로드는 REST(계약서 5장) */
  resetProfileImage: Member;
  /** AD-01 ②-1 ⑧ */
  restoreWarning: RecalcPayload;
  /** 거절 → 승인 대기로 되돌리기(AD-01 ②-2 ⑧) */
  revertMemberToPending: AdminMemberRow;
  /** AD-01 ②-4 ⑥ 고정 ON/OFF 즉시 토글 */
  setNoticePinned: Notice;
  /** 팀장을 다른 팀원에게 넘긴다 (팀장과 시스템 관리자만). 되돌릴 수 없다 */
  transferTeamLeadership: Team;
  /** 댓글을 고친다 (작성자 본인 또는 그 글이 연결된 팀의 현재 팀장) */
  updateComment: Comment;
  updateExemptionPeriod: ExemptionPeriod;
  updateNotice: Notice;
  /**
   * 글을 고친다 (작성자 본인 또는 그 글이 연결된 팀의 현재 팀장). 글 종류와 작성일은 바뀌지 않는다.
   * 팀장이 남의 글을 고칠 때는 teamId를 읽지 않고 기존 팀 연결을 유지한다. 그 밖의 사람은 FORBIDDEN
   */
  updatePost: Post;
  /** 팀의 공개·비공개를 바꾼다 (팀장과 시스템 관리자만, TM-06 ⑦) */
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
  expectedBasis: InputMaybe<Scalars['String']['input']>;
  requestId: Scalars['ID']['input'];
};


export type MutationCancelTeamInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationCorrectJudgmentArgs = {
  input: CorrectJudgmentInput;
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
  expectedBasis: InputMaybe<Scalars['String']['input']>;
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


export type MutationRejectMemberArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationRejectPersonalExemptionArgs = {
  reason: Scalars['String']['input'];
  requestId: Scalars['ID']['input'];
};


export type MutationRequestPersonalExemptionArgs = {
  memberId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
  teamId: Scalars['ID']['input'];
  weekStart: Scalars['String']['input'];
};


export type MutationRerunHeldJudgmentsArgs = {
  judgmentIds: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationRestoreWarningArgs = {
  expectedBasis: InputMaybe<Scalars['String']['input']>;
  warningId: Scalars['ID']['input'];
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

/** AC-02 화면 묶음 */
export type MyWarnings = {
  __typename?: 'MyWarnings';
  history: Array<WarningRecord>;
  state: WarningState;
};

/** DB notice (1-15) */
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

/** [Q-06] 커서 방식 초안. 오프셋으로 결정되면 이 타입과 각 Connection만 바뀌고, 프론트는 페이지 훅 안에서 흡수한다 */
export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

/** 재계산 미리보기의 벌칙 대상 변화 (AD-01 ⑩ '벌칙 진입·해제', E-42 · E-50) */
export type PenaltyChange =
  | 'ENTER'
  | 'NONE'
  | 'RELEASE';

/** AD-01 ②-1 ⑤ 벌칙 대상. 경고가 붙은 팀은 비공개여도 실명 */
export type PenaltyTarget = {
  __typename?: 'PenaltyTarget';
  activeWarningCount: Scalars['Int']['output'];
  member: Member;
  reachedAt: Maybe<Scalars['DateTime']['output']>;
  /** DB penalty_fulfillment.reached_week 의미(그 주 월요일). 목업 W-16 '도달 9/28'은 판정일로 보인다(계약서 9장 C-14) */
  reachedWeekStart: Scalars['Date']['output'];
  teams: Array<AdminTeamLabel>;
};

/** 개인 면제 요청 한 건 (TM-08). 팀 이름은 싣지 않는다 */
export type PersonalExemption = {
  __typename?: 'PersonalExemption';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  member: AdminMemberBrief;
  overlapsExemptionPeriod: Scalars['Boolean']['output'];
  reason: Scalars['String']['output'];
  rejectReason: Maybe<Scalars['String']['output']>;
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

/** DB personal_exemption (1-13). 관리자 목록에는 팀 이름을 넣지 않는다(AD-01 ②-3 ⑦) */
export type PersonalExemptionRequest = {
  __typename?: 'PersonalExemptionRequest';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** 그 주 판정이 이미 끝났는가 — true면 승인이 소급 면제가 된다 → 미리보기 필요 (추측, 계약서 9장 C-04) */
  isRetroactive: Scalars['Boolean']['output'];
  member: Member;
  /** E-44 이미 전체 면제 기간인 주 (안내용) */
  overlapsExemptionPeriod: Scalars['Boolean']['output'];
  reason: Scalars['String']['output'];
  /** 거절 사유(E-48) — TM-08 ⑤ '거절됨 · 사유: …' */
  rejectReason: Maybe<Scalars['String']['output']>;
  /** 요청한 팀장 */
  requestedBy: Member;
  respondedAt: Maybe<Scalars['DateTime']['output']>;
  status: PersonalExemptionStatus;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};

export type PersonalExemptionRequestConnection = {
  __typename?: 'PersonalExemptionRequestConnection';
  nodes: Array<PersonalExemptionRequest>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

/** DB personal_exemption.status (1-13). 초대(DECLINED)와 단어가 다르지만 DB 그대로 둔다 */
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
  /** 연결된 팀 id. 없으면 null. 팀 이름은 teamName(비공개 팀은 숨김) */
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

/** DB post_index.post_type · posts.type (1-5, 3-1). URL 쿼리(?type=troubleshooting|devlog)는 소문자이므로 라우터에서 변환한다 */
export type PostType =
  | 'DEVLOG'
  | 'TROUBLESHOOTING';

export type Profile = {
  __typename?: 'Profile';
  commentCount: Scalars['Int']['output'];
  githubLogin: Scalars['String']['output'];
  /** GitHub 잔디 1년치. 캐시가 없으면 null (E-32). 하루 한 번 갱신한 캐시다 */
  grass: Maybe<ProfileGrass>;
  id: Scalars['ID']['output'];
  /** 내 프로필인가 (프로필 수정 · 관리자 메뉴 버튼 노출 판단) */
  isMine: Scalars['Boolean']['output'];
  /** 주간 판정 이력 (PR-01 ⑩). 최근 주부터 커서 기반 20개. 첫 페이지 맨 위에 이번 주 IN_PROGRESS 행이 하나 더 붙을 수 있다 */
  judgmentHistory: ProfileJudgmentPage;
  /** GitHub 계정 이름. 수정할 수 없다 */
  nickname: Scalars['String']['output'];
  postCount: Scalars['Int']['output'];
  /** null이면 기본 이미지 */
  profileImageUrl: Maybe<Scalars['String']['output']>;
  /** 팀별 경고 (PR-01 ⑨). 중복 집계 */
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

/** PASS 통과 / FAIL 미달(경고) / EXEMPT 면제 / EXCLUDED 제외 / IN_PROGRESS 진행 중(이번 주와 아직 확정되지 않은 보류 주) */
export type ProfileJudgmentResult =
  | 'EXCLUDED'
  | 'EXEMPT'
  | 'FAIL'
  | 'IN_PROGRESS'
  | 'PASS';

/** 면제 · 제외 주와 보류 주는 인증일 · 기록글이 null */
export type ProfileJudgmentWeek = {
  __typename?: 'ProfileJudgmentWeek';
  recordCount: Maybe<Scalars['Int']['output']>;
  result: ProfileJudgmentResult;
  /** 인증일 수. 진행 중인 이번 주는 잔디 캐시가 없으면 null */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  weekEnd: Scalars['String']['output'];
  weekStart: Scalars['String']['output'];
};

export type ProfileTeam = {
  __typename?: 'ProfileTeam';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

/** 비공개 팀은 '비공개 팀', 삭제된 팀은 '삭제된 팀'으로 나온다 */
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

/** 보류 주가 남아 있으면 onHold만 true이고 나머지는 null */
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
  /** AD-01 ②-5. 검색: 제목 · 내용 · 작성자 */
  adminContents: ContentRowConnection;
  adminDashboardSummary: AdminDashboardSummary;
  /** AD-01 ⑥⑦. weekStart 생략 = 가장 최근 판정 주 */
  adminJudgmentWeek: AdminJudgmentWeek;
  /** AD-01 ②-2 */
  adminMembers: AdminMemberConnection;
  /** AD-01 ②-1 ⑦ */
  deletedWarnings: DeletedWarningConnection;
  /** AD-01 ②-3 ⑥ 과거 주간 등록 · 수정 · 삭제 전 미리보기 (제안). 수정이면 periodId, 삭제면 removing: true */
  exemptionPeriodPreview: ExemptionPeriodPreview;
  /** AD-01 ②-3 ⑤ */
  exemptionPeriods: ExemptionPeriodConnection;
  /** AD-01 ⑨ 주차와 무관한 미해결 보류 전체 (인수인계 5-1 명칭 유지, 제안: 지난 주차 보류가 묻히지 않게) */
  heldJudgments: Array<AdminJudgmentRow>;
  /** AD-01 ⑩ (인수인계 5-1 명칭) */
  judgmentCorrectionPreview: RecalcPreview;
  /** 내 계정 정보. 승인 대기·거절 계정도 호출할 수 있다 */
  me: Me;
  /** 없는 회원 → null(E-53). 프로필 화면은 profile을 쓴다 (다른 영역이 아직 쓴다) */
  member: Maybe<Member>;
  /** 내 지난 판정 목록 (AC-01 ⑤). 최근 주부터 커서 기반 20개 */
  myJudgmentHistory: JudgmentHistoryPage;
  /** 내가 보낸 개인 면제 요청 목록 (TM-08 ⑤). 최신순 커서 기반 20개 */
  myPersonalExemptionRequests: PersonalExemptionPage;
  /** 내 팀 목록 (TM-01). 참가한 순서(오래된 순). 커서 없이 전부 */
  myTeams: Array<Team>;
  /** 내 경고 이력 (AC-02 ③). 최근 주부터 커서 기반 20개 */
  myWarningHistory: WarningHistoryPage;
  /** 내 경고 요약. 판정 보류가 남아 있으면 onHold만 true이고 숫자는 null */
  myWarningSummary: WarningSummary;
  /** 내 주간 활동. weekStart는 월요일(yyyy-MM-dd), 생략하면 이번 주, 미래 주는 INVALID_INPUT */
  myWeeklyActivity: WeeklyActivity;
  /** 공지 상세. 없는 공지는 NOT_FOUND */
  notice: Notice;
  /** 공지 목록. 고정 공지가 위, 그 아래 최신순. 커서 기반 20개 (백엔드 notice.graphqls) */
  notices: NoticePage;
  /** AD-01 ②-1 ⑤ */
  penaltyTargets: Array<PenaltyTarget>;
  /** AD-01 ②-3 ⑦ 이미 판정된 주의 승인(소급) 미리보기. 소급이 아니면 null (추측) */
  personalExemptionApprovalPreview: Maybe<RecalcPreview>;
  /** AD-01 ②-3 ⑦ */
  personalExemptionRequests: PersonalExemptionRequestConnection;
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
  /** 프로필 (승인된 회원 누구나, 본인 · 타인 같은 모양). 없는 회원이나 승인되지 않은 회원은 NOT_FOUND */
  profile: Profile;
  /** 받은 초대 목록 (TM-04). 최신순, 커서 기반 20개 */
  receivedTeamInvitations: ReceivedTeamInvitationPage;
  /** AD-01 ②-1 ⑧ (인수인계 5-1 명칭). E-42 · E-43 · E-59 */
  restoreWarningPreview: RecalcPreview;
  /** 보낸 초대 중 대기 중인 목록 (TM-06). 팀장과 시스템 관리자만. 최신순, 커서 기반 20개 */
  sentTeamInvitations: SentTeamInvitationPage;
  /** 팀 기본 정보. 그 팀의 팀원·팀장과 시스템 관리자만. 없는/삭제된 팀 NOT_FOUND, 비소속 FORBIDDEN */
  team: Team;
  /** 팀 현황판 (TM-05). 그 팀의 팀원·팀장과 시스템 관리자만 */
  teamBoard: TeamBoard;
  /** 팀에 연결된 글에 달린 댓글 목록 (TM-06 ⑧). 팀장만. 최신순, 커서 기반 20개 */
  teamComments: TeamCommentPage;
  /** 초대코드 다시 확인 (TM-06). 그 팀의 팀장과 시스템 관리자만 */
  teamInviteCode: Scalars['String']['output'];
  /** 팀원 목록 (TM-06). 팀장이 맨 앞, 나머지는 참가한 순서. 커서 기반 20개 */
  teamMembers: TeamMemberPage;
  /** 팀에 연결된 글 목록 (TM-06 ⑧). 팀장만. 최신순, 커서 기반 20개 */
  teamPosts: TeamPostPage;
};


export type QueryAdminContentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminContentFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryAdminJudgmentWeekArgs = {
  weekStart: InputMaybe<Scalars['Date']['input']>;
};


export type QueryAdminMembersArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<AdminMemberFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
};


export type QueryDeletedWarningsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryExemptionPeriodPreviewArgs = {
  periodId: InputMaybe<Scalars['ID']['input']>;
  removing?: InputMaybe<Scalars['Boolean']['input']>;
  weekStart: Scalars['Date']['input'];
};


export type QueryExemptionPeriodsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryJudgmentCorrectionPreviewArgs = {
  judgmentId: Scalars['ID']['input'];
  newStatus: CorrectableJudgmentStatus;
};


export type QueryMemberArgs = {
  id: Scalars['ID']['input'];
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


export type QueryPersonalExemptionApprovalPreviewArgs = {
  requestId: Scalars['ID']['input'];
};


export type QueryPersonalExemptionRequestsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
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


export type QueryProfileArgs = {
  memberId: Scalars['ID']['input'];
};


export type QueryReceivedTeamInvitationsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
};


export type QueryRestoreWarningPreviewArgs = {
  warningId: Scalars['ID']['input'];
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

/** 판정 정정 · 경고 복구 · 이행 체크 · 소급 면제 후 영향받은 회원의 새 상태. 프론트는 이 결과로 부분 패치하지 않고 관련 쿼리를 재조회한다 */
export type RecalcPayload = {
  __typename?: 'RecalcPayload';
  /** 판정 정정이면 바뀐 판정 */
  judgment: Maybe<WeeklyJudgment>;
  member: Member;
  warningState: WarningState;
};

/**
 * 재계산 미리보기 — 계산만 하고 아무것도 바꾸지 않는다(기능명세서 7장)
 * 쓰는 곳: 판정 정정(AD-01 ⑩) · 경고 복구(②-1 ⑧) · 소급 면제(②-3 ⑥ 과거 주간, ⑦ 소급 승인)
 */
export type RecalcPreview = {
  __typename?: 'RecalcPreview';
  /** '다시 계산되는 주차 n주'(목업 W-15) */
  affectedWeekCount: Scalars['Int']['output'];
  /**
   * 반영 직전 서버 재검증용 기준값 (제안 — AD-01 ⑩ 비고). 반영 뮤테이션에 expectedBasis로 돌려준다.
   * 인수인계 5-2 '잘라낼 순서 3번'이라 nullable · 선택 인자로 둬서 잘라도 스키마가 바뀌지 않게 한다
   */
  basis: Maybe<Scalars['String']['output']>;
  /** 벌칙 이행 체크 이전 주차라 기록만 바뀌고 경고 수는 그대로(E-58 · E-59) */
  frozenByFulfillment: Scalars['Boolean']['output'];
  member: Member;
  penaltyChange: PenaltyChange;
  /** 카테고리가 하나도 없는 경고 복구 → '삭제된 팀'(E-43) */
  restoresWithoutCategory: Scalars['Boolean']['output'];
  warningCountAfter: Scalars['Int']['output'];
  warningCountBefore: Scalars['Int']['output'];
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

/** 보류 재실행 결과 → 토스트 '{n}명 처리했어요.'(E-35) */
export type RerunResult = {
  __typename?: 'RerunResult';
  processedCount: Scalars['Int']['output'];
  rows: Array<AdminJudgmentRow>;
  stillHeldCount: Scalars['Int']['output'];
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
  /** 이번 주 요약 (TM-01 ⑧) */
  weekSummary: TeamWeekSummary;
};

export type TeamBoard = {
  __typename?: 'TeamBoard';
  /** 잔디 갱신 기준 시각 (KST, ISO-8601). 하나도 없으면 null */
  grassFetchedAt: Maybe<Scalars['String']['output']>;
  /** 잔디를 못 불러온 팀원이 있는가 (E-32 배너) */
  grassNotLoaded: Scalars['Boolean']['output'];
  /** 팀장이 맨 앞, 나머지는 참가한 순서 */
  members: Array<TeamBoardMember>;
  /** 이 팀에 연결된 글 최신 5건 */
  recentPosts: Array<TeamBoardPost>;
  /** 이번 주 일요일 (yyyy-MM-dd) */
  weekEnd: Scalars['String']['output'];
  /** 이번 주 월요일 (yyyy-MM-dd) */
  weekStart: Scalars['String']['output'];
};

/** 날짜별 한 칸. null은 알 수 없음 */
export type TeamBoardDay = {
  __typename?: 'TeamBoardDay';
  date: Scalars['String']['output'];
  hasGrass: Maybe<Scalars['Boolean']['output']>;
  hasRecord: Scalars['Boolean']['output'];
  verified: Maybe<Scalars['Boolean']['output']>;
};

export type TeamBoardMember = {
  __typename?: 'TeamBoardMember';
  /** 월~일 7행 */
  days: Array<TeamBoardDay>;
  githubLogin: Scalars['String']['output'];
  isMe: Scalars['Boolean']['output'];
  memberId: Scalars['ID']['output'];
  nickname: Scalars['String']['output'];
  recordCount: Scalars['Int']['output'];
  status: TeamBoardStatus;
  /** 인증일 수. 잔디를 못 불러와 알 수 없으면 null */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  /** 이 팀 카테고리가 붙은 지금 경고 수. 판정 보류가 남아 알 수 없으면 null */
  warningCount: Maybe<Scalars['Int']['output']>;
};

export type TeamBoardPost = {
  __typename?: 'TeamBoardPost';
  author: BoardAuthor;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isRecord: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
  type: PostType;
};

/** 팀 현황판 상태 칸. 미달은 주가 끝나고 판정이 확정된 뒤에만 나온다 */
export type TeamBoardStatus =
  | 'EXCLUDED'
  | 'FAIL'
  | 'NOT_YET'
  | 'PASS';

export type TeamCommentPage = {
  __typename?: 'TeamCommentPage';
  items: Array<Comment>;
  /** 다음 페이지 커서. null이면 마지막 */
  nextCursor: Maybe<Scalars['String']['output']>;
};

/**
 * 마스킹된 팀 표기용 값 객체 (제안)
 * 일부러 id 필드를 두지 않는다 — 실명 Team:{id}와 같은 캐시 키로 합쳐지면 실명이 새거나 TM-01 이름이 깨진다.
 * name은 PUBLIC일 때만 값이 있다. PRIVATE·DELETED는 프론트가 고정 문구로 그린다.
 */
export type TeamLabel = {
  __typename?: 'TeamLabel';
  kind: TeamLabelKind;
  name: Maybe<Scalars['String']['output']>;
};

/**
 * 경고 카테고리·게시글 팀 표기 종류 (제안)
 * PRIVATE → "비공개 팀"(열람자 구분 없이 무조건, E-23) / DELETED → "삭제된 팀"(기능명세서 6장, E-43)
 */
export type TeamLabelKind =
  | 'DELETED'
  | 'PRIVATE'
  | 'PUBLIC';

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

/**
 * DB warning.delete_reason (1-9).
 * [충돌] FC-04는 정정·소급 면제로 '회수'된 경고를 사유를 구분해 저장한다고 적었으나 DB에는 이 두 값뿐이다.
 * 회수를 소프트 삭제로 남긴다면 RETRACTED 같은 값이 필요하다 (제안 — 계약서 9장 C-03)
 */
export type WarningDeleteReason =
  | 'KICKED'
  | 'TEAM_DELETED';

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

/** AC-02 ③ 경고 이력 한 줄. 소프트 삭제된 경고는 나오지 않는다 */
export type WarningRecord = {
  __typename?: 'WarningRecord';
  /** 판정 시점 소속 팀 전부(E-38). 비공개 → PRIVATE, 삭제 → DELETED */
  categories: Array<TeamLabel>;
  id: Scalars['ID']['output'];
  recordCount: Maybe<Scalars['Int']['output']>;
  standing: WarningStanding;
  /** 사유 '인증일 n일 · 기록글 n개' */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};

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

/**
 * 경고 현재 상태 — 저장값이 아니라 판정 이력 replay 결과(기능명세서 6장, DB 4-3)
 * [충돌] AC-02 비고는 DB 'member_warning_state'를 읽는다고 적었지만 DB명세서 v0.4에 그런 테이블은 없다
 */
export type WarningState = {
  __typename?: 'WarningState';
  /** 살아 있는 경고 수. [Q-10 ⓒ] 3을 넘을 수 있는지 미정 → 화면 게이지는 3에서 자른다 */
  activeCount: Scalars['Int']['output'];
  /** PR-01 ⑨ 팀(카테고리)별 경고 수. 중복 집계라 합계 ≠ activeCount(기능명세서 8장). 유효 경고만 센다 (추측 — 목업 W-07·W-14 대조) */
  byCategory: Array<CategoryWarningCount>;
  /** 연속 통과 n / 2주 (AC-02 ②). [Q-10 ⓑ] 벌칙 대상 상태에서 쌓이는지 미정 */
  consecutivePasses: Scalars['Int']['output'];
  /** 경고 3회 도달(기능명세서 6장). CM-01 ④ · PR-01 ⑧ 빨간 '벌칙 대상' 배지 */
  isPenaltyTarget: Scalars['Boolean']['output'];
  /** E-41 '다음 차감까지 n주'. 벌칙 대상이거나 경고 0이면 null [Q-10 ⓐ] */
  weeksUntilDeduction: Maybe<Scalars['Int']['output']>;
};

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

/**
 * 한 주의 활동 (CM-01 ②③, AC-01 ②④⑤, PR-01 ⑩ 첫 줄)
 * 이번 주면 live가, 지난 주면 judgment가 채워진다.
 */
export type WeekActivity = {
  __typename?: 'WeekActivity';
  /** 항상 7개, 월~일 */
  days: Array<DayActivity>;
  grassStatus: GrassFetchStatus;
  grassUpdatedAt: Maybe<Scalars['DateTime']['output']>;
  isCurrentWeek: Scalars['Boolean']['output'];
  /** 지난 주의 판정. 판정 기록이 없으면 null */
  judgment: Maybe<WeeklyJudgment>;
  live: Maybe<LiveWeekState>;
  /** E-39 (CM-01 ⑥ 배너 우선순위 E-39 → E-32 → E-36 → E-46 은 프론트가 적용) */
  privateContributionSuspected: Scalars['Boolean']['output'];
  /** 기록글 수는 실시간(5-2-6) */
  recordCount: Maybe<Scalars['Int']['output']>;
  /** 제외 · 면제 주는 null → '—'(AC-01 ⑤) */
  verifiedDays: Maybe<Scalars['Int']['output']>;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
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

/** DB weekly_judgment (1-6) */
export type WeeklyJudgment = {
  __typename?: 'WeeklyJudgment';
  /** 관리자 정정을 거쳤는가 */
  corrected: Scalars['Boolean']['output'];
  /** 그 주 미달로 받은 경고가 지금 살아 있으면 true → PR-01 '미달 (경고)' (추측) */
  hasActiveWarning: Scalars['Boolean']['output'];
  /** 관리자 화면 표시용. 회원 화면에서 보류 주를 어떻게 부를지는 명세에 없다 (계약서 9장 C-15) */
  holdReason: Maybe<HoldReason>;
  id: Scalars['ID']['output'];
  /** 확정 시각. AD-01 ⑦ '9/28 07:00 실행' */
  judgedAt: Maybe<Scalars['DateTime']['output']>;
  recordCount: Maybe<Scalars['Int']['output']>;
  skipReason: Maybe<SkipReason>;
  status: JudgmentStatus;
  verifiedDays: Maybe<Scalars['Int']['output']>;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};

export type WeeklyJudgmentConnection = {
  __typename?: 'WeeklyJudgmentConnection';
  nodes: Array<WeeklyJudgment>;
  pageInfo: PageInfo;
};
