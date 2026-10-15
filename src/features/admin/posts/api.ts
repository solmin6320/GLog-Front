import { graphql } from '@/gql';

/**
 * AD-01 ②-5 게시물 관리 (화면설계서 5-1-10 ②-5). 연산 이름은 `AdminPosts*`.
 * 글 + 댓글 혼합 목록(최신순). 팀은 묻지 않는다 — 비공개 팀 이름이 새는 경로를 만들지 않는다.
 * 삭제는 BD-03과 같은 deletePost · deleteComment(작성자 또는 관리자)를 쓴다.
 */

export const AdminPostsQuery = graphql(`
  query AdminPostsQuery($filter: AdminContentFilter!, $search: String, $first: Int, $after: String) {
    adminContents(filter: $filter, search: $search, first: $first, after: $after) {
      nodes {
        kind
        targetId
        postId
        postType
        title
        author {
          id
          nickname
        }
        createdAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`);

export const AdminPostsDeletePost = graphql(`
  mutation AdminPostsDeletePost($id: ID!) {
    deletePost(id: $id)
  }
`);

export const AdminPostsDeleteComment = graphql(`
  mutation AdminPostsDeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`);
