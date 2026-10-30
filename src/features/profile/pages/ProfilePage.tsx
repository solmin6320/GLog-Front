import { skipToken, useQuery } from '@apollo/client/react';
import { useParams } from 'react-router';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useIsAdmin, useViewer } from '@/session';
import { toPaged, usePagedList } from '@/shared/api';
import { isBigintId } from '@/shared/lib/ids';
import { FullState, PageContainer, QueryBoundary } from '@/shared/ui';
import { ProfileHistoryQuery, ProfileQuery } from '../api';
import {
  ActivityCounts,
  GrassSection,
  HISTORY_PAGE,
  HistorySection,
  ProfileHeader,
  ProfileSkeleton,
  TeamsSection,
  WarningSection,
} from '../components/ProfileSections';
import { PROFILE_COPY } from '../copy';
import s from '../profile.module.css';

/**
 * PR-01 프로필 (화면설계서 5-1-9, 목업 W-14) — `/profile/me` · `/profile/:userId` 공용.
 * userId 형식이 틀리면 부르지 않고 404, 없는 회원 · 승인되지 않은 회원도 404(NOT_FOUND, E-53). 내 id면 본인 화면.
 * 타인이어도 ⑥~⑫는 그대로 보인다(확정 · 5-1-9). 비공개 팀 표기는 서버가 가려서 준다.
 */
export default function ProfilePage() {
  const { userId } = useParams();
  const viewer = useViewer();
  const isAdmin = useIsAdmin();
  const id = userId ?? viewer.memberId;
  const valid = isBigintId(id);
  const isOwn = id === viewer.memberId;

  const q = useQuery(ProfileQuery, valid ? { variables: { id } } : skipToken);
  const history = usePagedList(ProfileHistoryQuery, {
    variables: { id },
    select: (d) => (d.profile.id === id ? toPaged(d.profile.judgmentHistory) : null),
    skip: !valid,
    pageSize: HISTORY_PAGE,
  });

  const raw = q.data?.profile;
  // 다른 회원으로 옮기는 중에는 이전 회원을 그리지 않는다
  const stale = !!raw && raw.id !== id;
  const member = stale ? undefined : raw;
  const myTeamIds = new Set((q.data?.myTeams ?? []).map((t) => t.id));
  useDocumentTitle(isOwn ? PROFILE_COPY.myTitle : (member?.nickname ?? PROFILE_COPY.title));

  if (!valid) {
    return (
      <PageContainer>
        <FullState kind="notFound" />
      </PageContainer>
    );
  }

  const retry = () => void q.refetch().catch(() => undefined);
  return (
    <PageContainer>
      <QueryBoundary loading={q.loading || stale} error={q.error} data={member} skeleton={<ProfileSkeleton />} onRetry={retry}>
        {(m) => (
          <>
            <ProfileHeader member={m} isOwn={isOwn} isAdmin={isAdmin} />
            <ActivityCounts member={m} />
            <GrassSection member={m} onRetry={retry} />
            <div className={s.grid}>
              <WarningSection member={m} />
              <HistorySection list={history} />
            </div>
            <TeamsSection member={m} myTeamIds={myTeamIds} />
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
