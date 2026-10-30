import { graphql } from '@/gql';

/**
 * AD-01 ②-4 공지 관리 (화면설계서 5-1-10 ②-4 · EX-AD01-02). 연산 이름은 `AdminNotices*`.
 * 목록은 NT-01과 같은 notices 필드(고정 먼저, 그다음 최신순)를 쓴다. 고정 토글만 낙관적으로 바꾼다(요구사항 6-5).
 */

export const AdminNoticesQuery = graphql(`
  query AdminNoticesQuery($after: String) {
    notices(after: $after) {
      items {
        id
        title
        isPinned
        isSystem
        createdAt
        updatedAt
      }
      nextCursor
    }
  }
`);

/** ⑦ 에디터 — 수정할 공지 */
export const AdminNoticesEditorQuery = graphql(`
  query AdminNoticesEditorQuery($id: ID!) {
    notice(id: $id) {
      id
      title
      content
      isPinned
      isSystem
    }
  }
`);

export const AdminNoticesCreate = graphql(`
  mutation AdminNoticesCreate($input: NoticeInput!) {
    createNotice(input: $input) {
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

export const AdminNoticesUpdate = graphql(`
  mutation AdminNoticesUpdate($id: ID!, $input: NoticeInput!) {
    updateNotice(id: $id, input: $input) {
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

export const AdminNoticesDelete = graphql(`
  mutation AdminNoticesDelete($id: ID!) {
    deleteNotice(id: $id)
  }
`);

/** ⑥ 고정 ON/OFF — Notice:{id}.isPinned만 바뀐다 */
export const AdminNoticesSetPinned = graphql(`
  mutation AdminNoticesSetPinned($id: ID!, $isPinned: Boolean!) {
    setNoticePinned(id: $id, isPinned: $isPinned) {
      id
      isPinned
    }
  }
`);
