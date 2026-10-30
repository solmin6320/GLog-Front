import { useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { paths } from '@/shared/lib/paths';
import { GuardState } from './GuardState';
import { useTeamScope } from './useTeamScope';

/**
 * TM-06 · TM-08 부모 (TeamScope 아래). 팀 응답의 viewerRole = LEADER만 통과, 아니면 본문 403.
 * 들어올 때 팀장이었는데 지금은 아니면(팀장 위임 직후) TM-05로 replace (요구사항 4-2).
 */
export function RequireTeamLeader() {
  const { team } = useTeamScope();
  const isLeader = team.viewerRole === 'LEADER';
  const [wasLeaderOnEnter] = useState(isLeader);

  if (isLeader) return <Outlet />;
  if (wasLeaderOnEnter) return <Navigate to={paths.team(team.id)} replace />;
  return <GuardState kind="forbidden" />;
}
