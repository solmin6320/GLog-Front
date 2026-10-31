import { useEffect, useRef } from 'react';
import { useQuery } from '@apollo/client/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { AdminDashboardSummaryQuery, AdminDashboardWeekQuery } from '@/features/admin/dashboard/api';
import { CorrectionPanel, type PanelTarget } from '@/features/admin/dashboard/CorrectionPanel';
import { DashboardKpis } from '@/features/admin/dashboard/DashboardKpis';
import { JudgmentResults } from '@/features/admin/dashboard/JudgmentResults';
import { JUDGMENT_PAGE_SIZE, RESULT_FILTER, weekOptions, type HeldRow } from '@/features/admin/dashboard/model';
import { useRerunHeld } from '@/features/admin/dashboard/useRerunHeld';
import s from '@/features/admin/dashboard/Dashboard.module.css';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useClock } from '@/session';
import { usePagedList } from '@/shared/api';
import { addDays } from '@/shared/lib/kst';
import { parseAdminDashboardSearch, paths, type AdminResultParam } from '@/shared/lib/paths';
import { Button, InfoBox, SectionHeader } from '@/shared/ui';

const NO_HELD: HeldRow[] = [];

/** 패널을 목록에서 열었다는 표시 — 닫을 때 히스토리를 한 칸 되돌린다 */
type FixState = { adminFixFromList?: boolean } | null;

/**
 * AD-01 ②-0 관리자 대시보드 + 판정 정정 패널 + 보류 재시도 (`/admin?week=&q=&result=&fix=`, 목업 W-15).
 * URL이 유일한 상태다. week 생략 = 가장 최근 판정 주(M-07). AdminLayout(폭 1120) 안이라 PageContainer를 두지 않는다.
 */
export default function AdminDashboardPage() {
  useDocumentTitle('관리자 대시보드');
  const clock = useClock();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();
  const parsed = parseAdminDashboardSearch(sp);
  // 미래 주는 받지 않는다 (서버도 거부한다)
  const week = parsed.week && parsed.week <= clock.currentWeekStart ? parsed.week : undefined;
  const { q, result, fix } = parsed;

  const summaryQ = useQuery(AdminDashboardSummaryQuery);
  const summary = summaryQ.data?.adminDashboardSummary;
  const held = summaryQ.data?.heldJudgments ?? NO_HELD;
  const latest = summary?.latestJudgedWeekStart ?? undefined;

  const list = usePagedList(AdminDashboardWeekQuery, {
    variables: { weekStart: week, filter: RESULT_FILTER[result], search: q },
    select: (d) => d.adminJudgmentWeek.rows,
    pageSize: JUDGMENT_PAGE_SIZE,
  });
  const shownWeek = week ?? list.data?.adminJudgmentWeek.weekStart ?? latest ?? addDays(clock.currentWeekStart, -7);

  const rerun = useRerunHeld();

  /* ---------- URL ---------- */

  const changeFilters = (change: Partial<{ week: string; q: string | undefined; result: AdminResultParam }>) => {
    let nextWeek = week;
    if (change.week !== undefined) nextWeek = change.week === latest ? undefined : change.week;
    const next = { week: nextWeek, q: 'q' in change ? change.q : q, result: change.result ?? result };
    // 조건을 바꾸면 정정 패널은 닫는다 (다른 목록의 행이라)
    navigate(paths.admin(next), { replace: true });
  };

  const openFix = (judgmentId: string) => {
    const state: FixState = { adminFixFromList: true };
    navigate(paths.admin({ week, q, result, fix: judgmentId }), { state });
  };

  const closeFix = () => {
    if ((location.state as FixState)?.adminFixFromList) navigate(-1);
    else navigate(paths.admin({ week, q, result }), { replace: true });
  };

  /* ---------- 정정 대상 찾기 ---------- */

  const row = fix ? list.nodes.find((r) => r.judgment.id === fix) : undefined;
  // 새로고침 등으로 대상이 다음 페이지에 있으면 찾을 때까지 더 불러온다
  const needMore = !!fix && !row && list.hasMore && !list.loadingMore && !list.loadMoreError;
  const loadMore = list.loadMore;
  useEffect(() => {
    if (needMore) loadMore();
  }, [needMore, loadMore]);

  let target: PanelTarget = { kind: 'missing' };
  if (row) target = { kind: 'row', row };
  else if (fix && held.some((h) => h.judgment.id === fix)) target = { kind: 'held' };
  else if (list.loading || list.loadingMore || needMore || (!list.data && !list.error)) target = { kind: 'loading' };

  // 패널을 닫으면 그 행의 [정정] 버튼으로 포커스를 돌려준다
  const prevFix = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prev = prevFix.current;
    prevFix.current = fix;
    if (prev && !fix) document.querySelector<HTMLElement>(`[data-correct-id="${prev}"]`)?.focus();
  }, [fix]);

  return (
    <>
      {summaryQ.error && !summary ? (
        <div className={s.kpis}>
          <InfoBox
            tone="red"
            icon="alert"
            action={
              <Button variant="outline" size="sm" onClick={() => summaryQ.refetch().catch(() => undefined)}>
                다시 시도
              </Button>
            }
          >
            처리 대기 요약을 불러오지 못했어요.
          </InfoBox>
        </div>
      ) : (
        <DashboardKpis summary={summary} currentWeekStart={clock.currentWeekStart} />
      )}

      <SectionHeader title="판정 결과" />
      <div className={fix ? `${s.grid} ${s.withPanel}` : s.grid}>
        <div className={s.listCol}>
          <JudgmentResults
            currentWeekStart={clock.currentWeekStart}
            today={clock.today}
            filters={{ weekValue: shownWeek, q, result }}
            weekOptions={weekOptions(clock.currentWeekStart, [shownWeek, latest])}
            onChange={changeFilters}
            list={list}
            held={held}
            fix={fix}
            onFix={openFix}
            running={rerun.running}
            onRetryOne={(id) => void rerun.retryOne(id)}
            onRetryAll={(n) => void rerun.retryAll(n)}
          />
        </div>
        {fix ? (
          <div className={s.panelCol}>
            <CorrectionPanel key={fix} target={target} onClose={closeFix} onCorrected={closeFix} />
          </div>
        ) : null}
      </div>
    </>
  );
}
