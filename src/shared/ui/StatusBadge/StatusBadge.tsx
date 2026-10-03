import { type BadgeArgs, toBadge } from '@/domain/badges';
import { Pill } from '../Pill';

/** 상태 배지 — 색 + 아이콘 + 글자. 모르는 값이면 아무것도 그리지 않는다. */
export function StatusBadge(p: BadgeArgs) {
  const b = toBadge(p);
  if (!b) return null;
  return (
    <Pill tone={b.tone} icon={b.icon}>
      {b.label}
    </Pill>
  );
}
