/**
 * 재계산 영향 (백엔드 AdminRecalcImpact) 표시 규칙 — 판정 정정 · 소급 면제 · 경고 복구 공통.
 * onHold면 보류 주가 있어 경고 수를 비교하지 않는다(null). recordOnly면 벌칙 이행 이전 주라 기록만 바뀐다 (E-58 · E-59).
 */
export type RecalcImpact = {
  onHold: boolean;
  warningCountBefore?: number | null;
  warningCountAfter?: number | null;
  entersPenalty: boolean;
  leavesPenalty: boolean;
  recordOnly: boolean;
  affectedWeeks: number;
};

export type PenaltyChange = 'ENTER' | 'RELEASE' | 'NONE';

export const PENALTY_CHANGE_LABEL: Record<PenaltyChange, string> = { RELEASE: '해제', ENTER: '진입', NONE: '변화 없음' };

export const penaltyChangeOf = (i: Pick<RecalcImpact, 'entersPenalty' | 'leavesPenalty'>): PenaltyChange =>
  i.entersPenalty ? 'ENTER' : i.leavesPenalty ? 'RELEASE' : 'NONE';

/** 경고 수가 비교되면 'a회 → b회', 보류 주가 있으면 안내 문구 */
export function warningChangeText(i: RecalcImpact): string {
  if (i.onHold || i.warningCountBefore == null || i.warningCountAfter == null) return '확인 중인 주가 있어 경고 수는 나중에 정해져요';
  return `${i.warningCountBefore}회 → ${i.warningCountAfter}회`;
}

/** 경고 수나 벌칙 대상이 바뀌는가 */
export const changesWarnings = (i: RecalcImpact) =>
  i.entersPenalty || i.leavesPenalty || (!i.onHold && i.warningCountBefore !== i.warningCountAfter);
