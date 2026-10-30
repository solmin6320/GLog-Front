/**
 * 게시판 표시 규칙 (BD-01 · BD-03 · BD-04). 화면 라벨은 프론트가 enum → 문구로 바꾼다.
 */
import type { PostType } from '@/gql/graphql';

/** 본문 항목 키 (백엔드 PostSections 필드 이름) */
export type PostSectionKey = 'problem' | 'cause' | 'solution' | 'did' | 'learned';

export const POST_TYPE_LABEL: Record<PostType, string> = {
  TROUBLESHOOTING: '트러블슈팅',
  DEVLOG: '개발일지',
};

export const SECTION_LABEL: Record<PostSectionKey, string> = {
  problem: '문제',
  cause: '원인',
  solution: '해결',
  did: '한 일',
  learned: '배운 점',
};

/** BD-04 입력칸 안내 문구 */
export const SECTION_PLACEHOLDER: Record<PostSectionKey, string> = {
  problem: '어떤 문제가 있었는지 적어 주세요',
  cause: '원인을 적어 주세요',
  solution: '어떻게 해결했는지 적어 주세요',
  did: '한 일을 적어 주세요',
  learned: '배운 점을 적어 주세요',
};

/** 기록글 인정에 필요한 항목 (작성 항목 순서). 서버 isRecord 규칙과 같다(R-08) */
export const REQUIRED_SECTIONS: Record<PostType, PostSectionKey[]> = {
  TROUBLESHOOTING: ['problem', 'cause', 'solution'],
  DEVLOG: ['did', 'learned'],
};

/** E-25 · BD-01 ⑩ 툴팁 */
export const NOT_RECORD_TIP = '필수 항목을 다 채우면 인증에 들어가요.';

/** 공백만 있는 칸은 빈 칸이다 (ACC-BD04-04) */
export const isFilled = (v: string | null | undefined) => (v ?? '').trim().length > 0;

/** `https://github.com/{owner}/{repo}/commit/{sha}` → 'owner/repo · 7자리 sha'. 형식이 다르면 주소 그대로 */
export function commitLabel(url: string): string {
  const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/commit\/([0-9a-fA-F]{7,40})\/?$/.exec(url.trim());
  if (!m) return url;
  return `${m[1]}/${m[2]} · ${m[3]?.slice(0, 7)}`;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 검색어와 맞는 조각을 표시한다(대소문자 무시). [{ text, hit }] */
export function splitByQuery(text: string, q: string | null | undefined): { text: string; hit: boolean }[] {
  const needle = (q ?? '').trim();
  if (!needle) return [{ text, hit: false }];
  const re = new RegExp(`(${escapeRegExp(needle)})`, 'gi');
  return text
    .split(re)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, hit: part.toLowerCase() === needle.toLowerCase() }));
}
