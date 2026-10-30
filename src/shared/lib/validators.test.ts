import {
  LIMITS,
  normalizeGithubLogin,
  normalizeInviteCode,
  normalizeTag,
  validateGithubLogin,
  validateInviteCode,
  validateNewTag,
  validateOptionalText,
  validateProfileImage,
  validateReason,
  validateRequiredText,
  validateSearch,
  validateTags,
  validateTeamName,
  validateTitle,
  VALIDATION_MSG,
} from './validators';

describe('validateSearch (E-61 · E-63)', () => {
  it('빈 값 · 공백만은 null (호출하는 쪽이 무동작 처리)', () => {
    expect(validateSearch('')).toBeNull();
    expect(validateSearch('   ')).toBeNull();
    expect(validateSearch(null)).toBeNull();
    expect(validateSearch(undefined)).toBeNull();
  });

  it('trim 후 1자 → "2자 이상 입력해 주세요."', () => {
    expect(validateSearch('R')).toBe('2자 이상 입력해 주세요.');
    expect(validateSearch('  R  ')).toBe('2자 이상 입력해 주세요.');
    expect(validateSearch('레')).toBe('2자 이상 입력해 주세요.');
  });

  it('2 ~ 50자 통과, 51자 이상은 "검색어는 50자까지 쓸 수 있어요."', () => {
    expect(validateSearch('Re')).toBeNull();
    expect(validateSearch('  Redis  ')).toBeNull();
    expect(validateSearch('a'.repeat(50))).toBeNull();
    expect(validateSearch(` ${'a'.repeat(50)} `)).toBeNull();
    expect(validateSearch('a'.repeat(51))).toBe('검색어는 50자까지 쓸 수 있어요.');
  });
});

describe('필수 텍스트 · 사유', () => {
  it('받침에 따라 을/를 · 은/는', () => {
    expect(validateRequiredText('제목')('')).toBe('제목을 입력해 주세요.');
    expect(validateRequiredText('사유')('  ')).toBe('사유를 입력해 주세요.');
    expect(validateRequiredText('댓글', 500)('a'.repeat(501))).toBe('댓글은 500자까지 쓸 수 있어요.');
    expect(validateRequiredText('정정 사유', 10)('a'.repeat(11))).toBe('정정 사유는 10자까지 쓸 수 있어요.');
    expect(validateRequiredText('GitHub 아이디')(null)).toBe('GitHub 아이디를 입력해 주세요.');
  });

  it('통과하면 null, 앞뒤 공백은 길이에서 뺀다', () => {
    expect(validateRequiredText('댓글', 5)('  abcde  ')).toBeNull();
    expect(validateRequiredText('댓글')('a'.repeat(10_000))).toBeNull();
  });

  it('validateReason(label, max)', () => {
    const v = validateReason('거절 사유', LIMITS.exemptionReason);
    expect(v('')).toBe('거절 사유를 입력해 주세요.');
    expect(v('가'.repeat(200))).toBeNull();
    expect(v('가'.repeat(201))).toBe('거절 사유는 200자까지 쓸 수 있어요.');
  });

  it('validateOptionalText: 비어도 통과', () => {
    const v = validateOptionalText('팀 설명', LIMITS.teamDescription);
    expect(v('')).toBeNull();
    expect(v(undefined)).toBeNull();
    expect(v('가'.repeat(100))).toBeNull();
    expect(v('가'.repeat(101))).toBe('팀 설명은 100자까지 쓸 수 있어요.');
  });
});

describe('validateTitle (BD-04 ③ · 1~60자)', () => {
  it('필수', () => {
    expect(validateTitle('')).toBe('제목을 입력해 주세요.');
    expect(validateTitle('   ')).toBe('제목을 입력해 주세요.');
  });

  it('60자까지', () => {
    expect(validateTitle('가')).toBeNull();
    expect(validateTitle('가'.repeat(60))).toBeNull();
    expect(validateTitle('가'.repeat(61))).toBe('제목은 60자까지 쓸 수 있어요.');
  });
});

describe('validateTeamName (TM-02 ① · 1~20자)', () => {
  it('필수 · 20자', () => {
    expect(validateTeamName('')).toBe('팀 이름을 입력해 주세요.');
    expect(validateTeamName('A')).toBeNull();
    expect(validateTeamName('사이드 프로젝트 A팀')).toBeNull();
    expect(validateTeamName('가'.repeat(20))).toBeNull();
    expect(validateTeamName('가'.repeat(21))).toBe('팀 이름은 20자까지 쓸 수 있어요.');
  });
});

describe('태그 (E-30 · 5개 · 개당 20자)', () => {
  it('normalizeTag: 앞뒤 공백 · 앞의 # 제거, 안쪽 공백 하나로', () => {
    expect(normalizeTag('  Redis ')).toBe('Redis');
    expect(normalizeTag('#Redis')).toBe('Redis');
    expect(normalizeTag('## Redis')).toBe('Redis');
    expect(normalizeTag('Spring   Boot')).toBe('Spring Boot');
    expect(normalizeTag('C#')).toBe('C#');
    expect(normalizeTag('#')).toBe('');
    expect(normalizeTag(null)).toBe('');
  });

  it('validateTags: 통과', () => {
    expect(validateTags([])).toBeNull();
    expect(validateTags(['Redis', 'Spring', 'C#', '트러블슈팅', 'a'.repeat(20)])).toBeNull();
  });

  it('validateTags: 6개', () => {
    expect(validateTags(['a', 'b', 'c', 'd', 'e', 'f'])).toBe('태그는 5개까지 달 수 있어요.');
  });

  it('validateTags: 21자 · 빈 태그 · # 시작 · 중복(대소문자 무시)', () => {
    expect(validateTags(['a'.repeat(21)])).toBe('태그는 20자까지 쓸 수 있어요.');
    expect(validateTags(['Redis', '  '])).toBe(VALIDATION_MSG.tagEmpty);
    expect(validateTags(['#Redis'])).toBe(VALIDATION_MSG.tagHash);
    expect(validateTags(['Redis', 'redis'])).toBe(VALIDATION_MSG.tagDuplicate);
  });

  it('validateNewTag: 하나 추가할 때', () => {
    expect(validateNewTag('', ['Redis'])).toBeNull();
    expect(validateNewTag('#Spring', ['Redis'])).toBeNull();
    expect(validateNewTag('#REDIS', ['Redis'])).toBe(VALIDATION_MSG.tagDuplicate);
    expect(validateNewTag('x', ['a', 'b', 'c', 'd', 'e'])).toBe('태그는 5개까지 달 수 있어요.');
    expect(validateNewTag('a'.repeat(21), [])).toBe('태그는 20자까지 쓸 수 있어요.');
  });
});

describe('초대코드 (TM-03 ①)', () => {
  it('normalizeInviteCode: trim + 대문자', () => {
    expect(normalizeInviteCode('  jd7k-q2ma ')).toBe('JD7K-Q2MA');
  });

  it('필수 · 영문 숫자 - · 4~20자 (제안)', () => {
    expect(validateInviteCode('')).toBe('초대코드를 입력해 주세요.');
    expect(validateInviteCode('JD7K-Q2MA')).toBeNull();
    expect(validateInviteCode('jd7k-q2ma')).toBeNull();
    expect(validateInviteCode('ABC')).toBe(VALIDATION_MSG.inviteCode);
    expect(validateInviteCode('JD7K Q2MA')).toBe(VALIDATION_MSG.inviteCode);
    expect(validateInviteCode('초대코드')).toBe(VALIDATION_MSG.inviteCode);
    expect(validateInviteCode('A'.repeat(21))).toBe(VALIDATION_MSG.inviteCode);
  });
});

describe('GitHub 아이디 (TM-06 ②)', () => {
  it('normalizeGithubLogin: 앞의 @ 제거', () => {
    expect(normalizeGithubLogin(' @handong-gwan ')).toBe('handong-gwan');
  });

  it.each(['handong-gwan', '@chulsoo-kim', 'a', 'A1', 'a'.repeat(39)])('통과: %s', (v) => {
    expect(validateGithubLogin(v)).toBeNull();
  });

  it('빈 값', () => {
    expect(validateGithubLogin('')).toBe('GitHub 아이디를 입력해 주세요.');
    expect(validateGithubLogin('@')).toBe('GitHub 아이디를 입력해 주세요.');
  });

  it.each(['-abc', 'abc-', 'a--b', 'a_b', 'a.b', '한동관', 'a b', 'a'.repeat(40)])('형식 아님: %s', (v) => {
    expect(validateGithubLogin(v)).toBe('GitHub 아이디 형식이 아니에요.');
  });
});

describe('validateProfileImage (E-56)', () => {
  const MB = 1024 * 1024;

  it('jpg · png · webp 5MB 이하 통과', () => {
    expect(validateProfileImage({ name: 'a.jpg', type: 'image/jpeg', size: 5 * MB })).toBeNull();
    expect(validateProfileImage({ name: 'a.png', type: 'image/png', size: 1 })).toBeNull();
    expect(validateProfileImage({ name: 'a.webp', type: 'image/webp', size: MB })).toBeNull();
    expect(validateProfileImage({ name: 'a.JPEG', type: '', size: MB })).toBeNull();
  });

  it('형식 · 용량 (ACC-PR02-02)', () => {
    expect(validateProfileImage({ name: 'a.gif', type: 'image/gif', size: MB })).toBe(
      'jpg, png, webp만 올릴 수 있어요.',
    );
    expect(validateProfileImage({ name: 'a.jpg', type: 'image/jpeg', size: 6 * MB })).toBe(
      '5MB 이하 이미지만 올릴 수 있어요.',
    );
  });
});
