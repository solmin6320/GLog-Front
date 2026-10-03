import { useState } from 'react';
import { Link } from 'react-router';
import type { AdminDashboardWeekQueryQuery } from '@/gql/graphql';
import type { PagedList } from '@/shared/api';
import { formatDateTime } from '@/shared/lib/format';
import { paths, type AdminResultParam } from '@/shared/lib/paths';
import {
  Avatar,
  Button,
  Card,
  DataTable,
  EmptyState,
  LoadMore,
  QueryBoundary,
  SearchInput,
  Select,
  StatusBadge,
  TableSkeleton,
  type Column,
} from '@/shared/ui';
import { HeldNotice } from './HeldNotice';
import {
  COPY,
  JUDGMENT_PAGE_SIZE,
  RESULT_OPTIONS,
  daysText,
  notExecutedText,
  recordsText,
  type HeldRow,
  type JudgmentRow,
} from './model';
import s from './Dashboard.module.css';

type WeekData = AdminDashboardWeekQueryQuery['adminJudgmentWeek'];

export type JudgmentFilters = { weekValue: string; q: string | undefined; result: AdminResultParam };

/**
 * ⑥ 툴바(주차 · 회원 검색 · 결과 필터) + ⑦ 집계 · 실행 시각 + ⑧ 보류 배지 + ⑨ 보류 안내 + ⑦ 회원별 표 + [더 보기].
 * 상태는 URL이 정본이다 — 바꾸면 onChange로 위에 알리고, 위가 URL을 고친다(ACC-FIX-15).
 */
export function JudgmentResults({
  currentWeekStart,
  filters,
  weekOptions,
  onChange,
  list,
  held,
  fix,
  onFix,
  running,
  onRetryOne,
  onRetryAll,
}: {
  currentWeekStart: string;
  filters: JudgmentFilters;
  weekOptions: { value: string; label: string }[];
  onChange: (next: Partial<{ week: string; q: string | undefined; result: AdminResultParam }>) => void;
  list: PagedList<AdminDashboardWeekQueryQuery, JudgmentRow>;
  held: HeldRow[];
  fix: string | undefined;
  onFix: (judgmentId: string) => void;
  running: string | null;
  onRetryOne: (judgmentId: string) => void;
  onRetryAll: (retryableCount: number) => void;
}) {
  const filtered = !!filters.q || filters.result !== 'all';

  const columns: Column<JudgmentRow>[] = [
    {
      key: 'member',
      header: '회원',
      render: (r) => (
        <Link to={paths.profile(r.member.id)} className={s.member}>
          <Avatar name={r.member.nickname} imageUrl={r.member.profileImageUrl} size={32} />
          <span className={s.memberName}>{r.member.nickname}</span>
        </Link>
      ),
    },
    { key: 'days', header: '인증일', render: (r) => daysText(r.judgment.verifiedDays) },
    { key: 'records', header: '기록글', render: (r) => recordsText(r.judgment.recordCount) },
    {
      key: 'result',
      header: '결과',
      render: (r) => (
        <span className={s.result}>
          <StatusBadge kind="judgment" status={r.judgment.status} skipReason={r.judgment.skipReason} context="admin" />
          {r.judgment.corrected ? <StatusBadge kind="corrected" /> : null}
        </span>
      ),
    },
    {
      key: 'warnings',
      header: '누적 경고',
      render: (r) => (
        <span className={s.warn}>
          {r.activeWarningCount}
          {r.isPenaltyTarget ? <StatusBadge kind="penalty" /> : null}
        </span>
      ),
    },
    {
      key: 'action',
      header: '처리',
      align: 'right',
      render: (r) => {
        const id = r.judgment.id;
        if (fix === id) return <span className={s.fixing}>정정 중</span>;
        if (r.canCorrect) {
          return (
            <Button variant="text" size="sm" data-correct-id={id} aria-label={`${r.member.nickname} 판정 정정`} onClick={() => onFix(id)}>
              정정
            </Button>
          );
        }
        if (r.canRetry) {
          return (
            <Button
              variant="outline"
              size="xs"
              icon="refresh"
              loading={running === id}
              disabled={running !== null}
              aria-label={`${r.member.nickname} 재시도`}
              onClick={() => onRetryOne(id)}
            >
              재시도
            </Button>
          );
        }
        return <span className={s.muted}>재로그인 필요</span>;
      },
    },
  ];

  return (
    <Card className={s.results}>
      <div className={s.toolbar}>
        <div className={s.weekSelect}>
          <Select aria-label="주차" value={filters.weekValue} options={weekOptions} onChange={(e) => onChange({ week: e.target.value })} />
        </div>
        <div className={s.search}>
          <JudgmentSearch key={filters.q ?? ''} initial={filters.q ?? ''} onSearch={(q) => onChange({ q })} />
        </div>
        <div className={s.resultSelect}>
          <Select
            aria-label="결과"
            value={filters.result}
            options={RESULT_OPTIONS}
            onChange={(e) => onChange({ result: e.target.value as AdminResultParam })}
          />
        </div>
      </div>

      <HeldNotice held={held} running={running === 'all'} onRetryAll={onRetryAll} />

      <QueryBoundary
        loading={list.loading}
        error={list.error}
        data={list.data?.adminJudgmentWeek}
        skeleton={
          <div className={s.notExecuted}>
            <TableSkeleton rows={6} cols={6} />
          </div>
        }
        onRetry={list.refetch}
      >
        {(week) => (
          <>
            <WeekCounts week={week} />
            {week.executedAt ? (
              <>
                <div className={s.stickyEnds}>
                  <DataTable
                    caption="판정 결과"
                    columns={columns}
                    rows={list.nodes}
                    rowKey={(r) => r.judgment.id}
                    rowTone={(r) => (r.judgment.id === fix ? 'focus' : undefined)}
                    empty={filtered ? COPY.emptyFiltered : COPY.emptyWeek}
                  />
                </div>
                <LoadMore
                  hasMore={list.hasMore}
                  loading={list.loadingMore}
                  error={list.loadMoreError}
                  onLoadMore={list.loadMore}
                  endText={(list.totalCount ?? 0) > JUDGMENT_PAGE_SIZE ? undefined : null}
                />
              </>
            ) : (
              <EmptyState icon="clock" title={notExecutedText(week.weekStart, currentWeekStart)} />
            )}
          </>
        )}
      </QueryBoundary>
    </Card>
  );
}

/** ⑦ 집계 + ⑧ 보류 배지 + 실행 시각 ('9/28 07:00 실행'). 판정 전 주는 그리지 않는다 */
function WeekCounts({ week }: { week: WeekData }) {
  if (!week.executedAt) return null;
  const c = week.counts;
  return (
    <p className={s.counts}>
      <span>
        통과 <b>{c.pass}</b>
      </span>
      <span>
        미달 <b>{c.fail}</b>
      </span>
      <span>
        면제 <b>{c.exempt}</b>
      </span>
      <span>
        첫 참가 <b>{c.firstWeek}</b>
      </span>
      {c.hold > 0 ? <StatusBadge kind="judgment" status="HOLD" context="admin" label={`보류 ${c.hold}`} /> : null}
      <span className={s.executed}>{formatDateTime(week.executedAt)} 실행</span>
    </p>
  );
}

/** 회원 검색 (닉네임 · GitHub 아이디). Enter로 적용, 지우면 바로 해제. URL q가 바뀌면 key로 다시 만든다 */
function JudgmentSearch({ initial, onSearch }: { initial: string; onSearch: (q: string | undefined) => void }) {
  const [text, setText] = useState(initial);
  return (
    <SearchInput
      ariaLabel="회원 검색"
      placeholder="닉네임 또는 GitHub 아이디"
      maxLength={50}
      value={text}
      onChange={(v) => {
        setText(v);
        if (v.trim() === '' && initial !== '') onSearch(undefined);
      }}
      onSubmit={(v) => onSearch(v.trim() || undefined)}
    />
  );
}
