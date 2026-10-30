import { Fragment } from 'react';
import { liveTeams, type AdminTeam } from './model';
import s from './Warnings.module.css';

/**
 * 관리자 전용 팀 실명 (기능명세서 9장 — 비공개 팀도 이름 그대로 + '(비공개)'). 이 탭에서만 쓴다.
 * 살아 있는 팀이 하나도 없으면 emptyText(삭제된 팀 등)를 흐리게.
 */
export function TeamNames({ teams, emptyText }: { teams: AdminTeam[]; emptyText: string }) {
  const live = liveTeams(teams);
  if (live.length === 0) return <span className={s.muted}>{emptyText}</span>;
  return (
    <>
      {live.map((t, i) => (
        <Fragment key={t.teamId}>
          {i > 0 ? ', ' : null}
          {t.name}
          {t.isPublic ? null : <span className={s.private}> (비공개)</span>}
        </Fragment>
      ))}
    </>
  );
}
