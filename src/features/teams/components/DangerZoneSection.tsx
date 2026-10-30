import { useMutation } from '@apollo/client/react';
import { useNavigate } from 'react-router';
import { useAction } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { Button, SectionHeader, useConfirm } from '@/shared/ui';
import { REFRESH_SESSION, TeamDeleteMutation } from '../api';
import { removeFromMyTeams, useForgetTeam } from '../hooks';
import { TEAM_COPY } from '../lib';
import m from './Manage.module.css';

/**
 * TM-06 ⑨ 팀 삭제 + ⑩ 팀 나가기 안내.
 * 팀원이 있으면 팀장은 넘긴 뒤에만 나갈 수 있다(E-19). 혼자 남은 팀장의 [팀 나가기]는 팀 삭제다(E-20, ACC-TM06-12 제안).
 */
export function DangerZoneSection({ teamId, alone }: { teamId: string; alone: boolean }) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const forgetTeam = useForgetTeam();
  const [deleteTeam] = useMutation(TeamDeleteMutation);
  const remove = useAction(
    () =>
      deleteTeam({
        variables: { teamId },
        refetchQueries: [REFRESH_SESSION],
        awaitRefetchQueries: true,
        update: (cache) => removeFromMyTeams(cache, teamId),
      }),
    { success: TEAM_COPY.deleted },
  );

  const removeAndLeave = async () => {
    const res = await remove.run();
    if (res === undefined) return;
    await navigate(paths.teams(), { replace: true });
    forgetTeam(teamId);
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: '팀을 삭제할까요?',
      body: '팀을 삭제하면 되돌릴 수 없어요. 글은 남지만 팀 이름은 사라져요.',
      confirmLabel: '팀 삭제',
      tone: 'danger',
    });
    if (ok) await removeAndLeave();
  };

  const onLeaveAlone = async () => {
    const ok = await confirm({
      title: '혼자 있는 팀이에요.',
      body: '나가면 팀이 삭제돼요. 삭제할까요?',
      confirmLabel: '나가고 삭제',
      tone: 'danger',
    });
    if (ok) await removeAndLeave();
  };

  return (
    <section className={m.section} aria-labelledby="manage-danger-heading">
      <SectionHeader id="manage-danger-heading" title="팀 나가기 · 삭제" />
      {alone ? (
        <div className={m.leaveRow}>
          <p className={m.note}>혼자 있는 팀이라 나가면 팀이 삭제돼요.</p>
          <Button variant="outline" disabled={remove.pending} onClick={() => void onLeaveAlone()}>
            팀 나가기
          </Button>
        </div>
      ) : (
        <p className={m.note}>{TEAM_COPY.leaderMustTransfer}</p>
      )}
      <div className={m.danger}>
        <div className={m.dangerText}>
          <b className={m.dangerTitle}>팀 삭제</b>
          <p className={m.dangerBody}>되돌릴 수 없어요. 글은 남지만 팀 이름은 사라져요.</p>
        </div>
        <Button variant="danger" loading={remove.pending} onClick={() => void onDelete()}>
          팀 삭제
        </Button>
      </div>
    </section>
  );
}
