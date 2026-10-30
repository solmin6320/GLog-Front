/**
 * 지금 시각(ms)의 출처. 백엔드에 서버 시각 API가 없어 기본은 브라우저 시계다.
 * 목 모드는 목 기준 시각(DevToolbar · 테스트의 now)을 연결한다 — 화면은 세션 clock(useClock)만 읽는다.
 */
let source: () => number = () => Date.now();

export function nowMs(): number {
  return source();
}

export function setNowSource(fn: () => number): void {
  source = fn;
}
