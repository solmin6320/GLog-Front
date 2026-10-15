import { graphql } from '@/gql';

/**
 * TeamScope — 팀 기본 정보 · 내 역할을 한 번 조회한다 (요구사항 4-2).
 * 없는 팀 → team: null(E-53) · 비소속 → FORBIDDEN(E-09). 관리자도 예외 없음.
 */
export const TeamScopeQuery = graphql(`
  query TeamScopeQuery($id: ID!) {
    team(id: $id) {
      id
      name
      isPublic
      viewerRole
      memberCount
    }
  }
`);
