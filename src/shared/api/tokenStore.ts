/**
 * 토큰 저장소 (FC-03 · A3 4-3). 화면은 토큰이 어디 있는지 모른다 — 세션 계층과 링크만 쓴다.
 * localStorage 'glog.token'. 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 이 탭 메모리에만 둔다.
 */
const KEY = 'glog.token';

let memory: string | null = null;
let memoryOnly = false;

export const tokenStore = {
  get(): string | null {
    if (memoryOnly) return memory;
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      memoryOnly = true;
      return memory;
    }
  },
  set(token: string): void {
    memory = token;
    try {
      window.localStorage.setItem(KEY, token);
      memoryOnly = false;
    } catch {
      memoryOnly = true;
    }
  },
  clear(): void {
    memory = null;
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // 저장소를 못 쓰면 메모리만 비운다
    }
  },
};
