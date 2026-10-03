/**
 * 화면 문구 (요구사항 5-4 · A3 7-2 · A2 7장). 순수 TS — 웹 · 앱이 같이 쓴다.
 * 규칙: 해요체 · 한 문장 40자 이내 · 사용자 탓 금지 · 기술 용어(토큰 · 서버 · API · 401 · GraphQL) 금지 · 이모지 금지.
 */

export type JosaPair = '을/를' | '이/가' | '은/는' | '과/와' | '으로/로';

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const JONG_RIEUL = 8; // ㄹ

/** 끝 글자의 받침: 'none' 받침 없음 · 'rieul' ㄹ 받침 · 'other' 그 밖의 받침 · null 모름 */
type Final = 'none' | 'rieul' | 'other' | null;

/** 숫자를 한국어로 읽을 때 끝소리: 0 영 · 1 일 · 2 이 · 3 삼 · 4 사 · 5 오 · 6 육 · 7 칠 · 8 팔 · 9 구 */
const DIGIT_FINAL: Final[] = ['other', 'rieul', 'none', 'other', 'none', 'none', 'other', 'rieul', 'rieul', 'none'];

function finalOfNumber(digits: string): Final {
  const n = digits.replace(/^0+(?=\d)/, '');
  const last = Number(n[n.length - 1]);
  if (last !== 0 || n === '0') return DIGIT_FINAL[last] ?? null;
  // 10 십 · 100 백 · 1000 천 · 10000 만 … 모두 받침이 있고 ㄹ은 아니다
  return 'other';
}

/** 괄호 · 따옴표 · 공백 · 마침표는 건너뛰고 읽는다 — '닉네임(별명)' → '명' */
const SKIP_TAIL = /[\s)\]}'"’”.,!?…》」』]+$/u;

function finalOf(word: string): Final {
  const w = word.replace(SKIP_TAIL, '');
  if (!w) return null;
  const digits = /(\d+)$/.exec(w);
  if (digits?.[1]) return finalOfNumber(digits[1]);
  const code = w.charCodeAt(w.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return null;
  const jong = (code - HANGUL_START) % 28;
  if (jong === 0) return 'none';
  return jong === JONG_RIEUL ? 'rieul' : 'other';
}

/**
 * 받침에 맞는 조사를 붙인 낱말을 돌려준다. josa('닉네임', '을/를') → '닉네임을'
 * 한글 · 숫자(한국어 읽기)만 판단한다. 그 밖의 글자는 뒤쪽 형태('를' · '가' · '는' · '와' · '로')를 쓴다.
 */
export function josa(word: string, pair: JosaPair): string {
  const [withFinal, withoutFinal] = pair.split('/') as [string, string];
  const f = finalOf(word);
  let particle: string;
  if (pair === '으로/로') particle = f === 'other' ? withFinal : withoutFinal;
  else particle = f === 'other' || f === 'rieul' ? withFinal : withoutFinal;
  return `${word}${particle}`;
}

export const MSG = {
  forbidden: '이 페이지에 들어올 권한이 없어요.',
  notFound: '찾는 내용이 없어요. 삭제됐을 수 있어요.',
  server: '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.',
  network: '인터넷 연결을 확인해 주세요.',
  expired: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  deletedPost: '삭제된 글이에요.',
  required: (label: string): string => `${josa(label, '을/를')} 입력해 주세요.`,
  searchTooShort: '2자 이상 입력해 주세요.',
  previewStale: '다른 변경이 먼저 반영됐어요. 바뀐 결과를 다시 확인해 주세요.',
  saved: '저장했어요.',
  deleted: '삭제했어요.',
  copied: '복사했어요.',
};

/** 코드별 기본 문구 (A3 7-2). 화면마다 다른 문구는 overrides로 덮는다 (예: ALREADY_TEAM_MEMBER의 E-16 · E-17) */
const BY_CODE: Record<string, string> = {
  UNAUTHENTICATED: MSG.expired, // E-03
  ACCOUNT_PENDING: '가입 승인을 기다리는 중이에요.', // E-01 (AU-03으로 이동)
  ACCOUNT_REJECTED: '가입이 승인되지 않았어요. 동아리 운영진에게 문의해 주세요.', // E-02
  FORBIDDEN: MSG.forbidden, // E-09
  NOT_FOUND: MSG.notFound, // E-53
  POST_DELETED: MSG.deletedPost, // E-31
  LOGIN_CODE_INVALID: '로그인 정보가 만료됐어요. 처음부터 다시 해 주세요.', // E-05 · E-06
  VALIDATION_FAILED: '입력한 내용을 다시 확인해 주세요.',
  INVITE_CODE_NOT_FOUND: '그런 초대코드가 없어요. 다시 확인해 주세요.', // E-10
  ALREADY_TEAM_MEMBER: '이미 참가한 팀이에요.', // E-11 (TM-06은 E-16, TM-04는 E-17로 덮는다)
  TEAM_JOIN_BLOCKED: '이 팀에는 참가할 수 없어요. 팀장에게 문의해 주세요.', // E-12
  INVITEE_NOT_FOUND: '그 아이디의 회원을 찾을 수 없어요. 먼저 가입해야 초대할 수 있어요.', // E-15
  TEAM_GONE: '없어진 팀이에요.', // E-18
  LEADER_MUST_TRANSFER: '팀장은 다른 팀원에게 팀장을 넘긴 뒤에 나갈 수 있어요.', // E-19
  LAST_MEMBER: '혼자 있는 팀이에요. 나가면 팀이 삭제돼요. 삭제할까요?', // E-20
  EXEMPTION_DUPLICATE: '이미 요청한 주간이에요.', // E-47
  JUDGMENT_NOT_CORRECTABLE: MSG.server, // 서버 오류 표준형 (A3 7-2)
  SYSTEM_NOTICE_UNDELETABLE: '이 공지는 판정 기준 안내라 삭제할 수 없어요.', // EX-AD01-02
  PREVIEW_STALE: MSG.previewStale,
  RECALC_BUSY: MSG.server, // E-52
  INTERNAL: MSG.server, // E-52
  NETWORK: MSG.network, // E-51
};

/** VALIDATION_FAILED의 field별 문구 — 프로필 사진 업로드(REST 413 · 415, E-56) */
const BY_FIELD: Record<string, string> = {
  'file.size': '5MB 이하 이미지만 올릴 수 있어요.',
  'file.type': 'jpg, png, webp만 올릴 수 있어요.',
};

/** 오류 → 화면 문구. 모르는 코드는 표준 서버 오류 문구 */
export function messageFor(err: { code: string; field?: string }, overrides?: Partial<Record<string, string>>): string {
  const override = overrides?.[err.code];
  if (override) return override;
  if (err.code === 'VALIDATION_FAILED' && err.field) {
    const byField = BY_FIELD[err.field];
    if (byField) return byField;
  }
  return BY_CODE[err.code] ?? MSG.server;
}
