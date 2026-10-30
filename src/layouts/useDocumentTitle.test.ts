import { formatDocumentTitle } from './useDocumentTitle';

describe('formatDocumentTitle', () => {
  it('"{화면 이름} · 잔디로그"', () => {
    expect(formatDocumentTitle('팀 현황판')).toBe('팀 현황판 · 잔디로그');
  });

  it.each([null, undefined, '', '   '])('이름이 없으면 서비스 이름만 (%s)', (t) => {
    expect(formatDocumentTitle(t)).toBe('잔디로그');
  });
});
