import { useQuery } from '@apollo/client/react';
import type { WarningsQueryQuery } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { formatWeekRange } from '@/shared/lib/format';
import {
  BigStat,
  CardSkeleton,
  DataTable,
  Foot,
  PageContainer,
  PageTitle,
  QueryBoundary,
  SectionHeader,
  StatusBadge,
  TableSkeleton,
  WarningGauge,
  type Column,
} from '@/shared/ui';
import { WarningsQuery } from '../api';
import { WARNINGS_COPY } from '../copy';
import s from '../activity.module.css';

type MyWarnings = WarningsQueryQuery['myWarnings'];
type WarningState = MyWarnings['state'];
type Row = MyWarnings['history'][number];

/** 벌칙까지 남은 횟수 — 표시용 산술(3 − n). 벌칙 대상 여부는 서버 플래그로 본다 */
const PENALTY_AT = 3;

/** ③ 팀 카테고리 — 비공개는 열람자와 무관하게 "비공개 팀"(서버 마스킹), 카테고리가 없으면 "삭제된 팀" */
function categoryText(categories: Row['categories']): string {
  if (categories.length === 0) return WARNINGS_COPY.deletedTeam;
  return categories
    .map((c) => {
      if (c.kind === 'PRIVATE') return WARNINGS_COPY.privateTeam;
      if (c.kind === 'DELETED') return WARNINGS_COPY.deletedTeam;
      return c.name ?? WARNINGS_COPY.deletedTeam;
    })
    .join(', ');
}

const COLUMNS: Column<Row>[] = [
  { key: 'week', header: '발생 주차', render: (r) => formatWeekRange(r.weekStart) },
  {
    key: 'reason',
    header: '사유',
    render: (r) => (r.verifiedDays == null ? '—' : `인증일 ${r.verifiedDays}일 · 기록글 ${r.recordCount ?? 0}개`),
  },
  { key: 'teams', header: '팀 카테고리', render: (r) => categoryText(r.categories) },
  // 유효 · 차감됨 · 이행 완료(Q-13 A)
  { key: 'standing', header: '상태', render: (r) => <StatusBadge kind="warning" standing={r.standing} /> },
];

/** ② 다음 결과 안내 (A2 2-4) — 서버의 weeksUntilDeduction으로 고른다 */
function streakGuide(state: WarningState): string | null {
  if (state.isPenaltyTarget) return null; // E-40이 대신한다
  if (state.weeksUntilDeduction == null) return null; // 경고 0 — 안내문 숨김(Q-10ⓐ)
  return state.weeksUntilDeduction <= 1 ? WARNINGS_COPY.deductNext : WARNINGS_COPY.deductLater;
}

/**
 * AC-02 내 경고 · 벌칙 (화면설계서 5-1-22, 목업 W-07).
 * ①② 수치는 PR-01 ⑧과 같은 서버 값(WarningState). 경고 이력은 서버가 준 순서 · 표기 그대로 그린다.
 */
export default function WarningsPage() {
  useDocumentTitle(WARNINGS_COPY.title);
  const q = useQuery(WarningsQuery);
  return (
    <PageContainer>
      <PageTitle title={WARNINGS_COPY.title} sub={WARNINGS_COPY.sub} />
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={q.data?.myWarnings}
        skeleton={<WarningsSkeleton />}
        onRetry={() => void q.refetch().catch(() => undefined)}
      >
        {(data) => <WarningsBody data={data} />}
      </QueryBoundary>
    </PageContainer>
  );
}

function WarningsBody({ data }: { data: MyWarnings }) {
  const { state, history } = data;
  const guide = streakGuide(state);
  const left = PENALTY_AT - state.activeCount;
  return (
    <>
      <div className={s.summary}>
        {/* ① 누적 경고 */}
        <section aria-label="누적 경고">
          {state.isOnHold ? (
            <>
              <p className={s.label}>누적 경고</p>
              <StatusBadge kind="judgment" status="HOLD" context="member" />
              <p className={s.calm}>{WARNINGS_COPY.onHold}</p>
            </>
          ) : state.activeCount > 0 ? (
            <>
              <BigStat label="누적 경고" value={state.activeCount} unit="/ 3회" />
              <div className={s.gauge}>
                <WarningGauge count={state.activeCount} />
              </div>
              {state.isPenaltyTarget ? (
                <div className={s.penaltyBadge}>
                  <StatusBadge kind="penalty" />
                </div>
              ) : left > 0 ? (
                <p className={s.lead}>{WARNINGS_COPY.remaining(left)}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className={s.label}>누적 경고</p>
              <p className={s.calm}>{WARNINGS_COPY.noWarning}</p>
            </>
          )}
        </section>

        {/* ② 연속 통과 */}
        <section aria-label="연속 통과">
          {state.isOnHold ? (
            <p className={s.label}>연속 통과</p>
          ) : (
            <BigStat label="연속 통과" value={state.consecutivePasses} unit="/ 2주" />
          )}
          {state.isPenaltyTarget ? <p className={s.penaltyText}>{WARNINGS_COPY.penalty}</p> : null}
          {guide ? <p className={s.guide}>{guide}</p> : null}
        </section>
      </div>

      {/* ③ 경고 이력 — 0건이면 숨김 (제안) */}
      {history.length > 0 ? (
        <section className={s.warnHistory} aria-labelledby="warnings-history-title">
          <SectionHeader id="warnings-history-title" title="경고 이력" />
          <DataTable caption="경고 이력" columns={COLUMNS} rows={history} rowKey={(r) => r.id} />
          <Foot>{WARNINGS_COPY.historyNote.join(' ')}</Foot>
        </section>
      ) : null}

      <div className={s.guides}>
        {/* ④ 기준 안내 */}
        <section aria-labelledby="warnings-rules-title">
          <h2 id="warnings-rules-title" className={s.guideTitle}>
            경고가 쌓이는 기준
          </h2>
          <dl className={s.rules}>
            {WARNINGS_COPY.rules.map(([term, desc]) => (
              <div key={term} className={s.rule}>
                <dt>{term}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ⑤ 벌칙 안내 */}
        <section aria-labelledby="warnings-penalty-title">
          <h2 id="warnings-penalty-title" className={s.guideTitle}>
            벌칙 대상이 되면
          </h2>
          <p className={s.penaltyGuide}>{WARNINGS_COPY.penaltyGuide.join(' ')}</p>
        </section>
      </div>
    </>
  );
}

function WarningsSkeleton() {
  return (
    <>
      <div className={s.summary}>
        <CardSkeleton height={150} />
        <CardSkeleton height={150} />
      </div>
      <div className={s.warnHistory}>
        <TableSkeleton rows={2} cols={4} />
      </div>
    </>
  );
}
