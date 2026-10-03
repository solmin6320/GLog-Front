import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type ConfirmOptions = { title: string; body?: ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: 'danger' | 'primary' };

export type ConfirmFn = (o: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/** `if (await confirm({ title, tone: 'danger' })) …` — 확인 true · 취소/Esc/바깥 클릭 false */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
