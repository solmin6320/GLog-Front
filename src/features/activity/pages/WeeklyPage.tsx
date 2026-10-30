import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { useNavigate, useSearchParams } from 'react-router';
import { toWeekView } from '@/domain/weekView';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useClock } from '@/session';
import { toPaged, usePagedList } from '@/shared/api';
import { formatWeekLabel } from '@/shared/lib/format';
import { addDays } from '@/shared/lib/kst';
import { parseWeekParam, paths } from '@/shared/lib/paths';
import { CardSkeleton, IconButton, PageContainer, PageTitle, QueryBoundary, TableSkeleton } from '@/shared/ui';
import { WeeklyHistoryQuery, WeeklyQuery } from '../api';
import { JudgmentHistory } from '../components/JudgmentHistory';
import { WeekDetail } from '../components/WeekDetail';
import { WEEKLY_COPY } from '../copy';
import s from '../activity.module.css';

/**
 * AC-01 내 주간 활동 · 판정 (화면설계서 5-1-21, 목업 W-06).
 * ① ?week=YYYY-MM-DD(월요일) — "이번 주"는 서버 clock으로 정하고 미래 주로는 가지 않는다.
 * ②③④는 주차마다 다시 부르고, ⑤ 지난 판정은 주차와 무관해서 따로 부른다.
 */
export default function WeeklyPage() {
  useDocumentTitle(WEEKLY_COPY.title);
  const clock = useClock();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requested = parseWeekParam(searchParams);
  const thisWeek = clock.currentWeekStart;
  const weekStart = requested && requested < thisWeek ? requested : thisWeek;
  const isThisWeek = weekStart === thisWeek;
  const hasParam = searchParams.has('week');

  // 잘못된 값 · 이번 주 · 미래 주는 주소를 /weekly로 정리한다
  useEffect(() => {
    if (hasParam && isThisWeek) void navigate(paths.weekly(), { replace: true });
  }, [hasParam, isThisWeek, navigate]);

  const week = useQuery(WeeklyQuery, { variables: { weekStart } });
  const history = usePagedList(WeeklyHistoryQuery, { variables: {}, select: (d) => toPaged(d.myJudgmentHistory) });

  const goTo = (w: string) => void navigate(w >= thisWeek ? paths.weekly() : paths.weekly(w));
  // 주차를 옮기는 중에는 이전 주 데이터를 다른 주 라벨 아래 보여 주지 않는다
  const raw = week.data?.myWeeklyActivity;
  const current = raw && raw.weekStart === weekStart ? toWeekView(raw, clock.today) : undefined;

  return (
    <PageContainer>
      <PageTitle title={WEEKLY_COPY.title} sub={WEEKLY_COPY.sub} />

      <nav className={s.weekNav} aria-label="주차 이동">
        <IconButton label={WEEKLY_COPY.prevWeek} icon="chevL" onClick={() => goTo(addDays(weekStart, -7))} />
        <p className={s.weekLabel} aria-live="polite">
          {formatWeekLabel(weekStart)}
        </p>
        <IconButton
          label={WEEKLY_COPY.nextWeek}
          icon="chevR"
          disabled={isThisWeek}
          onClick={() => goTo(addDays(weekStart, 7))}
        />
      </nav>

      <QueryBoundary
        loading={week.loading || (!!week.data && !current)}
        error={week.error}
        data={current}
        skeleton={<WeekSkeleton />}
        onRetry={() => void week.refetch().catch(() => undefined)}
      >
        {(w) => <WeekDetail week={w} />}
      </QueryBoundary>

      <JudgmentHistory list={history} />
    </PageContainer>
  );
}

function WeekSkeleton() {
  return (
    <div className={s.layout}>
      <TableSkeleton rows={7} cols={5} />
      <CardSkeleton height={200} />
    </div>
  );
}
