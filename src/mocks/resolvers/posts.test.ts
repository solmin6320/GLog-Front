import type { ExecutionResult } from 'graphql';
import { describe, expect, it } from 'vitest';
import { mockTokenFor, type PersonaKey } from '../control';
import { seedPostId } from '../db/seed';
import { db, findMember } from '../db/store';
import { executeMock } from '../schema';

// 게시판 뮤테이션 (BD-03 · BD-04 · AD 게시물 관리, 백엔드 post.graphqls). executeMock으로 스키마를 바로 실행한다.

type Json = Record<string, unknown>;

async function run(query: string, as: PersonaKey, variables?: Json) {
  const res: ExecutionResult = await executeMock({ query, variables, authorization: `Bearer ${mockTokenFor(as)}` });
  return {
    data: res.data as Json | null | undefined,
    codes: (res.errors ?? []).map((e) => e.extensions?.code),
    fields: (res.errors ?? []).map((e) => e.extensions?.field),
  };
}

const id = (key: string) => {
  const v = seedPostId(key);
  if (!v) throw new Error(`seed post ${key} missing`);
  return v;
};

const LOOKUP = `query($id: ID!) { post(id: $id) { title commentCount isRecord updatedAt teamId teamName comments { items { id content updatedAt } } } }`;
const DELETE_POST = `mutation($id: ID!) { deletePost(id: $id) }`;
const DELETE_COMMENT = `mutation($id: ID!) { deleteComment(id: $id) }`;
const ADD_COMMENT = `mutation($postId: ID!, $content: String!) { createComment(postId: $postId, content: $content) { id content authorId author { nickname } } }`;
const ADMIN_DELETE_POST = `mutation($id: ID!) { adminDeletePost(postId: $id) }`;
const ADMIN_DELETE_COMMENT = `mutation($id: ID!) { adminDeleteComment(commentId: $id) }`;
const UPDATE_COMMENT = `mutation($id: ID!, $content: String!) { updateComment(id: $id, content: $content) { id content updatedAt } }`;
const CREATE = `mutation($input: CreatePostInput!) { createPost(input: $input) { id type title isRecord tags commitUrls sections { problem did learned } authorId author { nickname } teamId teamName createdAt } }`;
const UPDATE = `mutation($id: ID!, $input: UpdatePostInput!) { updatePost(id: $id, input: $input) { id title isRecord updatedAt teamId tags } }`;

const commentOf = (postKey: string, authorId: string) => {
  const c = db.comments.find((x) => x.postId === id(postKey) && x.authorId === authorId && !x.deletedAt);
  if (!c) throw new Error('seed comment missing');
  return c;
};

describe('deletePost', () => {
  it('작성자가 지우면 POST_DELETED로 보이고 목록에서 빠진다', async () => {
    const r = await run(DELETE_POST, 'member', { id: id('redisTtl') });
    expect(r.codes).toEqual([]);
    expect(r.data?.deletePost).toBe(true);
    expect((await run(LOOKUP, 'member', { id: id('redisTtl') })).codes).toEqual(['POST_DELETED']);
    const list = await run(`{ posts(type: TROUBLESHOOTING, q: "Redis") { items { title } } }`, 'member');
    expect(((list.data?.posts as Json).items as Json[]).map((p) => p.title)).not.toContain('Redis TTL이 적용되지 않던 문제');
  });

  it('남의 글은 관리자여도 deletePost로 못 지우고, adminDeletePost로 지운다 (AD-01 ②-5)', async () => {
    expect((await run(DELETE_POST, 'member', { id: id('flyway') })).codes).toEqual(['FORBIDDEN']);
    expect((await run(ADMIN_DELETE_POST, 'member', { id: id('flyway') })).codes).toEqual([]);
    expect((await run(ADMIN_DELETE_POST, 'member', { id: id('flyway') })).codes).toEqual(['POST_DELETED']);
  });

  it('팀장 · 일반 회원은 남의 글을 못 지운다 · adminDeletePost는 관리자만', async () => {
    const leader = findMember('1');
    if (leader) leader.role = 'MEMBER';
    expect((await run(DELETE_POST, 'member', { id: id('expoDeeplink') })).codes).toEqual(['FORBIDDEN']);
    expect((await run(ADMIN_DELETE_POST, 'member', { id: id('expoDeeplink') })).codes).toEqual(['FORBIDDEN']);
    expect((await run(DELETE_POST, 'plain', { id: id('redisTtl') })).codes).toEqual(['FORBIDDEN']);
  });

  it('삭제된 글 → POST_DELETED · 없는 글 → NOT_FOUND', async () => {
    expect((await run(DELETE_POST, 'member', { id: id('deletedMemo') })).codes).toEqual(['POST_DELETED']);
    expect((await run(DELETE_POST, 'member', { id: '000000000000000000000000' })).codes).toEqual(['NOT_FOUND']);
    expect((await run(DELETE_POST, 'member', { id: 'nope' })).codes).toEqual(['NOT_FOUND']);
  });
});

describe('deleteComment', () => {
  it('작성자는 지울 수 있고 댓글 수가 줄어든다', async () => {
    const c = commentOf('redisTtl', '2');
    const r = await run(DELETE_COMMENT, 'plain', { id: c.id });
    expect(r.codes).toEqual([]);
    expect(r.data?.deleteComment).toBe(true);
    const after = await run(LOOKUP, 'plain', { id: id('redisTtl') });
    expect((after.data?.post as Json).commentCount).toBe(2);
  });

  it('관리자는 adminDeleteComment로 남의 댓글을 지운다 · 남의 댓글 deleteComment는 FORBIDDEN', async () => {
    const c = commentOf('redisTtl', '3');
    expect((await run(DELETE_COMMENT, 'plain', { id: c.id })).codes).toEqual(['FORBIDDEN']);
    expect((await run(DELETE_COMMENT, 'member', { id: c.id })).codes).toEqual(['FORBIDDEN']);
    expect((await run(ADMIN_DELETE_COMMENT, 'plain', { id: c.id })).codes).toEqual(['FORBIDDEN']);
    expect((await run(ADMIN_DELETE_COMMENT, 'member', { id: c.id })).codes).toEqual([]);
    expect((await run(ADMIN_DELETE_COMMENT, 'member', { id: c.id })).codes).toEqual(['NOT_FOUND']);
  });
});

describe('createComment · updateComment', () => {
  it('1~500자, 앞뒤 공백 제거 · 목록 맨 아래에 붙는다', async () => {
    const r = await run(ADD_COMMENT, 'plain', { postId: id('redisTtl'), content: '  좋은 글이에요  ' });
    expect(r.codes).toEqual([]);
    expect(r.data?.createComment).toMatchObject({ content: '좋은 글이에요', authorId: '2', author: { nickname: '김철수' } });
    const after = await run(LOOKUP, 'plain', { id: id('redisTtl') });
    const post = after.data?.post as Json;
    expect(post.commentCount).toBe(4);
    const items = (post.comments as Json).items as Json[];
    expect(items.at(-1)?.content).toBe('좋은 글이에요');

    expect((await run(ADD_COMMENT, 'plain', { postId: id('redisTtl'), content: '   ' })).codes).toEqual(['INVALID_INPUT']);
    expect((await run(ADD_COMMENT, 'plain', { postId: id('redisTtl'), content: 'a'.repeat(501) })).codes).toEqual(['INVALID_INPUT']);
    expect((await run(ADD_COMMENT, 'plain', { postId: id('deletedMemo'), content: '안녕' })).codes).toEqual(['POST_DELETED']);
  });

  it('작성자 · 그 글 팀의 팀장만 고친다, 고치면 updatedAt', async () => {
    const own = commentOf('redisTtl', '2');
    const r = await run(UPDATE_COMMENT, 'plain', { id: own.id, content: '고친 댓글' });
    expect(r.codes).toEqual([]);
    expect(r.data?.updateComment).toMatchObject({ content: '고친 댓글' });
    expect((r.data?.updateComment as Json).updatedAt).toBe('2026-10-01T10:00:00+09:00');
    // A팀 글의 남의 댓글: 팀장(한동관)은 고칠 수 있고, 팀원(김철수)은 못 고친다
    const others = commentOf('redisTtl', '3');
    expect((await run(UPDATE_COMMENT, 'member', { id: others.id, content: '팀장 수정' })).codes).toEqual([]);
    expect((await run(UPDATE_COMMENT, 'plain', { id: others.id, content: '남의 댓글' })).codes).toEqual(['FORBIDDEN']);
  });
});

describe('createPost', () => {
  const input = {
    type: 'DEVLOG',
    title: '  팀 현황판 표 만들기 ',
    sections: { did: '표를 만들었어요.', learned: '', problem: '무시돼요' },
    tags: ['React'],
    commitUrls: [],
    teamId: '2',
  };

  it('필수 항목이 비어도 저장 · isRecord=false · 비공개 팀 연결은 teamName null · 태그는 소문자', async () => {
    const r = await run(CREATE, 'member', { input });
    expect(r.codes).toEqual([]);
    expect(r.data?.createPost).toMatchObject({
      type: 'DEVLOG',
      title: '팀 현황판 표 만들기',
      isRecord: false,
      tags: ['react'],
      sections: { problem: null, did: '표를 만들었어요.', learned: null },
      authorId: '1',
      author: { nickname: '한동관' },
      teamId: '2',
      teamName: null,
      createdAt: '2026-10-01T10:00:00+09:00',
    });
    // 최신순 맨 앞
    const list = await run(`{ posts(type: DEVLOG) { items { id } } }`, 'member');
    expect(((list.data?.posts as Json).items as Json[])[0]?.id).toBe((r.data?.createPost as Json).id);
  });

  it('입력 검증: 제목 · 태그 · 커밋 · 종류에 맞지 않는 항목 · 소속 아닌 팀', async () => {
    const bad = (patch: Json) => run(CREATE, 'plain', { input: { ...input, teamId: null, ...patch } });
    expect((await bad({ title: '   ' })).codes).toEqual(['TITLE_REQUIRED']);
    expect((await bad({ title: 'a'.repeat(61) })).codes).toEqual(['INVALID_INPUT']);
    expect((await bad({ tags: ['a', 'b', 'c', 'd', 'e', 'f'] })).codes).toEqual(['TAG_LIMIT_EXCEEDED']);
    expect((await bad({ tags: ['a'.repeat(21)] })).codes).toEqual(['TAG_TOO_LONG']);
    expect((await bad({ commitUrls: ['github.com/a/b'] })).codes).toEqual(['INVALID_COMMIT_URL']);
    const six = Array.from({ length: 6 }, (_, i) => `https://github.com/a/b/commit/abc123${i}`);
    expect((await bad({ commitUrls: six })).codes).toEqual(['POST_COMMIT_URLS_LIMIT_EXCEEDED']);
    expect((await bad({ sections: { did: 'a'.repeat(5001) } })).codes).toEqual(['POST_DID_TOO_LONG']);
    expect((await bad({ teamId: '3' })).codes).toEqual(['POST_TEAM_INVALID']);
    expect((await bad({ teamId: '4' })).codes).toEqual(['POST_TEAM_INVALID']);
    const ok = await bad({ commitUrls: ['https://github.com/jandilog/server/commit/a1b2c3d'] });
    expect(ok.codes).toEqual([]);
  });
});

describe('updatePost', () => {
  const input = (patch: Json = {}) => ({
    title: '고친 제목',
    sections: { problem: '문제', cause: '원인', solution: '해결' },
    tags: ['Expo'],
    commitUrls: [],
    teamId: null,
    ...patch,
  });

  it('작성자는 팀 연결도 바꾼다 · updatedAt이 바뀐다', async () => {
    const r = await run(UPDATE, 'member', { id: id('redisTtl'), input: input({ teamId: '2' }) });
    expect(r.codes).toEqual([]);
    expect(r.data?.updatePost).toMatchObject({ title: '고친 제목', isRecord: true, teamId: '2', updatedAt: '2026-10-01T10:00:00+09:00' });
  });

  it('팀장이 남의 글을 고치면 teamId는 무시된다 · 일반 회원은 FORBIDDEN', async () => {
    const r = await run(UPDATE, 'member', { id: id('expoDeeplink'), input: input({ teamId: null }) });
    expect(r.codes).toEqual([]);
    expect(r.data?.updatePost).toMatchObject({ title: '고친 제목', teamId: '1' });
    expect((await run(UPDATE, 'plain', { id: id('expoDeeplink'), input: input() })).codes).toEqual(['FORBIDDEN']);
    expect((await run(UPDATE, 'member', { id: id('deletedMemo'), input: input() })).codes).toEqual(['POST_DELETED']);
  });
});
