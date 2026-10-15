import type { MockClock } from './clock';
import type { MemberRow } from './db/store';

/** none = Authorization 없음 · invalid = 모르는 토큰 · valid = 회원 확인 */
export type AuthState = 'none' | 'invalid' | 'valid';

/** 목 GraphQL 실행 컨텍스트 (요청마다 새로 만든다) */
export type MockContext = {
  auth: AuthState;
  /** 토큰의 회원 (상태 무관). auth !== 'valid'면 null */
  viewer: MemberRow | null;
  clock: MockClock;
};

/** 리졸버 함수 아무거나 (parent, args, ctx, info) */
export type AnyResolver = (...args: never[]) => unknown;

/** `<area>Resolvers` 모양: { Query?: {...}, Mutation?: {...}, 타입명: {...} } */
export type Resolvers = Record<string, Record<string, AnyResolver>>;
