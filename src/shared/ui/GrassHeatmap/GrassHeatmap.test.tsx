import { render } from '@testing-library/react';
import { addDays } from '@/shared/lib/kst';
import { GrassHeatmap } from './GrassHeatmap';

describe('GrassHeatmap', () => {
  it('서버가 2주치만 줘도 1년(365칸)을 그리고, 받지 못한 날은 "아직 불러오지 않음"', () => {
    const days = Array.from({ length: 14 }, (_, i) => ({ date: addDays('2026-10-18', i), count: i === 13 ? 3 : 0, level: i === 13 ? 2 : 0 }));
    const { container } = render(<GrassHeatmap days={days} />);
    const cells = container.querySelectorAll('li[data-level]');
    expect(cells).toHaveLength(365);
    expect(cells[0]?.getAttribute('data-tip')).toContain('아직 불러오지 않음');
    expect(cells[364]?.getAttribute('data-tip')).toContain('기여 3건');
  });
});
