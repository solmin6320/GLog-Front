import { useQuery } from '@apollo/client/react';
import { useParams, useSearchParams } from 'react-router';
import type { PostEditorPostQueryQuery, PostEditorTeamsQueryQuery } from '@/gql/graphql';
import { useClock } from '@/session';
import { isObjectId } from '@/shared/lib/ids';
import { parsePostNewSearch, postTypeToEnum } from '@/shared/lib/paths';
import { FullState, PageContainer, QueryBoundary } from '@/shared/ui';
import { PostEditorPostQuery, PostEditorTeamsQuery } from '../api';
import { PostForm, type PostFormValues } from '../components/PostForm';
import { inPastWeek, usePostPermissions } from '../permissions';
import { REQUIRED_SECTIONS } from '../postText';

type MyTeam = PostEditorTeamsQueryQuery['myTeams'][number];
type EditablePost = PostEditorPostQueryQuery['post'];

const NO_TEAM = { value: '', label: '연결 안 함' };

/** ⑨ 셀렉트: "연결 안 함"(기본) + 내 팀 실제 이름(비공개 팀 포함). 지금 연결된 팀이 내 팀이 아니면 그 자리도 남긴다 */
function teamOptions(teams: MyTeam[], keepTeamId?: string | null) {
  const options = [NO_TEAM, ...teams.map((t) => ({ value: t.id, label: t.name }))];
  if (keepTeamId && !teams.some((t) => t.id === keepTeamId)) options.push({ value: keepTeamId, label: '지금 연결된 팀' });
  return options;
}

/**
 * BD-04 글 작성 · 수정 (화면설계서 5-1-7). `/posts/new?type=&team=` · `/posts/:postId/edit` 공용.
 * 수정 권한(작성자 · 그 글 팀의 팀장)은 usePostPermissions로 계산한다 — 없으면 403(E-09).
 */
export default function PostEditorPage() {
  const { postId } = useParams();
  const [sp] = useSearchParams();
  if (postId === undefined) {
    const { type, team } = parsePostNewSearch(sp);
    return <NewPost type={postTypeToEnum(type)} team={team} />;
  }
  if (!isObjectId(postId)) {
    return (
      <PageContainer width="md">
        <FullState kind="notFound" />
      </PageContainer>
    );
  }
  return <EditPost postId={postId.toLowerCase()} />;
}

function NewPost({ type, team }: { type: PostFormValues['type']; team?: string }) {
  const teams = useQuery(PostEditorTeamsQuery);
  return (
    <PageContainer width="md">
      <QueryBoundary loading={teams.loading} error={teams.error} data={teams.data} onRetry={() => void teams.refetch()}>
        {(d) => (
          <PostForm
            mode="new"
            teams={teamOptions(d.myTeams)}
            initial={{
              type,
              title: '',
              sections: {},
              tags: [],
              commit: '',
              teamId: team && d.myTeams.some((t) => t.id === team) ? team : '',
            }}
          />
        )}
      </QueryBoundary>
    </PageContainer>
  );
}

function EditPost({ postId }: { postId: string }) {
  const post = useQuery(PostEditorPostQuery, { variables: { id: postId } });
  const teams = useQuery(PostEditorTeamsQuery);
  const data = post.data && teams.data ? { post: post.data.post, teams: teams.data.myTeams } : undefined;
  return (
    <PageContainer width="md">
      <QueryBoundary
        loading={post.loading || teams.loading}
        error={post.error ?? teams.error}
        data={data}
        onRetry={() => {
          void post.refetch();
          void teams.refetch();
        }}
      >
        {(d) => <EditForm post={d.post} teams={d.teams} />}
      </QueryBoundary>
    </PageContainer>
  );
}

function EditForm({ post, teams }: { post: EditablePost; teams: MyTeam[] }) {
  const clock = useClock();
  const can = usePostPermissions(post.teamId, teams);
  if (!can.canEdit(post.authorId)) return <FullState kind="forbidden" />;
  const leaderEditing = !can.isAuthor(post.authorId); // 수정 권한은 있는데 작성자가 아니다 = 그 팀 팀장
  return (
    <PostForm
      mode="edit"
      postId={post.id}
      teams={teamOptions(teams, post.teamId)}
      lockTeam={leaderEditing}
      finalizedWeek={inPastWeek(post.writtenDate, clock.currentWeekStart)}
      initial={{
        type: post.type,
        title: post.title,
        sections: Object.fromEntries(REQUIRED_SECTIONS[post.type].map((key) => [key, post.sections[key] ?? ''])),
        tags: post.tags,
        commit: post.commitUrls[0] ?? '',
        teamId: post.teamId ?? '',
      }}
    />
  );
}
