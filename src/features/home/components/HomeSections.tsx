import type { ReactNode } from 'react';
import type { HomeBanner } from '@/domain/banner';
import { deductionText, liveProgressText } from '@/domain/weekly';
import type { HomeNoticesQueryQuery, HomeQueryQuery } from '@/gql/graphql';
import { useClock } from '@/session';
import { asOfLabel, formatDateTimeMD, formatWeekRangeWithDay } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import {
  BigStat,
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  Icon,
  InfoBox,
  LinkButton,
  ListSkeleton,
  PageTitle,
  RowItem,
  RowList,
  SectionHeader,
  StatusBadge,
  TextLink,
  VisuallyHidden,
  WarningGauge,
  WeekStrip,
} from '@/shared/ui';
import { HOME_COPY } from '../copy';
import s from '../home.module.css';

type Week = HomeQueryQuery['myWeek'];
type WarningState = HomeQueryQuery['myWarnings']['state'];

/** ② 이번 주 진행 + ③ 진행 안내(+ E-41 다음 차감). 인증일 옆 갱신 기준은 서버 시각으로 만든다(M-15) */
export function WeekProgress({ week, weeksUntilDeduction }: { week: Week; weeksUntilDeduction: number | null }) {
  const clock = useClock();
  const asOf = asOfLabel(week.grassUpdatedAt, clock.now);
  const progress = liveProgressText(week.live);
  const deduction = deductionText(weeksUntilDeduction);
  return (
    <section className={s.progress} aria-labelledby="home-progress-title">
      <SectionHeader id="home-progress-title" title="이번 주 진행" right={formatWeekRangeWithDay(week.weekStart)} />
      <div className={s.progressBody}>
        <div className={s.strip}>
          <WeekStrip days={week.days} size={46} legend />
        </div>
        <div className={s.stats}>
          <div>
            <BigStat label="인증일" value={week.verifiedDays ?? '—'} unit="/ 3일" />
            {asOf ? <p className={s.asOf}>{asOf}</p> : null}
          </div>
          <BigStat label="기록글" value={week.recordCount ?? '—'} unit="/ 1개" check={week.live?.recordsNeeded === 0} />
        </div>
      </div>
      {progress || deduction ? (
        <p className={s.progressText}>
          {progress ? <strong>{progress}</strong> : null}
          {progress && deduction ? ' ' : null}
          {deduction ? <span className={s.muted}>{deduction}</span> : null}
        </p>
      ) : null}
      <NextAction week={week} />
    </section>
  );
}

/**
 * 이번 주 다음 할 일 버튼 — 홈에서 채워진 초록 버튼은 이것 하나다 (폰 레스토프 효과).
 * 기록글이 모자랄 때만 나타나 진행 안내 바로 아래에 붙는다 (근접성). 모바일에서는 한 줄 전폭 52px (피츠).
 * 통과 조건을 이미 채웠거나 면제 · 제외 주에는 그리지 않는다.
 */
function NextAction({ week }: { week: Week }) {
  const live = week.live;
  if (!live || live.status !== 'NOT_YET' || live.recordsNeeded <= 0) return null;
  return (
    <div className={s.next}>
      <LinkButton to={paths.postNew({ type: 'devlog' })} size="lg" icon="pencil" className={s.nextBtn}>
        기록글 쓰기
      </LinkButton>
    </div>
  );
}

/** 판정 보류 중: 숫자 대신 '확인 중' 배지 + 안내 (M-05와 같은 표기) */
function HoldNotice({ text }: { text: string }) {
  return (
    <div>
      <StatusBadge kind="judgment" status="HOLD" context="member" />
      <p className={s.noWarning}>{text}</p>
    </div>
  );
}

/** ④ 내 경고 — 사람 단위 누적. 벌칙 대상은 서버 플래그로 보고 E-40을 카드 하단에 쓴다 */
export function WarningSummary({ state }: { state: WarningState }) {
  return (
    <section aria-labelledby="home-warning-title">
      <SectionHeader id="home-warning-title" title="내 경고" />
      <div className={s.warnRow}>
        <div className={s.warnMain}>
          {state.isOnHold ? (
            <HoldNotice text={HOME_COPY.onHold} />
          ) : state.activeCount > 0 ? (
            <>
              <BigStat label={<VisuallyHidden>누적 경고</VisuallyHidden>} value={state.activeCount} unit="/ 3" size="md" />
              <WarningGauge count={state.activeCount} />
            </>
          ) : (
            <p className={s.noWarning}>{HOME_COPY.noWarning}</p>
          )}
        </div>
        <TextLink to={paths.warnings()} className={s.more}>
          자세히
        </TextLink>
      </div>
      {state.isPenaltyTarget ? (
        <div className={s.penalty}>
          <StatusBadge kind="penalty" />
          <p className={s.penaltyText}>{HOME_COPY.penalty}</p>
        </div>
      ) : null}
    </section>
  );
}

/** ⑤ 받은 초대 — 0건이면 영역째 그리지 않는다 */
export function InvitationNotice({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={s.invite}>
      <InfoBox
        tone="blue"
        icon="users"
        action={
          <LinkButton to={paths.invitations()} variant="outline" size="sm">
            보러 가기
          </LinkButton>
        }
      >
        <strong>{`받은 초대 ${count}건`}</strong>
      </InfoBox>
    </div>
  );
}

/** ⑥ 상태 배너 1개 (pickHomeBanner가 고른 것). E-39만 [설정 방법] → 잔디 인정 규칙 공지 */
export function StatusBanner({ banner, ruleNoticeId }: { banner: HomeBanner; ruleNoticeId: string | null }) {
  const action =
    banner.key === 'privateContribution' ? (
      <LinkButton to={ruleNoticeId ? paths.notice(ruleNoticeId) : paths.notices()} variant="outline" size="sm">
        설정 방법
      </LinkButton>
    ) : undefined;
  return (
    <div className={s.banner}>
      <InfoBox tone={banner.tone} icon={banner.tone === 'blue' ? 'info' : 'alert'} action={action} role="status">
        {banner.text}
      </InfoBox>
    </div>
  );
}

/** ⑨ 팀 미소속 (5-2-7) — ②③④ 대신 */
export function TeamlessCard() {
  return (
    <div className={s.teamless}>
      <Card as="section" aria-label="팀 참가 안내">
        <EmptyState
          icon="users"
          title={HOME_COPY.teamlessTitle}
          body={
            <div className={s.teamlessBody}>
              {HOME_COPY.teamlessBody.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          }
          action={
            <>
              <LinkButton to={paths.teamNew()} icon="plus">
                팀 만들기
              </LinkButton>
              <LinkButton to={paths.teamJoin()} variant="outline">
                초대코드 입력
              </LinkButton>
            </>
          }
        />
      </Card>
    </div>
  );
}

/** 영역 하나만 실패했을 때 — 화면 전체를 바꾸지 않는다 */
function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <InfoBox
      tone="mute"
      icon="alert"
      role="alert"
      action={
        <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
          다시 시도
        </Button>
      }
    >
      {message}
    </InfoBox>
  );
}

type NoticeProps = { data: HomeNoticesQueryQuery | undefined; loading: boolean; error: unknown; onRetry: () => void };

/** ⑦ 공지 3건(고정 공지 📌 먼저 — 서버 순서) + ⑧ 전체보기. 따로 불러서 실패해도 이 영역만 바뀐다 */
export function NoticePreview({ data, loading, error, onRetry }: NoticeProps) {
  let body: ReactNode = null;
  if (data) {
    // 캐시에 더 긴 목록이 있어도 3건만 (CM-01 ⑦)
    const nodes = data.notices.nodes.slice(0, 3);
    body =
      nodes.length > 0 ? (
        <RowList ariaLabel="최근 공지">
          {nodes.map((n) => (
            <RowItem
              key={n.id}
              to={paths.notice(n.id)}
              right={<time dateTime={n.createdAt}>{formatDateTimeMD(n.createdAt)}</time>}
            >
              <span className={s.pin} aria-hidden={n.isPinned ? undefined : true}>
                {n.isPinned ? (
                  <>
                    <Icon name="pin" size={15} />
                    <VisuallyHidden>고정 공지</VisuallyHidden>
                  </>
                ) : null}
              </span>
              <span className={`${s.noticeTitle} ${n.isPinned ? s.pinned : ''}`}>{n.title}</span>
            </RowItem>
          ))}
        </RowList>
      ) : (
        <p className={s.empty}>{HOME_COPY.noNotices}</p>
      );
  } else if (loading) {
    body = <ListSkeleton rows={3} />;
  } else if (error) {
    body = <SectionError message={HOME_COPY.noticesFailed} onRetry={onRetry} />;
  }
  return (
    <section className={s.notices} aria-labelledby="home-notices-title">
      <SectionHeader id="home-notices-title" title="공지" right={<TextLink to={paths.notices()}>전체보기</TextLink>} />
      {body}
    </section>
  );
}

/** 첫 로딩 — ②④⑦ 스켈레톤(E-54). 인사 문구는 세션 값이라 바로 그린다 */
export function HomeSkeleton({ title }: { title: string }) {
  return (
    <>
      <PageTitle title={title} />
      <div className={s.top}>
        <CardSkeleton height={220} />
        <span className={s.vline} aria-hidden="true" />
        <CardSkeleton height={220} />
      </div>
      <div className={s.notices}>
        <ListSkeleton rows={3} />
      </div>
    </>
  );
}
