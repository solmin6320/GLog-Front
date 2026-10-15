import { useQuery } from '@apollo/client/react';
import { useTeamScope } from '@/guards';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useViewer } from '@/session';
import { PageContainer, PageSkeleton, PageTitle, QueryBoundary, SectionHeader } from '@/shared/ui';
import { TeamManageQuery } from '../api';
import { DangerZoneSection } from '../components/DangerZoneSection';
import { InviteCodeBox } from '../components/InviteCodeBox';
import { InviteMemberSection } from '../components/InviteMemberSection';
import { MembersSection } from '../components/MembersSection';
import { TeamContentsSection } from '../components/TeamContentsSection';
import { VisibilitySection } from '../components/VisibilitySection';
import m from '../components/Manage.module.css';

/**
 * TM-06 팀 관리 (화면설계서 5-1-16, 목업 W-10). 팀장만 (RequireTeamLeader).
 * 순서: 초대코드 · 아이디로 초대 · 보낸 초대 · 팀원 · 공개 설정 · 팀 글 관리 · 나가기 · 삭제 (ACC-TM06-02)
 */
export default function TeamManagePage() {
  const { team } = useTeamScope();
  const viewer = useViewer();
  useDocumentTitle(`팀 관리 · ${team.name}`);
  const q = useQuery(TeamManageQuery, { variables: { id: team.id } });

  return (
    <PageContainer width="md">
      <PageTitle title="팀 관리" sub={team.name} />
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={q.data?.team}
        onRetry={() => {
          q.refetch().catch(() => undefined);
        }}
        skeleton={<PageSkeleton />}
      >
        {(t) => (
          <>
            {/* ① 계약 값이 있을 때만 (Q-01 기본값: 팀장 재열람 허용) */}
            {t.inviteCode ? (
              <section className={m.section} aria-labelledby="manage-code-heading">
                <SectionHeader id="manage-code-heading" title="초대코드" />
                <InviteCodeBox code={t.inviteCode} note="다시 발급할 수 없어요." />
              </section>
            ) : null}
            <InviteMemberSection teamId={team.id} pending={t.pendingInvitations} />
            <MembersSection teamId={team.id} members={t.members} viewerMemberId={viewer.memberId} />
            <VisibilitySection />
            <TeamContentsSection teamId={team.id} />
            <DangerZoneSection teamId={team.id} alone={t.members.length <= 1} />
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
