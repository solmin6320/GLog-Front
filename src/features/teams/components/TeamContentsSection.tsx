import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation } from '@apollo/client/react';
import { Link } from 'react-router';
import type { TeamCommentsQueryQuery, TeamPostsQueryQuery } from '@/gql/graphql';
import { MSG } from '@/domain/messages';
import { toPaged, useAction, usePagedList, type PagedList } from '@/shared/api';
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
import { TeamCommentsQuery, TeamPostsQuery, TeamUpdateCommentMutation } from '../api';
import { postTypeLabel, TEAM_COPY } from '../lib';
import m from './Manage.module.css';

type PostNode = TeamPostsQueryQuery['teamPosts']['items'][number];
type CommentNode = TeamCommentsQueryQuery['teamComments']['items'][number];

const validateComment = validateRequiredText('댓글', LIMITS.comment);
/** 댓글 줄에 보여 줄 본문 앞부분 */
const PREVIEW_LENGTH = 40;

function preview(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

/** 댓글 한 줄 — [수정]을 누르면 그 자리에서 고친다 (ACC-TM06-09). 목록에 본문 전체가 있다 */
function CommentRow({ node }: { node: CommentNode }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateComment] = useMutation(TeamUpdateCommentMutation);
  const title = preview(node.content);

  const save = useAction(
    (content: string) =>
      updateComment({ variables: { id: node.id, content }, refetchQueries: ['TeamCommentsQuery'], awaitRefetchQueries: true }),
    { success: MSG.saved },
  );

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
            aria-label={`수정: 댓글 ${title}`}
            onClick={() => {
              setError(null);
              setDraft(node.content);
            }}
          >
            수정
          </Button>
        ) : null
      }
    >
      <CategoryChip>댓글</CategoryChip>
      <div className={m.contentBody}>
        <Link to={paths.post(node.postId)} className={m.contentTitle}>
          {title}
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
function PostRow({ node }: { node: PostNode }) {
  return (
    <RowItem
      alignTop
      right={
        <LinkButton to={paths.postEdit(node.id)} variant="outline" size="xs" aria-label={`수정: ${node.title}`}>
          수정
        </LinkButton>
      }
    >
      <CategoryChip>{postTypeLabel(node.type)}</CategoryChip>
      <div className={m.contentBody}>
        <Link to={paths.post(node.id)} className={m.contentTitle}>
          {node.title}
        </Link>
        <div className={m.mutedXs}>{node.author.nickname}</div>
      </div>
    </RowItem>
  );
}

/** 목록 하나(글 또는 댓글)의 로딩 · 오류 · 빈 상태 · 더 보기 */
function PagedRows<TNode>({
  list,
  label,
  empty,
  render,
}: {
  list: PagedList<unknown, TNode>;
  label: string;
  empty: string;
  render: (n: TNode) => ReactNode;
}) {
  if (list.nodes.length === 0 && list.loading) return <ListSkeleton rows={3} />;
  if (list.nodes.length === 0 && list.error)
    return (
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
  if (list.nodes.length === 0) return <p className={m.emptyNote}>{empty}</p>;
  return (
    <>
      <RowList ariaLabel={label}>{list.nodes.map(render)}</RowList>
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} error={list.loadMoreError} onLoadMore={list.loadMore} endText={null} />
    </>
  );
}

/** TM-06 ⑧ 팀 글 관리 — 글과 댓글을 따로, 행마다 [수정]만. 삭제 버튼은 두지 않는다 (삭제는 작성자 · 관리자만) */
export function TeamContentsSection({ teamId }: { teamId: string }) {
  const posts = usePagedList(TeamPostsQuery, { variables: { id: teamId }, select: (d) => toPaged(d.teamPosts) });
  const comments = usePagedList(TeamCommentsQuery, { variables: { id: teamId }, select: (d) => toPaged(d.teamComments) });

  return (
    <section className={m.section} aria-labelledby="manage-contents-heading">
      <SectionHeader id="manage-contents-heading" title="팀 글 관리" />
      <PagedRows
        list={posts}
        label="팀 글"
        empty="이 팀에 연결된 글이 없어요."
        render={(n) => <PostRow key={`p-${n.id}`} node={n} />}
      />
      <SectionHeader title="댓글" as="h3" />
      <PagedRows
        list={comments}
        label="팀 글 댓글"
        empty="이 팀 글에 달린 댓글이 없어요."
        render={(n) => <CommentRow key={`c-${n.id}`} node={n} />}
      />
      <Hint>{TEAM_COPY.deleteAskAdmin}</Hint>
    </section>
  );
}
