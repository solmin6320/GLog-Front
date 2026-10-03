/**
 * 세션 문서 (계약서 3장). 다른 곳에서 같은 필드를 다시 부르지 않는다.
 * Me는 캐시에서 싱글턴(Me:{})이라, 다른 쿼리가 me { hasTeam pendingInvitationCount }를 다시 받아 오면 viewer도 바뀐다.
 */
import { graphql } from '@/gql';

export const SessionQuery = graphql(`
  query SessionQuery {
    clock {
      now
      currentWeekStart
      currentWeekEnd
    }
    me {
      id
      status
      role
      hasTeam
      pendingInvitationCount
      member {
        id
        nickname
        githubLogin
        profileImageUrl
      }
    }
  }
`);

export const SessionExchangeLoginCode = graphql(`
  mutation SessionExchangeLoginCode($code: String!) {
    exchangeLoginCode(code: $code) {
      status
      accessToken
      expiresAt
    }
  }
`);

export const SessionLogout = graphql(`
  mutation SessionLogout {
    logout
  }
`);
