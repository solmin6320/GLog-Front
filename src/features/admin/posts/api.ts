import { graphql } from '@/gql';

/**
 * AD-01 ②-5 게시물 관리 (화면설계서 5-1-10 ②-5). 연산 이름은 `AdminPosts*`.
 * 글 + 댓글 혼합 목록(최신순 20개씩). 팀은 묻지 않는다 — 비공개 팀 이름이 새는 경로를 만들지 않는다.
 * 댓글 행은 title에 글 제목, content에 댓글 앞 100자가 온다. 전체 건수는 백엔드에 없다.
 * 삭제는 관리자 전용 adminDeletePost · adminDeleteComment를 쓴다 (deletePost · deleteComment는 작성자 본인만).
 */

export const AdminPostsQuery = graphql(`
  query AdminPostsQuery($filter: AdminPostFilter!, $keyword: String, $after: String) {
    adminPosts(filter: $filter, keyword: $keyword, after: $after) {
      items {
        kind
        id
        postId
        title
        content
        author {
          id
          nickname
        }
        createdAt
      }
      nextCursor
    }
  }
`);

export const AdminPostsDeletePost = graphql(`
  mutation AdminPostsDeletePost($id: ID!) {
    adminDeletePost(postId: $id)
  }
`);

export const AdminPostsDeleteComment = graphql(`
  mutation AdminPostsDeleteComment($id: ID!) {
    adminDeleteComment(commentId: $id)
  }
`);
