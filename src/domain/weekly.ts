/**
 * 주간 표시용 산술 (요구사항 5-1 · A2 2-2 B표 · 2-4). 판정은 서버가 한다 — 여기서는 문구만 고른다.
 * 잔디를 필수 조건처럼 쓰지 않는다: "{n}일 더 인증하면"(○) / "잔디 {n}칸 더"(✕) (A2 2-6).
 */

/** 통과까지 남은 인증일 max(0, needed − v) */
export function daysLeftToPass(verifiedDays: number | null | undefined, needed = 3): number {
  return Math.max(0, needed - (verifiedDays ?? 0));
}

type LiveInput = { status: string; verifiedDaysNeeded: number; recordsNeeded: number };

/**
 * 이번 주 진행 안내 (CM-01 ③ · AC-01 ④).
 * CONDITION_MET · NOT_YET(인증일 · 기록글 부족 조합) · EXEMPT. EXCLUDED와 모르는 값은 null(③ 숨김, 배너가 대신한다).
 */
export function liveProgressText(live: LiveInput | null): string | null {
  if (!live) return null;
  switch (live.status) {
    case 'CONDITION_MET':
      return '이번 주 조건을 채웠어요. 월요일 판정에서 확정돼요.';
    case 'NOT_YET': {
      const days = Math.max(0, live.verifiedDaysNeeded);
      const records = Math.max(0, live.recordsNeeded);
      if (days > 0 && records > 0) return `아직 통과 전이에요. ${days}일 더 인증하고 기록글 ${records}개를 쓰면 통과!`;
      if (days > 0) return `아직 통과 전이에요. ${days}일 더 인증하면 통과!`;
      if (records > 0) return `기록글 ${records}개를 쓰면 통과!`;
      return '아직 통과 전이에요.';
    }
    case 'EXEMPT':
      return '이번 주는 면제예요.';
    default:
      return null;
  }
}

/** E-41 "다음 차감까지 n주 남았어요." — 서버가 null을 주면(벌칙 대상 · 경고 0) 숨긴다 */
export function deductionText(weeksUntilDeduction: number | null | undefined): string | null {
  if (weeksUntilDeduction == null || weeksUntilDeduction <= 0) return null;
  return `다음 차감까지 ${weeksUntilDeduction}주 남았어요.`;
}
