import { useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import type { TeamManageQueryQuery } from '@/gql/graphql';
import { useTeamScope } from '@/guards';
import { useAction } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { Avatar, Button, RowItem, RowList, SectionHeader, StatusBadge, useConfirm } from '@/shared/ui';
import { TeamKickMemberMutation, TeamTransferLeadershipMutation } from '../api';
import { TEAM_COPY } from '../lib';
import m from './Manage.module.css';

type Membership = NonNullable<TeamManageQueryQuery['team']>['members'][number];
type MemberInfo = Membership['member'];

/** TM-06 ④ 팀원 목록 + ⑤ 추방 + ⑥ 팀장 넘기기. 위험한 동작은 전부 확인 다이얼로그 */
export function MembersSection({ teamId, members, viewerMemberId }: { teamId: string; members: Membership[]; viewerMemberId: string }) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const scope = useTeamScope();

  const [kickMember] = useMutation(TeamKickMemberMutation);
  const [transferLeadership] = useMutation(TeamTransferLeadershipMutation);
  // 결과 Team.members가 캐시를 고쳐 목록에서 행이 바로 빠진다
  const kick = useAction((memberId: string) => kickMember({ variables: { teamId, memberId } }), { success: TEAM_COPY.kicked });
  const transfer = useAction((memberId: string) => transferLeadership({ variables: { teamId, memberId } }), {
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
    if (ok) await kick.run(target.id);
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

  const others = members.filter((x) => x.member.id !== viewerMemberId);

  return (
    <section className={m.section} aria-labelledby="manage-members-heading">
      <SectionHeader id="manage-members-heading" title="팀원" right={`${members.length}명`} />
      <RowList ariaLabel="팀원">
        {members.map((x) => {
          const self = x.member.id === viewerMemberId;
          return (
            <RowItem
              key={x.member.id}
              right={
                self ? null : (
                  <span className={m.rowActions}>
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={busy}
                      aria-label={`팀장 넘기기: ${x.member.nickname}`}
                      onClick={() => void onTransfer(x.member)}
                    >
                      팀장 넘기기
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      disabled={busy}
                      aria-label={`추방: ${x.member.nickname}`}
                      onClick={() => void onKick(x.member)}
                    >
                      추방
                    </Button>
                  </span>
                )
              }
            >
              <Avatar name={x.member.nickname} imageUrl={x.member.profileImageUrl} size={32} />
              <Link to={paths.profile(x.member.id)} className={m.memberName}>
                {x.member.nickname}
              </Link>
              <span className={m.mutedXs}>@{x.member.githubLogin}</span>
              <StatusBadge kind="teamRole" role={x.role} />
            </RowItem>
          );
        })}
      </RowList>
      {others.length === 0 ? <p className={m.emptyNote}>아직 팀원이 없어요. 초대코드를 알려주거나 아이디로 초대해 보세요.</p> : null}
    </section>
  );
}
