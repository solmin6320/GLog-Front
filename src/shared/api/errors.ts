/**
 * 오류 정규화 (설계서 3-4 · 요구사항 6-4 · A3 7장).
 * 어떤 오류든 AppError { code, category, field? }로 바꾼다. 화면 문구는 `@/domain/messages`의 messageFor로만 얻는다.
 * 서버 `message`는 화면에 쓰지 않는다.
 */
import type { GraphQLFormattedError } from 'graphql';
import { CombinedGraphQLErrors, CombinedProtocolErrors, ServerError, ServerParseError } from '@apollo/client';

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'ACCOUNT_PENDING'
  | 'ACCOUNT_REJECTED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'POST_DELETED'
  | 'AUTH_CODE_INVALID'
  | 'VALIDATION_FAILED'
  | 'TEAM_CODE_NOT_FOUND'
  | 'TEAM_ALREADY_JOINED'
  | 'TEAM_JOIN_BLOCKED'
  | 'INVITEE_NOT_FOUND'
  | 'INVITEE_ALREADY_MEMBER'
  | 'INVITATION_DUPLICATE'
  | 'INVITATION_ALREADY_JOINED'
  | 'TEAM_GONE'
  | 'TEAM_MEMBER_NOT_FOUND'
  | 'LEADER_MUST_TRANSFER'
  | 'LEADER_LAST_MEMBER'
  | 'EXEMPTION_DUPLICATE'
  | 'EXEMPTION_REQUEST_DUPLICATE'
  | 'JUDGMENT_NOT_CORRECTABLE'
  | 'SYSTEM_NOTICE_UNDELETABLE'
  | 'PREVIEW_STALE'
  | 'RECALC_BUSY'
  | 'INTERNAL'
  | 'NETWORK';

export type ErrorCategory = 'auth' | 'status' | 'forbidden' | 'notFound' | 'validation' | 'conflict' | 'server' | 'network';

export type AppError = { code: ErrorCode; category: ErrorCategory; field?: string };

/** 코드 → 범주 (요구사항 6-4 표) */
const CATEGORY: Record<ErrorCode, ErrorCategory> = {
  UNAUTHENTICATED: 'auth',
  ACCOUNT_PENDING: 'status',
  ACCOUNT_REJECTED: 'status',
  FORBIDDEN: 'forbidden',
  TEAM_JOIN_BLOCKED: 'forbidden',
  NOT_FOUND: 'notFound',
  POST_DELETED: 'notFound',
  INVITEE_NOT_FOUND: 'notFound',
  TEAM_GONE: 'notFound',
  TEAM_MEMBER_NOT_FOUND: 'notFound',
  VALIDATION_FAILED: 'validation',
  AUTH_CODE_INVALID: 'validation',
  TEAM_CODE_NOT_FOUND: 'validation',
  TEAM_ALREADY_JOINED: 'validation',
  INVITEE_ALREADY_MEMBER: 'validation',
  INVITATION_DUPLICATE: 'validation',
  INVITATION_ALREADY_JOINED: 'validation',
  LEADER_MUST_TRANSFER: 'validation',
  LEADER_LAST_MEMBER: 'validation',
  EXEMPTION_DUPLICATE: 'validation',
  EXEMPTION_REQUEST_DUPLICATE: 'validation',
  JUDGMENT_NOT_CORRECTABLE: 'validation',
  SYSTEM_NOTICE_UNDELETABLE: 'validation',
  PREVIEW_STALE: 'conflict',
  RECALC_BUSY: 'server',
  INTERNAL: 'server',
  NETWORK: 'network',
};

/** Spring for GraphQL 기본 분류 → 도메인 코드 (extensions.code가 없거나 모를 때) */
const CLASSIFICATION: Record<string, ErrorCode> = {
  UNAUTHORIZED: 'UNAUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'VALIDATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL',
};

export function isErrorCode(v: unknown): v is ErrorCode {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CATEGORY, v);
}

export function categoryOf(code: ErrorCode): ErrorCategory {
  return CATEGORY[code];
}

/** 코드로 AppError 만들기 (rest.ts · 세션 계층용) */
export function appError(code: ErrorCode, field?: string): AppError {
  return field ? { code, category: CATEGORY[code], field } : { code, category: CATEGORY[code] };
}

export function isAppError(v: unknown): v is AppError {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isErrorCode(o.code) && typeof o.category === 'string' && (o.field === undefined || typeof o.field === 'string');
}

type Extensions = Record<string, unknown> | undefined;

/** extensions { code, classification, field } → AppError. 모르면 null */
function fromExtensions(ext: Extensions): AppError | null {
  if (!ext) return null;
  const field = typeof ext.field === 'string' ? ext.field : undefined;
  if (isErrorCode(ext.code)) return appError(ext.code, field);
  const byClass = typeof ext.classification === 'string' ? CLASSIFICATION[ext.classification] : undefined;
  if (byClass) return appError(byClass, field);
  // classification 없이 code 자리에 Spring 분류가 오는 경우
  const codeAsClass = typeof ext.code === 'string' ? CLASSIFICATION[ext.code] : undefined;
  return codeAsClass ? appError(codeAsClass, field) : null;
}

function fromGraphQLErrors(errors: ReadonlyArray<GraphQLFormattedError>): AppError {
  const first = errors[0];
  return fromExtensions(first?.extensions as Extensions) ?? appError('INTERNAL');
}

/** HTTP 오류 응답 본문(JSON)에 실린 코드 — GraphQL 오류 배열 또는 REST `{ code }` */
function fromBody(bodyText: string): AppError | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const o = parsed as Record<string, unknown>;
  if (Array.isArray(o.errors) && o.errors.length > 0) {
    const first = o.errors[0] as GraphQLFormattedError | undefined;
    const fromGql = fromExtensions(first?.extensions as Extensions);
    if (fromGql) return fromGql;
  }
  return fromExtensions(o);
}

function fromHttpStatus(status: number, bodyText: string): AppError {
  if (status === 401) return appError('UNAUTHENTICATED');
  const body = status < 500 ? fromBody(bodyText) : null;
  return body ?? appError('INTERNAL');
}

/** 브라우저 · Node가 fetch 실패에 쓰는 TypeError 문구 (Chrome · Firefox · Safari · undici · RN) */
const FETCH_FAILURE = /failed to fetch|fetch failed|networkerror|network error|load failed|network request failed/i;

function isNetworkFailure(err: unknown): boolean {
  // 코드 버그로 난 TypeError까지 '연결 확인'으로 보이지 않게 문구로 거른다
  if (err instanceof TypeError && FETCH_FAILURE.test(err.message)) return true;
  if (typeof err === 'object' && err !== null) {
    const name = (err as { name?: unknown }).name;
    if (name === 'AbortError' || name === 'TimeoutError' || name === 'NetworkError') return true;
  }
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function normalizeError(err: unknown): AppError {
  if (isAppError(err)) return err;
  if (CombinedGraphQLErrors.is(err)) return fromGraphQLErrors(err.errors);
  if (ServerError.is(err) || ServerParseError.is(err)) return fromHttpStatus(err.statusCode, err.bodyText);
  if (CombinedProtocolErrors.is(err)) return appError('INTERNAL');
  if (isNetworkFailure(err)) return appError('NETWORK');
  // graphql 오류 배열을 그대로 던진 경우 (테스트 · 수동 throw)
  if (typeof err === 'object' && err !== null && 'extensions' in err) {
    const fromExt = fromExtensions((err as { extensions?: Extensions }).extensions);
    if (fromExt) return fromExt;
  }
  return appError('INTERNAL');
}
