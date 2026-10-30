/**
 * CM-01 문구 (화면설계서 5-1-3 · 5-4-9 · A2 7-4). 해요체 · 한 문장 40자 이내.
 * E-40 · 5-2-7 문구는 AC-01 · AC-02 · PR-01도 같은 글자를 쓴다 — 승격 후보(@/domain/messages).
 */
export const HOME_COPY = {
  greeting: (nickname: string) => `${nickname}님, 이번 주도 잔디 심어볼까요`,
  /** ① 팀 미소속 (제안) */
  greetingTeamless: (nickname: string) => `${nickname}님, 환영해요`,
  /** ④ 경고 0 */
  noWarning: '받은 경고가 없어요',
  /** 판정 보류가 남아 경고를 계산하지 않을 때 (백엔드 myWarningSummary.onHold) */
  warningOnHold: '확인 중인 주가 있어 경고를 계산하고 있어요.',
  /** E-40 — ④ 카드 하단 */
  penalty: '벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.',
  /** ⑨ 5-2-7 */
  teamlessTitle: '팀에 참가해야 판정이 시작돼요',
  teamlessBody: ['기록글은 지금도 쓸 수 있어요.', '처음 팀에 들어간 주는 판정하지 않아요.'],
  /** EX-CM01-01 */
  noNotices: '등록된 공지가 없어요.',
  noticesFailed: '공지를 불러오지 못했어요.',
} as const;
