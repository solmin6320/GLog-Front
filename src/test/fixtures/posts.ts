/**
 * 게시판 테스트 고정 응답 (F18). 모양은 백엔드 post.graphqls(Post · PostPage · Comment · TagCount) 그대로다.
 *
 *   const board = boardFixture();
 *   installBoard(board);                      // posts · post · popularTags · myTeams 응답
 *   renderRoute(`/posts/${POST_ID.redisTtl}`, { bridge: true });
 *
 * 응답 함수는 `board`의 배열을 그때그때 읽는다. 뮤테이션 응답(테스트가 backend.on으로 준다)이
 * 배열을 고치면 그 뒤 다시 부르는 조회(refetch)가 바뀐 상태를 받는다.
 */
import { backend, backendError, type BackendCtx } from '../backend';
import { PERSONAS } from '../personas';

export type BackendPostType = 'TROUBLESHOOTING' | 'DEVLOG';
export type BoardAuthor = { id: string; nickname: string; profileImageUrl: string | null };
export type BackendSections = { problem: string | null; cause: string | null; solution: string | null; did: string | null; learned: string | null };
export type BackendPost = {
  id: string;
  authorId: string;
  author: BoardAuthor;
  teamId: string | null;
  teamName: string | null;
  type: BackendPostType;
  title: string;
  sections: BackendSections;
  tags: string[];
  isRecord: boolean;
  writtenDate: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
};
export type BackendComment = { id: string; postId: string; authorId: string; author: BoardAuthor; content: string; createdAt: string; updatedAt: string };

/** 게시판에 나오는 회원 (실서버처럼 숫자 문자열 id) */
export const AUTHORS: Record<string, BoardAuthor> = {
  '1': { id: '1', nickname: PERSONAS.member.nickname, profileImageUrl: null },
  '2': { id: '2', nickname: PERSONAS.plain.nickname, profileImageUrl: null },
  '3': { id: '3', nickname: '이영희', profileImageUrl: null },
  '4': { id: '4', nickname: '박민수', profileImageUrl: null },
  '13': { id: '13', nickname: '오민석', profileImageUrl: null },
};

/** 팀 1 = 공개 · 한동관 팀장, 팀 2 = 비공개 · 한동관 팀원 */
export const TEAMS = {
  '1': { id: '1', name: '사이드 프로젝트 A팀', isPublic: true },
  '2': { id: '2', name: '알고리즘 스터디', isPublic: false },
} as const;

/** 몽고 ObjectId 모양(24자 hex) id */
export const oid = (n: number, prefix = 'a1') => `${prefix}${n.toString(16).padStart(22, '0')}`;
export const POST_ID = {
  redisTtl: oid(1),
  graphqlN1: oid(2),
  expoDeeplink: oid(3),
  flyway: oid(4),
  upstash: oid(5),
  healthCheck: oid(6),
  schemaDraft: oid(7),
  segTree: oid(8),
  dockerCompose: oid(9),
  apolloCache: oid(10),
  deletedMemo: oid(11),
} as const;
export const MISSING_POST_ID = '000000000000000000000000';

const kst = (at: string) => `${at.replace(' ', 'T')}:00+09:00`;
const SECTION_KEYS: Record<BackendPostType, (keyof BackendSections)[]> = {
  TROUBLESHOOTING: ['problem', 'cause', 'solution'],
  DEVLOG: ['did', 'learned'],
};
export const isRecordOf = (type: BackendPostType, s: Partial<BackendSections>) => SECTION_KEYS[type].every((k) => !!s[k]?.trim());

/** 백엔드 Post 한 건. body는 종류별 항목 순서(문제 · 원인 · 해결 / 한 일 · 배운 점), null = 비어 있음 */
export function post(o: {
  id: string;
  type: BackendPostType;
  title: string;
  author: string;
  team?: keyof typeof TEAMS;
  at: string;
  tags: string[];
  body: (string | null)[];
  commentCount?: number;
  updated?: string;
}): BackendPost {
  const sections: BackendSections = { problem: null, cause: null, solution: null, did: null, learned: null };
  SECTION_KEYS[o.type].forEach((k, i) => (sections[k] = o.body[i] ?? null));
  const team = o.team ? TEAMS[o.team] : null;
  const createdAt = kst(o.at);
  return {
    id: o.id,
    authorId: o.author,
    author: AUTHORS[o.author] ?? { id: o.author, nickname: `회원${o.author}`, profileImageUrl: null },
    teamId: team?.id ?? null,
    // 비공개 팀 이름은 서버가 숨긴다 (team.graphqls Post.teamName)
    teamName: team?.isPublic ? team.name : null,
    type: o.type,
    title: o.title,
    sections,
    tags: o.tags,
    isRecord: isRecordOf(o.type, sections),
    writtenDate: o.at.slice(0, 10),
    createdAt,
    updatedAt: o.updated ? kst(o.updated) : createdAt,
    commentCount: o.commentCount ?? 0,
  };
}

export function comment(id: number, postId: string, author: string, at: string, content: string): BackendComment {
  return { id: String(id), postId, authorId: author, author: AUTHORS[author]!, content, createdAt: kst(at), updatedAt: kst(at) };
}

/** 이름 있는 글 + 트러블슈팅 채움 글 17개 (트러블슈팅 23 · 개발일지 5) */
function seedPosts(): BackendPost[] {
  const T = 'TROUBLESHOOTING' as const;
  const D = 'DEVLOG' as const;
  const named = [
    post({
      id: POST_ID.redisTtl, type: T, title: 'Redis TTL이 적용되지 않던 문제', author: '1', team: '1', at: '2026-09-29 14:20', tags: ['redis', 'spring'], commentCount: 3,
      body: ['TTL을 걸었는데 키가 사라지지 않았어요.', 'set 다음에 expire를 따로 호출했어요.', 'set 명령에 ex 옵션을 같이 넘겼어요.'],
    }),
    post({
      id: POST_ID.graphqlN1, type: T, title: 'GraphQL N+1을 @BatchMapping으로 해결하기', author: '2', at: '2026-09-28 21:10', tags: ['graphql', 'spring'],
      body: ['게시글 목록을 부를 때마다 작성자 조회 쿼리가 글 수만큼 나갔어요.', null, '@BatchMapping으로 작성자를 한 번에 묶었어요.'],
    }),
    post({
      id: POST_ID.expoDeeplink, type: T, title: 'Expo 딥링크가 안드로이드에서만 열리지 않을 때', author: '4', team: '1', at: '2026-09-26 19:30', tags: ['expo', 'reactnative'], commentCount: 5,
      body: ['안드로이드에서만 딥링크가 열리지 않았어요.', 'intentFilters가 빠져 있었어요.', 'app.json에 intentFilters를 넣었어요.'],
    }),
    post({
      id: POST_ID.flyway, type: T, title: 'Flyway 체크섬 불일치로 서버가 안 뜨는 문제', author: '3', at: '2026-09-24 13:00', tags: ['flyway', 'mariadb'], commentCount: 2,
      body: ['서버가 체크섬 오류로 뜨지 않았어요.', '이미 적용된 마이그레이션 파일을 고쳤어요.', '새 버전 파일로 다시 만들었어요.'],
    }),
    post({
      id: POST_ID.upstash, type: T, title: 'Upstash Redis 명령 수가 갑자기 늘어난 이유', author: '3', at: '2026-09-19 11:00', tags: ['redis', 'upstash'], commentCount: 1,
      body: ['무료 한도를 넘었다는 메일이 왔어요.', '헬스체크가 PING을 계속 보냈어요.', '헬스체크 주기를 늘렸어요.'],
    }),
    post({
      id: POST_ID.healthCheck, type: T, title: '헬스체크에서 캐시 서버를 뺀 이유', author: '1', team: '1', at: '2026-09-15 16:00', tags: ['redis', 'actuator'],
      body: ['캐시 서버가 잠깐 끊기면 앱 전체가 내려갔어요.', '헬스체크에 캐시 서버가 들어 있었어요.', '캐시 서버를 헬스체크에서 뺐어요.'],
    }),
    post({
      id: POST_ID.schemaDraft, type: D, title: 'GraphQL 스키마 초안 정리', author: '2', team: '1', at: '2026-09-29 22:40', tags: ['graphql'],
      body: ['화면별로 필요한 필드를 모아서 스키마 초안을 만들었어요.', '목록은 커서 방식으로 통일했어요.'],
    }),
    post({
      id: POST_ID.segTree, type: D, title: '세그먼트 트리 지연 전파 정리', author: '13', team: '2', at: '2026-09-30 23:00', tags: ['알고리즘'],
      body: ['구간 갱신 문제 두 개를 지연 전파로 풀었어요.', '갱신을 미뤄 두는 시점을 그림으로 그렸어요.'],
    }),
    post({
      id: POST_ID.apolloCache, type: D, title: 'Apollo 캐시 정규화 정리', author: '2', at: '2026-10-01 08:30', tags: ['react'],
      body: ['id가 없는 값 객체를 캐시에서 어떻게 다루는지 정리했어요.', 'keyFields를 false로 두는 법을 배웠어요.'],
    }),
    post({
      id: POST_ID.dockerCompose, type: D, title: 'Docker Compose로 로컬 DB 통일', author: '1', team: '1', at: '2026-09-22 21:00', tags: ['docker', 'redis'],
      body: ['MariaDB · Redis · MongoDB를 Compose 하나로 띄웠어요.', '볼륨 이름을 팀에서 통일해야 한다는 걸 배웠어요.'],
    }),
  ];
  const filler = Array.from({ length: 17 }, (_, i) =>
    post({
      id: oid(100 + i),
      type: T,
      title: `배포 점검 기록 ${i + 1}`,
      author: '4',
      at: `2026-09-${String(1 + i).padStart(2, '0')} 20:00`,
      tags: ['배포'],
      body: ['배포 뒤 점검한 내용이에요.', '설정 값이 달랐어요.', '설정을 맞췄어요.'],
    }),
  );
  return [...named, ...filler];
}

function seedComments(): Record<string, BackendComment[]> {
  return {
    [POST_ID.redisTtl]: [
      comment(1, POST_ID.redisTtl, '2', '2026-09-29 15:02', '저도 같은 문제 겪었어요. ex 옵션 몰랐는데 덕분에 알았어요.'),
      comment(2, POST_ID.redisTtl, '1', '2026-09-29 15:30', '저도 한참 헤맸어요. 커밋 링크 참고해 주세요!'),
      comment(3, POST_ID.redisTtl, '3', '2026-09-29 16:10', '저도 같은 문제 겪었어요'),
    ],
  };
}

export type BoardFixture = {
  posts: BackendPost[];
  comments: Record<string, BackendComment[]>;
  /** 소프트 삭제된 글 id (post(id) → POST_DELETED, 목록에서 빠진다) */
  deleted: Set<string>;
  popularTags: { tag: string; count: number }[];
};

export function boardFixture(): BoardFixture {
  return {
    posts: seedPosts(),
    comments: seedComments(),
    deleted: new Set([POST_ID.deletedMemo]),
    popularTags: ['spring', 'redis', 'graphql', 'react', 'expo', 'mariadb', 'docker', '배포', 'flyway', 'mongodb', 'actuator'].map((tag, i) => ({
      tag,
      count: 20 - i,
    })),
  };
}

const PAGE = 20;
const hay = (p: BackendPost) => [p.title, ...Object.values(p.sections), ...p.tags].filter(Boolean).join('\n').toLowerCase();

/** posts(type, tag, q, after) — 실서버 규칙: 최신순 20개 · tag 정확히 일치 · q는 제목·내용·태그에 단어 모두 포함 */
export function listPosts(board: BoardFixture, args: Record<string, unknown>) {
  const tag = typeof args.tag === 'string' ? args.tag.trim().toLowerCase() : null;
  const words = typeof args.q === 'string' ? args.q.trim().toLowerCase().split(/\s+/).filter(Boolean) : [];
  const all = board.posts
    .filter((p) => !board.deleted.has(p.id) && p.type === args.type)
    .filter((p) => !tag || p.tags.includes(tag))
    .filter((p) => words.every((w) => hay(p).includes(w)))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const start = typeof args.after === 'string' ? Number(args.after) : 0;
  const items = all.slice(start, start + PAGE);
  return { items, nextCursor: start + PAGE < all.length ? String(start + PAGE) : null, totalCount: all.length };
}

/** post(id) — 없으면 NOT_FOUND, 지운 글은 POST_DELETED. 댓글은 오래된 순 */
export function findPost(board: BoardFixture, id: unknown) {
  const key = String(id);
  if (board.deleted.has(key)) throw backendError('POST_DELETED');
  const p = board.posts.find((x) => x.id === key);
  if (!p) throw backendError('NOT_FOUND');
  const items = [...(board.comments[key] ?? [])].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return { ...p, commentCount: board.comments[key] ? items.length : p.commentCount, comments: { items, nextCursor: null } };
}

/** 회원별 myTeams (team.graphqls Team 일부 + weekSummary). 한동관 = 팀1 팀장 · 팀2 팀원, 김철수 = 팀1 팀원 */
export function myTeamsOf(ctx: BackendCtx) {
  const row = (id: keyof typeof TEAMS, isLeader: boolean, memberCount: number) => ({
    ...TEAMS[id],
    isLeader,
    memberCount,
    weekSummary: { weekStart: '2026-09-28', passCount: 0, failCount: 0, notYetCount: memberCount },
  });
  if (ctx.viewer?.id === PERSONAS.member.id) return [row('1', true, 4), row('2', false, 6)];
  if (ctx.viewer?.id === PERSONAS.plain.id) return [row('1', false, 4)];
  return [];
}

/** 게시판 조회 응답을 건다 (posts · post · popularTags · myTeams) */
export function installBoard(board: BoardFixture) {
  backend
    .on('posts', (args: Record<string, unknown>) => listPosts(board, args))
    .on('post', ({ id }: Record<string, unknown>) => findPost(board, id))
    .on('popularTags', () => board.popularTags)
    .on('myTeams', (_a: Record<string, unknown>, ctx: BackendCtx) => myTeamsOf(ctx));
  return board;
}

const KST_NOW = '2026-10-01T10:00:00';
let seq = 500;

/**
 * 게시판 뮤테이션 응답 (post.graphqls 규칙). 삭제는 작성자만(남이면 FORBIDDEN → bridge가 관리자 삭제로 넘김),
 * 관리자 삭제는 ADMIN만. 글 작성은 board에 넣고 다음 조회에 보인다.
 */
export function serveBoardMutations(board: BoardFixture, o: { isAdmin?: (ctx: BackendCtx) => boolean } = {}) {
  const me = (ctx: BackendCtx) => ctx.viewer!.id;
  const isAdmin = o.isAdmin ?? ((ctx: BackendCtx) => ctx.viewer?.role === 'ADMIN');
  const allComments = () => Object.values(board.comments).flat();
  const teamOf = (teamId: unknown) => (typeof teamId === 'string' && teamId in TEAMS ? TEAMS[teamId as keyof typeof TEAMS] : null);
  type SectionsIn = Partial<Record<keyof BackendSections, string | null>>;
  const write = (p: BackendPost, input: { title: string; sections: SectionsIn; tags?: string[] | null; teamId?: string | null }, keepTeam: boolean) => {
    const sections = { problem: null, cause: null, solution: null, did: null, learned: null, ...input.sections };
    const team = keepTeam ? (p.teamId ? teamOf(p.teamId) : null) : teamOf(input.teamId);
    Object.assign(p, {
      title: input.title,
      sections,
      tags: (input.tags ?? []).map((t) => t.trim().toLowerCase()),
      teamId: team?.id ?? null,
      teamName: team?.isPublic ? team.name : null,
      isRecord: isRecordOf(p.type, sections),
    });
    return p;
  };
  backend
    .on('createPost', ({ input }, ctx) => {
      const i = input as { type: BackendPostType; title: string; sections: SectionsIn; tags?: string[]; teamId?: string | null };
      const p = post({ id: oid(seq++, 'b2'), type: i.type, title: i.title, author: me(ctx), at: '2026-10-01 10:00', tags: [], body: [] });
      board.posts.unshift(write(p, i, false));
      return p;
    })
    .on('updatePost', ({ id, input }, ctx) => {
      if (board.deleted.has(String(id))) throw backendError('POST_DELETED');
      const p = board.posts.find((x) => x.id === String(id));
      if (!p) throw backendError('NOT_FOUND');
      const i = input as { title: string; sections: SectionsIn; tags?: string[]; teamId?: string | null };
      write(p, i, p.authorId !== me(ctx));
      p.updatedAt = KST_NOW;
      return p;
    })
    .on('deletePost', ({ id }, ctx) => {
      const p = board.posts.find((x) => x.id === String(id));
      if (!p || board.deleted.has(p.id)) throw backendError(p ? 'POST_DELETED' : 'NOT_FOUND');
      if (p.authorId !== me(ctx)) throw backendError('FORBIDDEN');
      board.deleted.add(p.id);
      return true;
    })
    .on('adminDeletePost', ({ postId }, ctx) => {
      if (!isAdmin(ctx)) throw backendError('FORBIDDEN');
      board.deleted.add(String(postId));
      return true;
    })
    .on('createComment', ({ postId, content }, ctx) => {
      const c: BackendComment = {
        id: String(seq++),
        postId: String(postId),
        authorId: me(ctx),
        author: AUTHORS[me(ctx)] ?? { id: me(ctx), nickname: ctx.viewer!.nickname, profileImageUrl: null },
        content: String(content),
        createdAt: KST_NOW,
        updatedAt: KST_NOW,
      };
      (board.comments[String(postId)] ??= []).push(c);
      return c;
    })
    .on('updateComment', ({ id, content }) => {
      const c = allComments().find((x) => x.id === String(id));
      if (!c) throw backendError('NOT_FOUND');
      c.content = String(content);
      c.updatedAt = KST_NOW;
      return c;
    })
    .on('deleteComment', ({ id }, ctx) => {
      const c = allComments().find((x) => x.id === String(id));
      if (!c) throw backendError('NOT_FOUND');
      if (c.authorId !== me(ctx)) throw backendError('FORBIDDEN');
      board.comments[c.postId] = board.comments[c.postId]!.filter((x) => x.id !== c.id);
      return true;
    })
    .on('adminDeleteComment', ({ commentId }, ctx) => {
      if (!isAdmin(ctx)) throw backendError('FORBIDDEN');
      for (const k of Object.keys(board.comments)) board.comments[k] = board.comments[k]!.filter((x) => x.id !== String(commentId));
      return true;
    });
}
