import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { useAction } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import {
  Avatar,
  Button,
  DataTable,
  Foot,
  QueryBoundary,
  SectionHeader,
  StatusBadge,
  TableSkeleton,
  useConfirm,
  type Column,
} from '@/shared/ui';
import { AdminWarningsFulfillPenalty, AdminWarningsPenaltyTargetsQuery, warningsRefetch } from './api';
import { COPY, reachedText, type PenaltyTargetRow } from './model';
import { TeamNames } from './TeamNames';
import s from './Warnings.module.css';

/**
 * ②-1 ⑤ 벌칙 대상 + ⑥ [이행 완료] (W-16 · ACC-PEN-01 · 03 · 04 · 10).
 * 이행 완료는 되돌릴 수 없는 고정점(E-58) — 단순 확인형을 거치고, 되돌리는 버튼은 두지 않는다.
 */
export function PenaltyTargetsSection() {
  const q = useQuery(AdminWarningsPenaltyTargetsQuery);
  const confirm = useConfirm();
  const [fulfill] = useMutation(AdminWarningsFulfillPenalty);
  const [runningId, setRunningId] = useState<string | null>(null);
  const action = useAction(
    (memberId: string) => fulfill({ variables: { memberId }, refetchQueries: warningsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.fulfilled,
      errorOverrides: { NOT_FOUND: COPY.fulfillGone },
      onError: (e) => {
        if (e.code === 'NOT_FOUND') q.refetch().catch(() => undefined);
      },
    },
  );

  const onFulfill = async (t: PenaltyTargetRow) => {
    const ok = await confirm({
      title: `${t.member.nickname}님의 벌칙 이행을 완료할까요?`,
      body: COPY.fulfillBody,
      confirmLabel: '이행 완료',
    });
    if (!ok) return;
    setRunningId(t.member.id);
    try {
      await action.run(t.member.id);
    } finally {
      setRunningId(null);
    }
  };

  const columns: Column<PenaltyTargetRow>[] = [
    {
      key: 'member',
      header: '회원',
      render: (t) => (
        <Link to={paths.profile(t.member.id)} className={s.member}>
          <Avatar name={t.member.nickname} imageUrl={t.member.profileImageUrl} size={32} />
          <span className={s.memberName}>{t.member.nickname}</span>
        </Link>
      ),
    },
    {
      key: 'warnings',
      header: '경고',
      render: (t) => (
        <span className={s.warn}>
          {t.activeWarningCount}
          <StatusBadge kind="penalty" />
        </span>
      ),
    },
    { key: 'reached', header: '도달', render: (t) => <span className={s.nowrap}>{reachedText(t)}</span> },
    { key: 'teams', header: '경고가 붙은 팀', render: (t) => <TeamNames teams={t.teams} emptyText="—" /> },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      render: (t) => (
        <Button
          size="sm"
          aria-label={`${t.member.nickname} 이행 완료`}
          loading={runningId === t.member.id}
          disabled={runningId !== null}
          onClick={() => void onFulfill(t)}
        >
          이행 완료
        </Button>
      ),
    },
  ];

  const targets = q.data?.penaltyTargets;
  return (
    <section className={s.section} aria-labelledby="admin-penalty-title">
      <SectionHeader as="h3" id="admin-penalty-title" title="벌칙 대상" right={targets ? `${targets.length}명` : null} />
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={targets}
        skeleton={<TableSkeleton rows={2} cols={5} />}
        onRetry={() => q.refetch().catch(() => undefined)}
      >
        {(rows) => (
          <div className={s.stickyEnds}>
            <DataTable
              caption="벌칙 대상"
              columns={columns}
              rows={rows}
              rowKey={(t) => t.member.id}
              empty={COPY.emptyPenalty}
              footer={<Foot>{COPY.privateNote}</Foot>}
            />
          </div>
        )}
      </QueryBoundary>
    </section>
  );
}
