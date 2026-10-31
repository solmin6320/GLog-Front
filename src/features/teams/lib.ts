/**
 * 팀 영역 표시 도우미 (표시용 문구 · 배지만 — 판정은 서버 값 그대로).
 * POST_TYPE_LABEL · requestStatusBadge는 다른 영역에서도 쓰면 domain으로 올릴 후보다.
 */
import { toBadge, type BadgeSpec } from '@/domain/badges';

/** 글 말머리 (TM-05 ⑦ · TM-06 ⑧) */
export function postTypeLabel(type: string): string {
  if (type === 'TROUBLESHOOTING') return '트러블슈팅';
  if (type === 'DEVLOG') return '개발일지';
  return '글';
}

/**
 * TM-05 ⑥ 상태 칸 라벨 덮어쓰기. 진행 중인 주는 통과 / 아직 / 제외 세 값만 쓴다 (ACC-TM05-06 · 07).
 * 첫 참가 · 면제처럼 판정에서 빠지는 주는 사유와 상관없이 '제외'.
 */
export function boardStatusLabel(status: string): string | undefined {
  return status === 'EXCLUDED' || status === 'EXEMPT' ? '제외' : undefined;
}

/** TM-08 ⑤ 요청 상태 라벨 (A2 2-7: 대기 중 · 승인됨 · 거절됨). 색 · 아이콘은 공통 배지를 따른다 */
const REQUEST_LABEL: Record<string, string> = { PENDING: '대기 중', APPROVED: '승인됨', REJECTED: '거절됨' };

export function requestStatusBadge(status: string): BadgeSpec | null {
  const spec = toBadge({ kind: 'exemptionRequest', status });
  const label = REQUEST_LABEL[status];
  return spec && label ? { ...spec, label } : null;
}

/** 팀 확인 다이얼로그 · 안내 문구 (화면설계서 TM-05 · TM-06 · FC-05, 해요체) */
export const TEAM_COPY = {
  leaveDone: '팀에서 나왔어요.',
  joined: '팀에 참가했어요.',
  declined: '거절했어요.',
  invited: '초대를 보냈어요.',
  inviteCanceled: '초대를 취소했어요.',
  kicked: '추방했어요.',
  transferred: '팀장을 넘겼어요.',
  visibilityChanged: '공개 설정을 바꿨어요.',
  deleted: '팀을 삭제했어요.',
  requested: '요청을 보냈어요.',
  /** E-19 */
  leaderMustTransfer: '팀장은 다른 팀원에게 팀장을 넘긴 뒤에 나갈 수 있어요.',
  /** E-16 (TM-06에서 ALREADY_TEAM_MEMBER) */
  alreadyInTeam: '이미 팀에 있는 회원이에요.',
  /** E-17 (TM-04에서 ALREADY_TEAM_MEMBER) */
  alreadyJoinedInvitation: '이미 참가한 팀이에요. 초대는 정리했어요.',
  /** E-44 */
  overlapsExemptionPeriod: '이 주간은 이미 면제 기간이에요. 따로 승인하지 않아도 돼요.',
  /** TM-06 ⑧ 비고 */
  deleteAskAdmin: '삭제는 관리자에게 문의해 주세요.',
  /** 보는 사람이 관리자일 때 (관리자는 글 상세에서 바로 지운다) */
  deleteAsAdmin: '관리자라서 글 상세 화면에서 바로 삭제할 수 있어요.',
  copyFailed: '복사하지 못했어요. 직접 골라서 복사해 주세요.',
} as const;
