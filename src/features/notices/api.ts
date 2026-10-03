/**
 * 공지 GraphQL 문서 (설계서 9장 NT-01 · NT-02). 연산 이름은 `Notice…`로 시작한다.
 * 공지 작성 · 수정 · 고정 · 삭제는 관리자 영역(AD 공지 탭)이다.
 */
import { graphql } from '@/gql';

/** 고정 공지가 먼저, 그다음 최신순 (서버 정렬) */
export const NoticeListQuery = graphql(`
  query NoticeListQuery($first: Int, $after: String) {
    notices(first: $first, after: $after) {
      nodes {
        id
        title
        isPinned
        createdAt
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

export const NoticeDetailQuery = graphql(`
  query NoticeDetailQuery($id: ID!) {
    notice(id: $id) {
      id
      title
      content
      isPinned
      isSystem
      createdAt
      updatedAt
    }
  }
`);
