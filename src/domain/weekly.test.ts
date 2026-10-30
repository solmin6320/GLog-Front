import { describe, expect, it } from 'vitest';
import { daysLeftToPass, deductionText, liveProgressText } from './weekly';

describe('daysLeftToPass', () => {
  it('max(0, needed − v)', () => {
    expect(daysLeftToPass(0)).toBe(3);
    expect(daysLeftToPass(2)).toBe(1);
    expect(daysLeftToPass(3)).toBe(0);
    expect(daysLeftToPass(5)).toBe(0);
    expect(daysLeftToPass(null)).toBe(3);
    expect(daysLeftToPass(undefined, 2)).toBe(2);
  });
});

describe('liveProgressText (CM-01 ③ · AC-01 ④)', () => {
  const live = (status: string, verifiedDaysNeeded = 0, recordsNeeded = 0) => ({ status, verifiedDaysNeeded, recordsNeeded });

  it('CONDITION_MET', () => {
    expect(liveProgressText(live('CONDITION_MET'))).toBe('이번 주 조건을 채웠어요. 월요일 판정에서 확정돼요.');
  });

  it('NOT_YET — 인증일 · 기록글 부족 조합', () => {
    expect(liveProgressText(live('NOT_YET', 1, 0))).toBe('아직 통과 전이에요. 1일 더 인증하면 통과!');
    expect(liveProgressText(live('NOT_YET', 0, 1))).toBe('기록글 1개를 쓰면 통과!');
    expect(liveProgressText(live('NOT_YET', 2, 1))).toBe('아직 통과 전이에요. 2일 더 인증하고 기록글 1개를 쓰면 통과!');
  });

  it('잔디를 필수 조건처럼 말하지 않는다', () => {
    expect(liveProgressText(live('NOT_YET', 3, 1))).not.toMatch(/잔디/);
  });

  it('EXEMPT · EXCLUDED · 모르는 값 · null', () => {
    expect(liveProgressText(live('EXEMPT'))).toBe('이번 주는 면제예요.');
    expect(liveProgressText(live('EXCLUDED'))).toBeNull();
    expect(liveProgressText(live('SOMETHING_NEW'))).toBeNull();
    expect(liveProgressText(null)).toBeNull();
  });
});

describe('deductionText (E-41)', () => {
  it('n주 남았어요 · 없으면 숨김', () => {
    expect(deductionText(1)).toBe('다음 차감까지 1주 남았어요.');
    expect(deductionText(2)).toBe('다음 차감까지 2주 남았어요.');
    expect(deductionText(0)).toBeNull();
    expect(deductionText(null)).toBeNull();
    expect(deductionText(undefined)).toBeNull();
  });
});
