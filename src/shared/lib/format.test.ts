import {
  asOfLabel,
  formatDateTime,
  formatDateTimeMD,
  formatDotDate,
  formatFullDate,
  formatMD,
  formatMDW,
  formatMonthDay,
  formatWeekLabel,
  formatWeekRange,
  formatWeekRangeWithDay,
} from './format';

// `npm run test:tz`로 세 시간대에서 돈다. 표시는 언제나 KST 기준이어야 한다.

describe('Date 표기', () => {
  it('formatMD · formatMDW · formatMonthDay', () => {
    expect(formatMD('2026-09-28')).toBe('9/28');
    expect(formatMD('2026-01-05')).toBe('1/5');
    expect(formatMDW('2026-09-28')).toBe('9/28 월');
    expect(formatMDW('2026-10-04')).toBe('10/4 일');
    expect(formatMonthDay('2026-09-28')).toBe('9월 28일');
  });

  it('formatFullDate', () => {
    expect(formatFullDate('2026-10-01')).toBe('2026년 10월 1일 목요일');
    expect(formatFullDate('2027-01-01')).toBe('2027년 1월 1일 금요일');
  });
});

describe('주 범위', () => {
  it('월 경계 (9/28 ~ 10/4)', () => {
    expect(formatWeekRange('2026-09-28')).toBe('9/28 ~ 10/4');
    expect(formatWeekRangeWithDay('2026-09-28')).toBe('9/28 월 ~ 10/4 일');
    expect(formatWeekLabel('2026-09-28')).toBe('9월 28일 ~ 10월 4일');
  });

  it('연 경계 (12/28 ~ 1/3)', () => {
    expect(formatWeekRange('2026-12-28')).toBe('12/28 ~ 1/3');
    expect(formatWeekRangeWithDay('2026-12-28')).toBe('12/28 월 ~ 1/3 일');
    expect(formatWeekLabel('2026-12-28')).toBe('12월 28일 ~ 1월 3일');
  });

  it('윤년 2월 (2028-02-28 월 ~ 03-05 일)', () => {
    expect(formatWeekRange('2028-02-28')).toBe('2/28 ~ 3/5');
  });
});

describe('DateTime 표기 (KST)', () => {
  it('formatDateTime: 시:분 두 자리', () => {
    expect(formatDateTime('2026-09-29T14:20:00+09:00')).toBe('9/29 14:20');
    expect(formatDateTime('2026-09-29T05:20:00Z')).toBe('9/29 14:20');
    expect(formatDateTime('2026-10-01T09:05:00+09:00')).toBe('10/1 09:05');
  });

  it('UTC 자정 근처는 KST 날짜로 넘어간다', () => {
    expect(formatDateTime('2026-09-30T15:05:00Z')).toBe('10/1 00:05');
    expect(formatDateTime('2026-09-30T14:55:00Z')).toBe('9/30 23:55');
    expect(formatDateTimeMD('2026-09-30T15:00:00Z')).toBe('10/1');
  });

  it('formatDotDate: 연 경계', () => {
    expect(formatDotDate('2026-09-29T14:20:00+09:00')).toBe('2026.09.29');
    expect(formatDotDate('2026-12-31T15:00:00Z')).toBe('2027.01.01');
    expect(formatDotDate('2026-12-31T14:59:00Z')).toBe('2026.12.31');
  });
});

describe('asOfLabel (M-15 잔디 갱신 기준)', () => {
  const now = '2026-10-01T10:00:00+09:00';

  it('updatedAt이 없으면 null', () => {
    expect(asOfLabel(null, now)).toBeNull();
    expect(asOfLabel(undefined, now)).toBeNull();
    expect(asOfLabel('', now)).toBeNull();
  });

  it('오늘 · 어제 · 그 전', () => {
    expect(asOfLabel('2026-10-01T06:00:00+09:00', now)).toBe('오늘 오전 6시 기준');
    expect(asOfLabel('2026-09-30T06:00:00+09:00', now)).toBe('어제 오전 6시 기준');
    expect(asOfLabel('2026-09-29T06:00:00+09:00', now)).toBe('9/29 오전 6시 기준');
  });

  it('분이 있으면 분까지, 정오는 오후 12시 · 자정은 오전 0시', () => {
    expect(asOfLabel('2026-10-01T06:30:00+09:00', now)).toBe('오늘 오전 6시 30분 기준');
    expect(asOfLabel('2026-10-01T00:00:00+09:00', now)).toBe('오늘 오전 0시 기준');
    expect(asOfLabel('2026-09-30T12:00:00+09:00', now)).toBe('어제 오후 12시 기준');
    expect(asOfLabel('2026-09-30T13:05:00+09:00', now)).toBe('어제 오후 1시 5분 기준');
    expect(asOfLabel('2026-09-30T23:59:00+09:00', now)).toBe('어제 오후 11시 59분 기준');
  });

  it('UTC로 온 값도 KST 날짜로 비교한다 (UTC 9/30 21:00 = KST 10/1 06:00)', () => {
    expect(asOfLabel('2026-09-30T21:00:00Z', now)).toBe('오늘 오전 6시 기준');
    expect(asOfLabel('2026-09-30T14:59:00Z', now)).toBe('어제 오후 11시 59분 기준');
    expect(asOfLabel('2026-10-01T06:00:00+09:00', '2026-09-30T16:00:00Z')).toBe('오늘 오전 6시 기준');
  });

  it('연 경계에서도 어제', () => {
    expect(asOfLabel('2026-12-31T06:00:00+09:00', '2027-01-01T01:00:00+09:00')).toBe('어제 오전 6시 기준');
    expect(asOfLabel('2026-12-30T06:00:00+09:00', '2027-01-01T01:00:00+09:00')).toBe('12/30 오전 6시 기준');
  });
});
