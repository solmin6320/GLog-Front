import { formatMonthDay } from '@/shared/lib/format';
import { weekdayLabel } from '@/shared/lib/kst';

/** DayActivity 모양 그대로 */
export type StripDay = {
  date: string;
  grassLevel?: number | null;
  grassCount?: number | null;
  hasRecord: boolean;
  recordCount?: number | null;
  verified: boolean;
  isToday: boolean;
  isFuture: boolean;
};

const clampLevel = (n: number) => Math.max(0, Math.min(4, Math.round(n)));

/** 칸 색 단계. 단계를 모르는 지난 주(null)인데 잔디가 있으면 fallbackLevel(M-17). */
export function levelOf(d: StripDay, fallbackLevel: number): number {
  if (d.isFuture) return 0;
  if (d.grassLevel != null) return clampLevel(d.grassLevel);
  if ((d.grassCount ?? 0) > 0) return clampLevel(fallbackLevel);
  return 0;
}

/** "9월 29일 화요일, 잔디 1칸, 기록글 1개, 인증됨" */
export function stripDayText(d: StripDay): string {
  const date = `${formatMonthDay(d.date)} ${weekdayLabel(d.date)}요일`;
  if (d.isFuture) return `${date}, 아직 오지 않은 날`;
  const parts = [date];
  if (d.isToday) parts.push('오늘');
  if (d.grassCount != null && d.grassCount > 0) parts.push(`잔디 ${d.grassCount}칸`);
  else if (d.grassLevel != null && d.grassLevel > 0) parts.push('잔디 있음');
  else parts.push('잔디 없음');
  if (d.hasRecord) parts.push(d.recordCount ? `기록글 ${d.recordCount}개` : '기록글 있음');
  else parts.push('기록글 없음');
  parts.push(d.verified ? '인증됨' : '인증 안 됨');
  return parts.join(', ');
}
