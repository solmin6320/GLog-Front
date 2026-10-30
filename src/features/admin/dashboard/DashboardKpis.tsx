import { Link } from 'react-router';
import { paths } from '@/shared/lib/paths';
import { Skeleton } from '@/shared/ui';
import { COPY, failKpiLabel, type DashboardSummary } from './model';
import s from './Dashboard.module.css';

type Kpi = { key: string; label: string; value: number | null; to: string; red?: boolean };

/**
 * ⑤ 처리 대기 요약 4칸 (W-15 · ACC-ADM-01). 누르면 해당 탭으로.
 * 두 번째 칸은 판정 주(직전 주)의 미달 수다 (M-07) — 그 주의 미달만 거른 판정 결과로 간다.
 */
export function DashboardKpis({
  summary,
  heldCount,
  currentWeekStart,
}: {
  summary: DashboardSummary | undefined;
  heldCount: number | undefined;
  currentWeekStart: string;
}) {
  const kpis: Kpi[] = [
    { key: 'pending', label: '승인 대기', value: summary?.pendingMembers ?? null, to: paths.adminMembers() },
    {
      key: 'fail',
      label: failKpiLabel(summary?.judgedWeekStart, currentWeekStart),
      value: summary?.failedMembers ?? null,
      to: paths.admin({ result: 'fail' }),
    },
    { key: 'penalty', label: '벌칙 대상', value: summary?.penaltyTargets ?? null, to: paths.adminWarnings(), red: true },
    { key: 'exemption', label: '면제 요청 대기', value: summary?.pendingExemptions ?? null, to: paths.adminExemptions() },
  ];
  const nothingToDo =
    !!summary && heldCount !== undefined && summary.pendingMembers + summary.penaltyTargets + summary.pendingExemptions + heldCount === 0;

  return (
    <section aria-label="처리 대기 요약">
      <div className={s.kpis}>
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
