import { useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import type { TeamMembersQueryQuery } from '@/gql/graphql';
import { useTeamScope } from '@/guards';
import { toPaged, useAction, usePagedList } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { Avatar, Button, ListSkeleton, LoadMore, RowItem, RowList, SectionHeader, StatusBadge, useConfirm } from '@/shared/ui';
import { TeamKickMemberMutation, TeamMembersQuery, TeamTransferLeadershipMutation } from '../api';
import { TEAM_COPY } from '../lib';
import m from './Manage.module.css';

type MemberInfo = TeamMembersQueryQuery['teamMembers']['items'][number];

/** TM-06 ④ 팀원 목록(커서 20개) + ⑤ 추방 + ⑥ 팀장 넘기기. 위험한 동작은 전부 확인 다이얼로그 */
export function MembersSection({ teamId, viewerMemberId }: { teamId: string; viewerMemberId: string }) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const scope = useTeamScope();
  const list = usePagedList(TeamMembersQuery, { variables: { id: teamId }, select: (d) => toPaged(d.teamMembers) });

  const [kickMember] = useMutation(TeamKickMemberMutation);
  const [transferLeadership] = useMutation(TeamTransferLeadershipMutation);
  // 추방은 Boolean만 돌려줘서 팀원 목록과 팀 인원(TeamScope)을 다시 받는다
  const kick = useAction(
    (memberId: string) =>
      kickMember({ variables: { teamId, memberId }, refetchQueries: ['TeamMembersQuery'], awaitRefetchQueries: true }),
    { success: TEAM_COPY.kicked },
  );
  const transfer = useAction((newLeaderId: string) => transferLeadership({ variables: { teamId, newLeaderId } }), {
    success: TEAM_COPY.transferred,
  });
  const busy = kick.pending || transfer.pending;

  const onKick = async (target: MemberInfo) => {
    const ok = await confirm({
      title: `${target.nickname}님을 추방할까요?`,
      body: '이 팀 초대코드로는 1년간 다시 들어올 수 없어요.',
      confirmLabel: '추방',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await kick.run(target.id);
    if (res !== undefined) scope.refetch();
  };

  const onTransfer = async (target: MemberInfo) => {
    const ok = await confirm({
      title: `${target.nickname}님에게 팀장을 넘길까요?`,
      body: '넘기면 되돌릴 수 없어요.',
      confirmLabel: '팀장 넘기기',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await transfer.run(target.id);
    if (res === undefined) return;
    // 이 화면 권한을 잃는다 → 팀 정보를 다시 받고 TM-05로 (요구사항 4-2)
    scope.refetch();
    navigate(paths.team(teamId), { replace: true });
  };

  const members = list.nodes;
  const others = members.filter((x) => x.id !== viewerMemberId);

  return (
    <section className={m.section} aria-labelledby="manage-members-heading">
      <SectionHeader id="manage-members-heading" title="팀원" right={`${scope.team.memberCount}명`} />
      {members.length === 0 && list.loading ? (
        <ListSkeleton rows={3} />
      ) : (
        <RowList ariaLabel="팀원">
          {members.map((x) => {
            const self = x.id === viewerMemberId;
            return (
              <RowItem
                key={x.id}
                right={
                  self ? null : (
                    <span className={m.rowActions}>
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={busy}
                        aria-label={`팀장 넘기기: ${x.nickname}`}
                        onClick={() => void onTransfer(x)}
                      >
                        팀장 넘기기
                      </Button>
                      <Button variant="danger" size="xs" disabled={busy} aria-label={`추방: ${x.nickname}`} onClick={() => void onKick(x)}>
                        추방
                      </Button>
                    </span>
                  )
                }
              >
                <Avatar name={x.nickname} imageUrl={x.profileImageUrl} size={32} />
                <Link to={paths.profile(x.id)} className={m.memberName}>
                  {x.nickname}
                </Link>
                <span className={m.mutedXs}>@{x.githubLogin}</span>
                {x.isLeader ? <StatusBadge kind="teamRole" role="LEADER" /> : null}
              </RowItem>
            );
          })}
        </RowList>
      )}
      {members.length > 0 ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onLoadMore={list.loadMore} endText={null} />
      ) : null}
      {!list.loading && others.length === 0 ? (
        <p className={m.emptyNote}>아직 팀원이 없어요. 초대코드를 알려주거나 아이디로 초대해 보세요.</p>
      ) : null}
    </section>
  );
}
