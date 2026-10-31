import { notExecutedText } from './model';

describe('notExecutedText (5-4-9 판정 전 안내)', () => {
  const thisWeek = '2026-10-26';
  it('이번 주는 다음 월요일 오전에 실행', () => {
    expect(notExecutedText(thisWeek, thisWeek, '2026-10-29')).toBe('이번 주 판정은 다음 월요일 오전에 실행돼요.');
  });
  it('지난 주는 오늘이 그 판정 월요일일 때만 "오늘 오전에 실행", 화요일부터는 결과 없음', () => {
    expect(notExecutedText('2026-10-19', thisWeek, '2026-10-26')).toBe('지난 주 판정은 오늘 오전에 실행돼요.');
    expect(notExecutedText('2026-10-19', thisWeek, '2026-11-01')).toBe('이 주간의 판정 결과가 없어요.');
  });
  it('더 오래된 주는 결과 없음', () => {
    expect(notExecutedText('2026-10-12', thisWeek, '2026-10-26')).toBe('이 주간의 판정 결과가 없어요.');
  });
});
