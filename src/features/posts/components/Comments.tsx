import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { Link } from 'react-router';
import { MSG } from '@/domain/messages';
import type { PostDetailQueryQuery } from '@/gql/graphql';
import { useAction } from '@/shared/api';
import { formatDateTime } from '@/shared/lib/format';
import { LIMITS } from '@/shared/lib/validators';
import { Avatar, Button, LoadMore, SectionHeader, useConfirm } from '@/shared/ui';
import { PostAddComment, PostDeleteComment, PostDetailQuery, PostUpdateComment } from '../api';
import { useProfilePath } from '../useProfilePath';
import s from './Comments.module.css';

type PostNode = Extract<NonNullable<PostDetailQueryQuery['post']>, { __typename: 'Post' }>;
export type CommentNode = PostNode['comments']['nodes'][number];

/** 댓글을 바꾸면 상세(목록 · 댓글 수)를 다시 받는다 */
const refetchDetail = () => ({ refetchQueries: [PostDetailQuery], awaitRefetchQueries: true });

/**
 * BD-03 ⑨~⑫ 댓글 (1단계, 등록순). 작성자 [수정][삭제] · 팀장 [수정] · 관리자 [삭제] — 서버 플래그(viewerCan*)대로.
 */
export function Comments({
  postId,
  count,
  comments,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
  onPostGone,
}: {
  postId: string;
  count: number;
  comments: CommentNode[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
  /** 열람 중 글이 지워졌을 때 (EX-BD03-02) */
  onPostGone: () => void;
}) {
  const headingId = useId();
  return (
    <section className={s.wrap} aria-labelledby={headingId}>
      <SectionHeader id={headingId} title={`댓글 ${count}`} />
      {comments.length === 0 ? (
        <p className={s.empty}>첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className={s.list} aria-label="댓글 목록">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} onPostGone={onPostGone} />
          ))}
        </ul>
      )}
      <LoadMore hasMore={hasMore} loading={loadingMore} error={loadMoreError} onLoadMore={onLoadMore} endText={null} />
      <CommentForm postId={postId} onPostGone={onPostGone} />
    </section>
  );
}

function CommentItem({ comment, onPostGone }: { comment: CommentNode; onPostGone: () => void }) {
  const profilePath = useProfilePath();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [updateComment] = useMutation(PostUpdateComment);
  const [deleteComment] = useMutation(PostDeleteComment);
  const onError = (e: { code: string }) => {
    if (e.code === 'POST_DELETED') onPostGone();
    return false;
  };
  const save = useAction(
    async (content: string) => {
      await updateComment({ variables: { id: comment.id, content } });
      return true as const;
    },
    { success: '댓글을 수정했어요.', onError },
  );
  const remove = useAction(
    async () => {
      await deleteComment({ variables: { id: comment.id }, ...refetchDetail() });
      return true as const;
    },
    { success: MSG.deleted, onError },
  );

  const startEdit = () => {
    setDraft(comment.content);
    setEditing(true);
  };
  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || save.pending) return;
    if (text === comment.content) {
      setEditing(false);
      return;
    }
    if (await save.run(text)) setEditing(false);
  };
  const onEditKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(false);
    }
  };
  const onDelete = async () => {
    const ok = await confirm({ title: '댓글을 삭제할까요?', body: '삭제한 댓글은 되돌릴 수 없어요.', confirmLabel: '삭제', tone: 'danger' });
    if (ok) await remove.run();
  };

  const name = comment.author.nickname;
  return (
    <li className={s.item}>
      <Avatar name={name} imageUrl={comment.author.profileImageUrl} size={32} />
      <div className={s.main}>
        <div className={s.head}>
          <Link to={profilePath(comment.author.id)} className={s.author}>
            {name}
          </Link>
          <span className={s.date}>
            {formatDateTime(comment.createdAt)}
            {comment.updatedAt ? ' (수정됨)' : null}
          </span>
          {!editing && (comment.viewerCanEdit || comment.viewerCanDelete) ? (
            <span className={s.actions}>
              {comment.viewerCanEdit ? (
                <button type="button" className={s.action} onClick={startEdit} aria-label={`${name} 댓글 수정`}>
                  수정
                </button>
              ) : null}
              {comment.viewerCanDelete ? (
                <button
                  type="button"
                  className={`${s.action} ${s.danger}`}
                  onClick={() => void onDelete()}
                  disabled={remove.pending}
                  aria-label={`${name} 댓글 삭제`}
                >
                  삭제
                </button>
              ) : null}
            </span>
          ) : null}
        </div>
        {editing ? (
          <form className={s.editForm} onSubmit={(e) => void submitEdit(e)}>
            <textarea
              className={s.editInput}
              aria-label="댓글 수정"
              value={draft}
              maxLength={LIMITS.comment}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onEditKey}
              rows={3}
              autoFocus
            />
            <div className={s.editButtons}>
              <Button variant="text" size="sm" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button type="submit" size="sm" disabled={!draft.trim()} loading={save.pending}>
                저장
              </Button>
            </div>
          </form>
        ) : (
          <p className={s.content}>{comment.content}</p>
        )}
      </div>
    </li>
  );
}

/** ⑫ 댓글 입력 — 1~500자, 비면 [등록] 비활성(EX-BD03-01). 등록하면 칸을 비우고 목록 맨 아래에 붙는다 */
function CommentForm({ postId, onPostGone }: { postId: string; onPostGone: () => void }) {
  const inputId = useId();
  const [value, setValue] = useState('');
  const [addComment] = useMutation(PostAddComment);
  const add = useAction(
    async (content: string) => {
      await addComment({ variables: { postId, content }, ...refetchDetail() });
      return true as const;
    },
    {
      onError: (e) => {
        if (e.code === 'POST_DELETED') onPostGone();
        return false;
      },
    },
  );
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text || add.pending) return;
    if (await add.run(text)) setValue('');
  };
  return (
    <form className={s.form} onSubmit={(e) => void submit(e)}>
      <label htmlFor={inputId} className="visually-hidden">
        댓글
      </label>
      <input
        id={inputId}
        className={s.input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="댓글을 입력하세요"
        maxLength={LIMITS.comment}
        autoComplete="off"
      />
      <Button type="submit" disabled={!value.trim()} loading={add.pending} className={s.submit}>
        등록
      </Button>
    </form>
  );
}
