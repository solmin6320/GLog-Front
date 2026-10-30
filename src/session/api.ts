/**
 * 세션 문서 (계약서 3장, 백엔드 auth.graphqls). 다른 곳에서 같은 필드를 다시 부르지 않는다.
 * 팀 유무(hasTeam)와 받은 초대 수는 백엔드 Me에 없어 SessionTeamsQuery(myTeams · receivedTeamInvitations)로 센다.
 * 두 필드는 null이 될 수 없어 대기 · 거절 회원이면 응답 data 전체가 null이 된다 — 그래서 활성 회원일 때만 따로 부른다.
 */
import { graphql } from '@/gql';

export const SessionQuery = graphql(`
  query SessionQuery {
    me {
      id
      githubLogin
      nickname
      profileImageUrl
      status
      role
    }
  }
`);

export const SessionTeamsQuery = graphql(`
  query SessionTeamsQuery {
    myTeams {
      id
    }
    receivedTeamInvitations {
      items {
        id
      }
      nextCursor
    }
  }
`);

export const SessionExchangeAuthCode = graphql(`
  mutation SessionExchangeAuthCode($code: String!) {
    exchangeAuthCode(code: $code) {
      accessToken
      expiresIn
      me {
        id
        status
      }
    }
  }
`);
