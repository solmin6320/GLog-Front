/**
 * Apollo 클라이언트 (설계서 3-1 · 3-2).
 * 링크: errorLink → authLink → httpLink. 캐시: id 정규화 + 값 객체(keyFields: false) + 커서 목록(nodesConnection).
 */
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import type { TypePolicies } from '@apollo/client';
import { graphqlUrl } from '@/shared/config/env';
import { createAuthLink, createErrorLink } from './links';
import { nodesConnection } from './pagination';

/** id가 없는 값 객체 — 부모에 묻힌다. 같은 자리에 새 값이 오면 통째로 바꾼다 */
const VALUE_OBJECTS = [
  'TeamLabel', // 마스킹 표기. 실명 Team과 섞이지 않게 (요구사항 6-3)
  'AdminTeamLabel',
  'DayActivity',
  'WeekActivity', // weekStart로 묶으면 다른 회원의 주가 섞인다 (설계서 3-2)
  'LiveWeekState',
  'RecalcPreview',
  'ExemptionPeriodPreview',
  'TeamWeekRow',
  'PostSection',
  'CategoryWarningCount',
  'TagCount',
] as const;

/** id가 없지만 부모 필드 하나에 하나뿐인 집계 — 다른 쿼리가 다른 필드를 골라 와도 합친다 */
const MERGED_VALUE_OBJECTS = [
  'AdminDashboardSummary',
  'AdminJudgmentWeek',
  'JudgmentCounts',
  'MyWarnings',
  'WarningState',
  'GrassCalendar',
  'TeamWeekSummary',
  'TeamWeekBoard',
  'ServerClock',
  'PostTypeCounts',
] as const;

export function createTypePolicies(): TypePolicies {
  const policies: TypePolicies = {
    Me: { keyFields: [] }, // 싱글턴 Me:{} — Member:{id}와 다른 객체
    Query: {
      fields: {
        posts: nodesConnection(['filter', 'first']),
        notices: nodesConnection(['first']),
        adminMembers: nodesConnection(['filter', 'search', 'first']),
        adminContents: nodesConnection(['filter', 'search', 'first']),
        deletedWarnings: nodesConnection(['first']),
        exemptionPeriods: nodesConnection(['first']),
        personalExemptionRequests: nodesConnection(['status', 'first']),
      },
    },
    Member: { fields: { judgmentHistory: nodesConnection(['first']) } },
    Team: { fields: { managedContents: nodesConnection(['first']) } },
    Post: { fields: { comments: nodesConnection(['first']) } },
  };
  for (const t of VALUE_OBJECTS) policies[t] = { keyFields: false };
  for (const t of MERGED_VALUE_OBJECTS) policies[t] = { ...policies[t], keyFields: false, merge: true };
  policies.AdminJudgmentWeek = {
    ...policies.AdminJudgmentWeek,
    fields: { rows: nodesConnection(['filter', 'search', 'first']) },
  };
  return policies;
}

export function createCache(): InMemoryCache {
  return new InMemoryCache({
    possibleTypes: { PostLookup: ['Post', 'DeletedPost'] },
    typePolicies: createTypePolicies(),
  });
}

/**
 * 앱 · 테스트 공용 생성기. `fetch`는 테스트에서 가짜 응답을 넣을 때만 쓴다(계약서 3장 시그니처의 선택 확장).
 */
export function createApolloClient(opts: { uri?: string; fetch?: typeof fetch } = {}): ApolloClient {
  const httpLink = new HttpLink({ uri: opts.uri ?? graphqlUrl, ...(opts.fetch ? { fetch: opts.fetch } : {}) });
  return new ApolloClient({
    link: ApolloLink.from([createErrorLink(), createAuthLink(), httpLink]),
    cache: createCache(),
    defaultOptions: {
      // 조회 화면은 들어올 때마다 최신 판정을 본다. 다시 불러오는 동안 기존 데이터를 그대로 보여 준다(3-5).
      // errorPolicy는 기본값 'none' 그대로 (CM-01만 화면에서 'all').
      watchQuery: { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' },
    },
  });
}

/** 앱 싱글턴. 테스트는 createApolloClient()로 새로 만든다 */
export const apolloClient = createApolloClient();
