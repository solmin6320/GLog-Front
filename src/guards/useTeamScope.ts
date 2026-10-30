import { createContext, useContext } from 'react';

export type TeamScopeTeam = {
  id: string;
  name: string;
  isPublic: boolean;
  isLeader: boolean;
  memberCount: number;
};

export type TeamScopeValue = { team: TeamScopeTeam; refetch(): void };

export const TeamScopeContext = createContext<TeamScopeValue | null>(null);

/** `/teams/:teamId/**` 아래에서만. TeamScope가 팀을 받은 뒤에만 그리므로 항상 값이 있다. */
export function useTeamScope(): TeamScopeValue {
  const v = useContext(TeamScopeContext);
  if (!v) throw new Error('useTeamScope는 TeamScope 라우트 아래에서만 쓸 수 있어요.');
  return v;
}
