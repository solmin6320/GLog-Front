import { useMutation } from '@apollo/client/react';
import { useTeamScope } from '@/guards';
import { useAction } from '@/shared/api';
import { Card, SectionHeader, Switch } from '@/shared/ui';
import { TeamSetVisibilityMutation } from '../api';
import { TEAM_COPY } from '../lib';
import m from './Manage.module.css';

/** TM-06 ⑦ 공개 설정 — 확인 없이 즉시 반영(낙관적 응답, 설계서 3-6). 값은 TeamScope 팀(캐시)에서 읽는다 */
export function VisibilitySection() {
  const { team, refetch } = useTeamScope();
  const [setVisibility] = useMutation(TeamSetVisibilityMutation);
  const change = useAction(
    (isPublic: boolean) => {
      // 캐시가 Team:{id}를 찾도록 __typename을 함께 준다 (생성 타입에는 없어서 변수로 넘긴다)
      const optimistic = { __typename: 'Team' as const, id: team.id, isPublic };
      return setVisibility({
        variables: { teamId: team.id, isPublic },
        optimisticResponse: { updateTeam: optimistic },
      });
    },
    { success: TEAM_COPY.visibilityChanged },
  );

  const onChange = async (next: boolean) => {
    const res = await change.run(next);
    if (res !== undefined) refetch();
  };

  return (
    <section className={m.section} aria-labelledby="manage-visibility-heading">
      <SectionHeader id="manage-visibility-heading" title="공개 설정" />
      <Card>
        <Switch
          checked={team.isPublic}
          disabled={change.pending}
          onChange={(v) => void onChange(v)}
          label="공개"
          description="프로필과 게시글에 팀 이름이 보여요. 끄면 이름만 숨기고 글은 그대로 전체 공개예요."
        />
      </Card>
    </section>
  );
}
