/**
 * 상태 배지 매핑 (계약서 2-1 · 설계서 6-1).
 * 화면은 enum 문자열을 직접 비교하지 않고 이 함수로 라벨 · 색 · 아이콘을 얻는다.
 * 색 + 아이콘 + 글자 3중 표기를 여기서 보장한다. 모르는 값은 null(배지 숨김).
 */

export type BadgeIcon = 'check' | 'x' | 'half' | 'minus' | 'ring' | 'clock' | 'alert' | 'lock' | 'file' | 'shield' | 'users';
export type BadgeTone = 'ok' | 'bad' | 'info' | 'mute' | 'warn' | 'solid' | 'dark' | 'line';
export type BadgeSpec = { tone: BadgeTone; icon: BadgeIcon | null; label: string };
export type BadgeArgs =
  | { kind: 'judgment'; status: string; skipReason?: string | null; context: 'member' | 'profile' | 'admin'; label?: string }
  | { kind: 'live'; status: string; skipReason?: string | null; label?: string }
  | { kind: 'progress' }
  | { kind: 'warning'; standing: string }
  | { kind: 'penalty' }
  | { kind: 'memberStatus'; status: string }
  | { kind: 'exemptionRequest'; status: string }
  | { kind: 'teamRole'; role: string }
  | { kind: 'visibility'; isPublic: boolean }
  | { kind: 'record'; count?: number }
  | { kind: 'notRecord' }
  | { kind: 'corrected' };

const spec = (tone: BadgeTone, icon: BadgeIcon | null, label: string): BadgeSpec => ({ tone, icon, label });

/** EXCLUDED 사유별 라벨 — 판정 · 진행 중 공용 */
function excluded(skipReason: string | null | undefined): BadgeSpec {
  if (skipReason === 'FIRST_WEEK') return spec('mute', 'minus', '첫 참가');
  if (skipReason === 'NO_TEAM') return spec('mute', 'minus', '팀 없음');
  return spec('mute', 'minus', '제외');
}

function judgment(a: Extract<BadgeArgs, { kind: 'judgment' }>): BadgeSpec | null {
  switch (a.status) {
    case 'PASS':
      return spec('ok', 'check', '통과');
    case 'FAIL':
      return spec('bad', 'x', a.context === 'profile' ? '미달 (경고)' : '미달');
    case 'EXEMPT':
      return spec('info', 'half', '면제');
    case 'EXCLUDED':
      return excluded(a.skipReason);
    case 'HOLD':
      // M-05: 회원에게는 '보류' 대신 '확인 중'
      return a.context === 'admin' ? spec('warn', 'clock', '보류') : spec('mute', 'clock', '확인 중');
    default:
      return null;
  }
}

function live(a: Extract<BadgeArgs, { kind: 'live' }>): BadgeSpec | null {
  switch (a.status) {
    case 'CONDITION_MET':
      return spec('ok', 'check', '통과');
    case 'NOT_YET':
      return spec('mute', 'ring', '아직');
    case 'EXEMPT':
      return spec('info', 'half', '면제');
    case 'EXCLUDED':
      return excluded(a.skipReason);
    default:
      return null;
  }
}

function withLabel(s: BadgeSpec | null, label: string | undefined): BadgeSpec | null {
  return s && label ? { ...s, label } : s;
}

export function toBadge(a: BadgeArgs): BadgeSpec | null {
  switch (a.kind) {
    case 'judgment':
      return withLabel(judgment(a), a.label);
    case 'live':
      return withLabel(live(a), a.label);
    case 'progress':
      return spec('mute', 'clock', '진행 중');
    case 'warning':
      if (a.standing === 'ACTIVE') return spec('warn', 'alert', '유효');
      if (a.standing === 'DEDUCTED') return spec('ok', 'check', '차감됨');
      if (a.standing === 'FULFILLED') return spec('mute', 'check', '이행 완료');
      return null;
    case 'penalty':
      return spec('solid', 'alert', '벌칙 대상');
    case 'memberStatus':
      if (a.status === 'PENDING') return spec('warn', 'clock', '승인 대기');
      if (a.status === 'ACTIVE') return spec('ok', 'check', '승인됨');
      if (a.status === 'REJECTED') return spec('bad', 'x', '거절됨');
      return null;
    case 'exemptionRequest':
      if (a.status === 'PENDING') return spec('mute', 'clock', '대기');
      if (a.status === 'APPROVED') return spec('ok', 'check', '승인');
      if (a.status === 'REJECTED') return spec('bad', 'x', '반려');
      return null;
    case 'teamRole':
      return a.role === 'LEADER' ? spec('dark', null, '팀장') : null;
    case 'visibility':
      return a.isPublic ? spec('line', null, '공개') : spec('line', 'lock', '비공개');
    case 'record':
      return spec('mute', 'file', a.count === undefined ? '기록글' : `기록글 ${a.count}개`);
    case 'notRecord':
      return spec('mute', null, '인증 미포함');
    case 'corrected':
      return spec('info', 'shield', '정정됨');
    default:
      return null;
  }
}
