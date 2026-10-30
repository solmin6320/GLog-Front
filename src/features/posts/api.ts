/**
 * 게시판 GraphQL 문서 (설계서 9장 BD-01 · BD-03 · BD-04). 연산 이름은 `Post…`로 시작한다.
 * 목록 문서는 `$after`를 받고, 백엔드 `{ items, nextCursor }`를 toPaged로 usePagedList에 넘긴다.
 */
import type { ApolloCache, Reference } from '@apollo/client';
import { graphql } from '@/gql';

/* ---------- BD-01 목록 ---------- */

/** 최신순 20개씩 (백엔드 고정). 팀 이름은 공개 팀만 teamName으로 온다 */
export const PostListQuery = graphql(`
  query PostListQuery($type: PostType!, $q: String, $tag: String, $after: String) {
    posts(type: $type, q: $q, tag: $tag, after: $after) {
      items {
        id
        type
        title
        tags
        isRecord
        createdAt
        commentCount
        author {
          id
          nickname
        }
        teamName
      }
      nextCursor
      totalCount
    }
  }
`);

/**
 * BD-01 ① 검색 시 탭별 결과 수 (W-05). 탭별 건수 API가 없어 두 종류의 totalCount를 따로 센다.
 * 목록과 같은 캐시 칸에 items 없는 값을 쓰지 않게 no-cache로 부른다.
 */
export const PostTypeCountsQuery = graphql(`
  query PostTypeCountsQuery($q: String, $tag: String) {
    troubleshooting: posts(type: TROUBLESHOOTING, q: $q, tag: $tag) {
      totalCount
    }
    devlog: posts(type: DEVLOG, q: $q, tag: $tag) {
      totalCount
    }
  }
`);

/** BD-01 ④ 많이 쓰인 태그 10개 (W-11 — 종류 무관 순위) */
export const PostTagsQuery = graphql(`
  query PostTagsQuery {
    popularTags {
      tag
      count
    }
  }
`);

/* ---------- BD-03 상세 ---------- */

/**
 * 상세 + 댓글(오래된 순, 20개씩). 댓글 [더 보기]도 이 문서로 이어 붙인다.
 * 수정 권한(작성자 · 그 글 팀의 팀장)은 내 팀의 isLeader로 계산한다 — 백엔드에 viewerCan* 필드가 없다.
 * 없는 글은 NOT_FOUND, 삭제된 글은 POST_DELETED 오류로 온다.
 */
export const PostDetailQuery = graphql(`
  query PostDetailQuery($id: ID!, $after: String) {
    post(id: $id) {
      id
      authorId
      teamId
      teamName
      type
      title
      sections {
        problem
        cause
        solution
        did
        learned
      }
      tags
      commitUrls
      author {
        id
        nickname
        profileImageUrl
      }
      isRecord
      writtenDate
      createdAt
      updatedAt
      commentCount
      comments(after: $after) {
        items {
          id
          authorId
          content
          createdAt
          updatedAt
          author {
            id
            nickname
            profileImageUrl
          }
        }
        nextCursor
      }
    }
    myTeams {
      id
      isLeader
    }
  }
`);

export const PostDelete = graphql(`
  mutation PostDelete($id: ID!) {
    deletePost(id: $id)
  }
`);

/** 관리자가 남의 글을 지울 때 (작성자 본인은 deletePost) */
export const PostAdminDelete = graphql(`
  mutation PostAdminDelete($postId: ID!) {
    adminDeletePost(postId: $postId)
  }
`);

export const PostAddComment = graphql(`
  mutation PostAddComment($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      id
      content
      createdAt
      updatedAt
    }
  }
`);

export const PostUpdateComment = graphql(`
  mutation PostUpdateComment($id: ID!, $content: String!) {
    updateComment(id: $id, content: $content) {
      id
      content
      updatedAt
    }
  }
`);

export const PostDeleteComment = graphql(`
  mutation PostDeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`);

/** 관리자가 남의 댓글을 지울 때 */
export const PostAdminDeleteComment = graphql(`
  mutation PostAdminDeleteComment($commentId: ID!) {
    adminDeleteComment(commentId: $commentId)
  }
`);

/* ---------- BD-04 작성 · 수정 ---------- */

/** 소속 팀 셀렉트(⑨)와 팀장 여부. E-27 배너 시각은 세션 시계(useClock)를 쓴다 */
export const PostEditorTeamsQuery = graphql(`
  query PostEditorTeamsQuery {
    myTeams {
      id
      name
      isPublic
      isLeader
    }
  }
`);

/** 수정 모드 원본 */
export const PostEditorPostQuery = graphql(`
  query PostEditorPostQuery($id: ID!) {
    post(id: $id) {
      id
      authorId
      teamId
      type
      title
      sections {
        problem
        cause
        solution
        did
        learned
      }
      tags
      commitUrls
      isRecord
      writtenDate
    }
  }
`);

/** 저장 결과로 상세 화면 필드를 같이 받아 캐시를 바로 맞춘다 */
export const PostCreate = graphql(`
  mutation PostCreate($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      type
      title
      sections {
        problem
        cause
        solution
        did
        learned
      }
      tags
      commitUrls
      isRecord
      teamId
      teamName
      writtenDate
      createdAt
      updatedAt
    }
  }
`);

export const PostUpdate = graphql(`
  mutation PostUpdate($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      type
      title
      sections {
        problem
        cause
        solution
        did
        learned
      }
      tags
      commitUrls
      isRecord
      teamId
      teamName
      updatedAt
    }
  }
`);

/* ---------- 캐시 정리 ---------- */

/**
 * 글이 생기거나 바뀌면 목록 · 인기 태그를 버린다. 다음에 BD-01에 들어오면 새로 받는다
 * (지금 화면에 떠 있지 않아 refetchQueries로는 다시 부를 수 없다).
 */
export function dropPostLists(cache: ApolloCache): void {
  for (const fieldName of ['posts', 'popularTags']) cache.evict({ id: 'ROOT_QUERY', fieldName });
  cache.gc();
}

/** 지운 글을 캐시에 남은 모든 목록에서 뺀다 (목록 화면으로 돌아갔을 때 잠깐 보이지 않게) */
export function removePostFromLists(cache: ApolloCache, postId: string): void {
  cache.modify({
    id: 'ROOT_QUERY',
    fields: {
      posts(existing, { readField }) {
        const page = existing as { items?: readonly unknown[]; totalCount?: number } | undefined;
        if (!page?.items) return existing;
        const items = page.items.filter((ref) => readField<string>('id', ref as Reference) !== postId);
        if (items.length === page.items.length) return existing;
        const totalCount = typeof page.totalCount === 'number' ? Math.max(0, page.totalCount - 1) : page.totalCount;
        return { ...page, items, totalCount };
      },
    },
  });
  cache.evict({ id: 'ROOT_QUERY', fieldName: 'popularTags' });
  cache.gc();
}
