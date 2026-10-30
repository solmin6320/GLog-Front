/**
 * 테스트 로그인 사용자 (F18). 토큰 `test.<key>`로 가짜 백엔드의 `me`가 이 회원을 돌려준다.
 * id는 실서버처럼 숫자 문자열. 이름은 목업(v2) 인물을 그대로 쓴다.
 */
export type PersonaKey = 'member' | 'plain' | 'noteam' | 'penalty' | 'pending' | 'rejected' | 'suspended';

export type TestPersona = {
  key: PersonaKey;
  id: string;
  nickname: string;
  githubLogin: string;
  profileImageUrl: string | null;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  role: 'MEMBER' | 'ADMIN';
};

export const PERSONAS: Record<PersonaKey, TestPersona> = {
  member: { key: 'member', id: '1', nickname: '한동관', githubLogin: 'handong-gwan', profileImageUrl: null, status: 'ACTIVE', role: 'ADMIN' },
  plain: { key: 'plain', id: '2', nickname: '김철수', githubLogin: 'chulsoo-kim', profileImageUrl: null, status: 'ACTIVE', role: 'MEMBER' },
  noteam: { key: 'noteam', id: '5', nickname: '서연', githubLogin: 'seoyeon-lee', profileImageUrl: null, status: 'ACTIVE', role: 'MEMBER' },
  penalty: { key: 'penalty', id: '6', nickname: '박지훈', githubLogin: 'jihoon-park', profileImageUrl: null, status: 'ACTIVE', role: 'MEMBER' },
  pending: { key: 'pending', id: '9', nickname: '정다은', githubLogin: 'daeun-jung', profileImageUrl: null, status: 'PENDING', role: 'MEMBER' },
  rejected: { key: 'rejected', id: '10', nickname: '최민재', githubLogin: 'minjae-choi', profileImageUrl: null, status: 'REJECTED', role: 'MEMBER' },
  suspended: { key: 'suspended', id: '11', nickname: '오정지', githubLogin: 'suspended-user', profileImageUrl: null, status: 'SUSPENDED', role: 'MEMBER' },
};

export const testTokenFor = (key: PersonaKey) => `test.${key}`;

export function personaByToken(authorization: string | null): TestPersona | null {
  const m = /^Bearer test\.(\w+)$/.exec(authorization ?? '');
  return m && m[1] && m[1] in PERSONAS ? PERSONAS[m[1] as PersonaKey] : null;
}

/** 백엔드 BoardAuthor · TeamPerson · AdminMemberBrief 등 회원 요약 */
export const brief = (p: TestPersona) => ({ id: p.id, nickname: p.nickname, githubLogin: p.githubLogin, profileImageUrl: p.profileImageUrl });
