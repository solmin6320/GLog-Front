/**
 * KST 날짜 유틸 (설계서 5장).
 * - `Date` 스칼라는 'YYYY-MM-DD' 문자열 그대로 다룬다. 산술은 UTC 자정 기준이라 브라우저 시간대와 무관하다.
 * - `DateTime`은 ISO-8601(+09:00). 표시할 때만 Asia/Seoul로 포맷한다.
 * 화면은 `new Date()`로 "오늘"을 정하지 않는다. 오늘은 서버 clock에서 온다.
 */

export type DateString = string; // 'YYYY-MM-DD'
export type DateTimeString = string; // ISO-8601

const DAY_MS = 86_400_000;
export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

export function parseDate(d: DateString): number {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, day ?? 1);
}

export function toDateString(ms: number): DateString {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateString(v: unknown): v is DateString {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return toDateString(parseDate(v)) === v;
}

export function addDays(d: DateString, n: number): DateString {
  return toDateString(parseDate(d) + n * DAY_MS);
}

export function diffDays(a: DateString, b: DateString): number {
  return Math.round((parseDate(a) - parseDate(b)) / DAY_MS);
}

/** 월=0 … 일=6 */
export function weekdayIndex(d: DateString): number {
  return (new Date(parseDate(d)).getUTCDay() + 6) % 7;
}

export function weekdayLabel(d: DateString): string {
  return WEEKDAYS[weekdayIndex(d)] ?? '';
}

export function mondayOf(d: DateString): DateString {
  return addDays(d, -weekdayIndex(d));
}

export function isMonday(d: DateString): boolean {
  return weekdayIndex(d) === 0;
}

export function weekDates(weekStart: DateString): DateString[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const kstParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export type KstParts = { date: DateString; year: number; month: number; day: number; hour: number; minute: number };

export function kstPartsOf(iso: DateTimeString | number): KstParts {
  const parts = Object.fromEntries(kstParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    year,
    month,
    day,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** DateTime → KST 날짜 */
export function kstDateOf(iso: DateTimeString | number): DateString {
  return kstPartsOf(iso).date;
}

/** KST 날짜 + 시:분 → ISO(+09:00) */
export function kstIso(date: DateString, hour = 0, minute = 0): DateTimeString {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`;
}
