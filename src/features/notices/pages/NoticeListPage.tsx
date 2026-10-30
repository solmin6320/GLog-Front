import { DEFAULT_PAGE_SIZE, toPaged, usePagedList } from '@/shared/api';
import { formatDateTimeMD } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import {
  EmptyState,
  Icon,
  ListSkeleton,
  LoadMore,
  PageContainer,
  PageTitle,
  QueryBoundary,
  RowItem,
  RowList,
  VisuallyHidden,
} from '@/shared/ui';
import { NoticeListQuery } from '../api';
import s from './NoticeListPage.module.css';

/**
 * NT-01 공지 목록 (화면설계서 5-1-18). 고정 공지가 📌와 함께 맨 위(①), 나머지는 최신순(②) — 정렬은 서버가 한다.
 * 읽기 전용 · 댓글 없음. 20개씩 [더 보기](③).
 */
export default function NoticeListPage() {
  const list = usePagedList(NoticeListQuery, { variables: {}, select: (d) => toPaged(d.notices) });
  return (
    <PageContainer>
      <PageTitle title="공지사항" />
      <div className={s.body}>
        <QueryBoundary
          loading={list.loading}
          error={list.error}
          data={list.data}
          onRetry={list.refetch}
          skeleton={<ListSkeleton rows={5} />}
        >
          {() =>
            list.nodes.length === 0 ? (
              <EmptyState icon="mega" title="등록된 공지가 없어요." />
            ) : (
              <>
                <RowList ariaLabel="공지 목록">
                  {list.nodes.map((n) => (
                    <RowItem key={n.id} to={paths.notice(n.id)} right={<span>{formatDateTimeMD(n.createdAt)}</span>}>
                      <span className={n.isPinned ? s.pin : s.pinSpace} aria-hidden={n.isPinned ? undefined : true}>
                        {n.isPinned ? (
                          <>
                            <Icon name="pin" size={15} />
                            <VisuallyHidden>고정 공지</VisuallyHidden>
                          </>
                        ) : null}
                      </span>
                      <span className={n.isPinned ? s.titlePinned : s.title}>{n.title}</span>
                    </RowItem>
                  ))}
                </RowList>
                <LoadMore
                  hasMore={list.hasMore}
                  loading={list.loadingMore}
                  error={list.loadMoreError}
                  onLoadMore={list.loadMore}
                  endText={list.nodes.length > DEFAULT_PAGE_SIZE ? undefined : null}
                />
              </>
            )
          }
        </QueryBoundary>
      </div>
    </PageContainer>
  );
}
