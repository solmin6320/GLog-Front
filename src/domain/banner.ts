/**
 * CM-01 ⑥ 상태 배너 — 동시에 여러 조건이 참이어도 1개만 (요구사항 5-3 · A2 2-4 · ACC-HOME-05).
 * 재료(서버 값): WeekActivity.privateContributionSuspected · grassStatus · live.skipReason/status.
 * 우선순위 E-39 → E-32(· E-08) → E-36 → E-46 만 프론트가 적용한다.
 *
 * | 순위 | 예외 | 조건 | key |
 * | 1 | E-39 비공개 기여 꺼짐 | privateContributionSuspected | privateContribution (+ [설정 방법] → 잔디 인정 규칙 공지) |
 * | 2 | E-32 잔디 미조회 / E-08 아이디 변경 | grassStatus FAILED / IDENTITY_MISMATCH | grassFailed / grassIdentity |
 * | 3 | E-36 생애 첫 참가 주 | skipReason FIRST_WEEK | firstWeek |
 * | 4 | E-46 면제 주간 | liveStatus EXEMPT 또는 skipReason EXEMPTION_PERIOD · PERSONAL_EXEMPTION | exempt |
 *
 * 벌칙 대상(E-40)은 배너가 아니라 ④ 경고 카드 하단 문구다(ACC-HOME-06). 그래서 'penalty'는 고르지 않는다.
 */

export type HomeBannerInput = {
  /** 계약서 호환용. 배너 선택에 쓰지 않는다 (E-40은 ④ 카드 몫) */
  isPenaltyTarget?: boolean;
  grassStatus: 'OK' | 'FAILED' | 'IDENTITY_MISMATCH' | string;
  skipReason?: string | null;
  liveStatus?: string | null;
  privateContributionSuspected: boolean;
};

export type HomeBanner = {
  /** 'penalty'는 계약서 호환용 — pickHomeBanner는 돌려주지 않는다 */
  key: 'penalty' | 'grassFailed' | 'grassIdentity' | 'firstWeek' | 'exempt' | 'privateContribution';
  tone: 'red' | 'warn' | 'blue' | 'mute';
  text: string;
};

export const BANNER_TEXT = {
  privateContribution: 'GitHub에서 비공개 기여 표시를 켜야 잔디가 반영돼요.', // E-39
  grassFailed: '잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.', // E-32
  grassIdentity: 'GitHub 아이디가 바뀌었어요. 다시 로그인하면 잔디가 연결돼요.', // E-08
  firstWeek: '이번 주는 첫 주라 인증하지 않아도 괜찮아요.', // E-36
  exempt: '이번 주는 면제 주간이에요.', // E-46
} as const;

const EXEMPT_REASONS = new Set(['EXEMPTION_PERIOD', 'PERSONAL_EXEMPTION']);

export function pickHomeBanner(i: HomeBannerInput): HomeBanner | null {
  if (i.privateContributionSuspected) {
    return { key: 'privateContribution', tone: 'warn', text: BANNER_TEXT.privateContribution };
  }
  if (i.grassStatus === 'FAILED') return { key: 'grassFailed', tone: 'warn', text: BANNER_TEXT.grassFailed };
  if (i.grassStatus === 'IDENTITY_MISMATCH') return { key: 'grassIdentity', tone: 'warn', text: BANNER_TEXT.grassIdentity };
  if (i.skipReason === 'FIRST_WEEK') return { key: 'firstWeek', tone: 'blue', text: BANNER_TEXT.firstWeek };
  if (i.liveStatus === 'EXEMPT' || (i.skipReason != null && EXEMPT_REASONS.has(i.skipReason))) {
    return { key: 'exempt', tone: 'blue', text: BANNER_TEXT.exempt };
  }
  return null;
}
