import { skipToken, useQuery } from '@apollo/client/react';
import { pickHomeBanner } from '@/domain/banner';
import type { HomeQueryQuery } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useViewer } from '@/session';
import { PageContainer, PageTitle, QueryBoundary } from '@/shared/ui';
import { HomeNoticesQuery, HomeQuery } from '../api';
import {
  HomeSkeleton,
  InvitationNotice,
  NoticePreview,
  StatusBanner,
  TeamlessCard,
  WarningSummary,
  WeekProgress,
} from '../components/HomeSections';
import { HOME_COPY } from '../copy';
import s from '../home.module.css';

/**
 * CM-01 홈 (화면설계서 5-1-3, 목업 W-02).
 * 팀 있음: ① 인사 · ② 이번 주 진행 · ③ 안내 · ④ 내 경고 · ⑤ 받은 초대 · ⑥ 상태 배너 1개 · ⑦⑧ 공지
 * 팀 미소속(5-2-7): ① · ⑨ 팀 참가 유도 · ⑤ · ⑦⑧ — 판정 · 경고 카드는 그리지 않는다.
 * 숫자는 모두 서버 값이다. 프론트는 배너 1개 고르기 · 문구 고르기만 한다.
 */
export default function HomePage() {
  useDocumentTitle('홈');
  const viewer = useViewer();
  const main = useQuery(HomeQuery, viewer.hasTeam ? {} : skipToken);
  // 공지가 실패해도 화면 전체를 비우지 않는다 → 따로 · errorPolicy 'all'
  const notices = useQuery(HomeNoticesQuery, { errorPolicy: 'all' });
  const noticeProps = {
    data: notices.data,
    loading: notices.loading,
    error: notices.error,
    onRetry: () => void notices.refetch().catch(() => undefined),
  };

  if (!viewer.hasTeam) {
    return (
      <PageContainer>
        <PageTitle title={HOME_COPY.greetingTeamless(viewer.nickname)} />
        <TeamlessCard />
        <InvitationNotice count={viewer.pendingInvitationCount} />
        <NoticePreview {...noticeProps} />
      </PageContainer>
    );
  }

  const greeting = HOME_COPY.greeting(viewer.nickname);
  return (
    <PageContainer>
      <QueryBoundary
        loading={main.loading}
        error={main.error}
        data={main.data}
        skeleton={<HomeSkeleton title={greeting} />}
        onRetry={() => void main.refetch().catch(() => undefined)}
      >
        {(data) => (
          <>
            <PageTitle title={greeting} />
            <Dashboard data={data} invitationCount={viewer.pendingInvitationCount} />
            <NoticePreview {...noticeProps} />
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}

function Dashboard({ data, invitationCount }: { data: HomeQueryQuery; invitationCount: number }) {
  const week = data.myWeek;
  const state = data.myWarnings.state;
  // ⑥ E-39 → E-32 → E-36 → E-46 중 1개 (E-40은 ④ 하단)
  const banner = pickHomeBanner({
    grassStatus: week.grassStatus,
    skipReason: week.live?.skipReason ?? null,
    liveStatus: week.live?.status ?? null,
    privateContributionSuspected: week.privateContributionSuspected,
  });
  return (
    <>
      <div className={s.top}>
        <WeekProgress week={week} weeksUntilDeduction={state.weeksUntilDeduction} />
        <span className={s.vline} aria-hidden="true" />
        <div className={s.side}>
          <WarningSummary state={state} />
          <InvitationNotice count={invitationCount} />
        </div>
      </div>
      {banner ? <StatusBanner banner={banner} ruleNoticeId={data.grassRuleNotice?.id ?? null} /> : null}
    </>
  );
}
