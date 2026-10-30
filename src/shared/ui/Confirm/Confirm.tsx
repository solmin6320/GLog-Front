import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { type ConfirmFn, type ConfirmOptions, ConfirmContext } from './confirmContext';

/** 확인 대화상자 공급자. 한 번에 하나 — 새 요청이 오면 이전 것은 false로 끝난다. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    resolver.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(o);
    });
  }, []);

  const close = (result: boolean) => {
    const r = resolver.current;
    resolver.current = null;
    setOptions(null);
    r?.(result);
  };

  useEffect(
    () => () => {
      resolver.current?.(false);
      resolver.current = null;
    },
    [],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options ? (
        <Modal
          open
          size="sm"
          title={options.title}
          onClose={() => close(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => close(false)}>
                {options.cancelLabel ?? '취소'}
              </Button>
              <Button variant={options.tone === 'danger' ? 'danger' : 'primary'} onClick={() => close(true)}>
                {options.confirmLabel ?? '확인'}
              </Button>
            </>
          }
        >
          {options.body ?? null}
        </Modal>
      ) : null}
    </ConfirmContext.Provider>
  );
}
