/**
 * 목 기준 시각 (설계서 5장 · 8-3). 서버 clock 필드와 모든 "지금" 계산이 여기서 나온다.
 * 기본 2026-10-01T10:00:00+09:00 (env.mockNow), DevToolbar 프리셋으로 바꾼다.
 */
import { addDays, kstIso, kstPartsOf, mondayOf } from '@/shared/lib/kst';
import { env } from '@/shared/config/env';
import { getMockControl } from './control';

export type MockClock = {
  /** ISO +09:00 */
  now: string;
  nowMs: number;
  /** KST 날짜 */
  today: string;
  hour: number;
  currentWeekStart: string;
  currentWeekEnd: string;
};

/** epoch ms → 'YYYY-MM-DDTHH:mm:ss+09:00' */
export function kstIsoFromMs(ms: number): string {
  const k = new Date(ms + 9 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${p(k.getUTCHours())}:${p(k.getUTCMinutes())}:${p(k.getUTCSeconds())}+09:00`;
}

export function clockAt(iso: string): MockClock {
  let ms = Date.parse(iso);
  if (Number.isNaN(ms)) ms = Date.parse(env.mockNow);
  const parts = kstPartsOf(ms);
  const currentWeekStart = mondayOf(parts.date);
  return {
    now: kstIsoFromMs(ms),
    nowMs: ms,
    today: parts.date,
    hour: parts.hour,
    currentWeekStart,
    currentWeekEnd: addDays(currentWeekStart, 6),
  };
}

/** 지금 목 시각 (요청마다 control을 다시 읽는다) */
export function currentClock(): MockClock {
  return clockAt(getMockControl().now);
}

/** 잔디 캐시 갱신 시각: 오늘 06:00 (지금이 06:00 이후) · 아니면 어제 06:00 (5-2-6) */
export function grassUpdatedAt(clock: MockClock): string {
  return kstIso(clock.hour >= 6 ? clock.today : addDays(clock.today, -1), 6, 0);
}

/** 그 주 판정 배치 실행 시각: 다음 월요일 07:00 */
export function judgmentExecutionTime(weekStart: string): string {
  return kstIso(addDays(weekStart, 7), 7, 0);
}

/** DevToolbar 시각 프리셋 — 기본 시각이 속한 주 기준 */
export function clockPresets(): { key: string; label: string; now: string }[] {
  const base = clockAt(env.mockNow);
  const mon = base.currentWeekStart;
  return [
    { key: 'default', label: '기본 (목 10:00)', now: env.mockNow },
    { key: 'sunLate', label: '일 23:40', now: kstIso(addDays(mon, 6), 23, 40) },
    { key: 'monBefore', label: '월 03:00 (판정 전)', now: kstIso(mon, 3, 0) },
    { key: 'monAfter', label: '월 09:00 (판정 후)', now: kstIso(mon, 9, 0) },
  ];
}
