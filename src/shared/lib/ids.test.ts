import { isBigintId, isObjectId } from './ids';

describe('isBigintId (teamId · userId · noticeId — A1 5-5)', () => {
  it.each(['1', '9', '42', '1234567890123456789'])('양의 정수: %s', (v) => {
    expect(isBigintId(v)).toBe(true);
  });

  it.each(['0', '01', '-1', '1.5', '1e3', ' 1', '1 ', 'abc', '12345678901234567890', ''])('형식 아님: "%s"', (v) => {
    expect(isBigintId(v)).toBe(false);
  });

  it('null · undefined', () => {
    expect(isBigintId(null)).toBe(false);
    expect(isBigintId(undefined)).toBe(false);
  });
});

describe('isObjectId (postId — MongoDB ObjectId 24자리 hex)', () => {
  it.each(['65f0a1b2c3d4e5f6a7b8c9d0', '65F0A1B2C3D4E5F6A7B8C9D0', '000000000000000000000000'])('맞는 형식: %s', (v) => {
    expect(isObjectId(v)).toBe(true);
  });

  it.each(['65f0a1b2c3d4e5f6a7b8c9d', '65f0a1b2c3d4e5f6a7b8c9d0a', '65f0a1b2c3d4e5f6a7b8c9dg', '42', ''])(
    '형식 아님: "%s"',
    (v) => {
      expect(isObjectId(v)).toBe(false);
    },
  );

  it('null · undefined', () => {
    expect(isObjectId(null)).toBe(false);
    expect(isObjectId(undefined)).toBe(false);
  });
});
