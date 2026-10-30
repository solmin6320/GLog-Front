import { useState } from 'react';
import { Link } from 'react-router';
import { DEFAULT_PAGE_SIZE, usePagedList } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import { Avatar, Button, DataTable, Foot, LoadMore, QueryBoundary, SectionHeader, TableSkeleton, type Column } from '@/shared/ui';
import { AdminWarningsDeletedQuery } from './api';
import { COPY, DELETE_REASON_LABEL, type DeletedWarningRow } from './model';
import { RestoreWarningDialog } from './RestoreWarningDialog';
import { TeamNames } from './TeamNames';
import s from './Warnings.module.css';

const NO_VARS = {};

/**
 * ②-1 ⑦ 삭제된 경고 (추방 · 팀 삭제로 카테고리가 모두 빠진 경고) + ⑧ [복구] (W-16 · ACC-PEN-05 ~ 10).
 * 정정 · 소급 면제로 회수된 경고는 서버가 보내지 않는다 — 각주로 알린다.
 */
export function DeletedWarningsSection() {
  const list = usePagedList(AdminWarningsDeletedQuery, { variables: NO_VARS, select: (d) => d.deletedWarnings });
  const [restoring, setRestoring] = useState<DeletedWarningRow | null>(null);

  const columns: Column<DeletedWarningRow>[] = [
    {
      key: 'member',
      header: '회원',
      render: (w) => (
        <Link to={paths.profile(w.member.id)} className={s.member}>
          <Avatar name={w.member.nickname} imageUrl={w.member.profileImageUrl} size={32} />
          <span className={s.memberName}>{w.member.nickname}</span>
        </Link>
      ),
    },
    { key: 'week', header: '부여 주차', render: (w) => <span className={s.nowrap}>{formatWeekRange(w.weekStart)}</span> },
    { key: 'reason', header: '삭제 사유', render: (w) => DELETE_REASON_LABEL[w.deleteReason] },
    { key: 'category', header: '복구 후 카테고리', render: (w) => <TeamNames teams={w.restoreCategories} emptyText={COPY.deletedTeam} /> },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      render: (w) => (
        <Button variant="outline" size="sm" aria-label={`${w.member.nickname} ${formatWeekRange(w.weekStart)} 경고 복구`} onClick={() => setRestoring(w)}>
          복구
        </Button>
      ),
    },
  ];

  return (
    <section className={s.section} aria-labelledby="admin-deleted-title">
      <SectionHeader as="h3" id="admin-deleted-title" title="삭제된 경고" right={COPY.deletedHint} />
      <QueryBoundary
        loading={list.loading}
        error={list.error}
        data={list.data?.deletedWarnings}
        skeleton={<TableSkeleton rows={2} cols={5} />}
        onRetry={list.refetch}
      >
        {() => (
          <>
            <div className={s.stickyEnds}>
              <DataTable
                caption="삭제된 경고"
                columns={columns}
                rows={list.nodes}
                rowKey={(w) => w.id}
                empty={COPY.emptyDeleted}
                footer={<Foot>{COPY.retractedNote}</Foot>}
              />
            </div>
            <LoadMore
              hasMore={list.hasMore}
              loading={list.loadingMore}
              error={list.loadMoreError}
              onLoadMore={list.loadMore}
              endText={list.nodes.length > DEFAULT_PAGE_SIZE ? undefined : null}
            />
          </>
        )}
      </QueryBoundary>
      {restoring ? <RestoreWarningDialog warning={restoring} onClose={() => setRestoring(null)} /> : null}
    </section>
  );
}
