import type { ApolloCache } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import { MSG } from '@/domain/messages';
import type { AdminNoticesQueryQuery } from '@/gql/graphql';
import { DEFAULT_PAGE_SIZE, useAction, usePagedList } from '@/shared/api';
import { formatDotDate } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import { Button, DataTable, EmptyState, Icon, LoadMore, Pill, QueryBoundary, TableSkeleton, useConfirm, type Column } from '@/shared/ui';
import { AdminNoticesDelete, AdminNoticesQuery, AdminNoticesSetPinned } from './api';
import { SYSTEM_NOTICE_HINT, sortNotices } from './order';
import s from './Notices.module.css';

type Notice = AdminNoticesQueryQuery['notices']['nodes'][number];

/** ⑥ 공지 목록. 행마다 고정 토글 · [수정] · [삭제] */
export function NoticeList() {
  const navigate = useNavigate();
  const list = usePagedList(AdminNoticesQuery, { variables: {}, select: (d) => d.notices });

  const columns: Column<Notice>[] = [
    {
      key: 'title',
      header: '제목',
      render: (n) => (
        <span className={s.titleCell}>
          {n.isPinned ? (
            <span className={s.pin}>
              <Icon name="pin" size={15} title="고정됨" />
            </span>
          ) : null}
          <Link to={paths.notice(n.id)} className={s.noticeLink}>
            {n.title}
          </Link>
          {n.isSystem ? (
            <Pill tone="info" icon="shield">
              잔디 인정 규칙
            </Pill>
          ) : null}
          {n.isSystem ? <span className={s.sysHint}>{SYSTEM_NOTICE_HINT}</span> : null}
        </span>
      ),
    },
    { key: 'date', header: '작성일', render: (n) => <span className={s.date}>{formatDotDate(n.createdAt)}</span> },
    { key: 'pin', header: '고정', render: (n) => <PinToggle notice={n} /> },
    { key: 'actions', header: '처리', align: 'right', render: (n) => <NoticeActions notice={n} /> },
  ];

  return (
    <QueryBoundary loading={list.loading} error={list.error} data={list.data} skeleton={<TableSkeleton rows={5} cols={4} />} onRetry={list.refetch}>
      {() =>
        list.nodes.length === 0 ? (
          <EmptyState
            icon="mega"
            title="등록된 공지가 없어요."
            action={
              <Button icon="plus" onClick={() => navigate(paths.adminNotices({ editor: 'new' }))}>
                공지 작성
              </Button>
            }
          />
        ) : (
          <>
            <div className={s.table}>
              <DataTable columns={columns} rows={sortNotices(list.nodes)} rowKey={(n) => n.id} caption="공지" />
            </div>
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
  );
}

/**
 * ⑥ 고정 ON/OFF. 고정은 즉시(낙관적), 해제는 단순 확인형을 거친다
 * (②-4 ⑥ "즉시 토글"과 공통 요소 "고정 해제 = 단순 확인형"을 함께 만족하는 C-25 잠정안).
 */
const optimisticNotice = (id: string, isPinned: boolean) => ({ __typename: 'Notice' as const, id, isPinned });

function PinToggle({ notice }: { notice: Notice }) {
  const confirm = useConfirm();
  const [setPinned] = useMutation(AdminNoticesSetPinned);
  const toggle = useAction(
    (pinned: boolean) =>
      setPinned({
        variables: { id: notice.id, pinned },
        // __typename이 있어야 Notice:{id}에 바로 반영된다 (생성 타입에는 없어서 변수로 넘긴다)
        optimisticResponse: { setNoticePinned: optimisticNotice(notice.id, pinned) },
        refetchQueries: [AdminNoticesQuery],
      }),
    { success: (r) => (r.data?.setNoticePinned.isPinned ? '맨 위에 고정했어요.' : '고정을 해제했어요.') },
  );

  return (
    <Button
      size="xs"
      variant={notice.isPinned ? 'dark' : 'outline'}
      icon="pin"
      aria-pressed={notice.isPinned}
      aria-label={`${notice.title} 고정`}
      disabled={toggle.pending}
      onClick={async () => {
        if (!notice.isPinned) {
          await toggle.run(true);
          return;
        }
        const ok = await confirm({ title: '고정을 해제할까요?', body: '해제하면 목록 맨 위에서 내려가요.', confirmLabel: '해제' });
        if (ok) await toggle.run(false);
      }}
    >
      고정
    </Button>
  );
}

/** ⑥ [수정] → ⑦ 에디터 · [삭제] → 단순 확인형(danger). 잔디 인정 규칙 공지는 [삭제]를 두지 않는다(EX-AD01-02) */
function NoticeActions({ notice }: { notice: Notice }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [deleteNotice] = useMutation(AdminNoticesDelete);
  const remove = useAction(
    () =>
      deleteNotice({
        variables: { id: notice.id },
        refetchQueries: [AdminNoticesQuery],
        awaitRefetchQueries: true,
        update: (cache: ApolloCache) => {
          const id = cache.identify({ __typename: 'Notice', id: notice.id });
          if (id) cache.evict({ id });
          cache.gc();
        },
      }),
    { success: MSG.deleted },
  );

  return (
    <span className={s.actions}>
      <Button size="xs" variant="outline" aria-label={`${notice.title} 수정`} onClick={() => navigate(paths.adminNotices({ editor: notice.id }))}>
        수정
      </Button>
      {notice.isSystem ? null : (
        <Button
          size="xs"
          variant="danger"
          loading={remove.pending}
          aria-label={`${notice.title} 삭제`}
          onClick={async () => {
            const ok = await confirm({
              title: '공지를 삭제할까요?',
              body: '삭제하면 되돌릴 수 없어요. 회원 화면에서도 사라져요.',
              confirmLabel: '삭제',
              tone: 'danger',
            });
            if (ok) await remove.run();
          }}
        >
          삭제
        </Button>
      )}
    </span>
  );
}
