import { describe, expect, it } from 'vitest';
import { grassLevels } from './grass';

describe('grassLevels', () => {
  it('0은 0단계, 기여가 있는 날은 사분위(1~8 → 3 · 5 · 7 경계)로 1~4단계', () => {
    const days = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((count, i) => ({ date: `2026-10-0${i + 1}`, count }));
    expect(grassLevels(days).map((d) => d.level)).toEqual([0, 1, 1, 1, 2, 2, 3, 3, 4]);
  });

  it('기여가 하나도 없으면 전부 0단계', () => {
    expect(grassLevels([{ date: '2026-10-01', count: 0 }]).map((d) => d.level)).toEqual([0]);
  });
});
