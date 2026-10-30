/** 게시판 (BD-01 · BD-03 · BD-04 · 헤더 검색, 백엔드 post.graphqls) */
import { LIMITS } from '@/shared/lib/validators';
import type {
  MutationAdminDeleteCommentArgs,
  MutationAdminDeletePostArgs,
  MutationCreateCommentArgs,
  MutationCreatePostArgs,
  MutationDeleteCommentArgs,
  MutationDeletePostArgs,
  MutationUpdateCommentArgs,
  MutationUpdatePostArgs,
  PostSectionsInput,
  PostType,
  QueryPopularTagsArgs,
  QueryPostArgs,
  QueryPostsArgs,
} from '../__generated__/schema-types';
import { isPostVisible, visiblePosts } from '../db/derive';
import { sectionKeysOf } from '../db/seed';
import {
  db,
  findComment,
  findPost,
  liveTeam,
  membershipOf,
  nextObjectId,
  touch,
  type CommentRow,
  type Id,
  type PostRow,
  type PostSectionKey,
} from '../db/store';
import { gqlError, type ErrorCode } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { canEditComment, canEditPost, commentView, isAdmin, itemsPage, postView, requireViewer, viewerId } from '../views';

/** 목업 TAGS 순서 — 같은 개수면 이 순서로 (W-11) */
const TAG_ORDER = ['Spring', 'Redis', 'GraphQL', 'React', 'Expo', 'MariaDB', 'Docker', '배포', 'Flyway', 'MongoDB'];

const SEARCH_MIN = 2;
const SEARCH_MAX = 50;

/** 종류 · 태그 · 검색어로 거른다 (최신순 유지). q는 공백으로 나눈 단어를 모두 포함한 글 */
export function filterPosts(ctx: MockContext, o: { type?: PostType | null; tag?: string | null; q?: string | null }): PostRow[] {
  let words: string[] = [];
  if (o.q != null) {
    const trimmed = o.q.trim();
    if (trimmed.length < SEARCH_MIN) throw gqlError('SEARCH_TOO_SHORT');
    if (trimmed.length > SEARCH_MAX) throw gqlError('SEARCH_TOO_LONG');
    words = trimmed.toLowerCase().split(/\s+/);
  }
  const tag = o.tag?.trim().toLowerCase() || null;
  return visiblePosts(ctx.clock).filter((p) => {
    if (o.type && p.type !== o.type) return false;
    if (tag && !p.tags.some((x) => x.toLowerCase() === tag)) return false;
    if (words.length > 0) {
      const hay = [p.title, ...p.tags, ...Object.values(p.sections).map((s) => s ?? '')].join('\n').toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}

const isObjectIdLike = (id: string) => /^[0-9a-f]{24}$/i.test(id);

/* ------------------------------------------------------------------ */
/* 뮤테이션 도우미                                                        */
/* ------------------------------------------------------------------ */

const COMMENT_MAX = LIMITS.comment;
const SECTION_MAX = 5000;
const COMMIT_URLS_MAX = 5;
const COMMIT_URL = /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/commit\/[0-9a-fA-F]{7,40}\/?$/;

const SECTION_TOO_LONG: Record<PostSectionKey, ErrorCode> = {
  problem: 'POST_PROBLEM_TOO_LONG',
  cause: 'POST_CAUSE_TOO_LONG',
  solution: 'POST_SOLUTION_TOO_LONG',
  did: 'POST_DID_TOO_LONG',
  learned: 'POST_LEARNED_TOO_LONG',
};

/** 글 찾기: 형식이 틀리거나 없거나 아직 안 보이는 글 → NOT_FOUND · 삭제된 글 → POST_DELETED */
function livePost(ctx: MockContext, id: string): PostRow {
  const p = isObjectIdLike(id) ? findPost(id.toLowerCase()) : undefined;
  if (!p) throw gqlError('NOT_FOUND');
  if (p.deletedAt) throw gqlError('POST_DELETED');
  if (!isPostVisible(p, ctx.clock)) throw gqlError('NOT_FOUND');
  return p;
}

/** 댓글 찾기: 없거나 삭제된 댓글 → NOT_FOUND · 글이 삭제됐으면 POST_DELETED */
function liveComment(ctx: MockContext, id: string): { comment: CommentRow; post: PostRow } {
  const c = isObjectIdLike(id) ? findComment(id.toLowerCase()) : undefined;
  if (!c || c.deletedAt) throw gqlError('NOT_FOUND');
  return { comment: c, post: livePost(ctx, c.postId) };
}

function cleanTitle(raw: string): string {
  const title = raw.trim();
  if (title.length < 1) throw gqlError('TITLE_REQUIRED');
  if (title.length > LIMITS.title) throw gqlError('INVALID_INPUT');
  return title;
}

/** 그 종류의 항목만 쓰고 나머지는 무시한다. 빈 문자열 → null(작성되지 않음) */
function cleanSections(type: PostType, input: PostSectionsInput): PostRow['sections'] {
  const out: PostRow['sections'] = {};
  for (const key of sectionKeysOf(type)) {
    const body = (input[key] ?? '').trim();
    if (body.length > SECTION_MAX) throw gqlError(SECTION_TOO_LONG[key]);
    out[key] = body.length > 0 ? body : null;
  }
  return out;
}

/** 앞뒤 공백 제거 · 소문자 · 중복 제거. 최대 5개, 개당 20자 */
function cleanTags(input: string[] | null | undefined): string[] {
  const tags = [...new Set((input ?? []).map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0))];
  if (tags.length > LIMITS.tagCount) throw gqlError('TAG_LIMIT_EXCEEDED');
  if (tags.some((t) => t.length > LIMITS.tagLength)) throw gqlError('TAG_TOO_LONG');
  return tags;
}

function cleanCommitUrls(input: string[] | null | undefined): string[] {
  const urls = (input ?? []).map((u) => u.trim()).filter((u) => u.length > 0);
  if (urls.length > COMMIT_URLS_MAX) throw gqlError('POST_COMMIT_URLS_LIMIT_EXCEEDED');
  if (urls.some((u) => !COMMIT_URL.test(u))) throw gqlError('INVALID_COMMIT_URL');
  return urls;
}

/** 연결할 팀: null = 연결 안 함 · 지금 소속인 삭제되지 않은 팀만, 아니면 POST_TEAM_INVALID */
function cleanTeamId(ctx: MockContext, teamId: Id | null | undefined): Id | null {
  if (!teamId) return null;
  if (!liveTeam(teamId) || !membershipOf(teamId, viewerId(ctx) ?? '')) throw gqlError('POST_TEAM_INVALID');
  return teamId;
}

function cleanComment(raw: string): string {
  const text = raw.trim();
  if (text.length < 1 || text.length > COMMENT_MAX) throw gqlError('INVALID_INPUT');
  return text;
}

function requireAdmin(ctx: MockContext): void {
  requireViewer(ctx);
  if (!isAdmin(ctx)) throw gqlError('FORBIDDEN', { message: 'mock: admin only' });
}

export const postsResolvers: Resolvers = {
  Query: {
    posts: (_: unknown, { type, tag, q, after }: QueryPostsArgs, ctx: MockContext) => {
      const rows = filterPosts(ctx, { type, tag, q });
      return { ...itemsPage(rows, after, (p) => postView(ctx, p)), totalCount: rows.length };
    },
    popularTags: (_: unknown, { type }: QueryPopularTagsArgs, ctx: MockContext) => {
      const counts = new Map<string, number>();
      for (const p of visiblePosts(ctx.clock)) {
        if (type && p.type !== type) continue;
        for (const tag of p.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
      const rank = (tag: string) => {
        const i = TAG_ORDER.indexOf(tag);
        return i < 0 ? TAG_ORDER.length : i;
      };
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
    },
    // 없는 글 → NOT_FOUND(E-53) · 삭제된 글 → POST_DELETED(E-31)
    post: (_: unknown, { id }: QueryPostArgs, ctx: MockContext) => postView(ctx, livePost(ctx, id)),
  },
  Mutation: {
    // BD-03 ④ — 작성자 본인만. 소프트 삭제. 확정 판정은 그대로(E-28)
    deletePost: (_: unknown, { id }: MutationDeletePostArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const p = livePost(ctx, id);
      if (p.authorId !== viewer.id) throw gqlError('FORBIDDEN', { message: 'mock: not the author' });
      p.deletedAt = ctx.clock.now;
      touch();
      return true;
    },
    // BD-03 ⑪ — 작성자 본인만 (팀장 · 관리자는 불가, 관리자는 adminDeleteComment)
    deleteComment: (_: unknown, { id }: MutationDeleteCommentArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const { comment } = liveComment(ctx, id);
      if (comment.authorId !== viewer.id) throw gqlError('FORBIDDEN', { message: 'mock: not the author' });
      comment.deletedAt = ctx.clock.now;
      touch();
      return true;
    },
    // AD-01 게시물 관리 · BD-03 관리자 삭제
    adminDeletePost: (_: unknown, { postId }: MutationAdminDeletePostArgs, ctx: MockContext) => {
      requireAdmin(ctx);
      const p = livePost(ctx, postId);
      p.deletedAt = ctx.clock.now;
      touch();
      return true;
    },
    adminDeleteComment: (_: unknown, { commentId }: MutationAdminDeleteCommentArgs, ctx: MockContext) => {
      requireAdmin(ctx);
      const c = isObjectIdLike(commentId) ? findComment(commentId.toLowerCase()) : undefined;
      if (!c || c.deletedAt) throw gqlError('NOT_FOUND');
      c.deletedAt = ctx.clock.now;
      touch();
      return true;
    },
    // BD-04 등록 — 제목 1~60자 · 태그 ≤5(개당 ≤20) · 커밋 ≤5개 · 본인 소속 팀만. 필수 항목이 비어도 저장(E-24)
    createPost: (_: unknown, { input }: MutationCreatePostArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const row: PostRow = {
        id: nextObjectId('posts'),
        type: input.type,
        title: cleanTitle(input.title),
        sections: cleanSections(input.type, input.sections),
        tags: cleanTags(input.tags),
        commitUrls: cleanCommitUrls(input.commitUrls),
        authorId: viewer.id,
        teamId: cleanTeamId(ctx, input.teamId),
        createdAt: ctx.clock.now,
        updatedAt: null,
        deletedAt: null,
      };
      db.posts.push(row);
      touch();
      return postView(ctx, row);
    },
    // BD-04 수정 — 작성자 · 연결 팀 팀장. 종류는 그대로. 팀장이 남의 글을 고칠 때 teamId는 무시
    updatePost: (_: unknown, { id, input }: MutationUpdatePostArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const p = livePost(ctx, id);
      if (!canEditPost(ctx, p)) throw gqlError('FORBIDDEN', { message: 'mock: cannot edit post' });
      const next = {
        title: cleanTitle(input.title),
        sections: cleanSections(p.type, input.sections),
        tags: cleanTags(input.tags),
        commitUrls: cleanCommitUrls(input.commitUrls),
        teamId: p.authorId === viewer.id ? (input.teamId === p.teamId ? p.teamId : cleanTeamId(ctx, input.teamId)) : p.teamId,
      };
      Object.assign(p, next, { updatedAt: ctx.clock.now });
      touch();
      return postView(ctx, p);
    },
    // BD-03 ⑫ — 1~500자. 삭제된 글 → POST_DELETED
    createComment: (_: unknown, { postId, content }: MutationCreateCommentArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const p = livePost(ctx, postId);
      const row: CommentRow = {
        id: nextObjectId('comments'),
        postId: p.id,
        authorId: viewer.id,
        content: cleanComment(content),
        createdAt: ctx.clock.now,
        updatedAt: null,
        deletedAt: null,
      };
      db.comments.push(row);
      touch();
      return commentView(ctx, row);
    },
    // BD-03 ⑪ · TM-06 ⑧ — 작성자 · 그 글 연결 팀의 팀장
    updateComment: (_: unknown, { id, content }: MutationUpdateCommentArgs, ctx: MockContext) => {
      requireViewer(ctx);
      const { comment } = liveComment(ctx, id);
      if (!canEditComment(ctx, comment)) throw gqlError('FORBIDDEN', { message: 'mock: cannot edit comment' });
      comment.content = cleanComment(content);
      comment.updatedAt = ctx.clock.now;
      touch();
      return commentView(ctx, comment);
    },
  },
};
