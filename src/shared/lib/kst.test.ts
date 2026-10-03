import {
  addDays,
  diffDays,
  isDateString,
  isMonday,
  kstDateOf,
  kstIso,
  kstPartsOf,
  mondayOf,
  parseDate,
  toDateString,
  weekDates,
  weekdayIndex,
  weekdayLabel,
  WEEKDAYS,
} from './kst';

// 이 파일은 `npm run test:tz`로 UTC · Asia/Seoul · America/Los_Angeles 세 번 돈다. 결과가 시간대와 무관해야 한다.

describe('parseDate · toDateString', () => {
  it.each(['2026-09-28', '2026-01-01', '2026-12-31', '2028-02-29', '1999-12-31'])('왕복: %s', (d) => {
    expect(toDateString(parseDate(d))).toBe(d);
  });

  it('UTC 자정 기준 ms를 돌려준다', () => {
    expect(parseDate('2026-10-01')).toBe(Date.UTC(2026, 9, 1));
  });
});

describe('isDateString', () => {
  it.each(['2026-10-01', '2028-02-29', '2026-12-31'])('맞는 날짜: %s', (d) => {
    expect(isDateString(d)).toBe(true);
  });

  it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026-00-10', '2026-1-01', '20261001', '2026-10-01T00:00', '', 'abc'])(
    '틀린 날짜: %s',
    (d) => {
      expect(isDateString(d)).toBe(false);
    },
  );

  it('문자열이 아니면 false', () => {
    expect(isDateString(null)).toBe(false);
    expect(isDateString(undefined)).toBe(false);
    expect(isDateString(20261001)).toBe(false);
  });
});

describe('addDays · diffDays', () => {
  it('월 · 연 경계를 넘는다', () => {
    expect(addDays('2026-09-28', 6)).toBe('2026-10-04');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-10-01', 0)).toBe('2026-10-01');
  });

  it('미국 서머타임 전환일에도 하루씩 간다', () => {
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
  });

  it('diffDays = a - b (일)', () => {
    expect(diffDays('2026-10-04', '2026-09-28')).toBe(6);
    expect(diffDays('2026-09-28', '2026-10-04')).toBe(-6);
    expect(diffDays('2027-01-01', '2026-12-31')).toBe(1);
    expect(diffDays('2026-10-01', '2026-10-01')).toBe(0);
  });
});

describe('요일', () => {
  it('월=0 … 일=6 (시드 주 2026-09-28 월 ~ 10-04 일)', () => {
    expect(weekDates('2026-09-28').map(weekdayIndex)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(weekDates('2026-09-28').map(weekdayLabel)).toEqual([...WEEKDAYS]);
    expect(weekdayLabel('2026-10-01')).toBe('목');
  });

  it('mondayOf: 같은 주 월요일 (일요일은 앞 월요일)', () => {
    expect(mondayOf('2026-09-28')).toBe('2026-09-28');
    expect(mondayOf('2026-10-01')).toBe('2026-09-28');
    expect(mondayOf('2026-10-04')).toBe('2026-09-28');
    expect(mondayOf('2026-10-05')).toBe('2026-10-05');
  });

  it('mondayOf: 연 경계 (2027-01-01 금 → 2026-12-28 월)', () => {
    expect(weekdayLabel('2027-01-01')).toBe('금');
    expect(mondayOf('2027-01-01')).toBe('2026-12-28');
    expect(mondayOf('2027-01-03')).toBe('2026-12-28');
    expect(mondayOf('2027-01-04')).toBe('2027-01-04');
  });

  it('isMonday', () => {
    expect(isMonday('2026-09-28')).toBe(true);
    expect(isMonday('2026-09-29')).toBe(false);
    expect(isMonday('2026-10-04')).toBe(false);
  });

  it('weekDates: 7일, 월 경계 포함', () => {
    expect(weekDates('2026-09-28')).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(weekDates('2026-12-28').at(-1)).toBe('2027-01-03');
  });
});

describe('kstPartsOf · kstDateOf', () => {
  it('+09:00 ISO는 그대로 읽는다', () => {
    expect(kstPartsOf('2026-10-01T10:00:00+09:00')).toEqual({
      date: '2026-10-01',
      year: 2026,
      month: 10,
      day: 1,
      hour: 10,
      minute: 0,
    });
  });

  it('UTC 자정 근처: UTC 15:00 = KST 다음 날 00:00', () => {
    expect(kstDateOf('2026-09-30T14:59:59Z')).toBe('2026-09-30');
    expect(kstDateOf('2026-09-30T15:00:00Z')).toBe('2026-10-01');
    expect(kstPartsOf('2026-09-30T15:00:00Z')).toMatchObject({ hour: 0, minute: 0 });
    expect(kstPartsOf('2026-09-30T14:59:00Z')).toMatchObject({ hour: 23, minute: 59 });
  });

  it('UTC 자정은 KST 오전 9시', () => {
    expect(kstPartsOf('2026-10-01T00:00:00Z')).toMatchObject({ date: '2026-10-01', hour: 9, minute: 0 });
  });

  it('다른 시간대 오프셋도 KST로 바꾼다', () => {
    // LA(-07:00) 9/30 08:30 = UTC 15:30 = KST 10/1 00:30
    expect(kstPartsOf('2026-09-30T08:30:00-07:00')).toMatchObject({ date: '2026-10-01', hour: 0, minute: 30 });
  });

  it('연 경계', () => {
    expect(kstDateOf('2026-12-31T15:00:00Z')).toBe('2027-01-01');
    expect(kstDateOf('2026-12-31T14:59:59Z')).toBe('2026-12-31');
  });

  it('ms 숫자도 받는다', () => {
    expect(kstDateOf(Date.UTC(2026, 8, 30, 15, 0))).toBe('2026-10-01');
  });

  it('일요일 23:40 (E-27 프리셋)', () => {
    const p = kstPartsOf('2026-10-04T23:40:00+09:00');
    expect(p).toMatchObject({ date: '2026-10-04', hour: 23, minute: 40 });
    expect(weekdayLabel(p.date)).toBe('일');
  });
});

describe('kstIso', () => {
  it('KST 날짜 + 시:분 → +09:00 ISO', () => {
    expect(kstIso('2026-10-01')).toBe('2026-10-01T00:00:00+09:00');
    expect(kstIso('2026-10-01', 6)).toBe('2026-10-01T06:00:00+09:00');
    expect(kstIso('2026-10-01', 23, 5)).toBe('2026-10-01T23:05:00+09:00');
  });

  it('kstDateOf · kstPartsOf와 왕복한다', () => {
    for (const d of ['2026-09-28', '2026-12-31', '2027-01-01']) {
      expect(kstDateOf(kstIso(d))).toBe(d);
      expect(kstDateOf(kstIso(d, 23, 59))).toBe(d);
      expect(kstPartsOf(kstIso(d, 6, 30))).toMatchObject({ date: d, hour: 6, minute: 30 });
    }
  });
});
