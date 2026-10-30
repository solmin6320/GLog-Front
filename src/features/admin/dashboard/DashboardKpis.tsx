import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { paths } from '@/shared/lib/paths';
import { Skeleton } from '@/shared/ui';
import { COPY, failKpiLabel, type DashboardSummary } from './model';
import s from './Dashboard.module.css';

type Kpi = { key: string; label: string; value: number | null; to: string; red?: boolean };

/**
 * ⑤ 처리 대기 요약 3칸(정리할 승인 대기가 있으면 4칸) (W-15 · ACC-ADM-01). 누르면 해당 탭으로.
 * 두 번째 칸은 '가장 최근 판정 주'의 미달 수다 (M-07) — 그 주의 미달만 거른 판정 결과로 간다.
 */
export function DashboardKpis({ summary, currentWeekStart }: { summary: DashboardSummary | undefined; currentWeekStart: string }) {
  // 가입은 승인 없이 바로 활성이다. 승인 대기 칸은 이전에 쌓인 계정이 남아 있을 때만 정리용으로 보인다
  const legacyPending = summary?.pendingMemberCount ?? 0;
  const kpis: Kpi[] = [
    ...(legacyPending > 0 ? [{ key: 'pending', label: '정리할 승인 대기', value: legacyPending, to: paths.adminMembers({ status: 'pending' }) }] : []),
    {
      key: 'fail',
      label: failKpiLabel(summary?.latestJudgedWeekStart, currentWeekStart),
      value: summary?.latestWeekFailCount ?? null,
      to: paths.admin({ result: 'fail' }),
    },
    { key: 'penalty', label: '벌칙 대상', value: summary?.penaltyTargetCount ?? null, to: paths.adminWarnings(), red: true },
    { key: 'exemption', label: '면제 요청 대기', value: summary?.pendingExemptionRequestCount ?? null, to: paths.adminExemptions() },
  ];
  const nothingToDo =
    !!summary &&
    summary.pendingMemberCount + summary.penaltyTargetCount + summary.pendingExemptionRequestCount + summary.heldJudgmentCount === 0;

  return (
    <section aria-label="처리 대기 요약">
      <div className={s.kpis} style={{ '--kpi-cols': kpis.length } as CSSProperties}>
        {kpis.map((k) => (
          <Link key={k.key} to={k.to} className={s.kpi} data-kpi={k.key}>
            <span>{k.label}</span>
            {k.value === null ? (
              <Skeleton width={28} height={24} />
            ) : (
              <b className={k.red && k.value > 0 ? `${s.kpiValue} ${s.kpiRed}` : s.kpiValue}>{k.value}</b>
            )}
          </Link>
        ))}
      </div>
      {nothingToDo ? <p className={s.noTasks}>{COPY.noTasks}</p> : null}
    </section>
  );
}
