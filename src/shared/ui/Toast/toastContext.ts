import { createContext, useContext } from 'react';

export type ToastApi = { success(msg: string): void; error(msg: string): void; info(msg: string): void };

export const ToastContext = createContext<ToastApi | null>(null);

/** 토스트 띄우기 — 3초, 아래 가운데, aria-live=polite. ToastProvider 안에서만 쓴다. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
