/**
 * 세션 모델 (요구사항 4-1 · 계약서 3장). 화면은 status · viewer · clock만 본다.
 * 토큰이 어디 있는지, 대기 회원에게 토큰이 있는지는 세션 계층만 안다(B-01).
 */
export type SessionStatus = 'LOADING' | 'ANONYMOUS' | 'PENDING' | 'REJECTED' | 'ACTIVE';

export type Viewer = {
  /** Me.id (= Member.id) */
  id: string;
  /** Me.member.id */
  memberId: string;
  nickname: string;
  githubLogin: string;
  profileImageUrl: string | null;
  role: 'MEMBER' | 'ADMIN';
  hasTeam: boolean;
  pendingInvitationCount: number;
};

/** 서버 기준 시각 (설계서 5장). 화면은 new Date()로 오늘을 정하지 않는다 */
export type Clock = {
  /** 마지막으로 세션을 조회한 순간의 서버 시각 (ISO +09:00) */
  now: string;
  /** now의 KST 날짜 'YYYY-MM-DD' */
  today: string;
  currentWeekStart: string;
  currentWeekEnd: string;
};

export type Session = {
  status: SessionStatus;
  viewer: Viewer | null;
  clock: Clock | null;
  /** me 재조회 (AU-03 [승인됐는지 확인]). 연결 · 서버 실패면 AppError로 reject하고 status는 그대로 둔다 */
  refresh(): Promise<SessionStatus>;
  /** 일회용 code 교환 → 토큰 저장 → 캐시 비우기 → me 재조회. 같은 code는 진행 중인 교환을 같이 쓴다(StrictMode) */
  completeLogin(code: string): Promise<SessionStatus>;
  /** logout(실패해도 진행) → 토큰 삭제 → ANONYMOUS(viewer null 동시) → 캐시 비우기. 이동은 호출한 쪽 · 가드가 한다 */
  signOut(): Promise<void>;
  /** real: `${apiOrigin}/oauth2/authorization/github` · mock: `/auth/callback?code=mock-<persona>` */
  loginUrl(persona?: string): string;
};
