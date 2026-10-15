import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Outlet, useParams } from 'react-router';
import { normalizeError } from '@/shared/api/errors';
import { isBigintId } from '@/shared/lib/ids';
import { PageContainer, PageSkeleton, type FullStateKind } from '@/shared/ui';
import { TeamScopeQuery } from './api';
import { GuardState } from './GuardState';
import { TeamScopeContext, type TeamScopeTeam, type TeamScopeValue } from './useTeamScope';

function errorKind(error: unknown): FullStateKind {
  switch (normalizeError(error).category) {
    case 'forbidden':
      return 'forbidden';
    case 'notFound':
      return 'notFound';
    case 'network':
      return 'network';
    default:
      return 'server';
  }
}

/**
 * `/teams/:teamId` 부모 (레이아웃 없음).
 * teamId 형식이 틀리면 조회 없이 404. 서버 응답으로 판정: FORBIDDEN → 403 · null/NOT_FOUND → 404 (관리자도 예외 없음).
 * 통과하면 useTeamScope()로 팀 기본 정보 · 내 역할을 하위 화면에 준다.
 */
export function TeamScope() {
  const { teamId } = useParams();
  const valid = isBigintId(teamId);
  const { data, loading, error, refetch } = useQuery(TeamScopeQuery, {
    variables: { id: teamId ?? '' },
    skip: !valid,
  });

  const raw = data?.team;
  const team = useMemo<TeamScopeTeam | null>(
    () =>
      raw && raw.id === teamId
        ? {
            id: raw.id,
            name: raw.name,
            isPublic: raw.isPublic,
            viewerRole: raw.viewerRole ?? null,
            memberCount: raw.memberCount,
          }
        : null,
    [raw, teamId],
  );
  const value = useMemo<TeamScopeValue | null>(
    () => (team ? { team, refetch: () => void refetch() } : null),
    [team, refetch],
  );

  if (!valid) return <GuardState kind="notFound" />;

  // 열람 중 추방(EX-TM05-01) 등 재조회 결과가 권한 없음 · 없음이면 이전 데이터보다 우선한다
  const errKind = error ? errorKind(error) : null;
  if (errKind === 'forbidden' || errKind === 'notFound') return <GuardState kind={errKind} />;

  if (value) {
    return (
      <TeamScopeContext.Provider value={value}>
        {/* 다른 팀으로 옮기면 하위 화면 상태를 새로 시작한다 */}
        <Outlet key={teamId} />
      </TeamScopeContext.Provider>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <PageSkeleton />
      </PageContainer>
    );
  }

  if (errKind) return <GuardState kind={errKind} onRetry={() => void refetch()} />;

  return <GuardState kind="notFound" />;
}
