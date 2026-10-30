import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionEvents } from './sessionEvents';
import { tokenStore } from './tokenStore';

describe('tokenStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    tokenStore.clear();
  });

  it("localStorage 'glog.token'에 저장 · 읽기 · 삭제", () => {
    expect(tokenStore.get()).toBeNull();
    tokenStore.set('abc');
    expect(localStorage.getItem('glog.token')).toBe('abc');
    expect(tokenStore.get()).toBe('abc');
    tokenStore.clear();
    expect(localStorage.getItem('glog.token')).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });

  it('저장소가 막혀 있으면 메모리로 버틴다 (던지지 않는다)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => tokenStore.set('mem')).not.toThrow();
    expect(tokenStore.get()).toBe('mem');
    expect(() => tokenStore.clear()).not.toThrow();
    expect(tokenStore.get()).toBeNull();
  });
});

describe('sessionEvents', () => {
  it('on은 구독 해제 함수를 돌려주고, 한 리스너의 오류가 다른 리스너를 막지 않는다', () => {
    const a = vi.fn(() => {
      throw new Error('a');
    });
    const b = vi.fn();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const offA = sessionEvents.on('expired', a);
    const offB = sessionEvents.on('expired', b);
    sessionEvents.emit('expired');
    sessionEvents.emit('status-changed');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalled();
    offA();
    offB();
    sessionEvents.emit('expired');
    expect(b).toHaveBeenCalledTimes(1);
  });
});
