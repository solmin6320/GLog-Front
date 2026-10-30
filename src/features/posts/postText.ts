/**
 * 게시판 표시 규칙 (BD-01 · BD-03 · BD-04). 화면 라벨은 프론트가 enum → 문구로 바꾼다.
 */
import type { PostSectionKey, PostType } from '@/gql/graphql';

export const POST_TYPE_LABEL: Record<PostType, string> = {
  TROUBLESHOOTING: '트러블슈팅',
  DEVLOG: '개발일지',
};

export const SECTION_LABEL: Record<PostSectionKey, string> = {
  PROBLEM: '문제',
  CAUSE: '원인',
  SOLUTION: '해결',
  DID: '한 일',
  LEARNED: '배운 점',
};

/** BD-04 입력칸 안내 문구 */
export const SECTION_PLACEHOLDER: Record<PostSectionKey, string> = {
  PROBLEM: '어떤 문제가 있었는지 적어 주세요',
  CAUSE: '원인을 적어 주세요',
  SOLUTION: '어떻게 해결했는지 적어 주세요',
  DID: '한 일을 적어 주세요',
  LEARNED: '배운 점을 적어 주세요',
};

/** 기록글 인정에 필요한 항목 (작성 항목 순서). 서버 isRecord 규칙과 같다(R-08) */
export const REQUIRED_SECTIONS: Record<PostType, PostSectionKey[]> = {
  TROUBLESHOOTING: ['PROBLEM', 'CAUSE', 'SOLUTION'],
  DEVLOG: ['DID', 'LEARNED'],
};

/** E-25 · BD-01 ⑩ 툴팁 */
export const NOT_RECORD_TIP = '필수 항목을 다 채우면 인증에 들어가요.';

/** 공백만 있는 칸은 빈 칸이다 (ACC-BD04-04) */
export const isFilled = (v: string | null | undefined) => (v ?? '').trim().length > 0;

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
