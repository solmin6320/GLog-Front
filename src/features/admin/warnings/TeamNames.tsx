import type { AdminTeam } from './model';
import s from './Warnings.module.css';

/**
 * 관리자 전용 팀 실명 (기능명세서 9장 — 비공개 팀도 이름 그대로). 이 탭에서만 쓴다.
 * 백엔드는 살아 있는 팀만 보내고 공개 여부는 싣지 않는다. 팀이 없으면 emptyText(삭제된 팀 등)를 흐리게.
 */
export function TeamNames({ teams, emptyText }: { teams: AdminTeam[]; emptyText: string }) {
  if (teams.length === 0) return <span className={s.muted}>{emptyText}</span>;
  return <>{teams.map((t) => t.name).join(', ')}</>;
}
