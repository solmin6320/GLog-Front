import { useMutation, useQuery } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import type { TeamBoardQueryQuery } from '@/gql/graphql';
import { useTeamScope } from '@/guards';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useClock } from '@/session';
import { useAction } from '@/shared/api';
import { asOfLabel, formatDateTimeMD, formatWeekRangeWithDay } from '@/shared/lib/format';
import { kstDateOf } from '@/shared/lib/kst';
import { paths } from '@/shared/lib/paths';
import {
  Avatar,
  Button,
  Card,
  CategoryChip,
  DataTable,
  EmptyState,
  Foot,
  InfoBox,
  LinkButton,
  PageContainer,
  PageTitle,
  QueryBoundary,
  RowItem,
  RowList,
  SectionHeader,
  StatusBadge,
  TableSkeleton,
  WeekStrip,
  useConfirm,
  type Column,
} from '@/shared/ui';
import { REFRESH_SESSION, TeamBoardQuery, TeamLeaveMutation } from '../api';
import { removeFromMyTeams, useForgetTeam } from '../hooks';
import { boardStatusLabel, postTypeLabel, TEAM_COPY } from '../lib';
import s from './TeamPages.module.css';

type Board = TeamBoardQueryQuery['teamBoard'];
type Row = Board['members'][number];
type RecentPost = Board['recentPosts'][number];

/** 서버 칸(null = 알 수 없음)을 WeekStrip 칸으로. 오늘 · 앞으로 올 날은 서버 시각(clock) 기준 */
function stripDays(days: Row['days'], today: string) {
  return days.map((d) => ({
    date: d.date,
    grassCount: d.hasGrass == null ? null : d.hasGrass ? 1 : 0,
    hasRecord: d.hasRecord,
    verified: !!d.verified,
    isToday: d.date === today,
    isFuture: d.date > today,
  }));
}

/** ⑥ 상태 칸: 진행 중이면 통과 / 아직 / 제외, 판정이 확정된 미달만 '미달' */
function BoardStatus({ status }: { status: Row['status'] }) {
  if (status === 'NOT_YET') return <StatusBadge kind="live" status="NOT_YET" />;
  return <StatusBadge kind="judgment" context="member" status={status} label={boardStatusLabel(status)} />;
}

/** ⑥ 팀원 행 — 경고는 이 팀 카테고리만(서버 warningCount), 벌칙 대상 표시는 넣지 않는다 */
const columns = (today: string): Column<Row>[] => [
  {
    key: 'name',
    header: '이름',
    render: (r) => (
      <div className={s.nameCell}>
        <Avatar name={r.nickname} size={32} />
        <Link to={paths.profile(r.memberId)} className={s.nameLink}>
          {r.nickname}
        </Link>
        {r.isMe ? <span className={s.meMark}>나</span> : null}
      </div>
    ),
  },
  {
    key: 'days',
    header: '인증일',
    render: (r) => (
      <div className={s.daysCell}>
        <WeekStrip days={stripDays(r.days, today)} size={12} />
        {/* E-32 잔디 미조회 · 판정 제외 주는 서버가 null → '—' */}
        <b className={s.dayCount}>{r.verifiedDays == null ? '—' : `${r.verifiedDays}일`}</b>
      </div>
    ),
  },
  { key: 'records', header: '기록글', render: (r) => `${r.recordCount}개` },
  // 판정 보류가 남아 알 수 없으면 서버가 null → '—'
  { key: 'warnings', header: '경고', render: (r) => (r.warningCount == null ? '—' : r.warningCount) },
  {
    key: 'status',
    header: '상태',
    // 진행 중인 주: 통과 / 아직 / 제외 — '미달'은 판정 확정 뒤에만 (TM-05 비고)
    render: (r) => <BoardStatus status={r.status} />,
  },
];

/** ⑤ 이번 주 현황표 (+ ⑨ 빈 상태) */
function WeekBoard({ board, teamId }: { board: Board; teamId: string }) {
  const clock = useClock();
  const today = kstDateOf(clock.now);
  const asOf = asOfLabel(board.grassFetchedAt, clock.now);
  const noActivity = board.members.every((r) => r.recordCount === 0 && !r.days.some((d) => d.verified));

  return (
    <section aria-labelledby="team-week-heading">
      <SectionHeader
        id="team-week-heading"
        title={
          <>
            이번 주 <span className={s.weekRange}>({formatWeekRangeWithDay(board.weekStart)})</span>
          </>
        }
        right={asOf ? `인증일은 ${asOf}이에요` : undefined}
      />
      {board.grassNotLoaded ? (
        <div className={s.block}>
          <InfoBox tone="warn" icon="alert" role="status">
            잔디를 아직 못 불러왔어요. 곧 다시 확인할게요.
          </InfoBox>
        </div>
      ) : null}
      {noActivity ? (
        <Card>
          <EmptyState
            icon="calendar"
            title="이번 주 활동이 아직 없어요."
            action={
              <LinkButton to={paths.postNew({ team: teamId })} icon="pencil">
                기록 쓰러 가기
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <DataTable
          caption="이번 주 팀원 현황"
          columns={columns(today)}
          rows={board.members}
          rowKey={(r) => r.memberId}
          rowTone={(r) => (r.isMe ? 'me' : undefined)}
          footer={<Foot>경고는 이 팀에서 받은 것만 세요. “아직”은 주가 끝나지 않아 만회할 수 있다는 뜻이에요.</Foot>}
        />
      )}
    </section>
  );
}

/** ⑦ 이 팀의 기록글 최신 5건. ⑧ [전체보기]는 팀 필터가 정해질 때까지 숨긴다 (U-02 · Q-12) */
function RecentPosts({ posts }: { posts: RecentPost[] }) {
  return (
    <section className={s.section} aria-labelledby="team-posts-heading">
      <SectionHeader id="team-posts-heading" title="이 팀의 기록글" />
      {posts.length === 0 ? (
        <p className={s.muted}>이 팀에 연결된 글이 아직 없어요.</p>
      ) : (
        <RowList>
          {posts.map((p) => (
            <RowItem
              key={p.id}
              to={paths.post(p.id)}
              right={
                <>
                  <span>{p.author.nickname}</span>
                  <span>{formatDateTimeMD(p.createdAt)}</span>
                </>
              }
            >
              <CategoryChip>{postTypeLabel(p.type)}</CategoryChip>
              <span className={s.postTitle}>{p.title}</span>
            </RowItem>
          ))}
        </RowList>
      )}
    </section>
  );
}

/** ③ 팀장 보조 메뉴 — 이 팀 팀장만 */
function LeaderMenu({ teamId }: { teamId: string }) {
  return (
    <div className={s.leaderMenu} role="group" aria-labelledby="team-leader-only">
      <span id="team-leader-only" className={s.leaderOnly}>
        팀장 전용
      </span>
      <LinkButton to={paths.teamManage(teamId)} variant="outline">
        팀원 관리
      </LinkButton>
      <LinkButton to={paths.teamExemption(teamId)} variant="outline">
        개인 면제 요청
      </LinkButton>
    </div>
  );
}

/** ④ 팀 나가기 — 팀원만 (팀장은 E-19로 노출하지 않는다). 자진 탈퇴는 경고를 유지한다 */
function LeaveButton({ teamId }: { teamId: string }) {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const forgetTeam = useForgetTeam();
  const [leaveTeam] = useMutation(TeamLeaveMutation);
  const leave = useAction(
    () =>
      leaveTeam({
        variables: { teamId },
        refetchQueries: [REFRESH_SESSION],
        awaitRefetchQueries: true,
        update: (cache) => removeFromMyTeams(cache, teamId),
      }),
    { success: TEAM_COPY.leaveDone },
  );

  const onLeave = async () => {
    const ok = await confirm({
      title: '팀에서 나갈까요?',
      body: '나가도 받은 경고는 그대로 남아요.',
      confirmLabel: '나가기',
      tone: 'danger',
    });
    if (!ok) return;
    const res = await leave.run();
    if (res === undefined) return;
    await navigate(paths.teams(), { replace: true });
    forgetTeam(teamId);
  };

  return (
    <Button variant="text" loading={leave.pending} onClick={() => void onLeave()}>
      팀 나가기
    </Button>
  );
}

/** TM-05 팀 현황판 (화면설계서 5-1-5, 목업 W-09). 팀 기본 정보 · 내 역할은 TeamScope에서 */
export default function TeamBoardPage() {
  const { team } = useTeamScope();
  useDocumentTitle(team.name);
  const q = useQuery(TeamBoardQuery, { variables: { id: team.id } });
  const isLeader = team.isLeader;

  return (
    <PageContainer>
      {/* ① 소속 팀원이 보는 화면이라 비공개여도 실제 이름 · ② 공개 설정 배지 */}
      <PageTitle
        title={team.name}
        meta={<StatusBadge kind="visibility" isPublic={team.isPublic} />}
        actions={isLeader ? <LeaderMenu teamId={team.id} /> : <LeaveButton teamId={team.id} />}
      />
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={q.data?.teamBoard}
        onRetry={() => {
          q.refetch().catch(() => undefined);
        }}
        skeleton={<TableSkeleton rows={4} cols={5} />}
      >
        {(board) => (
          <>
            <WeekBoard board={board} teamId={team.id} />
            <RecentPosts posts={board.recentPosts} />
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
