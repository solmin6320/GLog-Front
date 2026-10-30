import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import type { TeamListQueryQuery } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { paths } from '@/shared/lib/paths';
import { CardSkeleton, EmptyState, Icon, InfoBox, LinkButton, PageContainer, PageTitle, QueryBoundary, StatusBadge } from '@/shared/ui';
import { TeamListQuery } from '../api';
import s from './TeamPages.module.css';

type TeamItem = TeamListQueryQuery['myTeams'][number];

function TopActions() {
  return (
    <>
      <LinkButton to={paths.teamJoin()} variant="outline">
        초대코드 입력
      </LinkButton>
      <LinkButton to={paths.teamNew()}>팀 만들기</LinkButton>
    </>
  );
}

/** ③ 받은 초대 알림 — 0건이면 숨김 */
function InvitationBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={s.block}>
      <InfoBox
        tone="blue"
        icon="users"
        action={
          <LinkButton to={paths.invitations()} variant="outline" size="sm">
            보러 가기
          </LinkButton>
        }
      >
        <b>받은 초대 {count}건</b>
      </InfoBox>
    </div>
  );
}

/** ④~⑧ 팀 카드 한 장. 카드 전체가 TM-05 링크 */
function TeamCard({ team }: { team: TeamItem }) {
  const { passCount, notYetCount } = team.currentWeekSummary;
  // 첫 참가 주 · 면제 주라 판정하지 않는 팀원 (통과 · 아직에 세지 않는다)
  const excluded = Math.max(0, team.memberCount - passCount - notYetCount);
  return (
    <li>
      <Link to={paths.team(team.id)} className={s.teamCard}>
        <div className={s.teamMain}>
          <div className={s.teamHead}>
            <h2 className={s.teamName}>{team.name}</h2>
            {team.viewerRole ? <StatusBadge kind="teamRole" role={team.viewerRole} /> : null}
            <StatusBadge kind="visibility" isPublic={team.isPublic} />
          </div>
          {/* ⑧ 진행 중인 주에는 '미달'을 쓰지 않는다 — 통과 · 아직 두 값만 (M-06) */}
          <p className={s.teamMeta}>
            <span>팀원 {team.memberCount}명</span>
            <span>
              이번 주 통과 <b>{passCount}명</b>
            </span>
            <span>
              아직 <b>{notYetCount}명</b>
            </span>
            {excluded > 0 ? (
              <span>
                제외 <b>{excluded}명</b>
              </span>
            ) : null}
          </p>
        </div>
        <span className={s.chev} aria-hidden="true">
          <Icon name="chevR" size={20} />
        </span>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className={s.cardList} aria-hidden="true">
      <CardSkeleton height={92} />
      <CardSkeleton height={92} />
      <CardSkeleton height={92} />
    </div>
  );
}

/** TM-01 내 팀 목록 (화면설계서 5-1-4, 목업 W-08) */
export default function TeamListPage() {
  useDocumentTitle('내 팀');
  const q = useQuery(TeamListQuery);
  const hasTeams = (q.data?.myTeams.length ?? 0) > 0;

  return (
    <PageContainer>
      {/* ② 상단 액션은 목록이 1개 이상일 때만 (빈 목록이면 ⑨ 안으로) */}
      <PageTitle title="내 팀" actions={hasTeams ? <TopActions /> : undefined} />
      <QueryBoundary loading={q.loading} error={q.error} data={q.data} onRetry={() => void q.refetch()} skeleton={<ListSkeleton />}>
        {(data) => (
          <>
            <InvitationBanner count={data.me?.pendingInvitationCount ?? 0} />
            {data.myTeams.length === 0 ? (
              <EmptyState
                icon="users"
                title="아직 참가한 팀이 없어요."
                body="팀을 만들거나 초대코드로 참가해 보세요."
                action={
                  <>
                    <LinkButton to={paths.teamNew()}>팀 만들기</LinkButton>
                    <LinkButton to={paths.teamJoin()} variant="outline">
                      초대코드 입력
                    </LinkButton>
                  </>
                }
              />
            ) : (
              <ul className={s.cardList} aria-label="내 팀">
                {data.myTeams.map((t) => (
                  <TeamCard key={t.id} team={t} />
                ))}
              </ul>
            )}
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
