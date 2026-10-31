import { skipToken, useQuery } from '@apollo/client/react';
import { NoticeDetailQuery } from '@/features/notices/api';
import { isBigintId } from '@/shared/lib/ids';
import { leafLabel } from './drawerNav';

/**
 * 경로 표시 마지막 칸 · 드로어 "지금 위치"에 쓸 화면 이름.
 * - 글쓰기 · 글 수정 · 프로필 수정: 고정 이름(leafLabel)
 * - 공지 상세: 공지 제목. 상세 화면이 받아 둔 캐시에서만 읽는다(따로 요청하지 않는다)
 * 소메뉴 아래 화면인데 이름을 아직 모르면 ''(빈 문자열) — 소메뉴를 "지금 위치"로 잘못 보이지 않게 한다.
 * 소메뉴 자체 화면이면 null.
 */
export function useLeafLabel(pathname: string): string | null {
  const noticeMatch = /^\/notices\/([^/]+)\/?$/.exec(pathname);
  const noticeId = noticeMatch?.[1] ?? null;
  const notice = useQuery(
    NoticeDetailQuery,
    noticeId && isBigintId(noticeId) ? { variables: { id: noticeId }, fetchPolicy: 'cache-only' } : skipToken,
  );
  if (noticeMatch) return notice.data?.notice?.title ?? '';
  return leafLabel(pathname);
}
