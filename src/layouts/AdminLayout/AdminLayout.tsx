import { useQuery } from '@apollo/client/react';
import { Outlet } from 'react-router';
import { useClock } from '@/session';
import { formatFullDate } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import { PageContainer, PageTitle, Tabs } from '@/shared/ui';
import { AdminLayoutCountsQuery } from '../api';
import s from './AdminLayout.module.css';

/**
 * AD-01 6개 URL 공용 (W-15 · W-16): 제목 '관리자' + 오늘 날짜 + 가로 탭 6 + 처리 대기 배지. 본문 폭 1120.
 * 배지 숫자는 adminDashboardSummary 한 번 (드로어 관리자 그룹과 공유).
 */
export function AdminLayout() {
  const clock = useClock();
  const { data } = useQuery(AdminLayoutCountsQuery);
  const summary = data?.adminDashboardSummary;

  return (
    <PageContainer width="xl">
      <PageTitle title="관리자" actions={<span className={s.date}>{formatFullDate(clock.today)}</span>} />
      <Tabs
        ariaLabel="관리자 메뉴"
        items={[
          { to: paths.admin(), label: '관리자 대시보드', end: true },
          { to: paths.adminWarnings(), label: '경고 복구 · 벌칙', count: summary?.penaltyTargetCount },
          { to: paths.adminMembers(), label: '가입 승인', count: summary?.pendingMemberCount },
          { to: paths.adminExemptions(), label: '면제 관리', count: summary?.pendingExemptionRequestCount },
          { to: paths.adminNotices(), label: '공지 관리' },
          { to: paths.adminPosts(), label: '게시물 관리' },
        ]}
      />
      <Outlet />
    </PageContainer>
  );
}
