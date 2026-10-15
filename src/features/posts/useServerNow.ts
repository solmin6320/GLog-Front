import { useEffect, useState } from 'react';
import { kstPartsOf, weekdayIndex } from '@/shared/lib/kst';

/**
 * 서버 시각(clock.now)을 기준으로 흘러가는 지금(ms). 화면은 브라우저 시계로 날짜를 정하지 않는다 —
 * 받은 서버 시각에 그 뒤로 흐른 시간만 더한다(설계서 5장, E-27 배너 전용).
 */
export function useServerNow(serverNow: string, tickMs = 30_000): number {
  const [elapsed, setElapsed] = useState(0);
  const [anchor, setAnchor] = useState(serverNow);
  if (anchor !== serverNow) {
    setAnchor(serverNow);
    setElapsed(0);
  }
  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), tickMs);
    return () => window.clearInterval(id);
  }, [serverNow, tickMs]);
  return Date.parse(serverNow) + elapsed;
}

/** E-27: KST 일요일 23:30 이후 */
export function isSundayLate(ms: number): boolean {
  const p = kstPartsOf(ms);
  return weekdayIndex(p.date) === 6 && p.hour * 60 + p.minute >= 23 * 60 + 30;
}
