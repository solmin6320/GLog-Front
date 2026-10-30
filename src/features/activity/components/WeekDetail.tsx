import { pickHomeBanner } from '@/domain/banner';
import { liveProgressText } from '@/domain/weekly';
import type { WeekDayView, WeekView } from '@/domain/weekView';
import { useClock } from '@/session';
import { asOfLabel, formatMDW } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import {
  BigStat,
  Card,
  DataTable,
  Foot,
  InfoBox,
  LinkButton,
  Pill,
  SectionHeader,
  StatusBadge,
  WeekStrip,
  type Column,
  type StripDay,
} from '@/shared/ui';
import { WEEKLY_COPY } from '../copy';
import s from '../activity.module.css';

type Week = WeekView;
type Day = WeekDayView;

/**
 * 지난 주 잔디는 판정 때 저장한 있음/없음뿐이라 단계가 없다(B-03) → 단색으로 칠한다(M-17).
 * WeekStrip의 fallbackLevel은 grassCount > 0일 때만 쓰여서, 단계를 직접 채워 넘긴다(보고: StripDay에 hasGrass 필요).
 */
const PAST_GRASS_LEVEL = 3;

function toStripDays(days: Day[]): StripDay[] {
  return days.map((d) => ({ ...d, grassLevel: d.grassLevel ?? (d.hasGrass ? PAST_GRASS_LEVEL : null) }));
}

/** 내역 칸 — 이번 주는 개수, 지난 주는 있음/없음만 */
function dayDetail(d: Day): string {
  const parts: string[] = [];
  if (d.grassCount != null) {
    if (d.grassCount > 0) parts.push(`잔디 ${d.grassCount}칸`);
  } else if (d.hasGrass) parts.push('잔디');
  if (d.recordCount != null) {
    if (d.recordCount > 0) parts.push(`기록글 ${d.recordCount}개`);
  } else if (d.hasRecord) parts.push('기록글');
  if (parts.length === 0) return d.isToday ? WEEKLY_COPY.today : WEEKLY_COPY.noActivity;
  const text = parts.join(' + ');
  return d.isToday ? `${WEEKLY_COPY.today} · ${text}` : text;
}

function GrassCell({ d }: { d: Day }) {
  if (d.grassCount != null && d.grassCount > 0) {
    const level = Math.max(1, Math.min(4, d.grassLevel ?? PAST_GRASS_LEVEL));
    return (
      <span className={s.grass}>
        <span className={s.squares} aria-hidden="true">
          {Array.from({ length: Math.min(d.grassCount, 4) }, (_, i) => (
            <i key={i} style={{ background: `var(--h${level})` }} />
          ))}
        </span>
        <span className={s.grassCount}>{`${d.grassCount}칸`}</span>
      </span>
    );
  }
  if (d.grassCount == null && d.hasGrass) {
    return (
      <span className={s.grass}>
        <span className={s.squares} aria-hidden="true">
          <i style={{ background: `var(--h${PAST_GRASS_LEVEL})` }} />
        </span>
        <span className={s.grassCount}>있음</span>
      </span>
    );
  }
  return <span className={s.dash}>—</span>;
}

function RecordCell({ d }: { d: Day }) {
  if (d.recordCount != null && d.recordCount > 0) return <StatusBadge kind="record" count={d.recordCount} />;
  if (d.recordCount == null && d.hasRecord) return <StatusBadge kind="record" />;
  return <span className={s.dash}>—</span>;
}

/** ② 날짜별 표 — 미래 날짜는 안내 한 줄만 */
const DAY_COLUMNS: Column<Day>[] = [
  {
    key: 'date',
    header: '날짜',
    render: (d) => <span className={d.isFuture ? s.dateFuture : s.date}>{formatMDW(d.date)}</span>,
  },
  {
    key: 'grass',
    header: 'GitHub 잔디',
    render: (d) => (d.isFuture ? <span className={s.futureText}>{WEEKLY_COPY.future}</span> : <GrassCell d={d} />),
  },
  { key: 'record', header: '기록글', render: (d) => (d.isFuture ? null : <RecordCell d={d} />) },
  {
    key: 'verified',
    header: '인증일',
    render: (d) => {
      if (d.isFuture) return null;
      // 잔디와 기록글이 둘 다 있어도 1일 (서버 verified)
      return d.verified ? (
        <Pill tone="ok" icon="check">
          1일
        </Pill>
      ) : (
        <span className={s.zero}>0일</span>
      );
    },
  },
  { key: 'detail', header: '내역', render: (d) => (d.isFuture ? null : <span className={s.detail}>{dayDetail(d)}</span>) },
];

/** ④ 이번 주 판정 — 이번 주를 볼 때만. 문구는 A2 2-4 */
function ThisWeekCard({ week }: { week: Week }) {
  const live = week.live;
  const teamless = live?.status === 'EXCLUDED' && live.skipReason === 'NO_TEAM';
  let message: string | null = null;
  let sub: string | null = null;
  if (live?.status === 'CONDITION_MET') {
    message = WEEKLY_COPY.conditionMet;
    sub = WEEKLY_COPY.confirmMonday;
  } else if (live?.status === 'NOT_YET') {
    message = liveProgressText(live);
    sub = WEEKLY_COPY.confirmMonday;
  } else {
    message = liveProgressText(live);
  }
  return (
    <Card as="section" aria-labelledby="weekly-judge-title">
      <h2 id="weekly-judge-title" className={s.cardTitle}>
        이번 주 판정
      </h2>
      {teamless ? (
        <>
          <p className={s.message}>{WEEKLY_COPY.teamlessTitle}</p>
          <p className={s.teamlessBody}>{WEEKLY_COPY.teamlessBody}</p>
        </>
      ) : (
        <>
          <div className={s.judgeStats}>
            <BigStat
              size="md"
              label="인증일 3일 이상"
              value={week.verifiedDays ?? '—'}
              unit="/ 3일"
              check={live?.verifiedDaysNeeded === 0}
            />
            <BigStat
              size="md"
              label="기록글 1개 이상"
              value={week.recordCount ?? '—'}
              unit="/ 1개"
              check={live?.recordsNeeded === 0}
            />
          </div>
          {message ? <p className={s.message}>{message}</p> : null}
          {sub ? <p className={s.subMessage}>{sub}</p> : null}
        </>
      )}
    </Card>
  );
}

/** ②③④ + 이번 주 상태 배너(E-39 → E-32 → E-36 → E-46, ② 위 — A2 7-4 제안) */
export function WeekDetail({ week }: { week: Week }) {
  const clock = useClock();
  const current = week.isCurrentWeek;
  const banner = current
    ? pickHomeBanner({
        grassStatus: week.grassStatus,
        skipReason: week.live?.skipReason ?? null,
        liveStatus: week.live?.status ?? null,
        privateContributionSuspected: week.privateContributionSuspected,
      })
    : null;
  const asOf = current ? asOfLabel(week.grassUpdatedAt, clock.now) : null;
  const badge = current ? (
    <StatusBadge kind="progress" />
  ) : week.judgment ? (
    <StatusBadge kind="judgment" status={week.judgment.status} skipReason={week.judgment.skipReason} context="member" />
  ) : null;

  return (
    <>
      {banner ? (
        <div className={s.banner}>
          <InfoBox
            tone={banner.tone}
            icon={banner.tone === 'blue' ? 'info' : 'alert'}
            role="status"
            action={
              banner.key === 'privateContribution' ? (
                <LinkButton to={paths.notices()} variant="outline" size="sm">
                  설정 방법
                </LinkButton>
              ) : undefined
            }
          >
            {banner.text}
          </InfoBox>
        </div>
      ) : null}
      <div className={current ? s.layout : undefined}>
        <section className={s.days} aria-labelledby="weekly-days-title">
          <SectionHeader
            id="weekly-days-title"
            title="날짜별 인증"
            right={
              badge || asOf ? (
                <span className={s.headRight}>
                  {badge}
                  {asOf ? <span>{asOf}</span> : null}
                </span>
              ) : undefined
            }
          />
          <div className={s.strip}>
            <WeekStrip days={toStripDays(week.days)} size={54} fallbackLevel={PAST_GRASS_LEVEL} />
          </div>
          <DataTable caption="날짜별 인증" columns={DAY_COLUMNS} rows={week.days} rowKey={(d) => d.date} />
          <Foot>{WEEKLY_COPY.countRule}</Foot>
        </section>
        {current ? <ThisWeekCard week={week} /> : null}
      </div>
    </>
  );
}
