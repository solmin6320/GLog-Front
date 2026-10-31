import { render, screen } from '@testing-library/react';
import { WeekStrip } from './WeekStrip';
import type { StripDay } from './strip';

const base = { hasRecord: false, verified: false, isToday: false, isFuture: false };
const WEEK: StripDay[] = [
  { ...base, date: '2026-09-28', grassLevel: 3, grassCount: 3, verified: true },
  { ...base, date: '2026-09-29', grassLevel: 1, grassCount: 1, hasRecord: true, recordCount: 1, verified: true },
  { ...base, date: '2026-09-30', grassLevel: 0, grassCount: 0 },
  { ...base, date: '2026-10-01', grassLevel: 0, grassCount: 0, isToday: true },
  { ...base, date: '2026-10-02', isFuture: true },
  { ...base, date: '2026-10-03', isFuture: true },
  { ...base, date: '2026-10-04', isFuture: true },
];

function squareFor(text: string) {
  const li = screen.getByText(text).closest('li, [role="listitem"]');
  const sq = li?.querySelector('.sq');
  if (!sq) throw new Error(`square not found for ${text}`);
  return sq as HTMLElement;
}

describe('WeekStrip', () => {
  it('칸마다 스크린리더 문구를 단다', () => {
    render(<WeekStrip days={WEEK} />);
    expect(screen.getByText('9월 29일 화요일, 기여 1회, 기록글 1개, 인증됨')).toBeInTheDocument();
    expect(screen.getByText('9월 30일 수요일, 기여 없음, 기록글 없음, 인증 안 됨')).toBeInTheDocument();
    expect(screen.getByText('10월 1일 목요일, 오늘, 기여 없음, 기록글 없음, 인증 안 됨')).toBeInTheDocument();
    expect(screen.getByText('10월 2일 금요일, 아직 오지 않은 날')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('오늘 · 미래 · 기록글 · 인증일 표시', () => {
    render(<WeekStrip days={WEEK} size={54} />);
    const today = squareFor('10월 1일 목요일, 오늘, 기여 없음, 기록글 없음, 인증 안 됨');
    expect(today).toHaveClass('today');
    expect(today).not.toHaveClass('future');

    const future = squareFor('10월 2일 금요일, 아직 오지 않은 날');
    expect(future).toHaveClass('future');
    expect(future.style.background).toBe('');

    const rec = squareFor('9월 29일 화요일, 기여 1회, 기록글 1개, 인증됨');
    expect(rec).toHaveClass('record');
    expect(rec.querySelector('.rc')).not.toBeNull();
    expect(rec.style.background).toBe('var(--h1)');

    const mon = squareFor('9월 28일 월요일, 기여 3회, 기록글 없음, 인증됨');
    expect(mon.querySelector('.rc')).toBeNull();
    // 인증일: 굵은 라벨 + 밑줄
    const monItem = mon.closest('li') as HTMLElement;
    expect(monItem.querySelector('.dl')).toHaveClass('on');
    expect(monItem.querySelector('.ul')).not.toHaveClass('off');
    const wedItem = squareFor('9월 30일 수요일, 기여 없음, 기록글 없음, 인증 안 됨').closest('li') as HTMLElement;
    expect(wedItem.querySelector('.ul')).toHaveClass('off');
    expect(wedItem.querySelector('.dl')).toHaveTextContent('수');
  });

  it('단계를 모르는 지난 주는 fallbackLevel로 칠한다 (M-17)', () => {
    const days: StripDay[] = [
      { ...base, date: '2026-09-21', grassLevel: null, grassCount: 2, verified: true },
      { ...base, date: '2026-09-22', grassLevel: null, grassCount: null },
    ];
    const { rerender } = render(<WeekStrip days={days} />);
    expect(squareFor('9월 21일 월요일, 기여 2회, 기록글 없음, 인증됨')).toHaveAttribute('data-level', '3');
    expect(squareFor('9월 22일 화요일, 기여 없음, 기록글 없음, 인증 안 됨')).toHaveAttribute('data-level', '0');
    rerender(<WeekStrip days={days} fallbackLevel={2} />);
    expect(squareFor('9월 21일 월요일, 기여 2회, 기록글 없음, 인증됨').style.background).toBe('var(--h2)');
  });

  it('size 12는 라벨 없는 미니 스트립', () => {
    const { container } = render(<WeekStrip days={WEEK} size={12} />);
    expect(screen.getByRole('list')).toHaveClass('mini');
    expect(container.querySelector('.dl')).toBeNull();
    expect(container.querySelector('.ul')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('legend', () => {
    render(<WeekStrip days={WEEK} legend />);
    expect(screen.getByText('잔디')).toBeInTheDocument();
    expect(screen.getByText('기록글')).toBeInTheDocument();
    expect(screen.getByText('인증일')).toBeInTheDocument();
  });

  it('showLabels=false면 요일 라벨을 숨긴다', () => {
    const { container } = render(<WeekStrip days={WEEK} showLabels={false} />);
    expect(container.querySelector('.dl')).toBeNull();
  });
});
