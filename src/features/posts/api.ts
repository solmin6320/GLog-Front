/**
 * 게시판 GraphQL 문서 (설계서 9장 BD-01 · BD-03 · BD-04). 연산 이름은 `Post…`로 시작한다.
 * 목록 문서는 usePagedList 규칙대로 `$first` · `$after`를 받는다.
 */
import type { ApolloCache, Reference } from '@apollo/client';
import { graphql } from '@/gql';

/* ---------- BD-01 목록 ---------- */

export const PostListQuery = graphql(`
  query PostListQuery($filter: PostFilter!, $first: Int, $after: String) {
    posts(filter: $filter, first: $first, after: $after) {
      nodes {
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
        publicTeam {
          id
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`);

/** BD-01 ① 검색 시 탭별 결과 수 (W-05) */
export const PostTypeCountsQuery = graphql(`
  query PostTypeCountsQuery($filter: PostFilter!) {
    postTypeCounts(filter: $filter) {
      troubleshooting
      devlog
    }
  }
`);

/** BD-01 ④ 많이 쓰인 태그 10개 (W-11 — 종류 무관 순위) */
export const PostTagsQuery = graphql(`
  query PostTagsQuery {
    popularTags(first: 10) {
      tag
      count
    }
  }
`);

/* ---------- BD-03 상세 ---------- */

/** 상세 + 댓글(등록순, 50개씩). 댓글 [더 보기]도 이 문서로 이어 붙인다 */
export const PostDetailQuery = graphql(`
  query PostDetailQuery($id: ID!, $first: Int, $after: String) {
    post(id: $id) {
      __typename
      ... on Post {
        id
        type
        title
        sections {
          key
          body
        }
        tags
        commitUrls
        author {
          id
          nickname
          profileImageUrl
        }
        publicTeam {
          id
          name
        }
        isRecord
        inFinalizedWeek
        createdAt
        updatedAt
        commentCount
        viewerCanEdit
        viewerCanDelete
        viewerIsAuthor
        comments(first: $first, after: $after) {
          nodes {
            id
            content
            createdAt
            updatedAt
            viewerCanEdit
            viewerCanDelete
            author {
              id
              nickname
              profileImageUrl
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
          totalCount
        }
      }
      ... on DeletedPost {
        id
        deletedAt
      }
    }
  }
`);

export const PostDelete = graphql(`
  mutation PostDelete($id: ID!) {
    deletePost(id: $id)
  }
`);

export const PostAddComment = graphql(`
  mutation PostAddComment($postId: ID!, $content: String!) {
    addComment(postId: $postId, content: $content) {
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

/* ---------- BD-04 작성 · 수정 ---------- */

/**
 * 소속 팀 셀렉트(⑨)와 E-27 배너용 서버 시각.
 * clock을 다시 받으면 세션 시계(useClock)도 같은 캐시 값으로 새로워진다 — 오래 켜 둔 탭에서도 배너가 맞게 뜬다.
 */
export const PostEditorTeamsQuery = graphql(`
  query PostEditorTeamsQuery {
    clock {
      now
      currentWeekStart
      currentWeekEnd
    }
    myTeams {
      id
      name
      isPublic
    }
  }
`);

/** 수정 모드 원본 */
export const PostEditorPostQuery = graphql(`
  query PostEditorPostQuery($id: ID!) {
    post(id: $id) {
      __typename
      ... on Post {
        id
        type
        title
        sections {
          key
          body
        }
        tags
        commitUrls
        isRecord
        inFinalizedWeek
        viewerCanEdit
        viewerIsAuthor
        editTeamId
      }
      ... on DeletedPost {
        id
      }
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
        key
        body
      }
      tags
      commitUrls
      isRecord
      createdAt
      updatedAt
      editTeamId
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
        key
        body
      }
      tags
      commitUrls
      isRecord
      inFinalizedWeek
      updatedAt
      editTeamId
      publicTeam {
        id
        name
      }
    }
  }
`);

/* ---------- 캐시 정리 ---------- */

/**
 * 글이 생기거나 바뀌면 목록 · 탭 건수 · 인기 태그를 버린다. 다음에 BD-01에 들어오면 새로 받는다
 * (지금 화면에 떠 있지 않아 refetchQueries로는 다시 부를 수 없다).
 */
export function dropPostLists(cache: ApolloCache): void {
  for (const fieldName of ['posts', 'postTypeCounts', 'popularTags']) cache.evict({ id: 'ROOT_QUERY', fieldName });
  cache.gc();
}

/** 지운 글을 캐시에 남은 모든 목록에서 뺀다 (목록 화면으로 돌아갔을 때 잠깐 보이지 않게) */
export function removePostFromLists(cache: ApolloCache, postId: string): void {
  cache.modify({
    id: 'ROOT_QUERY',
    fields: {
      posts(existing, { readField }) {
        const conn = existing as { nodes?: readonly unknown[]; totalCount?: number } | undefined;
        if (!conn?.nodes) return existing;
        const nodes = conn.nodes.filter((ref) => readField<string>('id', ref as Reference) !== postId);
        if (nodes.length === conn.nodes.length) return existing;
        const totalCount = typeof conn.totalCount === 'number' ? Math.max(0, conn.totalCount - 1) : conn.totalCount;
        return { ...conn, nodes, totalCount };
      },
    },
  });
  for (const fieldName of ['postTypeCounts', 'popularTags']) cache.evict({ id: 'ROOT_QUERY', fieldName });
  cache.gc();
}
