import { graphql } from '@/gql';

/**
 * TeamScope — 팀 기본 정보 · 내 역할을 한 번 조회한다 (요구사항 4-2).
 * 없는 팀 → NOT_FOUND · 비소속 → FORBIDDEN. 시스템 관리자는 소속과 상관없이 볼 수 있다(isLeader는 false).
 */
export const TeamScopeQuery = graphql(`
  query TeamScopeQuery($id: ID!) {
    team(id: $id) {
      id
      name
      isPublic
      isLeader
      memberCount
    }
  }
`);
