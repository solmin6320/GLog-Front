import { useQuery } from '@apollo/client/react';
import { useParams } from 'react-router';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { formatDateTime } from '@/shared/lib/format';
import { isBigintId } from '@/shared/lib/ids';
import { paths } from '@/shared/lib/paths';
import { FullState, PageContainer, Pill, QueryBoundary, TextLink } from '@/shared/ui';
import { NoticeDetailQuery } from '../api';
import s from './NoticeDetailPage.module.css';

/**
 * NT-02 공지 상세 (화면설계서 5-1-19). noticeId 형식이 틀리면 부르지 않고 404(요구사항 3-2), 없는 공지도 404(E-53).
 * 작성자는 관리자 고정이라 적지 않는다. 본문은 글자 그대로(줄바꿈 유지), 댓글 영역 없음.
 */
export default function NoticeDetailPage() {
  const { noticeId } = useParams();
  if (!isBigintId(noticeId)) {
    return (
      <PageContainer width="md">
        <FullState kind="notFound" />
      </PageContainer>
    );
  }
  return <NoticeDetail id={noticeId} />;
}

function NoticeDetail({ id }: { id: string }) {
  const q = useQuery(NoticeDetailQuery, { variables: { id } });
  // 없는(지운) 공지면 404 화면이므로 탭 제목도 404에 맞춘다
  useDocumentTitle(q.data?.notice?.title ?? (q.data && !q.data.notice ? '페이지를 찾을 수 없음' : '공지사항'));
  return (
    <PageContainer width="md">
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={q.data ? q.data.notice : undefined}
        onRetry={() => void q.refetch()}
      >
        {(notice) => (
          <article>
            {notice.isPinned ? (
              <Pill tone="warn" icon="pin">
                고정
              </Pill>
            ) : null}
            <h1 className={s.title}>{notice.title}</h1>
            <p className={s.date}>
              <time dateTime={notice.createdAt}>{formatDateTime(notice.createdAt)}</time>
              {/* 글 · 댓글과 같이 고친 공지에는 (수정됨) */}
              {notice.updatedAt && notice.updatedAt !== notice.createdAt ? ' (수정됨)' : null}
            </p>
            <div className={s.content}>{notice.content}</div>
            <p className={s.back}>
              <TextLink to={paths.notices()}>공지 목록으로</TextLink>
            </p>
          </article>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
