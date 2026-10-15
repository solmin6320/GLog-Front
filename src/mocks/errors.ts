/**
 * 목 서버 오류 (설계서 8-1). Spring for GraphQL 응답 모양을 흉내 낸다:
 * errors[].extensions = { code: 도메인 코드, classification: Spring ErrorType, field?: 입력 필드 }
 */
import { GraphQLError } from 'graphql';

/** 계약서 3장 ErrorCode와 같은 목록 (목은 shared/api에 기대지 않는다) */
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'ACCOUNT_PENDING'
  | 'ACCOUNT_REJECTED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'POST_DELETED'
  | 'LOGIN_CODE_INVALID'
  | 'VALIDATION_FAILED'
  | 'INVITE_CODE_NOT_FOUND'
  | 'ALREADY_TEAM_MEMBER'
  | 'TEAM_JOIN_BLOCKED'
  | 'INVITEE_NOT_FOUND'
  | 'TEAM_GONE'
  | 'LEADER_MUST_TRANSFER'
  | 'LAST_MEMBER'
  | 'EXEMPTION_DUPLICATE'
  | 'JUDGMENT_NOT_CORRECTABLE'
  | 'SYSTEM_NOTICE_UNDELETABLE'
  | 'PREVIEW_STALE'
  | 'RECALC_BUSY'
  | 'INTERNAL'
  | 'NETWORK';

export type SpringClassification = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_ERROR';

export function classificationOf(code: ErrorCode): SpringClassification {
  switch (code) {
    case 'UNAUTHENTICATED':
      return 'UNAUTHORIZED';
    case 'ACCOUNT_PENDING':
    case 'ACCOUNT_REJECTED':
    case 'FORBIDDEN':
    case 'TEAM_JOIN_BLOCKED':
      return 'FORBIDDEN';
    case 'NOT_FOUND':
    case 'POST_DELETED':
    case 'TEAM_GONE':
      return 'NOT_FOUND';
    case 'INTERNAL':
    case 'NETWORK':
      return 'INTERNAL_ERROR';
    default:
      return 'BAD_REQUEST';
  }
}

export function gqlError(code: ErrorCode, opts: { field?: string; message?: string } = {}): GraphQLError {
  return new GraphQLError(opts.message ?? `mock: ${code}`, {
    extensions: {
      code,
      classification: classificationOf(code),
      ...(opts.field ? { field: opts.field } : {}),
    },
  });
}

/** 입력 검증 실패 단축형 */
export function invalid(field: string, message?: string): GraphQLError {
  return gqlError('VALIDATION_FAILED', { field, message: message ?? `mock: invalid ${field}` });
}
