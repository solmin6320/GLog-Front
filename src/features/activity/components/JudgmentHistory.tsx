import type { ReactNode } from 'react';
import type { WeeklyHistoryQueryQuery } from '@/gql/graphql';
import type { PagedList } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { DataTable, EmptyState, Foot, LoadMore, SectionHeader, StatusBadge, TableSkeleton, type Column } from '@/shared/ui';
import { WEEKLY_COPY } from '../copy';
import s from '../activity.module.css';
import { SectionError } from './SectionError';

type Row = WeeklyHistoryQueryQuery['myJudgmentHistory']['items'][number];

const COLUMNS: Column<Row>[] = [
  { key: 'week', header: '주차', width: '36%', render: (r) => formatWeekRange(r.weekStart) },
  // 판정 제외 · 면제 · 보류 주는 서버가 null → '—'
  { key: 'days', header: '인증일', render: (r) => (r.verifiedDays == null ? '—' : `${r.verifiedDays}일`) },
  { key: 'records', header: '기록글', render: (r) => (r.recordCount == null ? '—' : `${r.recordCount}개`) },
  {
    key: 'result',
    header: '결과',
    // 통과 · 미달 · 면제 · 첫 참가 · 제외 · 확인 중(HOLD, M-05)
    render: (r) => <StatusBadge kind="judgment" status={r.status} skipReason={r.skipReason} context="member" />,
  },
];

/** AC-01 ⑤ 지난 판정 + ⑥ 불변 안내. 주차를 옮겨도 그대로다 */
export function JudgmentHistory({ list }: { list: PagedList<WeeklyHistoryQueryQuery, Row> }) {
  let body: ReactNode;
  if (!list.data && list.loading) {
    body = <TableSkeleton rows={5} cols={4} />;
  } else if (!list.data && list.error) {
    body = <SectionError message={WEEKLY_COPY.historyFailed} onRetry={list.refetch} />;
  } else if (list.nodes.length === 0) {
    body = <EmptyState title={WEEKLY_COPY.noHistory} />;
  } else {
    body = (
      <>
        <DataTable caption="지난 판정" columns={COLUMNS} rows={list.nodes} rowKey={(r) => r.weekStart} />
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onLoadMore={list.loadMore} endText={null} />
        {list.nodes.some((r) => r.status === 'HOLD') ? <Foot>{WEEKLY_COPY.holdNote}</Foot> : null}
      </>
    );
  }
  return (
    <section className={s.history} aria-labelledby="weekly-history-title">
      <SectionHeader id="weekly-history-title" title="지난 판정" />
      {body}
      <Foot>{WEEKLY_COPY.immutable}</Foot>
    </section>
  );
}
