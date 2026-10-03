import { useState, type FormEvent } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { Link } from 'react-router';
import type { TeamManagedContentsQueryQuery } from '@/gql/graphql';
import { MSG } from '@/domain/messages';
import { appError, useAction, usePagedList } from '@/shared/api';
import { paths } from '@/shared/lib/paths';
import { LIMITS, validateRequiredText } from '@/shared/lib/validators';
import {
  Button,
  CategoryChip,
  Hint,
  InfoBox,
  LinkButton,
  ListSkeleton,
  LoadMore,
  RowItem,
  RowList,
  SectionHeader,
  TextArea,
} from '@/shared/ui';
import { TeamCommentForEditQuery, TeamManagedContentsQuery, TeamUpdateCommentMutation } from '../api';
import { TEAM_COPY } from '../lib';
import m from './Manage.module.css';

type ContentNode = NonNullable<TeamManagedContentsQueryQuery['team']>['managedContents']['nodes'][number];

const validateComment = validateRequiredText('댓글', LIMITS.comment);

/** 댓글 한 줄 — [수정]을 누르면 그 자리에서 고친다 (ACC-TM06-09). 목록에는 본문 앞부분만 있어 전체 본문을 먼저 받는다 */
function CommentRow({ node }: { node: ContentNode }) {
  const client = useApolloClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateComment] = useMutation(TeamUpdateCommentMutation);

  const open = useAction(async () => {
    const res = await client.query({ query: TeamCommentForEditQuery, variables: { postId: node.postId }, fetchPolicy: 'network-only' });
    const post = res.data?.post;
    const comment = post && 'comments' in post ? post.comments.nodes.find((c) => c.id === node.targetId) : undefined;
    if (!comment || !comment.viewerCanEdit) throw appError('NOT_FOUND');
    return comment.content;
  });
  const save = useAction(
    (content: string) =>
      updateComment({ variables: { id: node.targetId, content }, refetchQueries: ['TeamManagedContentsQuery'], awaitRefetchQueries: true }),
    { success: MSG.saved },
  );

  const startEdit = async () => {
    const content = await open.run();
    if (content !== undefined) {
      setError(null);
      setDraft(content);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (draft === null || save.pending) return;
    const invalid = validateComment(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    const res = await save.run(draft.trim());
    if (res !== undefined) setDraft(null);
  };

  return (
    <RowItem
      alignTop
      right={
        draft === null ? (
          <Button
            variant="outline"
            size="xs"
            loading={open.pending}
            aria-label={`수정: 댓글 ${node.title}`}
            onClick={() => void startEdit()}
          >
            수정
          </Button>
        ) : null
      }
    >
      <CategoryChip>댓글</CategoryChip>
      <div className={m.contentBody}>
        <Link to={paths.post(node.postId)} className={m.contentTitle}>
          {node.title}
        </Link>
        <div className={m.mutedXs}>{node.author.nickname}</div>
        {draft !== null ? (
          <form className={m.commentEditor} onSubmit={(e) => void submit(e)} noValidate>
            <TextArea
              label="댓글 수정"
              value={draft}
              rows={3}
              maxLength={LIMITS.comment}
              counter
              autoFocus
              error={error}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
            />
            <div className={m.editorActions}>
              <Button variant="outline" size="sm" disabled={save.pending} onClick={() => setDraft(null)}>
                취소
              </Button>
              <Button type="submit" size="sm" loading={save.pending}>
                저장
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </RowItem>
  );
}

/** 글 한 줄 — [수정] → BD-04 (팀장이 남의 글을 고치는 경우 BD-04가 배너를 띄운다) */
function PostRow({ node }: { node: ContentNode }) {
  return (
    <RowItem
      alignTop
      right={
        <LinkButton to={paths.postEdit(node.postId)} variant="outline" size="xs" aria-label={`수정: ${node.title}`}>
          수정
        </LinkButton>
      }
    >
      <CategoryChip>글</CategoryChip>
      <div className={m.contentBody}>
        <Link to={paths.post(node.postId)} className={m.contentTitle}>
          {node.title}
        </Link>
        <div className={m.mutedXs}>{node.author.nickname}</div>
      </div>
    </RowItem>
  );
}

/** TM-06 ⑧ 팀 글 관리 — 행마다 [수정]만. 삭제 버튼은 두지 않는다 (삭제는 관리자만) */
export function TeamContentsSection({ teamId }: { teamId: string }) {
  const list = usePagedList(TeamManagedContentsQuery, { variables: { id: teamId }, select: (d) => d.team?.managedContents });

  let body;
  if (list.nodes.length === 0 && list.loading) body = <ListSkeleton rows={3} />;
  else if (list.nodes.length === 0 && list.error)
    body = (
      <InfoBox
        tone="red"
        icon="alert"
        role="alert"
        action={
          <Button variant="outline" size="sm" icon="refresh" onClick={list.refetch}>
            다시 시도
          </Button>
        }
      >
        불러오지 못했어요.
      </InfoBox>
    );
  else if (list.nodes.length === 0) body = <p className={m.emptyNote}>이 팀에 연결된 글이 없어요.</p>;
  else
    body = (
      <RowList ariaLabel="팀 글과 댓글">
        {list.nodes.map((n) =>
          n.kind === 'COMMENT' ? <CommentRow key={`c-${n.targetId}`} node={n} /> : <PostRow key={`p-${n.targetId}`} node={n} />,
        )}
      </RowList>
    );

  return (
    <section className={m.section} aria-labelledby="manage-contents-heading">
      <SectionHeader id="manage-contents-heading" title="팀 글 관리" />
      {body}
      {list.nodes.length > 0 ? (
        <LoadMore hasMore={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onLoadMore={list.loadMore} endText={null} />
      ) : null}
      <Hint>{TEAM_COPY.deleteAskAdmin}</Hint>
    </section>
  );
}
