import { parseServerDateTime } from '@/shared/lib/kst';
/** EX-AD01-02 잔디 인정 규칙 공지 — [삭제] 대신 이유를 보인다 (messages SYSTEM_NOTICE_UNDELETABLE과 같은 문구) */
export const SYSTEM_NOTICE_HINT = '이 공지는 판정 기준 안내라 삭제할 수 없어요.';

/**
 * 고정 공지 먼저, 그다음 최신순 (②-4 ⑥ · 서버 notices와 같은 표시 순서).
 * 고정을 바꾸면 서버 순서를 다시 받기 전에도 바로 맨 위로 옮겨 보이게 한다.
 */
export function sortNotices<T extends { id: string; isPinned: boolean; createdAt: string }>(nodes: readonly T[]): T[] {
  return [...nodes].sort(
    (a, b) =>
      Number(b.isPinned) - Number(a.isPinned) ||
      parseServerDateTime(b.createdAt) - parseServerDateTime(a.createdAt) ||
      Number(b.id) - Number(a.id),
  );
}
