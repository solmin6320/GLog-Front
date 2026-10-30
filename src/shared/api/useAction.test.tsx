import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appError } from './errors';
import { useAction } from './useAction';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/shared/ui', () => ({ useToast: () => toast }));

describe('useAction', () => {
  beforeEach(() => {
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('성공: 결과를 돌려주고 success 문구를 토스트', async () => {
    const { result } = renderHook(() => useAction(async (n: number) => n * 2, { success: (r) => `${r}개 저장했어요.` }));
    let out: number | undefined;
    await act(async () => {
      out = await result.current.run(21);
    });
    expect(out).toBe(42);
    expect(toast.success).toHaveBeenCalledWith('42개 저장했어요.');
    expect(result.current.pending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('진행 중에는 pending', async () => {
    let resolve!: () => void;
    const { result } = renderHook(() => useAction(() => new Promise<void>((r) => (resolve = r))));
    let running!: Promise<unknown>;
    act(() => {
      running = result.current.run();
    });
    expect(result.current.pending).toBe(true);
    await act(async () => {
      resolve();
      await running;
    });
    expect(result.current.pending).toBe(false);
  });

  it('실패: 던지지 않고 messageFor 문구를 토스트 (errorOverrides 우선)', async () => {
    const { result } = renderHook(() =>
      useAction(
        async () => {
          throw appError('TEAM_ALREADY_JOINED');
        },
        { errorOverrides: { TEAM_ALREADY_JOINED: '이미 팀에 있는 회원이에요.' } },
      ),
    );
    let out: unknown = 'x';
    await act(async () => {
      out = await result.current.run();
    });
    expect(out).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith('이미 팀에 있는 회원이에요.');
    expect(result.current.error).toEqual({ code: 'TEAM_ALREADY_JOINED', category: 'validation' });
    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });

  it('onError가 true면 토스트하지 않는다 (인라인 처리)', async () => {
    const onError = vi.fn(() => true);
    const { result } = renderHook(() =>
      useAction(async () => {
        throw appError('TEAM_CODE_NOT_FOUND');
      }, { onError }),
    );
    await act(async () => {
      await result.current.run();
    });
    expect(onError).toHaveBeenCalledWith({ code: 'TEAM_CODE_NOT_FOUND', category: 'validation' });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('UNAUTHENTICATED는 토스트하지 않는다 (세션이 E-03을 한 번 띄운다)', async () => {
    const { result } = renderHook(() =>
      useAction(async () => {
        throw appError('UNAUTHENTICATED');
      }),
    );
    await act(async () => {
      await result.current.run();
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('연결 실패는 표준 네트워크 문구', async () => {
    const { result } = renderHook(() =>
      useAction(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await act(async () => {
      await result.current.run();
    });
    expect(toast.error).toHaveBeenCalledWith('인터넷 연결을 확인해 주세요.');
  });
});
