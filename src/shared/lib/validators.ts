/**
 * 입력 검증 (설계서 ADR-05 · A2 6-5 · E-29 · E-30 · E-56 · E-61 ~ E-63).
 * 모든 함수는 순수 함수이고, 통과하면 null · 막히면 화면에 그대로 쓸 해요체 문구를 돌려준다.
 * 서버도 같은 제한을 다시 검사한다 — 여기 검증은 요청 전에 막는 용도다.
 *
 * 길이 제한의 근거: `docs/api/schema.graphql` 입력 타입 설명 · A2 6-5 표. 명세에 없는 값은 `(제안)`.
 */
import { SEARCH_MAX, SEARCH_MIN } from './paths';

export type ValidationResult = string | null;
export type Validator = (value: string | null | undefined) => ValidationResult;

export const LIMITS = {
  /** E-61 · E-63 */
  searchMin: SEARCH_MIN,
  searchMax: SEARCH_MAX,
  /** BD-04 ③ — 1~60자 (schema CreatePostInput.title) */
  title: 60,
  /** BD-04 ⑦ · E-30 — 최대 5개 · 개당 20자 (schema Post.tags) */
  tagCount: 5,
  tagLength: 20,
  /** TM-02 ① — 1~20자 (schema CreateTeamInput.name) */
  teamName: 20,
  /** TM-02 ② — 100자 (schema CreateTeamInput.description) */
  teamDescription: 100,
  /** BD-03 ⑫ — 1~500자 (schema Comment.content) */
  comment: 500,
  /** TM-08 ③ — 200자 (schema RequestPersonalExemptionInput.reason) */
  exemptionReason: 200,
  /** 초대코드 길이 (제안) — 명세에 형식이 없다. 시드 `JD7K-Q2MA` 9자 */
  inviteCodeMin: 4,
  inviteCodeMax: 20,
  /** GitHub 아이디 규칙(39자) — GitHub 가입 규칙 그대로 (제안) */
  githubLogin: 39,
} as const;

/* ---------- 문구 ---------- */

type JosaPair = '을/를' | '은/는' | '이/가';

/** 마지막 글자 받침 여부. 한글이 아니면 숫자만 읽어서 판단하고, 그 밖(영문 등)은 받침 없음으로 본다. */
function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/[0-9]/.test(last)) return '013678'.includes(last); // 영 · 일 · 삼 · 육 · 칠 · 팔
  return false;
}

function withJosa(word: string, pair: JosaPair): string {
  const [withB, withoutB] = pair.split('/') as [string, string];
  return `${word}${hasBatchim(word) ? withB : withoutB}`;
}

export const VALIDATION_MSG = {
  required: (label: string) => `${withJosa(label, '을/를')} 입력해 주세요.`,
  tooLong: (label: string, max: number) => `${withJosa(label, '은/는')} ${max}자까지 쓸 수 있어요.`,
  /** E-61 (MSG.searchTooShort와 같은 문구) */
  searchTooShort: `${SEARCH_MIN}자 이상 입력해 주세요.`,
  /** E-63 */
  searchTooLong: `검색어는 ${SEARCH_MAX}자까지 쓸 수 있어요.`,
  /** E-30 */
  tagTooMany: `태그는 ${LIMITS.tagCount}개까지 달 수 있어요.`,
  tagTooLong: `태그는 ${LIMITS.tagLength}자까지 쓸 수 있어요.`,
  /** (제안) */
  tagEmpty: '빈 태그는 달 수 없어요.',
  /** (제안) — Tag 컴포넌트가 '#'을 붙인다 */
  tagHash: '태그 앞의 #은 빼고 입력해 주세요.',
  /** (제안) */
  tagDuplicate: '이미 단 태그예요.',
  /** E-29 */
  /** (제안) */
  inviteCode: '초대코드는 영문, 숫자, -로 되어 있어요.',
  /** (제안) */
  githubLogin: 'GitHub 아이디 형식이 아니에요.',
} as const;

const clean = (v: string | null | undefined) => (v ?? '').trim();

/* ---------- 검색 (E-61 · E-63) ---------- */

/**
 * 헤더 검색 · BD-01 ③. 앞뒤 공백을 지우고 본다.
 * 빈 값은 null이다 — "빈 칸 Enter 무동작"은 호출하는 쪽이 `value.trim() === ''`로 따로 처리한다.
 */
export function validateSearch(value: string | null | undefined): ValidationResult {
  const q = clean(value);
  if (q.length === 0) return null;
  if (q.length < SEARCH_MIN) return VALIDATION_MSG.searchTooShort;
  if (q.length > SEARCH_MAX) return VALIDATION_MSG.searchTooLong;
  return null;
}

/* ---------- 공통 텍스트 ---------- */

/**
 * 필수 텍스트 검증기를 만든다. `validateRequiredText('댓글', 500)(value)`.
 * max를 주면 길이도 본다.
 */
export function validateRequiredText(label: string, max?: number): Validator {
  return (value) => {
    const v = clean(value);
    if (!v) return VALIDATION_MSG.required(label);
    if (max !== undefined && v.length > max) return VALIDATION_MSG.tooLong(label, max);
    return null;
  };
}

/** 선택 텍스트 — 비어도 통과, 길이만 본다 (팀 설명 등). */
export function validateOptionalText(label: string, max: number): Validator {
  return (value) => (clean(value).length > max ? VALIDATION_MSG.tooLong(label, max) : null);
}

/**
 * 사유 입력 검증기 (판정 정정 사유 · 개인 면제 거절 사유 · 면제 요청 사유).
 * `validateReason('정정 사유', 500)(value)` → '정정 사유를 입력해 주세요.' / '정정 사유는 500자까지 쓸 수 있어요.'
 */
export function validateReason(label: string, max: number): Validator {
  return validateRequiredText(label, max);
}

/** BD-04 ③ 글 제목 — 필수 · 60자 (EX-BD04-01) */
export function validateTitle(value: string | null | undefined): ValidationResult {
  return validateRequiredText('제목', LIMITS.title)(value);
}

/** TM-02 ① 팀 이름 — 필수 · 20자 (EX-TM02-01) */
export function validateTeamName(value: string | null | undefined): ValidationResult {
  return validateRequiredText('팀 이름', LIMITS.teamName)(value);
}

/* ---------- 태그 (E-30) ---------- */

/** 태그 하나 정규화: 앞뒤 공백 · 앞에 붙은 '#' 제거, 안쪽 공백 하나로. */
export function normalizeTag(raw: string | null | undefined): string {
  return clean(raw).replace(/^#+/, '').trim().replace(/\s+/g, ' ');
}

function tagKey(tag: string): string {
  return tag.toLowerCase();
}

function checkOneTag(tag: string): ValidationResult {
  const t = tag.trim();
  if (!t) return VALIDATION_MSG.tagEmpty;
  if (t.startsWith('#')) return VALIDATION_MSG.tagHash;
  if (t.length > LIMITS.tagLength) return VALIDATION_MSG.tagTooLong;
  return null;
}

/**
 * 태그 목록 전체 검증 (저장 직전). 5개 이하 · 개당 20자 · 빈 태그 없음 · '#'으로 시작 안 함 · 중복 없음(대소문자 무시).
 * 'C#'처럼 안쪽 '#'은 허용한다.
 */
export function validateTags(tags: readonly string[]): ValidationResult {
  if (tags.length > LIMITS.tagCount) return VALIDATION_MSG.tagTooMany;
  const seen = new Set<string>();
  for (const tag of tags) {
    const err = checkOneTag(tag);
    if (err) return err;
    const k = tagKey(tag.trim());
    if (seen.has(k)) return VALIDATION_MSG.tagDuplicate;
    seen.add(k);
  }
  return null;
}

/**
 * BD-04 ⑦ 태그 하나 추가 (Enter · 쉼표로 확정할 때). raw는 정규화해서 본다.
 * 빈 입력은 null(무동작) — 호출하는 쪽이 `normalizeTag(raw)`가 비었는지 따로 본다.
 */
export function validateNewTag(raw: string | null | undefined, existing: readonly string[]): ValidationResult {
  const tag = normalizeTag(raw);
  if (!tag) return null;
  if (existing.length >= LIMITS.tagCount) return VALIDATION_MSG.tagTooMany;
  const err = checkOneTag(tag);
  if (err) return err;
  if (existing.some((t) => tagKey(t.trim()) === tagKey(tag))) return VALIDATION_MSG.tagDuplicate;
  return null;
}

/* ---------- 관련 커밋 (E-29) ---------- */

/* ---------- 초대코드 · GitHub 아이디 ---------- */

/** 초대코드는 대소문자 구분 없음 — 프론트는 대문자로 바꿔 보낸다 (A2 6-5 제안). */
export function normalizeInviteCode(raw: string | null | undefined): string {
  return clean(raw).toUpperCase();
}

/** TM-03 ① 초대코드 — 필수 · 영문 · 숫자 · '-' · 4~20자 (형식은 제안. 존재 여부는 서버 E-10) */
export function validateInviteCode(value: string | null | undefined): ValidationResult {
  const v = clean(value);
  if (!v) return VALIDATION_MSG.required('초대코드');
  if (!/^[A-Za-z0-9-]+$/.test(v) || v.length < LIMITS.inviteCodeMin || v.length > LIMITS.inviteCodeMax) {
    return VALIDATION_MSG.inviteCode;
  }
  return null;
}

/** '@handong-gwan' → 'handong-gwan' */
export function normalizeGithubLogin(raw: string | null | undefined): string {
  return clean(raw).replace(/^@/, '');
}

const GITHUB_LOGIN_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

/**
 * TM-06 ② 아이디로 초대 — GitHub 아이디 규칙: 영문 · 숫자 · '-', 39자 이하, '-'로 시작 · 끝나거나 연달아 쓰지 않음.
 * 앞의 '@'는 허용한다. 존재 여부는 서버(INVITEE_NOT_FOUND).
 */
export function validateGithubLogin(value: string | null | undefined): ValidationResult {
  const v = normalizeGithubLogin(value);
  if (!v) return VALIDATION_MSG.required('GitHub 아이디');
  if (!GITHUB_LOGIN_RE.test(v)) return VALIDATION_MSG.githubLogin;
  return null;
}

/* ---------- 프로필 사진 (E-56) ---------- */

export const PROFILE_IMAGE = {
  /** 5MB (제안 — A2 6-5) */
  maxBytes: 5 * 1024 * 1024,
  types: ['image/jpeg', 'image/png', 'image/webp'] as readonly string[],
  extensions: ['jpg', 'jpeg', 'png', 'webp'] as readonly string[],
} as const;

/** PR-02 사진 선택 직후 선검증. 형식을 먼저 보고 용량을 본다. */
export function validateProfileImage(file: { size: number; type: string; name: string }): ValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = file.type ? PROFILE_IMAGE.types.includes(file.type) : PROFILE_IMAGE.extensions.includes(ext);
  if (!typeOk) return 'jpg, png, webp만 올릴 수 있어요.';
  if (file.size > PROFILE_IMAGE.maxBytes) return '5MB 이하 이미지만 올릴 수 있어요.';
  return null;
}
