/**
 * PR-01 · PR-02 문구 (화면설계서 5-1-9 · 5-1-20 · 5-4-9 · A2 7-6). 해요체 · 한 문장 40자 이내.
 * E-40 · 빈 상태 문구는 CM-01 · AC-01 · AC-02와 같은 글자 — 승격 후보(@/domain/messages).
 */
export const PROFILE_COPY = {
  myTitle: '내 프로필',
  title: '프로필',
  edit: '프로필 수정',
  adminMenu: '관리자 메뉴',
  /** ⑦ */
  grassFailed: 'GitHub 잔디를 불러오지 못했어요.', // E-32
  grassIdentity: 'GitHub 아이디가 바뀌었어요. 다시 로그인하면 잔디가 연결돼요.', // E-08
  privateContribution: 'GitHub에서 비공개 기여 표시를 켜야 잔디가 반영돼요.', // E-39
  /** ⑧⑨ */
  penalty: '벌칙을 이행해야 경고가 사라져요. 지금은 차감되지 않아요.', // E-40
  noWarning: '받은 경고가 없어요. 잘하고 있어요.', // EX-PR01-01
  /** 판정 보류가 남아 경고 수를 아직 셀 수 없을 때 (서버 onHold) */
  onHold: '판정을 확인하는 중이에요. 확인이 끝나면 경고 수를 보여 드려요.',
  privateTeam: '비공개 팀',
  deletedTeam: '삭제된 팀',
  /** ⑨ 중복 집계 안내 (기능명세서 8장 · ACC-PR01-03 문구 그대로) */
  doubleCount: '경고 1개에 여러 팀이 함께 붙을 수 있어서, 팀별 합계는 누적 경고 수와 다를 수 있어요.',
  /** ⑩ */
  noHistory: '아직 판정 기록이 없어요.', // EX-PR01-03
  historyFailed: '판정 이력을 불러오지 못했어요.',
  holdNote: '확인 중인 주는 잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.', // M-05 + E-32
  /** ⑫ */
  noPublicTeams: '공개된 소속 팀이 없어요.', // EX-PR01-02
} as const;

export const PROFILE_EDIT_COPY = {
  title: '프로필 수정',
  sub: '닉네임과 GitHub 아이디는 GitHub 계정에서 가져와요.',
  pick: '사진 바꾸기',
  pickHint: '5MB 이하의 jpg, png, webp 사진을 올릴 수 있어요.',
  reset: '기본 이미지로 되돌리기',
  save: '저장',
  saving: '저장 중...',
  cancel: '취소',
  /** E-55 */
  uploadFailed: '사진을 올리지 못했어요. 다시 시도해 주세요.',
  leaveTitle: '저장하지 않고 나갈까요?',
  leaveBody: '바꾼 사진은 저장되지 않아요.',
  leaveConfirm: '나가기',
  leaveCancel: '계속 고치기',
} as const;
