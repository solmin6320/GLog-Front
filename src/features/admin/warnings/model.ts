/**
 * 경고 복구 · 벌칙 표시 규칙 (순수 함수 · 문구). 경고 수 · 벌칙 대상은 서버 값만 그린다.
 */
import type {
  AdminWarningsDeletedQueryQuery,
  AdminWarningsPenaltyTargetsQueryQuery,
  AdminWarningsRestorePreviewQueryQuery,
  PenaltyChange,
  WarningDeleteReason,
} from '@/gql/graphql';
import { formatDateTimeMD, formatMD } from '@/shared/lib/format';

export type PenaltyTargetRow = AdminWarningsPenaltyTargetsQueryQuery['penaltyTargets'][number];
export type DeletedWarningRow = AdminWarningsDeletedQueryQuery['deletedWarnings']['nodes'][number];
export type RestorePreview = AdminWarningsRestorePreviewQueryQuery['restoreWarningPreview'];
export type AdminTeam = PenaltyTargetRow['teams'][number];

export const DELETE_REASON_LABEL: Record<WarningDeleteReason, string> = { KICKED: '추방', TEAM_DELETED: '팀 삭제' };

export const PENALTY_CHANGE_LABEL: Record<PenaltyChange, string> = { RELEASE: '해제', ENTER: '진입', NONE: '변화 없음' };

export const COPY = {
  /** W-16 각주 */
  privateNote: '벌칙을 누구에게 통보할지 판단할 수 있도록, 이 화면에서만 비공개 팀 이름도 그대로 보여요.',
  deletedHint: '추방 · 팀 삭제로 카테고리가 모두 빠진 경고',
  retractedNote: '판정 정정이나 소급 면제로 회수된 경고는 여기에 나오지 않아요.',
  /** 5-4-9 */
  emptyPenalty: '벌칙 대상이 없어요.',
  emptyDeleted: '삭제된 경고가 없어요.',
  fulfilled: '처리했어요.',
  fulfillGone: '이미 처리됐거나 벌칙 대상이 아니에요.',
  fulfillBody: '이행 완료로 표시하면 경고가 0이 되고 벌칙 대상에서 빠져요. 되돌릴 수 없어요.',
  restored: '복구했어요.',
  restoreGone: '이미 복구됐거나 없는 경고예요.',
  /** E-42 (M-14 해요체) */
  reenter: '복구하면 이 회원은 다시 벌칙 대상이 돼요. 복구할까요?',
  /** E-43 (M-14 해요체) */
  noCategory: "연결된 팀이 없어요. 복구하면 '삭제된 팀'으로 표시돼요.",
  /** E-59 (5-4-7 문구, M-14 해요체) */
  frozen: '이미 벌칙을 이행한 주간의 경고예요. 기록만 되살리고 경고 수는 그대로 둬요.',
  deletedTeam: '삭제된 팀',
} as const;

/** 도달: 판정일(reachedAt) M/D, 없으면 그 주 월요일 (계약서 C-14 · W-16 '도달 9/28') */
export function reachedText(t: Pick<PenaltyTargetRow, 'reachedAt' | 'reachedWeekStart'>): string {
  return t.reachedAt ? formatDateTimeMD(t.reachedAt) : formatMD(t.reachedWeekStart);
}

/** 이름표로 그릴 살아 있는 팀 (삭제된 팀은 빼고 '삭제된 팀' 한 번으로) */
export function liveTeams(teams: AdminTeam[]): AdminTeam[] {
  return teams.filter((t) => !t.isDeleted);
}
