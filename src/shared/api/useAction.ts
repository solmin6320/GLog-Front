/**
 * 뮤테이션 · 액션 공통 처리 (설계서 3-6 · 계약서 3장).
 *   const del = useAction((id: string) => deletePost({ variables: { id } }), { success: MSG.deleted });
 *   <Button loading={del.pending} disabled={del.pending} onClick={() => del.run(post.id)} />
 * - 성공: success 문구가 있으면 토스트
 * - 실패: onError가 true를 돌려주면 끝(인라인 표시 등). 아니면 messageFor(errorOverrides)로 토스트.
 *   UNAUTHENTICATED는 링크 · 세션이 처리하므로(E-03 토스트 1번) 여기서는 토스트하지 않는다.
 * - run은 던지지 않는다. 실패하면 undefined를 돌려준다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { messageFor } from '@/domain/messages';
import { useToast } from '@/shared/ui';
import { normalizeError, type AppError, type ErrorCode } from './errors';

export type UseActionOptions<R> = {
  success?: string | ((r: R) => string);
  errorOverrides?: Partial<Record<ErrorCode, string>>;
  onError?: (e: AppError) => boolean | void;
};

export function useAction<A extends unknown[], R>(
  fn: (...a: A) => Promise<R>,
  o?: UseActionOptions<R>,
): { run: (...a: A) => Promise<R | undefined>; pending: boolean; error: AppError | null; reset(): void } {
  const toast = useToast();
  const [inflight, setInflight] = useState(0);
  const [error, setError] = useState<AppError | null>(null);

  // 최신 fn · 옵션을 쓰되 run의 정체성은 유지한다
  const latest = useRef({ fn, o });
  useEffect(() => {
    latest.current = { fn, o };
  });

  const run = useCallback(
    async (...a: A): Promise<R | undefined> => {
      const { fn: call, o: opts } = latest.current;
      setInflight((n) => n + 1);
      setError(null);
      try {
        const r = await call(...a);
        const s = opts?.success;
        if (s) toast.success(typeof s === 'function' ? s(r) : s);
        return r;
      } catch (err) {
        const e = normalizeError(err);
        setError(e);
        const handled = opts?.onError?.(e) === true;
        if (!handled && e.code !== 'UNAUTHENTICATED') toast.error(messageFor(e, opts?.errorOverrides));
        return undefined;
      } finally {
        setInflight((n) => Math.max(0, n - 1));
      }
    },
    [toast],
  );

  const reset = useCallback(() => setError(null), []);

  return { run, pending: inflight > 0, error, reset };
}
