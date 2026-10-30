import type { ReactNode } from 'react';

/** 화면에는 안 보이고 스크린리더만 읽는 텍스트. global.css의 .visually-hidden을 쓴다. */
export function VisuallyHidden({ children, as: Tag = 'span' }: { children: ReactNode; as?: 'span' | 'div' | 'h2' }) {
  return <Tag className="visually-hidden">{children}</Tag>;
}
