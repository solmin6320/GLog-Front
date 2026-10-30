/**
 * 게시판 권한 (기능명세서 2 · 3장). 백엔드에 viewerCan* 필드가 없어 세션 viewer · role과 내 팀의 isLeader로 계산한다.
 * - 수정: 작성자 본인 또는 그 글이 연결된 팀의 현재 팀장
 * - 삭제: 작성자 본인(deletePost · deleteComment) 또는 관리자(adminDeletePost · adminDeleteComment). 팀장은 못 지운다
 */
import { useIsAdmin, useViewer } from '@/session';

type MyTeam = { id: string; isLeader: boolean };

export type PostPermissions = {
  isAuthor: (authorId: string) => boolean;
  canEdit: (authorId: string) => boolean;
  canDelete: (authorId: string) => boolean;
  /** 작성자가 아니라 관리자 권한으로 지운다 */
  deletesAsAdmin: (authorId: string) => boolean;
};

export function usePostPermissions(teamId: string | null | undefined, myTeams: readonly MyTeam[]): PostPermissions {
  const viewer = useViewer();
  const isAdmin = useIsAdmin();
  const leadsTeam = !!teamId && myTeams.some((t) => t.id === teamId && t.isLeader);
  const isAuthor = (authorId: string) => authorId === viewer.id;
  return {
    isAuthor,
    canEdit: (authorId) => isAuthor(authorId) || leadsTeam,
    canDelete: (authorId) => isAuthor(authorId) || isAdmin,
    deletesAsAdmin: (authorId) => !isAuthor(authorId) && isAdmin,
  };
}

/** E-28 — 지난 주에 쓴 글. 백엔드에 판정 확정 여부(inFinalizedWeek)가 없어 작성일이 이번 주 전인지로 본다 */
export const inPastWeek = (writtenDate: string, currentWeekStart: string) => writtenDate < currentWeekStart;
