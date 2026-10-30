import { describe, expect, it } from 'vitest';
import { josa, messageFor, MSG } from './messages';

const ALL_CODES = [
  'UNAUTHENTICATED', 'ACCOUNT_PENDING', 'ACCOUNT_REJECTED', 'FORBIDDEN', 'NOT_FOUND', 'POST_DELETED',
  'AUTH_CODE_INVALID', 'VALIDATION_FAILED', 'TEAM_CODE_NOT_FOUND', 'TEAM_ALREADY_JOINED', 'TEAM_JOIN_BLOCKED',
  'INVITEE_NOT_FOUND', 'INVITEE_ALREADY_MEMBER', 'INVITATION_DUPLICATE', 'INVITATION_ALREADY_JOINED', 'TEAM_GONE',
  'TEAM_MEMBER_NOT_FOUND', 'LEADER_MUST_TRANSFER', 'LEADER_LAST_MEMBER', 'EXEMPTION_DUPLICATE', 'EXEMPTION_REQUEST_DUPLICATE',
  'JUDGMENT_NOT_CORRECTABLE', 'SYSTEM_NOTICE_UNDELETABLE', 'PREVIEW_STALE', 'RECALC_BUSY', 'INTERNAL', 'NETWORK',
];

/** 문구 규칙 (요구사항 5-4): 한 문장 40자 · 기술 용어 금지 · 해요체 */
function expectFriendly(text: string) {
  const sentences = text.split(/(?<=[.?!])\s+/);
  for (const s of sentences) expect(s.length, s).toBeLessThanOrEqual(40);
  expect(text).not.toMatch(/토큰|서버|API|401|GraphQL|token|server/i);
  expect(text).not.toMatch(/(습니다|합니다|됩니다)/);
}

describe('josa', () => {
  it.each([
    ['닉네임', '을/를', '닉네임을'],
    ['제목', '을/를', '제목을'],
    ['팀 이름', '을/를', '팀 이름을'],
    ['내용', '을/를', '내용을'],
    ['소개', '을/를', '소개를'],
    ['초대코드', '을/를', '초대코드를'],
    ['GitHub 아이디', '을/를', 'GitHub 아이디를'],
    ['팀', '이/가', '팀이'],
    ['회원', '은/는', '회원은'],
    ['사과', '과/와', '사과와'],
    ['서울', '으로/로', '서울로'], // ㄹ 받침 → 로
    ['집', '으로/로', '집으로'],
    ['학교', '으로/로', '학교로'],
    ['닉네임(별명)', '을/를', '닉네임(별명)을'],
  ] as const)('%s + %s → %s', (word, pair, expected) => {
    expect(josa(word, pair)).toBe(expected);
  });

  it.each([
    ['1', '이/가', '1이'], // 일
    ['2', '이/가', '2가'], // 이
    ['3', '을/를', '3을'], // 삼
    ['5', '은/는', '5는'], // 오
    ['10', '을/를', '10을'], // 십
    ['7', '으로/로', '7로'], // 칠 (ㄹ)
    ['6', '으로/로', '6으로'], // 육
    ['20자', '이/가', '20자가'],
  ] as const)('숫자는 한국어로 읽는다: %s + %s → %s', (word, pair, expected) => {
    expect(josa(word, pair)).toBe(expected);
  });

  it('한글 · 숫자가 아니면 뒤쪽 형태', () => {
    expect(josa('Redis', '을/를')).toBe('Redis를');
    expect(josa('', '이/가')).toBe('가');
  });
});

describe('MSG', () => {
  it('표준 문구 (요구사항 5-4)', () => {
    expect(MSG.forbidden).toBe('이 페이지에 들어올 권한이 없어요.');
    expect(MSG.notFound).toBe('찾는 내용이 없어요. 삭제됐을 수 있어요.');
    expect(MSG.server).toBe('잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.');
    expect(MSG.network).toBe('인터넷 연결을 확인해 주세요.');
    expect(MSG.expired).toBe('로그인이 만료됐어요. 다시 로그인해 주세요.');
    expect(MSG.required('닉네임')).toBe('닉네임을 입력해 주세요.');
    expect(MSG.required('소개')).toBe('소개를 입력해 주세요.');
    expect(MSG.searchTooShort).toBe('2자 이상 입력해 주세요.');
  });

  it('모든 문구가 문구 규칙을 지킨다', () => {
    for (const v of Object.values(MSG)) expectFriendly(typeof v === 'function' ? v('제목') : v);
  });
});

describe('messageFor', () => {
  it('27개 코드 모두 문구가 있고 규칙을 지킨다', () => {
    expect(ALL_CODES).toHaveLength(27);
    for (const code of ALL_CODES) {
      const text = messageFor({ code });
      expect(text, code).toBeTruthy();
      expectFriendly(text);
    }
  });

  it('A3 7-2 문구', () => {
    expect(messageFor({ code: 'AUTH_CODE_INVALID' })).toBe('로그인 정보가 만료됐어요. 처음부터 다시 해 주세요.');
    expect(messageFor({ code: 'TEAM_CODE_NOT_FOUND' })).toBe('그런 초대코드가 없어요. 다시 확인해 주세요.');
    expect(messageFor({ code: 'TEAM_JOIN_BLOCKED' })).toBe('이 팀에는 참가할 수 없어요. 팀장에게 문의해 주세요.');
    expect(messageFor({ code: 'EXEMPTION_REQUEST_DUPLICATE' })).toBe('이미 요청한 주간이에요.');
    expect(messageFor({ code: 'PREVIEW_STALE' })).toBe(MSG.previewStale);
    expect(messageFor({ code: 'NETWORK' })).toBe(MSG.network);
    expect(messageFor({ code: 'RECALC_BUSY' })).toBe(MSG.server);
    expect(messageFor({ code: 'POST_DELETED' })).toBe('삭제된 글이에요.');
  });

  it('화면별 덮어쓰기 · field별 문구 · 모르는 코드', () => {
    expect(messageFor({ code: 'TEAM_ALREADY_JOINED' }, { TEAM_ALREADY_JOINED: '이미 팀에 있는 회원이에요.' })).toBe('이미 팀에 있는 회원이에요.');
    expect(messageFor({ code: 'VALIDATION_FAILED', field: 'file.size' })).toBe('5MB 이하 이미지만 올릴 수 있어요.');
    expect(messageFor({ code: 'VALIDATION_FAILED', field: 'title' })).toBe('입력한 내용을 다시 확인해 주세요.');
    expect(messageFor({ code: 'WHAT_IS_THIS' })).toBe(MSG.server);
  });
});
