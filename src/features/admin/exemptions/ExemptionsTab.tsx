import { useId, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useAction, usePagedList, type PagedList } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import type { PersonalExemptionStatus } from '@/gql/graphql';
import { Button, DataTable, EmptyState, Icon, LoadMore, QueryBoundary, Select, StatusBadge, TableSkeleton, type Column } from '@/shared/ui';
import { AdminExemptionsApprove, AdminExemptionsPeriodsQuery, AdminExemptionsRequestsQuery, AdminExemptionsSummaryQuery } from './api';
import { COPY, exemptionsRefetch, requestLine, type PeriodRow, type RequestRow } from './model';
import { DeletePeriodDialog, PeriodDialog } from './PeriodDialogs';
import { ApproveDialog, RejectDialog } from './RequestDialogs';
import s from './Exemptions.module.css';

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; period: PeriodRow }
  | { kind: 'delete'; period: PeriodRow }
  | { kind: 'approve'; request: RequestRow }
  | { kind: 'reject'; request: RequestRow };

/**
 * AD-01 ②-3 면제 관리 (`/admin/exemptions`, 화면설계서 5-1-10 ②-3).
 * ⑤ 전체 면제 기간 목록 · ⑥ 등록 · ⑦ 개인 면제 요청(대기). 판정이 끝난 주를 건드리는 조작은 영향 미리보기형을 거친다(E-45).
 */
export function ExemptionsTab() {
  useDocumentTitle(COPY.title);
  const titleId = useId();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const periods = usePagedList(AdminExemptionsPeriodsQuery, { variables: {}, select: (d) => d.exemptionPeriods });
  // 기본은 대기. 처리한 요청(승인 · 거절)도 다시 볼 수 있게 상태를 고른다
  const [reqStatus, setReqStatus] = useState<PersonalExemptionStatus>('PENDING');
  const requests = usePagedList(AdminExemptionsRequestsQuery, {
    variables: { status: reqStatus },
    select: (d) => d.personalExemptionRequests,
  });
  const pending = useQuery(AdminExemptionsSummaryQuery).data?.adminDashboardSummary.pendingExemptionRequestCount;

  const bothLoaded = !!periods.data && !!requests.data;
  const allEmpty = bothLoaded && reqStatus === 'PENDING' && periods.nodes.length === 0 && requests.nodes.length === 0;
  const registerButton = (
    <Button icon="half" onClick={() => setDialog({ kind: 'create' })}>
      {COPY.register}
    </Button>
  );

  return (
    <section aria-labelledby={titleId}>
      <div className={s.head}>
        <h2 id={titleId} className={s.title}>
          {COPY.title}
        </h2>
        {pending != null ? <span className={s.meta}>{COPY.pending(pending)}</span> : null}
        {/* 둘 다 비었으면 빈 상태가 같은 버튼을 들고 있다 */}
        {allEmpty ? null : <div className={s.headAction}>{registerButton}</div>}
      </div>

      {allEmpty ? (
        <EmptyState icon="half" title={COPY.emptyAll} action={registerButton} />
      ) : (
        <>
          <PeriodsSection list={periods} onEdit={(period) => setDialog({ kind: 'edit', period })} onDelete={(period) => setDialog({ kind: 'delete', period })} />
          <RequestsSection
            list={requests}
            status={reqStatus}
            onStatus={setReqStatus}
            onApproveRetro={(request) => setDialog({ kind: 'approve', request })}
            onReject={(request) => setDialog({ kind: 'reject', request })}
          />
        </>
      )}

      {dialog?.kind === 'create' ? <PeriodDialog onClose={close} /> : null}
      {dialog?.kind === 'edit' ? <PeriodDialog period={dialog.period} onClose={close} /> : null}
      {dialog?.kind === 'delete' ? <DeletePeriodDialog period={dialog.period} onClose={close} /> : null}
      {dialog?.kind === 'approve' ? <ApproveDialog request={dialog.request} onClose={close} /> : null}
      {dialog?.kind === 'reject' ? <RejectDialog request={dialog.request} onClose={close} /> : null}
    </section>
  );
}

/* ---------- ⑤ 전체 면제 기간 ---------- */

function PeriodsSection({
  list,
  onEdit,
  onDelete,
}: {
  list: PagedList<unknown, PeriodRow>;
  onEdit: (p: PeriodRow) => void;
  onDelete: (p: PeriodRow) => void;
}) {
  const headingId = useId();
  const columns: Column<PeriodRow>[] = [
    {
      key: 'week',
      header: '주간',
      render: (r) => (
        <span className={s.week}>
          {formatWeekRange(r.weekStart)}
          {r.isPast ? <span className={s.pastTag}>{COPY.pastWeek}</span> : null}
        </span>
      ),
    },
    { key: 'reason', header: '사유', render: (r) => <span className={s.reason}>{r.reason}</span> },
    {
      key: 'actions',
      header: '처리',
      align: 'right',
      render: (r) => (
        <span className={s.actions}>
          <Button size="xs" variant="outline" aria-label={`수정: ${formatWeekRange(r.weekStart)} 면제`} onClick={() => onEdit(r)}>
            수정
          </Button>
          <Button size="xs" variant="danger" aria-label={`삭제: ${formatWeekRange(r.weekStart)} 면제`} onClick={() => onDelete(r)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <section className={s.section} aria-labelledby={headingId}>
      <div className={s.sectionHead}>
        <h3 id={headingId} className={s.sectionTitle}>
          {COPY.periodsTitle}
        </h3>
        <span className={s.meta}>{COPY.periodsHint}</span>
      </div>
      <QueryBoundary loading={list.loading} error={list.error} data={list.data} skeleton={<TableSkeleton rows={3} cols={3} />} onRetry={list.refetch}>
        {() =>
          list.nodes.length === 0 ? (
            <p className={s.empty}>{COPY.emptyPeriods}</p>
          ) : (
            <>
              <div className={s.table}>
                <DataTable columns={columns} rows={list.nodes} rowKey={(r) => r.id} caption={COPY.periodsTitle} />
              </div>
              <LoadMore hasMore={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onLoadMore={list.loadMore} endText={null} />
            </>
          )
        }
      </QueryBoundary>
      <p className={s.note}>
        <Icon name="alert" size={14} />
        <span>{COPY.retroNote}</span>
      </p>
    </section>
  );
}

/* ---------- ⑦ 개인 면제 요청 ---------- */

const REQUEST_STATUS_OPTIONS: { value: PersonalExemptionStatus; label: string }[] = [
  { value: 'PENDING', label: '대기' },
  { value: 'APPROVED', label: '승인함' },
  { value: 'REJECTED', label: '거절함' },
];

function RequestsSection({
  list,
  status,
  onStatus,
  onApproveRetro,
  onReject,
}: {
  list: PagedList<unknown, RequestRow>;
  status: PersonalExemptionStatus;
  onStatus: (s: PersonalExemptionStatus) => void;
  onApproveRetro: (r: RequestRow) => void;
  onReject: (r: RequestRow) => void;
}) {
  const headingId = useId();
  const client = useApolloClient();
  const [approve] = useMutation(AdminExemptionsApprove);
  // 판정 전 주는 바로 승인한다 — 행이 빠지고 탭 배지 · 대기 수가 준다 (ACC-ADM-08)
  const direct = useAction(
    (requestId: string) => approve({ variables: { requestId, expectedBasis: null }, refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.approved,
      errorOverrides: { NOT_FOUND: COPY.gone },
      onError: (e) => {
        if (e.code === 'NOT_FOUND') client.refetchQueries({ include: exemptionsRefetch() }).catch(() => undefined);
        return false;
      },
    },
  );

  const onApprove = (r: RequestRow) => {
    if (r.isRetroactive) onApproveRetro(r);
    else void direct.run(r.id);
  };

  const columns: Column<RequestRow>[] = [
    { key: 'who', header: '요청', render: (r) => <b className={s.who}>{requestLine(r)}</b> },
    {
      key: 'week',
      header: '주간',
      render: (r) => (
        <span className={s.week}>
          {formatWeekRange(r.weekStart)}
          {r.isRetroactive ? <span className={s.pastTag}>{COPY.pastWeek}</span> : null}
        </span>
      ),
    },
    {
      key: 'reason',
      header: '사유',
      render: (r) => (
        <div className={s.reasonCell}>
          <span className={s.reason}>{r.reason}</span>
          {r.overlapsExemptionPeriod ? (
            <span className={s.overlap}>
              <Icon name="info" size={13} />
              {COPY.overlaps}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '처리',
      align: 'right',
      render: (r) => {
        // 처리한 요청: 결과와 거절 사유만 보인다
        if (r.status !== 'PENDING') {
          return (
            <span className={s.result}>
              <StatusBadge kind="exemptionRequest" status={r.status} />
              {r.rejectReason ? <span className={s.rejectReason}>{r.rejectReason}</span> : null}
            </span>
          );
        }
        const target = `${r.member.nickname} ${formatWeekRange(r.weekStart)}`;
        return (
          <span className={s.actions}>
            <Button size="xs" disabled={direct.pending} aria-label={`승인: ${target}`} onClick={() => onApprove(r)}>
              승인
            </Button>
            <Button size="xs" variant="outline" disabled={direct.pending} aria-label={`거절: ${target}`} onClick={() => onReject(r)}>
              거절
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <section className={s.section} aria-labelledby={headingId}>
      <div className={s.sectionHead}>
        <h3 id={headingId} className={s.sectionTitle}>
          {COPY.requestsTitle}
        </h3>
        {list.totalCount != null && status === 'PENDING' ? <span className={s.meta}>대기 {list.totalCount}건</span> : null}
        <div className={s.headAction}>
          <Select
            aria-label="요청 상태"
            options={REQUEST_STATUS_OPTIONS}
            value={status}
            onChange={(e) => onStatus(e.target.value as PersonalExemptionStatus)}
          />
        </div>
      </div>
      <QueryBoundary loading={list.loading} error={list.error} data={list.data} skeleton={<TableSkeleton rows={2} cols={4} />} onRetry={list.refetch}>
        {() =>
          list.nodes.length === 0 ? (
            <p className={s.empty}>{status === 'PENDING' ? COPY.emptyRequests : status === 'APPROVED' ? COPY.emptyApproved : COPY.emptyRejected}</p>
          ) : (
            <>
              <div className={s.table}>
                <DataTable columns={columns} rows={list.nodes} rowKey={(r) => r.id} caption={COPY.requestsTitle} />
              </div>
              <LoadMore hasMore={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onLoadMore={list.loadMore} endText={null} />
            </>
          )
        }
      </QueryBoundary>
      <p className={s.note}>
        <Icon name="info" size={14} />
        <span>{COPY.requestsHint}</span>
      </p>
    </section>
  );
}
