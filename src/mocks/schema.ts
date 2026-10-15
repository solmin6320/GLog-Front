/**
 * 실행 가능한 목 스키마 (ADR-03). 계약 SDL을 그대로 읽어 리졸버를 붙인다 —
 * 리졸버가 계약과 다른 모양을 돌려주면 graphql 실행기가 바로 오류를 낸다.
 *
 * makeExecutableSchema(@graphql-tools/schema) 대신 graphql의 buildSchema + 리졸버 부착을 쓴다:
 * Vitest(node)에서 @graphql-tools가 graphql CJS 빌드를, 목 코드는 ESM 빌드를 불러
 * "Cannot use GraphQLSchema from another module or realm" 오류가 난다. 동작은 같다.
 *
 * 루트 필드 접근 규칙 (가드):
 * - 공개: clock · exchangeLoginCode · logout
 * - me: 토큰 없음 → null, 잘못된 토큰 → UNAUTHENTICATED, 대기 · 거절 회원도 허용
 * - 그 밖: 토큰 없음/잘못됨 → UNAUTHENTICATED · PENDING → ACCOUNT_PENDING · REJECTED → ACCOUNT_REJECTED
 * - admin* 등 관리자 필드: MEMBER면 FORBIDDEN
 */
import sdl from '../../docs/api/schema.graphql?raw';
import {
  buildSchema,
  graphql,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
  Kind,
  type ExecutionResult,
  type GraphQLFieldResolver,
  type GraphQLSchema,
  type GraphQLTypeResolver,
  type ValueNode,
} from 'graphql';
import { isDateString } from '@/shared/lib/kst';
import { createContext } from './context';
import { gqlError } from './errors';
import { activityResolvers } from './resolvers/activity';
import { adminResolvers } from './resolvers/admin';
import { adminManageResolvers } from './resolvers/adminManage';
import { authResolvers } from './resolvers/auth';
import { commonResolvers } from './resolvers/common';
import { noticesResolvers } from './resolvers/notices';
import { postsResolvers } from './resolvers/posts';
import { profileResolvers } from './resolvers/profile';
import { teamsResolvers } from './resolvers/teams';
import type { AnyResolver, MockContext, Resolvers } from './types';

const AREAS: Record<string, Resolvers> = {
  auth: authResolvers,
  common: commonResolvers,
  activity: activityResolvers,
  teams: teamsResolvers,
  posts: postsResolvers,
  notices: noticesResolvers,
  profile: profileResolvers,
  admin: adminResolvers,
  adminManage: adminManageResolvers,
};

type Policy = 'public' | 'self' | 'active' | 'admin';

const PUBLIC_FIELDS = new Set(['Query.clock', 'Mutation.exchangeLoginCode', 'Mutation.logout']);
const SELF_FIELDS = new Set(['Query.me']);

/** admin.ts · adminManage.ts에 있는 루트 필드는 전부 관리자 전용 */
function policyOf(type: string, field: string, area: string): Policy {
  const key = `${type}.${field}`;
  if (PUBLIC_FIELDS.has(key)) return 'public';
  if (SELF_FIELDS.has(key)) return 'self';
  if (area === 'admin' || area === 'adminManage') return 'admin';
  return 'active';
}

function assertAccess(policy: Policy, ctx: MockContext): 'skip-null' | void {
  if (policy === 'public') return;
  if (ctx.auth === 'invalid') throw gqlError('UNAUTHENTICATED', { message: 'mock: invalid token' });
  if (policy === 'self') return ctx.auth === 'none' ? 'skip-null' : undefined;
  if (ctx.auth === 'none' || !ctx.viewer) throw gqlError('UNAUTHENTICATED', { message: 'mock: login required' });
  if (ctx.viewer.status === 'PENDING') throw gqlError('ACCOUNT_PENDING');
  if (ctx.viewer.status === 'REJECTED') throw gqlError('ACCOUNT_REJECTED');
  if (policy === 'admin' && ctx.viewer.role !== 'ADMIN') throw gqlError('FORBIDDEN', { message: 'mock: admin only' });
}

type ResolverFn = (parent: unknown, args: unknown, ctx: MockContext, info: unknown) => unknown;

function guarded(policy: Policy, fn: AnyResolver): ResolverFn {
  const f = fn as unknown as ResolverFn;
  return (parent, args, ctx, info) => {
    if (assertAccess(policy, ctx) === 'skip-null') return null;
    return f(parent, args, ctx, info);
  };
}

/** 영역 리졸버를 합친다. 같은 필드를 두 영역이 정의하면 바로 알린다 */
export function mergeResolvers(): Record<string, Record<string, unknown>> {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const [area, map] of Object.entries(AREAS)) {
    for (const [type, fields] of Object.entries(map)) {
      const target = (merged[type] ??= {});
      for (const [field, fn] of Object.entries(fields)) {
        if (field in target) throw new Error(`mock: ${type}.${field} is defined twice (area ${area})`);
        target[field] = type === 'Query' || type === 'Mutation' ? guarded(policyOf(type, field, area), fn) : fn;
      }
    }
  }
  return merged;
}

const dateError = () => gqlError('VALIDATION_FAILED', { message: 'mock: Date must be YYYY-MM-DD' });

/** SDL로 스키마를 만들고 리졸버 · 스칼라를 붙인다 */
function buildMockSchema(): GraphQLSchema {
  const built = buildSchema(sdl);
  for (const [typeName, fields] of Object.entries(mergeResolvers())) {
    const type = built.getType(typeName);
    for (const [field, fn] of Object.entries(fields)) {
      if (field === '__resolveType' && (isUnionType(type) || isInterfaceType(type))) {
        type.resolveType = fn as GraphQLTypeResolver<unknown, unknown>;
      } else if (isObjectType(type) && type.getFields()[field]) {
        const def = type.getFields()[field];
        if (def) def.resolve = fn as GraphQLFieldResolver<unknown, unknown>;
      } else {
        throw new Error(`mock: resolver ${typeName}.${field} is not in the SDL`);
      }
    }
  }
  // Date: 'YYYY-MM-DD'만 받는다 (잘못되면 VALIDATION_FAILED). DateTime: 문자열 그대로
  const date = built.getType('Date');
  if (isScalarType(date)) {
    date.serialize = (v: unknown) => v;
    date.parseValue = (v: unknown) => {
      if (!isDateString(v)) throw dateError();
      return v;
    };
    date.parseLiteral = (ast: ValueNode) => {
      if (ast.kind !== Kind.STRING || !isDateString(ast.value)) throw dateError();
      return ast.value;
    };
  }
  return built;
}

export const schema: GraphQLSchema = buildMockSchema();

/** 목 스키마에 연산 하나를 실행한다 (핸들러 · 테스트 공용). authorization = 'Bearer mock.<id>' 또는 null */
export function executeMock(o: {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
  authorization?: string | null;
}): Promise<ExecutionResult> {
  return graphql({
    schema,
    source: o.query,
    variableValues: o.variables ?? undefined,
    operationName: o.operationName ?? undefined,
    contextValue: createContext(o.authorization),
  });
}
