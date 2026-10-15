import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import type { TeamInvitationsQueryQuery } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useAction } from '@/shared/api';
import { formatDateTimeMD } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import { Button, Card, CardSkeleton, EmptyState, PageContainer, PageTitle, QueryBoundary } from '@/shared/ui';
import { REFRESH_SESSION, TeamInvitationsQuery, TeamRespondInvitationMutation } from '../api';
import { TEAM_COPY } from '../lib';
import s from './TeamPages.module.css';

type Invitation = TeamInvitationsQueryQuery['myInvitations'][number];

function InvitationCard({
  invitation,
  disabled,
  onAccept,
  onDecline,
}: {
  invitation: Invitation;
  disabled: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const teamName = invitation.team.name;
  return (
    <li>
      <Card className={s.inviteCard}>
        {/* ① 비공개 팀이어도 초대받은 당사자에게는 실제 이름 */}
        <div className={s.inviteMain}>
          <h2 className={s.inviteTeam}>{teamName}</h2>
          <p className={s.inviteMeta}>
            <span>{invitation.invitedBy.nickname} 님이 초대했어요</span>
            <span className={s.dot} aria-hidden="true">
              ·
            </span>
            <span>{formatDateTimeMD(invitation.createdAt)}</span>
          </p>
        </div>
        <div className={s.inviteActions}>
          <Button variant="outline" disabled={disabled} onClick={onDecline} aria-label={`${teamName} 초대 거절`}>
            거절
          </Button>
          <Button disabled={disabled} onClick={onAccept} aria-label={`${teamName} 초대 수락`}>
            수락
          </Button>
        </div>
      </Card>
    </li>
  );
}

/** TM-04 받은 초대 (화면설계서 5-1-15). 수락 · 거절은 확인 없이 바로 */
export default function InvitationsPage() {
  useDocumentTitle('받은 초대');
  const navigate = useNavigate();
  const q = useQuery(TeamInvitationsQuery);
  // 목록 쿼리에 me.pendingInvitationCount가 있어 다시 부르면 드로어 배지도 같이 바뀐다
  const reload = () => {
    q.refetch().catch(() => undefined);
  };

  const [respond] = useMutation(TeamRespondInvitationMutation);
  const accept = useAction(
    (invitationId: string) =>
      respond({
        variables: { invitationId, accept: true },
        refetchQueries: [REFRESH_SESSION, 'TeamInvitationsQuery'],
        awaitRefetchQueries: true,
      }),
    {
      success: TEAM_COPY.joined,
      // E-17 이미 참가 · E-18 없어진 팀: 서버가 초대를 정리했으니 목록을 다시 받아 카드를 지운다
      errorOverrides: { ALREADY_TEAM_MEMBER: TEAM_COPY.alreadyJoinedInvitation },
      onError: () => {
        reload();
        return false;
      },
    },
  );
  const decline = useAction(
    (invitationId: string) =>
      respond({ variables: { invitationId, accept: false }, refetchQueries: ['TeamInvitationsQuery'], awaitRefetchQueries: true }),
    {
      success: TEAM_COPY.declined,
      onError: () => {
        reload();
        return false;
      },
    },
  );
  const busy = accept.pending || decline.pending;

  const onAccept = async (invitationId: string) => {
    const res = await accept.run(invitationId);
    const team = res?.data?.respondInvitation.team;
    if (team) navigate(paths.team(team.id));
  };

  return (
    <PageContainer width="md">
      <PageTitle title="받은 초대" />
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={q.data}
        onRetry={reload}
        skeleton={
          <div className={s.cardList} aria-hidden="true">
            <CardSkeleton height={96} />
            <CardSkeleton height={96} />
          </div>
        }
      >
        {(data) =>
          data.myInvitations.length === 0 ? (
            <EmptyState icon="users" title="받은 초대가 없어요." />
          ) : (
            <ul className={s.cardList} aria-label="받은 초대">
              {data.myInvitations.map((inv) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  disabled={busy}
                  onAccept={() => void onAccept(inv.id)}
                  onDecline={() => void decline.run(inv.id)}
                />
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </PageContainer>
  );
}
