import {
  type DateString,
  type DateTimeString,
  addDays,
  diffDays,
  kstPartsOf,
  parseDate,
  weekdayLabel,
} from './kst';

/** 9/28 */
export function formatMD(d: DateString): string {
  const dt = new Date(parseDate(d));
  return `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
}

/** 9/28 월 */
export function formatMDW(d: DateString): string {
  return `${formatMD(d)} ${weekdayLabel(d)}`;
}

/** 9월 28일 */
export function formatMonthDay(d: DateString): string {
  const dt = new Date(parseDate(d));
  return `${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일`;
}

/** 9/28 ~ 10/4 */
export function formatWeekRange(weekStart: DateString): string {
  return `${formatMD(weekStart)} ~ ${formatMD(addDays(weekStart, 6))}`;
}

/** 9/28 월 ~ 10/4 일 */
export function formatWeekRangeWithDay(weekStart: DateString): string {
  return `${formatMDW(weekStart)} ~ ${formatMDW(addDays(weekStart, 6))}`;
}

/** 9월 28일 ~ 10월 4일 */
export function formatWeekLabel(weekStart: DateString): string {
  return `${formatMonthDay(weekStart)} ~ ${formatMonthDay(addDays(weekStart, 6))}`;
}

/** 2026년 10월 1일 목요일 */
export function formatFullDate(d: DateString): string {
  const dt = new Date(parseDate(d));
  return `${dt.getUTCFullYear()}년 ${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일 ${weekdayLabel(d)}요일`;
}

/** 9/29 14:20 (KST) */
export function formatDateTime(iso: DateTimeString): string {
  const p = kstPartsOf(iso);
  return `${p.month}/${p.day} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

/** 2026.09.29 (KST) */
export function formatDotDate(iso: DateTimeString): string {
  const p = kstPartsOf(iso);
  return `${p.year}.${String(p.month).padStart(2, '0')}.${String(p.day).padStart(2, '0')}`;
}

/** 9/29 (KST) — DateTime을 월/일로 */
export function formatDateTimeMD(iso: DateTimeString): string {
  const p = kstPartsOf(iso);
  return `${p.month}/${p.day}`;
}

function hourLabel(hour: number, minute: number): string {
  const ampm = hour < 12 ? '오전' : '오후';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}시 ${minute}분`;
}

/**
 * 잔디 갱신 기준 문구 (M-15). 서버 updatedAt과 clock.now로 만든다.
 * 오늘 오전 6시 기준 / 어제 오전 6시 기준 / 9/29 오전 6시 기준
 */
export function asOfLabel(updatedAt: DateTimeString | null | undefined, now: DateTimeString): string | null {
  if (!updatedAt) return null;
  const u = kstPartsOf(updatedAt);
  const n = kstPartsOf(now);
  const gap = diffDays(n.date, u.date);
  const day = gap === 0 ? '오늘' : gap === 1 ? '어제' : formatMD(u.date);
  return `${day} ${hourLabel(u.hour, u.minute)} 기준`;
}
