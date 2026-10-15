import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { appError, isAppError, normalizeError } from './errors';

function gqlErrors(...extensions: Record<string, unknown>[]) {
  return new CombinedGraphQLErrors({ data: null, errors: extensions.map((ext) => ({ message: 'x', extensions: ext })) });
}

function serverError(status: number, bodyText = '') {
  return new ServerError(`status ${status}`, { response: new Response(bodyText, { status }), bodyText });
}

describe('normalizeError', () => {
  it('GraphQL 오류: 첫 오류의 extensions.code를 쓴다 (+ field)', () => {
    expect(normalizeError(gqlErrors({ code: 'VALIDATION_FAILED', classification: 'BAD_REQUEST', field: 'title' }, { code: 'FORBIDDEN' }))).toEqual({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      field: 'title',
    });
    expect(normalizeError(gqlErrors({ code: 'TEAM_JOIN_BLOCKED', classification: 'FORBIDDEN' }))).toEqual({
      code: 'TEAM_JOIN_BLOCKED',
      category: 'forbidden',
    });
    expect(normalizeError(gqlErrors({ code: 'PREVIEW_STALE' })).category).toBe('conflict');
    expect(normalizeError(gqlErrors({ code: 'ACCOUNT_PENDING' })).category).toBe('status');
    expect(normalizeError(gqlErrors({ code: 'POST_DELETED' })).category).toBe('notFound');
    expect(normalizeError(gqlErrors({ code: 'RECALC_BUSY' })).category).toBe('server');
  });

  it.each([
    ['UNAUTHORIZED', 'UNAUTHENTICATED', 'auth'],
    ['FORBIDDEN', 'FORBIDDEN', 'forbidden'],
    ['NOT_FOUND', 'NOT_FOUND', 'notFound'],
    ['BAD_REQUEST', 'VALIDATION_FAILED', 'validation'],
    ['INTERNAL_ERROR', 'INTERNAL', 'server'],
  ])('code가 없으면 Spring classification %s → %s', (classification, code, category) => {
    expect(normalizeError(gqlErrors({ classification }))).toEqual({ code, category });
  });

  it('모르는 code는 classification으로, 둘 다 모르면 INTERNAL(server)', () => {
    expect(normalizeError(gqlErrors({ code: 'SOMETHING_NEW', classification: 'NOT_FOUND' })).code).toBe('NOT_FOUND');
    expect(normalizeError(gqlErrors({ code: 'SOMETHING_NEW' }))).toEqual({ code: 'INTERNAL', category: 'server' });
    expect(normalizeError(gqlErrors({}))).toEqual({ code: 'INTERNAL', category: 'server' });
  });

  it('HTTP 401 → UNAUTHENTICATED · 5xx → INTERNAL · 4xx는 본문 code', () => {
    expect(normalizeError(serverError(401))).toEqual({ code: 'UNAUTHENTICATED', category: 'auth' });
    expect(normalizeError(serverError(500))).toEqual({ code: 'INTERNAL', category: 'server' });
    expect(normalizeError(serverError(502, '<html>Bad Gateway</html>'))).toEqual({ code: 'INTERNAL', category: 'server' });
    expect(normalizeError(serverError(400, JSON.stringify({ errors: [{ message: 'x', extensions: { code: 'VALIDATION_FAILED' } }] }))).code).toBe(
      'VALIDATION_FAILED',
    );
    expect(normalizeError(serverError(403, JSON.stringify({ code: 'FORBIDDEN' }))).code).toBe('FORBIDDEN');
    expect(normalizeError(serverError(404, 'not json')).code).toBe('INTERNAL');
  });

  it('200인데 JSON이 아니면(ServerParseError) INTERNAL', () => {
    const err = new ServerParseError(new SyntaxError('bad'), { response: new Response('<html>', { status: 200 }), bodyText: '<html>' });
    expect(normalizeError(err).code).toBe('INTERNAL');
  });

  it('응답 없음(fetch 실패 · 중단) → NETWORK', () => {
    expect(normalizeError(new TypeError('Failed to fetch'))).toEqual({ code: 'NETWORK', category: 'network' });
    expect(normalizeError(new TypeError('NetworkError when attempting to fetch resource.')).code).toBe('NETWORK');
    expect(normalizeError(new TypeError('Load failed')).code).toBe('NETWORK');
    expect(normalizeError(new DOMException('aborted', 'AbortError')).code).toBe('NETWORK');
  });

  it('코드 버그 TypeError는 연결 문제로 보지 않는다', () => {
    expect(normalizeError(new TypeError("Cannot read properties of undefined (reading 'fetchMore')")).code).toBe('INTERNAL');
  });

  it('모르는 값 → INTERNAL · AppError는 그대로', () => {
    expect(normalizeError('boom')).toEqual({ code: 'INTERNAL', category: 'server' });
    expect(normalizeError(undefined).code).toBe('INTERNAL');
    const e = appError('TEAM_GONE');
    expect(normalizeError(e)).toBe(e);
  });

  it('isAppError', () => {
    expect(isAppError({ code: 'NETWORK', category: 'network' })).toBe(true);
    expect(isAppError({ code: 'NOPE', category: 'network' })).toBe(false);
    expect(isAppError(new Error('x'))).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
