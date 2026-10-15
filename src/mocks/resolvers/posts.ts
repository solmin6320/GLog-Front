/** 게시판 (BD-01 · BD-03 · BD-04 · 헤더 검색) */
import { LIMITS, validateCommitUrl, validateTags } from '@/shared/lib/validators';
import type {
  MutationAddCommentArgs,
  MutationCreatePostArgs,
  MutationDeleteCommentArgs,
  MutationDeletePostArgs,
  MutationUpdateCommentArgs,
  MutationUpdatePostArgs,
  PostFilter,
  PostSectionInput,
  PostType,
  QueryPopularTagsArgs,
  QueryPostArgs,
  QueryPostsArgs,
  QueryPostTypeCountsArgs,
} from '../__generated__/schema-types';
import { isPostVisible, visiblePosts } from '../db/derive';
import { sectionKeysOf } from '../db/seed';
import {
  db,
  findComment,
  findPost,
  findTeam,
  liveTeam,
  membershipOf,
  nextObjectId,
  touch,
  type CommentRow,
  type Id,
  type PostRow,
} from '../db/store';
import { gqlError, invalid } from '../errors';
import type { MockContext, Resolvers } from '../types';
import { canDelete, canEditComment, canEditPost, commentView, paginate, postLookupView, postView, requireViewer, viewerId } from '../views';

/** 목업 TAGS 순서 — 같은 개수면 이 순서로 (W-11) */
const TAG_ORDER = ['Spring', 'Redis', 'GraphQL', 'React', 'Expo', 'MariaDB', 'Docker', '배포', 'Flyway', 'MongoDB'];

const SEARCH_MIN = 2;
const SEARCH_MAX = 50;

/** PostFilter 적용 (최신순 유지). ignoreType = 탭별 건수 계산용 */
export function filterPosts(ctx: MockContext, filter: PostFilter, o: { ignoreType?: boolean } = {}): PostRow[] {
  let q: string | null = null;
  if (filter.query != null) {
    const trimmed = filter.query.trim();
    if (trimmed.length > 0) {
      if (trimmed.length < SEARCH_MIN || trimmed.length > SEARCH_MAX) throw invalid('query', 'mock: query must be 2~50 chars');
      q = trimmed.toLowerCase();
    }
  }
  const tag = filter.tag?.trim().toLowerCase() || null;
  if (filter.teamId) {
    const t = findTeam(filter.teamId);
    // 비공개 팀 글 목록은 소속자만 (팀 연결이 새지 않게)
    if (t && !t.isPublic && !t.deletedAt && !membershipOf(t.id, viewerId(ctx) ?? '')) {
      throw gqlError('FORBIDDEN', { message: 'mock: private team filter' });
    }
  }
  return visiblePosts(ctx.clock).filter((p) => {
    if (!o.ignoreType && filter.type && p.type !== filter.type) return false;
    if (filter.teamId && p.teamId !== filter.teamId) return false;
    if (filter.authorId && p.authorId !== filter.authorId) return false;
    if (tag && !p.tags.some((x) => x.toLowerCase() === tag)) return false;
    if (q) {
      const hay = [p.title, ...p.tags, ...Object.values(p.sections).map((s) => s ?? '')];
      if (!hay.some((s) => s.toLowerCase().includes(q))) return false;
    }
    return true;
  });
}

const isObjectIdLike = (id: string) => /^[0-9a-f]{24}$/i.test(id);

/* ------------------------------------------------------------------ */
/* 뮤테이션 도우미                                                        */
/* ------------------------------------------------------------------ */

const COMMENT_MAX = LIMITS.comment;
const COMMIT_URLS_MAX = 1; // M-18 화면 1칸 → 0~1개

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
  if (title.length < 1 || title.length > LIMITS.title) throw invalid('title');
  return title;
}

/** type에 맞는 키만, 중복 없이. 빈 문자열 → null(작성되지 않음) */
function cleanSections(type: PostType, input: PostSectionInput[]): PostRow['sections'] {
  const allowed = sectionKeysOf(type);
  const out: PostRow['sections'] = Object.fromEntries(allowed.map((k) => [k, null]));
  const seen = new Set<string>();
  for (const s of input) {
    if (!allowed.includes(s.key) || seen.has(s.key)) throw invalid('sections');
    seen.add(s.key);
    const body = (s.body ?? '').trim();
    out[s.key] = body.length > 0 ? body : null;
  }
  return out;
}

function cleanTags(input: string[]): string[] {
  const tags = input.map((t) => t.trim());
  if (validateTags(tags) !== null) throw invalid('tags');
  return tags;
}

function cleanCommitUrls(input: string[]): string[] {
  const urls = input.map((u) => u.trim()).filter((u) => u.length > 0);
  if (urls.length > COMMIT_URLS_MAX || urls.some((u) => validateCommitUrl(u) !== null)) throw invalid('commitUrls');
  return urls;
}

/** 연결할 팀: null = 연결 안 함 · 삭제된 팀 → TEAM_GONE · 소속 아님 → FORBIDDEN. keep = 지금 연결된 팀은 그대로 허용 */
function cleanTeamId(ctx: MockContext, teamId: Id | null | undefined, keep?: Id | null): Id | null {
  if (!teamId) return null;
  if (keep && teamId === keep) return keep;
  const team = findTeam(teamId);
  if (!team) throw invalid('teamId');
  if (!liveTeam(teamId)) throw gqlError('TEAM_GONE');
  if (!membershipOf(teamId, viewerId(ctx) ?? '')) throw gqlError('FORBIDDEN', { message: 'mock: not a team member' });
  return teamId;
}

function cleanComment(raw: string): string {
  const text = raw.trim();
  if (text.length < 1 || text.length > COMMENT_MAX) throw invalid('content');
  return text;
}

export const postsResolvers: Resolvers = {
  Query: {
    posts: (_: unknown, { filter, first, after }: QueryPostsArgs, ctx: MockContext) =>
      paginate(filterPosts(ctx, filter), { first, after }, (p) => postView(ctx, p)),
    postTypeCounts: (_: unknown, { filter }: QueryPostTypeCountsArgs, ctx: MockContext) => {
      const rows = filterPosts(ctx, filter, { ignoreType: true });
      return {
        troubleshooting: rows.filter((p) => p.type === 'TROUBLESHOOTING').length,
        devlog: rows.filter((p) => p.type === 'DEVLOG').length,
      };
    },
    popularTags: (_: unknown, { type, first }: QueryPopularTagsArgs, ctx: MockContext) => {
      const n = first ?? 10;
      if (!Number.isInteger(n) || n < 0 || n > 50) throw invalid('first');
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
        .slice(0, n)
        .map(([tag, count]) => ({ tag, count }));
    },
    // 없는 글 → null(E-53) · 삭제된 글 → DeletedPost(E-31)
    post: (_: unknown, { id }: QueryPostArgs, ctx: MockContext) => (isObjectIdLike(id) ? postLookupView(ctx, id.toLowerCase()) : null),
  },
  PostLookup: {
    __resolveType: (obj: { __typename?: string }) => obj.__typename ?? 'Post',
  },
  Mutation: {
    // BD-03 ④ · AD-01 ②-5 — 작성자 · 관리자. 소프트 삭제(이후 post(id) = DeletedPost). 확정 판정은 그대로(E-28)
    deletePost: (_: unknown, { id }: MutationDeletePostArgs, ctx: MockContext) => {
      requireViewer(ctx);
      const p = livePost(ctx, id);
      if (!canDelete(ctx, p.authorId)) throw gqlError('FORBIDDEN', { message: 'mock: cannot delete post' });
      p.deletedAt = ctx.clock.now;
      touch();
      return p.id;
    },
    // BD-03 ⑪ · AD-01 ②-5 — 작성자 · 관리자 (팀장은 불가)
    deleteComment: (_: unknown, { id }: MutationDeleteCommentArgs, ctx: MockContext) => {
      requireViewer(ctx);
      const { comment } = liveComment(ctx, id);
      if (!canDelete(ctx, comment.authorId)) throw gqlError('FORBIDDEN', { message: 'mock: cannot delete comment' });
      comment.deletedAt = ctx.clock.now;
      touch();
      return comment.id;
    },
    // BD-04 등록 — 제목 1~60자 · 태그 ≤5(개당 ≤20) · 커밋 0~1개 · 본인 소속 팀만. 필수 항목이 비어도 저장(E-24)
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
    // BD-04 수정 — 작성자 · 연결 팀 팀장. 종류는 그대로. 팀장이 남의 글을 고칠 때 teamId는 무시(BD-04 비고)
    updatePost: (_: unknown, { id, input }: MutationUpdatePostArgs, ctx: MockContext) => {
      const viewer = requireViewer(ctx);
      const p = livePost(ctx, id);
      if (!canEditPost(ctx, p)) throw gqlError('FORBIDDEN', { message: 'mock: cannot edit post' });
      const next = {
        title: cleanTitle(input.title),
        sections: cleanSections(p.type, input.sections),
        tags: cleanTags(input.tags),
        commitUrls: cleanCommitUrls(input.commitUrls),
        teamId: p.authorId === viewer.id ? cleanTeamId(ctx, input.teamId, p.teamId) : p.teamId,
      };
      Object.assign(p, next, { updatedAt: ctx.clock.now });
      touch();
      return postView(ctx, p);
    },
    // BD-03 ⑫ — 1~500자. 삭제된 글 → POST_DELETED
    addComment: (_: unknown, { postId, content }: MutationAddCommentArgs, ctx: MockContext) => {
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
