/**
 * Vitest 공통 준비 (구현 계약서 6장 · 설계서 10장).
 * - jest-dom 매처
 * - msw/node 서버(가짜 백엔드): 정의 안 된 요청은 실패시킨다(테스트가 모르는 네트워크를 타지 않게)
 * - 테스트마다 localStorage 비우고 가짜 백엔드 응답을 기본값으로 되돌린다
 * - jsdom에 없는 브라우저 API 메우기
 * 시간대는 `npm run test:tz`가 TZ 환경변수로 바꿔 가며 돌린다 — 여기서 고정하지 않는다.
 */
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { backend } from './backend';
import { server } from './server';

/* ---------- jsdom 보강 ---------- */

// ScrollRestoration · 페이지 이동 시 스크롤 — jsdom은 "Not implemented" 오류를 낸다
window.scrollTo = (() => {}) as typeof window.scrollTo;
Element.prototype.scrollTo = function scrollTo() {} as typeof Element.prototype.scrollTo;
Element.prototype.scrollIntoView = function scrollIntoView() {};

if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
if (!('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', { configurable: true, writable: true, value: NoopObserver });
}
if (!('IntersectionObserver' in window)) {
  Object.defineProperty(window, 'IntersectionObserver', { configurable: true, writable: true, value: NoopObserver });
}

/* ---------- 목 서버 ---------- */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

beforeEach(() => {
  localStorage.clear();
  // 가짜 백엔드 응답을 기본값으로 (테스트가 backend.on으로 채운다)
  backend.reset();
});

afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});

afterAll(() => server.close());
