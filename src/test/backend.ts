/**
 * 테스트용 가짜 백엔드 (F18). 화면 테스트는 bridge 전송을 그대로 타고, 백엔드 GraphQL 요청만 여기서 받는다.
 * - 요청의 루트 필드(별칭 포함)마다 등록한 응답 함수를 부르고 { data } 로 묶어 돌려준다.
 * - 응답은 **백엔드 스키마 모양**(GLog-Backend *.graphqls)으로 준다. 화면 계약 모양으로 바꾸는 일은 bridge가 한다.
 * - 오류는 `throw backendError('TEAM_GONE')`. 하나라도 있으면 실서버처럼 { data: null, errors } 가 된다.
 *
 *   backend.on('myTeams', () => [teamFixture()]);
 *   backend.on('inviteToTeam', ({ githubLogin }) => { throw backendError('INVITEE_NOT_FOUND'); });
 *   expect(backend.calls('kickTeamMember')[0]?.args).toEqual({ teamId: '1', memberId: '2' });
 */
import { Kind, parse, valueFromASTUntyped, type FieldNode, type OperationDefinitionNode } from 'graphql';
import { http, HttpResponse } from 'msw';
import { personaByToken, type TestPersona } from './personas';

/** vars = 요청 변수 전체 (중첩 필드 인자 — 예: profile { judgmentHistory(after: $after) } — 를 읽을 때) */
export type BackendCtx = { auth: string | null; viewer: TestPersona | null; query: string; vars: Record<string, unknown> };
export type Resolver = (args: Record<string, unknown>, ctx: BackendCtx) => unknown;
export type BackendCall = { field: string; args: Record<string, unknown>; auth: string | null };

const CLASSIFICATION: Record<string, string> = {
  UNAUTHENTICATED: 'UNAUTHORIZED',
  ACCOUNT_PENDING: 'FORBIDDEN',
  ACCOUNT_REJECTED: 'FORBIDDEN',
  ACCOUNT_SUSPENDED: 'FORBIDDEN',
  FORBIDDEN: 'FORBIDDEN',
  TEAM_JOIN_BLOCKED: 'FORBIDDEN',
  SYSTEM_NOTICE_UNDELETABLE: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  POST_DELETED: 'NOT_FOUND',
  INVITEE_NOT_FOUND: 'NOT_FOUND',
  TEAM_GONE: 'NOT_FOUND',
  TEAM_MEMBER_NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/** 실서버가 함께 보내는 사용자 문구 (GLog-Backend common/exception/ErrorCode.java 그대로) */
const SERVER_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "로그인이 만료됐어요. 다시 로그인해 주세요.",
  ACCOUNT_PENDING: "가입 승인을 기다리는 중이에요. 승인되면 바로 이용할 수 있어요.",
  ACCOUNT_REJECTED: "가입이 승인되지 않았어요. 동아리 운영진에게 문의해 주세요.",
  ACCOUNT_SUSPENDED: "이용이 정지된 계정이에요. 동아리 운영진에게 문의해 주세요.",
  FORBIDDEN: "이 페이지에 들어올 권한이 없어요.",
  AUTH_CODE_INVALID: "로그인 정보가 만료됐어요. 처음부터 다시 해주세요.",
  TEAM_CODE_NOT_FOUND: "그런 초대코드가 없어요. 다시 확인해 주세요.",
  TEAM_ALREADY_JOINED: "이미 참가한 팀이에요.",
  TEAM_JOIN_BLOCKED: "이 팀에는 참가할 수 없어요. 팀장에게 문의해 주세요.",
  INVITEE_NOT_FOUND: "그 아이디의 회원을 찾을 수 없어요. 먼저 가입해야 초대할 수 있어요.",
  INVITEE_ALREADY_MEMBER: "이미 팀에 있는 회원이에요.",
  INVITATION_DUPLICATE: "이미 초대를 보냈어요.",
  INVITATION_ALREADY_JOINED: "이미 참가한 팀이에요. 초대는 정리했어요.",
  TEAM_GONE: "없어진 팀이에요.",
  LEADER_MUST_TRANSFER: "팀장은 다른 팀원에게 팀장을 넘긴 뒤에 나갈 수 있어요.",
  LEADER_LAST_MEMBER: "혼자 있는 팀이에요. 나가면 팀이 삭제돼요. 삭제할까요?",
  TEAM_NAME_REQUIRED: "팀 이름을 입력해 주세요.",
  TEAM_MEMBER_NOT_FOUND: "그 팀원을 찾을 수 없어요.",
  POST_TEAM_INVALID: "연결할 수 없는 팀이에요. 내가 속한 팀만 고를 수 있어요.",
  NOT_FOUND: "찾는 내용이 없어요. 삭제됐을 수 있어요.",
  CONFLICT: "이미 처리된 회원이에요. 목록을 새로고침해 주세요.",
  INVALID_INPUT: "요청 내용을 확인해 주세요.",
  QUERY_TOO_COMPLEX: "요청이 너무 복잡해요. 조건을 줄여서 다시 시도해 주세요.",
  POST_DELETED: "삭제된 글이에요.",
  TAG_LIMIT_EXCEEDED: "태그는 5개까지 달 수 있어요.",
  TAG_TOO_LONG: "태그는 20자까지 쓸 수 있어요.",
  POST_PROBLEM_TOO_LONG: "문제는 5000자까지 쓸 수 있어요.",
  POST_CAUSE_TOO_LONG: "원인은 5000자까지 쓸 수 있어요.",
  POST_SOLUTION_TOO_LONG: "해결은 5000자까지 쓸 수 있어요.",
  POST_DID_TOO_LONG: "한 일은 5000자까지 쓸 수 있어요.",
  POST_LEARNED_TOO_LONG: "배운 점은 5000자까지 쓸 수 있어요.",
  TITLE_REQUIRED: "제목을 입력해 주세요.",
  SEARCH_TOO_SHORT: "2자 이상 입력해 주세요.",
  SEARCH_TOO_LONG: "검색어는 50자까지 쓸 수 있어요.",
  SYSTEM_NOTICE_UNDELETABLE: "이 공지는 판정 기준 안내라 삭제할 수 없어요.",
  EXEMPTION_REQUEST_DUPLICATE: "이미 요청한 주간이에요.",
  REJECT_REASON_REQUIRED: "거절 사유를 입력해 주세요.",
  REASON_REQUIRED: "사유를 입력해 주세요.",
  EXEMPTION_PERIOD_DUPLICATE: "이미 면제 기간으로 등록된 주예요.",
  JUDGMENT_NOT_CORRECTABLE: "이 판정은 그 결과로 정정할 수 없어요.",
  JUDGMENT_CHANGED: "그 사이 판정이 바뀌었어요. 목록을 새로고침해 주세요.",
  ALREADY_HANDLED: "이미 처리된 항목이에요. 목록을 새로고침해 주세요.",
  NOT_PENALTY_TARGET: "벌칙 대상이 아니에요. 목록을 새로고침해 주세요.",
  PROFILE_IMAGE_UPLOAD_FAILED: "사진을 올리지 못했어요. 다시 시도해 주세요.",
  PROFILE_IMAGE_TOO_LARGE: "5MB 이하 이미지만 올릴 수 있어요.",
  PROFILE_IMAGE_TYPE_NOT_ALLOWED: "jpg, png, webp만 올릴 수 있어요.",
  INTERNAL_ERROR: "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.",
};

export class BackendFailure extends Error {
  readonly code: string;
  constructor(code: string, message?: string) {
    super(message ?? SERVER_MESSAGES[code] ?? code);
    this.code = code;
  }
}

/** 실서버 오류 하나 (`extensions.code`) */
export const backendError = (code: string, message?: string) => new BackendFailure(code, message);

let resolvers = new Map<string, Resolver>();
let log: BackendCall[] = [];

/** 로그인만 되면 늘 쓰는 루트 필드. 테스트가 on()으로 덮는다 */
function installDefaults() {
  resolvers.set('me', (_a, ctx) => {
    if (!ctx.viewer) throw backendError('UNAUTHENTICATED');
    const { id, nickname, githubLogin, profileImageUrl, status, role } = ctx.viewer;
    return { id, nickname, githubLogin, profileImageUrl, status, role };
  });
  resolvers.set('myTeams', () => []);
  resolvers.set('receivedTeamInvitations', () => ({ items: [], nextCursor: null }));
}

type Backend = {
  reset(): void;
  /** 루트 필드 응답. 함수를 주면 (args, ctx)로 부르고, 값을 주면 늘 그 값 */
  on(field: string, resolver: Resolver): Backend;
  on(field: string, value: unknown): Backend;
  calls(field?: string): BackendCall[];
};

export const backend: Backend = {
  /** 응답 함수를 지우고 기본값(me · 빈 팀 · 빈 초대)만 남긴다. setup.ts가 테스트마다 부른다 */
  reset() {
    resolvers = new Map();
    log = [];
    installDefaults();
  },
  /** 루트 필드 응답. 값을 주면 늘 그 값, 함수를 주면 (args, ctx)로 부른다 */
  on(field: string, resolver: unknown) {
    resolvers.set(field, typeof resolver === 'function' ? (resolver as Resolver) : () => resolver);
    return backend;
  },
  /** 그 필드로 들어온 호출들 (없으면 전체) */
  calls(field?: string): BackendCall[] {
    return field ? log.filter((c) => c.field === field) : [...log];
  },
};

backend.reset();

function rootFields(query: string, operationName?: string | null): FieldNode[] {
  const doc = parse(query);
  const op = doc.definitions.find(
    (d): d is OperationDefinitionNode => d.kind === Kind.OPERATION_DEFINITION && (!operationName || d.name?.value === operationName),
  );
  return (op?.selectionSet.selections ?? []).filter((s): s is FieldNode => s.kind === Kind.FIELD);
}

type Body = { query: string; variables?: Record<string, unknown> | null; operationName?: string | null };

/** msw 핸들러 — bridge의 callBackend가 부르는 같은 출처 /__backend/graphql */
export const backendHandler = http.post('*/__backend/graphql', async ({ request }) => {
  const body = (await request.json()) as Body;
  const auth = request.headers.get('authorization');
  const vars = body.variables ?? {};
  const ctx: BackendCtx = { auth, viewer: personaByToken(auth), query: body.query, vars };
  const data: Record<string, unknown> = {};
  const errors: { message: string; path: string[]; extensions: { code: string; classification: string } }[] = [];

  for (const field of rootFields(body.query, body.operationName)) {
    const name = field.name.value;
    const key = field.alias?.value ?? name;
    const args = Object.fromEntries((field.arguments ?? []).map((a) => [a.name.value, valueFromASTUntyped(a.value, vars)]));
    log.push({ field: name, args, auth });
    const resolver = resolvers.get(name);
    try {
      if (!resolver) throw new Error(`test backend: no resolver for "${name}" — backend.on('${name}', …)`);
      data[key] = await resolver(args, ctx);
    } catch (e) {
      if (!(e instanceof BackendFailure)) throw e;
      errors.push({ message: e.message, path: [key], extensions: { code: e.code, classification: CLASSIFICATION[e.code] ?? 'BAD_REQUEST' } });
    }
  }
  return HttpResponse.json(errors.length ? { data: null, errors } : { data });
});
