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

/**
 * 일회용 코드 교환 결과 (기능명세서 1장 토큰 교환, AU-02, FC-03)
 * - ACTIVE  : accessToken 발급 → CM-01
 * - PENDING : 본인 상태 조회 전용 제한 토큰 발급 (제안 — FC-03은 승인 후에만 토큰 저장. 계약서 4장·9장 C-01)
 * - REJECTED: accessToken = null, 거절 안내 화면(E-02 '토큰 미발급')
 */
export type AuthPayload = {
  __typename?: 'AuthPayload';
  accessToken: Maybe<Scalars['String']['output']>;
  expiresAt: Maybe<Scalars['DateTime']['output']>;
  /** REJECTED면 null */
  me: Maybe<Me>;
  status: MemberStatus;
};

export type CategoryWarningCount = {
  __typename?: 'CategoryWarningCount';
  count: Scalars['Int']['output'];
  label: TeamLabel;
};

export type Comment = {
  __typename?: 'Comment';
  author: Member;
  /** 1~500자(BD-03 ⑫ 제안) */
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** 작성자 또는 관리자 */
  viewerCanDelete: Scalars['Boolean']['output'];
  /** 작성자 또는 그 글이 연결된 팀의 팀장 */
  viewerCanEdit: Scalars['Boolean']['output'];
};

export type CommentConnection = {
  __typename?: 'CommentConnection';
  nodes: Array<Comment>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
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

/**
 * 글 작성 (BD-04). 필수 항목이 비어도 저장은 허용(E-24 추측) — isRecord는 서버가 계산한다(DB 1-5).
 * type과 맞지 않는 section key는 VALIDATION_FAILED.
 */
export type CreatePostInput = {
  commitUrls: Array<Scalars['String']['input']>;
  sections: Array<PostSectionInput>;
  tags: Array<Scalars['String']['input']>;
  /** 본인이 속한 팀만. null = 연결 안 함(BD-04 ⑨) */
  teamId?: InputMaybe<Scalars['ID']['input']>;
  /** 1~60자(BD-04 ③ 제안). 제목만 진짜 필수 */
  title: Scalars['String']['input'];
  type: PostType;
};

export type CreateTeamInput = {
  /** 100자 이내(TM-02 ② 제안). DB는 200자 */
  description?: InputMaybe<Scalars['String']['input']>;
  /** 기본 공개(TM-02 ③) */
  isPublic: Scalars['Boolean']['input'];
  /** 1~20자(TM-02 ① 제안) */
  name: Scalars['String']['input'];
};

/** TM-02 ⑤ 초대코드는 이 응답에서만 반드시 온다(1회 발급, 재발급 불가 — 기능명세서 2장) */
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

/** E-31 삭제된 글 안내(404와 구분). 본문 · 댓글은 내려주지 않는다 */
export type DeletedPost = {
  __typename?: 'DeletedPost';
  deletedAt: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
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

/**
 * 로그인한 본인. 라우터 가드(5-2-3)와 공통 헤더 ④가 쓴다.
 * status · role은 토큰 클레임이 아니라 요청 시점 DB 값이어야 한다 (제안) — 승인 직후 재발급 없이 반영(AU-03 ⑤)
 */
export type Me = {
  __typename?: 'Me';
  /** 팀 미소속 여부(5-2-7). CM-01 ⑨ · AC-01 상태 분기 */
  hasTeam: Scalars['Boolean']['output'];
  /** Member.id와 같은 값 */
  id: Scalars['ID']['output'];
  member: Member;
  /** CM-01 ⑤ · TM-01 ③ · 드로어 '받은 초대' 배지(목업 W-03) */
  pendingInvitationCount: Scalars['Int']['output'];
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
  /** BD-03 ⑫ */
  addComment: Comment;
  approveMember: AdminMemberRow;
  /** AD-01 ②-3 ⑦ [승인]. 소급이면 미리보기 후 (추측) */
  approvePersonalExemption: PersonalExemptionRequest;
  /** TM-06 ③ [취소]. DB에 철회 상태값이 없어 행 삭제로 해석 (추측) */
  cancelInvitation: Scalars['ID']['output'];
  /** AD-01 ⑩ [정정하고 재계산]. 사유 필수. 연쇄 재계산(E-49 · E-50 · E-58 · E-60) */
  correctJudgment: RecalcPayload;
  /** 과거 주간이면 exemptionPeriodPreview를 먼저 거친다(AD-01 ②-3 ⑥, E-45) */
  createExemptionPeriod: ExemptionPeriod;
  createNotice: Notice;
  /** BD-04 등록 */
  createPost: Post;
  /** TM-02 */
  createTeam: CreateTeamPayload;
  /** BD-03 ⑪ · AD-01 ②-5 작성자 또는 관리자 */
  deleteComment: Scalars['ID']['output'];
  /** [미결] 이미 판정된 주의 면제 기간을 지우면 그 주를 어떻게 판정할지 명세에 없다(계약서 9장 C-05) */
  deleteExemptionPeriod: Scalars['ID']['output'];
  /** isSystem이면 SYSTEM_NOTICE_UNDELETABLE(EX-AD01-02) */
  deleteNotice: Scalars['ID']['output'];
  /** BD-03 ④ 작성자 또는 관리자(AD-01 ②-5). 확정 판정 불변(E-28) */
  deletePost: Scalars['ID']['output'];
  /** TM-06 ⑨. 글은 남고 팀 연결만 해제(E-21), 카테고리 제거(E-22). 마지막 1인 팀장의 '나가기'도 이것(E-20 추측) */
  deleteTeam: Scalars['ID']['output'];
  /** 비로그인 허용. 코드 재사용 · 만료 → LOGIN_CODE_INVALID(E-05 · E-06) */
  exchangeLoginCode: AuthPayload;
  /** AD-01 ②-1 ⑥ 되돌릴 수 없는 고정점(E-58). 경고 0 · 연속 0 [Q-10 ⓓ] */
  fulfillPenalty: RecalcPayload;
  /** TM-06 ②. 가입 회원만(E-15), 이미 팀원(E-16), 추방자 재초대 허용(E-13) */
  inviteMember: SentInvitation;
  /** TM-03. E-10 · E-11 · E-12(차단 사유 · 남은 기간 미노출) */
  joinTeamByInviteCode: Team;
  /** TM-06 ⑤. 그 팀 경고 카테고리 제거 · 0이면 경고 소프트 삭제(E-22) */
  kickMember: Team;
  /** TM-05 ④ 팀원만. 팀장은 LEADER_MUST_TRANSFER(E-19). 자진 탈퇴는 경고 유지(기능명세서 6장) */
  leaveTeam: Scalars['ID']['output'];
  /** 무상태 JWT라 서버 처리는 없다 (제안). 클라이언트가 토큰 폐기 + 캐시 초기화 */
  logout: Scalars['Boolean']['output'];
  /** 확인 다이얼로그 후. 감사 기록 대상(기능명세서 9장) */
  rejectMember: AdminMemberRow;
  /** 거절 사유 필수(E-48 제안) */
  rejectPersonalExemption: PersonalExemptionRequest;
  /** TM-08 ④. E-44 · E-47 */
  requestPersonalExemption: PersonalExemptionRequest;
  /** AD-01 ⑦ [재시도] · ⑨ [전체 재시도]. judgmentIds 생략 = 재시도 가능한 보류 전부. 확정 건은 건드리지 않는다(E-35) */
  rerunHeldJudgments: RerunResult;
  /** PR-02 ③ 기본 이미지로. 파일 업로드는 REST(계약서 5장) */
  resetProfileImage: Member;
  /** TM-04 ②③. E-17 · E-18 */
  respondInvitation: RespondInvitationPayload;
  /** AD-01 ②-1 ⑧ */
  restoreWarning: RecalcPayload;
  /** 거절 → 승인 대기로 되돌리기(AD-01 ②-2 ⑧) */
  revertMemberToPending: AdminMemberRow;
  /** AD-01 ②-4 ⑥ 고정 ON/OFF 즉시 토글 */
  setNoticePinned: Notice;
  /** TM-06 ⑦ 즉시 반영 */
  setTeamVisibility: Team;
  /** TM-06 ⑥ 되돌릴 수 없음. 성공 후 조회자는 TM-06 권한을 잃는다 */
  transferLeadership: Team;
  /** BD-03 ⑪ · TM-06 ⑧ 작성자 또는 팀장 */
  updateComment: Comment;
  updateExemptionPeriod: ExemptionPeriod;
  updateNotice: Notice;
  /** BD-04 수정. 작성자 또는 연결 팀 팀장 */
  updatePost: Post;
};


export type MutationAddCommentArgs = {
  content: Scalars['String']['input'];
  postId: Scalars['ID']['input'];
};


export type MutationApproveMemberArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationApprovePersonalExemptionArgs = {
  expectedBasis: InputMaybe<Scalars['String']['input']>;
  requestId: Scalars['ID']['input'];
};


export type MutationCancelInvitationArgs = {
  invitationId: Scalars['ID']['input'];
};


export type MutationCorrectJudgmentArgs = {
  input: CorrectJudgmentInput;
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


export type MutationExchangeLoginCodeArgs = {
  code: Scalars['String']['input'];
};


export type MutationFulfillPenaltyArgs = {
  memberId: Scalars['ID']['input'];
};


export type MutationInviteMemberArgs = {
  githubLogin: Scalars['String']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationJoinTeamByInviteCodeArgs = {
  code: Scalars['String']['input'];
};


export type MutationKickMemberArgs = {
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
  input: RequestPersonalExemptionInput;
};


export type MutationRerunHeldJudgmentsArgs = {
  judgmentIds: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationRespondInvitationArgs = {
  accept: Scalars['Boolean']['input'];
  invitationId: Scalars['ID']['input'];
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
  pinned: Scalars['Boolean']['input'];
};


export type MutationSetTeamVisibilityArgs = {
  isPublic: Scalars['Boolean']['input'];
  teamId: Scalars['ID']['input'];
};


export type MutationTransferLeadershipArgs = {
  memberId: Scalars['ID']['input'];
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

/** AC-02 화면 묶음 */
export type MyWarnings = {
  __typename?: 'MyWarnings';
  history: Array<WarningRecord>;
  state: WarningState;
};

/** DB notice (1-15) */
export type Notice = {
  __typename?: 'Notice';
  /** 줄바꿈 유지, 댓글 없음(NT-02 ④) */
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isPinned: Scalars['Boolean']['output'];
  /** 잔디 인정 규칙 공지. 삭제 불가(EX-AD01-02) */
  isSystem: Scalars['Boolean']['output'];
  title: Scalars['String']['output'];
  updatedAt: Maybe<Scalars['DateTime']['output']>;
};

export type NoticeConnection = {
  __typename?: 'NoticeConnection';
  nodes: Array<Notice>;
  pageInfo: PageInfo;
};

export type NoticeInput = {
  content: Scalars['String']['input'];
  isPinned: Scalars['Boolean']['input'];
  title: Scalars['String']['input'];
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

/**
 * 게시글 (MongoDB posts 3-1 + MariaDB post_index 1-5)
 * 권한 판단은 서버 계산 필드(viewerCan*)로 받는다 — 비공개 팀 글은 팀 정보가 숨겨져 클라이언트가
 * '이 글 팀의 팀장인가'를 스스로 계산할 수 없다(BD-03 ④ · ⑪, 5-2-4).
 */
export type Post = {
  __typename?: 'Post';
  author: Member;
  commentCount: Scalars['Int']['output'];
  /** BD-03 ⑩ 등록순. 페이지 크기는 명세 없음 (제안: 50) */
  comments: CommentConnection;
  /** DB는 배열(3-1), 화면은 1칸(BD-04 ⑧) → 1차 구현은 0~1개 (제안, 계약서 9장 C-08) */
  commitUrls: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  /** BD-04 수정 모드의 ⑨ 소속 팀 기본값. viewerCanEdit일 때만 값(비공개 팀이어도 id만) (제안) */
  editTeamId: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  /** writtenDate가 속한 주가 이미 판정 확정됐으면 true. E-28 '이미 끝난 주의 인증 결과는 바뀌지 않아요' 안내 판단용. 월요일 00:00~판정 실행 사이 · 보류 주는 false (M-03, 제안) */
  inFinalizedWeek: Scalars['Boolean']['output'];
  /** false면 '인증 미포함' 배지(E-25) */
  isRecord: Scalars['Boolean']['output'];
  /** 공개 팀에 연결된 글만 값. 비공개 · 삭제 · 미연결이면 null(BD-01 ⑧, BD-03 ⑥, E-23) */
  publicTeam: Maybe<Team>;
  /** 작성 항목 순서대로(TROUBLESHOOTING 3칸 · DEVLOG 2칸) */
  sections: Array<PostSection>;
  /** 최대 5개 · 개당 20자(BD-04 ⑦ 제안) */
  tags: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  type: PostType;
  /** 값이 있으면 '(수정됨)'(BD-03 ③ 제안) */
  updatedAt: Maybe<Scalars['DateTime']['output']>;
  /** 작성자 본인 또는 관리자. 팀장은 삭제 불가(BD-03 비고) */
  viewerCanDelete: Scalars['Boolean']['output'];
  /** 작성자 본인 또는 연결 팀의 팀장(BD-03 ④, 기능명세서 2장) */
  viewerCanEdit: Scalars['Boolean']['output'];
  /** 팀장이 남의 글을 수정하는 경우 배너(BD-04 비고) 판단용 */
  viewerIsAuthor: Scalars['Boolean']['output'];
  /** 주차 귀속 날짜(KST, 서버 저장 시각 기준 E-27) [Q-11: 작성일 기준인지 필수 항목을 다 채운 날 기준인지 미정] */
  writtenDate: Scalars['Date']['output'];
};


/**
 * 게시글 (MongoDB posts 3-1 + MariaDB post_index 1-5)
 * 권한 판단은 서버 계산 필드(viewerCan*)로 받는다 — 비공개 팀 글은 팀 정보가 숨겨져 클라이언트가
 * '이 글 팀의 팀장인가'를 스스로 계산할 수 없다(BD-03 ④ · ⑪, 5-2-4).
 */
export type PostCommentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type PostConnection = {
  __typename?: 'PostConnection';
  nodes: Array<Post>;
  pageInfo: PageInfo;
  /** BD-01 ⑬ '검색 결과 n건'(현재 탭 기준) */
  totalCount: Scalars['Int']['output'];
};

/** BD-01 · 헤더 검색(5-1-0-1) 공통 필터. 헤더 검색은 서버에 따로 묻지 않고 이 필터로 BD-01에 들어온다 */
export type PostFilter = {
  /** [Q-12] PR-01 ⑥ '작성자 필터' */
  authorId?: InputMaybe<Scalars['ID']['input']>;
  /** 제목 · 내용 · 태그 검색. 앞뒤 공백 제거 후 2~50자(E-61 · E-63) */
  query?: InputMaybe<Scalars['String']['input']>;
  tag?: InputMaybe<Scalars['String']['input']>;
  /** [Q-12] TM-05 ⑧ '전체보기(팀 필터)'. A안이면 사용, B안이면 남겨두고 쓰지 않는다 */
  teamId?: InputMaybe<Scalars['ID']['input']>;
  /** null이면 종류 무관(관리자 · 프로필용) */
  type?: InputMaybe<PostType>;
};

/** post(id) 결과. null = 없는 글(E-53) */
export type PostLookup = DeletedPost | Post;

/** 빈 항목은 body = null → '작성되지 않음'(BD-03 ⑦) */
export type PostSection = {
  __typename?: 'PostSection';
  body: Maybe<Scalars['String']['output']>;
  key: PostSectionKey;
};

export type PostSectionInput = {
  body?: InputMaybe<Scalars['String']['input']>;
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

/** BD-01 ① 검색 시 탭별 결과 수(제안 — 목업 W-05) */
export type PostTypeCounts = {
  __typename?: 'PostTypeCounts';
  devlog: Scalars['Int']['output'];
  troubleshooting: Scalars['Int']['output'];
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
  /** 서버 시각 · 이번 주 경계 (제안). 비로그인 허용 */
  clock: ServerClock;
  /** AD-01 ②-1 ⑦ */
  deletedWarnings: DeletedWarningConnection;
  /** AD-01 ②-3 ⑥ 과거 주간 등록 · 수정 · 삭제 전 미리보기 (제안). 수정이면 periodId, 삭제면 removing: true */
  exemptionPeriodPreview: ExemptionPeriodPreview;
  /** AD-01 ②-3 ⑤ */
  exemptionPeriods: ExemptionPeriodConnection;
  /** 잔디 인정 규칙 공지(isSystem). CM-01 ⑥ · PR-01 E-39 [설정 방법] → NT-02 (제안) */
  grassRuleNotice: Maybe<Notice>;
  /** AD-01 ⑨ 주차와 무관한 미해결 보류 전체 (인수인계 5-1 명칭 유지, 제안: 지난 주차 보류가 묻히지 않게) */
  heldJudgments: Array<AdminJudgmentRow>;
  /** AD-01 ⑩ (인수인계 5-1 명칭) */
  judgmentCorrectionPreview: RecalcPreview;
  /** 본인. 토큰이 없으면 null. 승인 대기 제한 토큰으로도 조회 가능(AU-03 ④⑤) */
  me: Maybe<Me>;
  /** 없는 회원 → null(E-53) */
  member: Maybe<Member>;
  /** TM-04 */
  myInvitations: Array<ReceivedInvitation>;
  /** TM-01 참가 순서(오래된 순, 제안) · BD-04 ⑨ 셀렉트 · TM-04 이후 갱신 */
  myTeams: Array<Team>;
  /** AC-02 · CM-01 ④ */
  myWarnings: MyWarnings;
  /** AC-01 · CM-01 ②③. weekStart 생략 = 이번 주. 미래 주는 VALIDATION_FAILED */
  myWeek: WeekActivity;
  notice: Maybe<Notice>;
  /** 고정 공지가 먼저, 그다음 최신순(NT-01 ①②). CM-01 ⑦은 first: 3 */
  notices: NoticeConnection;
  /** AD-01 ②-1 ⑤ */
  penaltyTargets: Array<PenaltyTarget>;
  /** AD-01 ②-3 ⑦ 이미 판정된 주의 승인(소급) 미리보기. 소급이 아니면 null (추측) */
  personalExemptionApprovalPreview: Maybe<RecalcPreview>;
  /** AD-01 ②-3 ⑦ */
  personalExemptionRequests: PersonalExemptionRequestConnection;
  /** BD-01 ④. type 생략 = 전체 (제안: 현재 탭 기준) */
  popularTags: Array<TagCount>;
  /** BD-03 · BD-04 수정 모드 */
  post: Maybe<PostLookup>;
  /** BD-01 ① 검색 시 탭별 건수 (제안) */
  postTypeCounts: PostTypeCounts;
  /** 최신순 고정(BD-01 비고 제안). 20개씩(BD-01 ⑪ 제안) [Q-06] */
  posts: PostConnection;
  /** AD-01 ②-1 ⑧ (인수인계 5-1 명칭). E-42 · E-43 · E-59 */
  restoreWarningPreview: RecalcPreview;
  /** TM-05 · TM-06 · TM-08. 없는 팀 → null(E-53), 비소속 → FORBIDDEN(E-09), 관리자도 예외 없음 */
  team: Maybe<Team>;
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


export type QueryMyWeekArgs = {
  weekStart: InputMaybe<Scalars['Date']['input']>;
};


export type QueryNoticeArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNoticesArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
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
  first?: InputMaybe<Scalars['Int']['input']>;
  type: InputMaybe<PostType>;
};


export type QueryPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryPostTypeCountsArgs = {
  filter: PostFilter;
};


export type QueryPostsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  filter: PostFilter;
  first?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRestoreWarningPreviewArgs = {
  warningId: Scalars['ID']['input'];
};


export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
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

/** TM-04 받은 초대 한 건. 비공개 팀이어도 초대받은 당사자에게는 실명(TM-04 ①) */
export type ReceivedInvitation = {
  __typename?: 'ReceivedInvitation';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  /** [DB 공백] team_invitation에 초대한 사람 컬럼이 없다 → 조회 시점 팀장 (추측) */
  invitedBy: Member;
  team: Team;
};

export type RequestPersonalExemptionInput = {
  /** 이 팀 팀원 또는 본인(TM-08 ①) */
  memberId: Scalars['ID']['input'];
  /** 200자 이내(TM-08 ③ 제안). DB는 500자 */
  reason: Scalars['String']['input'];
  teamId: Scalars['ID']['input'];
  /** 이번 주 · 다음 주(TM-08 ② 제안) */
  weekStart: Scalars['Date']['input'];
};

/** 보류 재실행 결과 → 토스트 '{n}명 처리했어요.'(E-35) */
export type RerunResult = {
  __typename?: 'RerunResult';
  processedCount: Scalars['Int']['output'];
  rows: Array<AdminJudgmentRow>;
  stillHeldCount: Scalars['Int']['output'];
};

/** 수락이면 team이 있고 TM-05로 이동, 거절이면 null */
export type RespondInvitationPayload = {
  __typename?: 'RespondInvitationPayload';
  invitationId: Scalars['ID']['output'];
  team: Maybe<Team>;
};

/** TM-06 ③ 보낸 초대 */
export type SentInvitation = {
  __typename?: 'SentInvitation';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  invitee: Member;
};

/** 서버 기준 시각 (제안). 주차·E-27 배너·이번 주 판단을 브라우저 시계로 하지 않기 위해 둔다 */
export type ServerClock = {
  __typename?: 'ServerClock';
  currentWeekEnd: Scalars['Date']['output'];
  currentWeekStart: Scalars['Date']['output'];
  now: Scalars['DateTime']['output'];
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

/** BD-01 ④ 많이 쓰인 태그 상위 10개(제안) */
export type TagCount = {
  __typename?: 'TagCount';
  count: Scalars['Int']['output'];
  tag: Scalars['String']['output'];
};

/**
 * 팀 (DB team 1-2). 실명 객체다 — 조회자가 볼 자격이 있을 때만 이 타입으로 내려간다.
 * (내 팀 목록, 팀 현황판, 받은 초대, 공개 팀 배지, 공개 팀 글의 팀 이름)
 */
export type Team = {
  __typename?: 'Team';
  /** TM-05 ⑤⑥ 이번 주 현황표. 소속자만(E-09) */
  currentWeekBoard: TeamWeekBoard;
  /** TM-01 ⑧ 이번 주 요약. 소속자만 */
  currentWeekSummary: TeamWeekSummary;
  description: Maybe<Scalars['String']['output']>;
  /**
   * TM-08 ⑤ 개인 면제 요청 목록. 팀장만.
   * [DB 공백] personal_exemption에 team_id가 없다 → '이 팀장(requested_by)이 요청했고 대상이 지금 이 팀 소속'으로 거른다 (추측)
   */
  exemptionRequests: Array<PersonalExemptionRequest>;
  id: Scalars['ID']['output'];
  /** [Q-01] A안(재열람 가능)이면 팀장에게만 값, B안(해시 저장)이면 항상 null. 생성 직후 값은 CreateTeamPayload.inviteCode */
  inviteCode: Maybe<Scalars['String']['output']>;
  isPublic: Scalars['Boolean']['output'];
  leader: Member;
  /** TM-06 ⑧ 팀 글 · 댓글 관리. 팀장만. 삭제 버튼 없음(수정만) */
  managedContents: ContentRowConnection;
  memberCount: Scalars['Int']['output'];
  /** TM-06 ④ · TM-08 ① 팀원 목록. 소속자만 */
  members: Array<TeamMembership>;
  name: Scalars['String']['output'];
  /** TM-06 ③ 보낸 초대(대기 중). 팀장만 */
  pendingInvitations: Array<SentInvitation>;
  /** TM-05 ⑦ 이 팀에 연결된 글 최신순. 5건(제안) */
  recentPosts: Array<Post>;
  /** 조회자의 이 팀 역할. 비소속이면 null. TM-01 ⑤ · TM-05 ③④ 노출 조건 */
  viewerRole: Maybe<TeamRole>;
};


/**
 * 팀 (DB team 1-2). 실명 객체다 — 조회자가 볼 자격이 있을 때만 이 타입으로 내려간다.
 * (내 팀 목록, 팀 현황판, 받은 초대, 공개 팀 배지, 공개 팀 글의 팀 이름)
 */
export type TeamManagedContentsArgs = {
  after: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * 팀 (DB team 1-2). 실명 객체다 — 조회자가 볼 자격이 있을 때만 이 타입으로 내려간다.
 * (내 팀 목록, 팀 현황판, 받은 초대, 공개 팀 배지, 공개 팀 글의 팀 이름)
 */
export type TeamRecentPostsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
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

export type TeamMembership = {
  __typename?: 'TeamMembership';
  joinedAt: Scalars['DateTime']['output'];
  member: Member;
  role: TeamRole;
};

/** 팀 단위 역할. 권한 판정은 항상 (회원, 팀) 쌍이다(화면설계서 5-2-1) */
export type TeamRole =
  | 'LEADER'
  | 'MEMBER';

/** TM-05 ⑤ 이번 주 현황표 */
export type TeamWeekBoard = {
  __typename?: 'TeamWeekBoard';
  /** '인증일은 오늘 오전 6시 기준이에요'(TM-05 ⑤, 5-2-6) */
  grassUpdatedAt: Maybe<Scalars['DateTime']['output']>;
  rows: Array<TeamWeekRow>;
  weekEnd: Scalars['Date']['output'];
  weekStart: Scalars['Date']['output'];
};

/**
 * TM-05 ⑥ 팀원 행.
 * 누적 경고 · 벌칙 대상 여부는 넣지 않는다 — 다른 팀 경고가 새어나간다(기능명세서 2장, 확정)
 */
export type TeamWeekRow = {
  __typename?: 'TeamWeekRow';
  days: Array<DayActivity>;
  grassStatus: GrassFetchStatus;
  /** 본인 행 배경 강조, '나' 표시(목업 W-09) */
  isViewer: Scalars['Boolean']['output'];
  member: Member;
  recordCount: Scalars['Int']['output'];
  status: LiveWeekStatus;
  /** 이 팀 카테고리가 붙은 살아 있는 경고만 센다(기능명세서 2장, DB 1-10 warning_team) */
  teamWarningCount: Scalars['Int']['output'];
  /** E-32 잔디 미조회면 null → '—' */
  verifiedDays: Maybe<Scalars['Int']['output']>;
};

/**
 * TM-01 ⑧ '이번 주 통과 n명 · 미달 n명 · 아직 n명'
 * [충돌] TM-05 비고는 '미달은 판정 확정 뒤에만' → 진행 중인 주에는 failCount가 항상 0이다(목업 W-08도 0명)
 */
export type TeamWeekSummary = {
  __typename?: 'TeamWeekSummary';
  excludedCount: Scalars['Int']['output'];
  failCount: Scalars['Int']['output'];
  notYetCount: Scalars['Int']['output'];
  passCount: Scalars['Int']['output'];
};

/**
 * 글 수정. 종류는 바꿀 수 없다(BD-04 ② 제안).
 * 전체 치환(필드 전부 보냄) 방식 (제안) — 'teamId 생략'과 'teamId: null(연결 해제)'을 헷갈리지 않기 위해.
 * 팀장이 남의 글을 수정할 때 teamId는 서버가 무시한다(BD-04 비고: ②⑨ 비활성).
 */
export type UpdatePostInput = {
  commitUrls: Array<Scalars['String']['input']>;
  sections: Array<PostSectionInput>;
  tags: Array<Scalars['String']['input']>;
  teamId?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

/**
 * DB warning.delete_reason (1-9).
 * [충돌] FC-04는 정정·소급 면제로 '회수'된 경고를 사유를 구분해 저장한다고 적었으나 DB에는 이 두 값뿐이다.
 * 회수를 소프트 삭제로 남긴다면 RETRACTED 같은 값이 필요하다 (제안 — 계약서 9장 C-03)
 */
export type WarningDeleteReason =
  | 'KICKED'
  | 'TEAM_DELETED';

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
