import { useMutation } from '@apollo/client/react';
import { Link, useNavigate, useParams } from 'react-router';
import { MSG } from '@/domain/messages';
import type { PostDetailQueryQuery } from '@/gql/graphql';
import { useAction, usePagedList } from '@/shared/api';
import { formatDateTime } from '@/shared/lib/format';
import { isObjectId } from '@/shared/lib/ids';
import { paths, postTypeFromEnum } from '@/shared/lib/paths';
import {
  Avatar,
  Button,
  CategoryChip,
  FullState,
  LinkButton,
  PageContainer,
  QueryBoundary,
  Skeleton,
  Tag,
  TeamTag,
  VisuallyHidden,
  useConfirm,
} from '@/shared/ui';
import { PostDelete, PostDetailQuery, removePostFromLists } from '../api';
import { Comments } from '../components/Comments';
import { CommitCard } from '../components/CommitCard';
import { NotRecordBadge } from '../components/PostListItem';
import { isFilled, POST_TYPE_LABEL, SECTION_LABEL } from '../postText';
import { useProfilePath } from '../useProfilePath';
import s from './PostDetailPage.module.css';

type PostNode = Extract<NonNullable<PostDetailQueryQuery['post']>, { __typename: 'Post' }>;
type CommentNode = PostNode['comments']['nodes'][number];

const COMMENT_PAGE = 50;

/**
 * BD-03 글 상세 (화면설계서 5-1-8 · W-12). postId 형식이 틀리면 부르지 않고 404(요구사항 3-2).
 * 삭제된 글(DeletedPost)은 404가 아니라 삭제 안내(E-31), 댓글 영역은 없다.
 */
export default function PostDetailPage() {
  const { postId } = useParams();
  if (!isObjectId(postId)) {
    return (
      <PageContainer width="md">
        <FullState kind="notFound" />
      </PageContainer>
    );
  }
  return <PostDetail postId={postId.toLowerCase()} />;
}

function PostDetail({ postId }: { postId: string }) {
  // 상세와 댓글을 한 문서로 받고, 댓글 [더 보기]는 같은 문서로 이어 붙인다
  const detail = usePagedList(PostDetailQuery, {
    variables: { id: postId },
    select: (d) => (d.post?.__typename === 'Post' ? d.post.comments : null),
    pageSize: COMMENT_PAGE,
  });
  return (
    <PageContainer width="md">
      <QueryBoundary
        loading={detail.loading}
        error={detail.error}
        data={detail.data ? detail.data.post : undefined}
        onRetry={detail.refetch}
        skeleton={<DetailSkeleton />}
      >
        {(post) =>
          post.__typename === 'Post' ? (
            <PostView
              post={post}
              comments={detail.nodes}
              hasMore={detail.hasMore}
              loadingMore={detail.loadingMore}
              loadMoreError={detail.loadMoreError}
              onLoadMore={detail.loadMore}
              onPostGone={detail.refetch}
            />
          ) : (
            <FullState kind="deleted" />
          )
        }
      </QueryBoundary>
    </PageContainer>
  );
}

function PostView({
  post,
  comments,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
  onPostGone,
}: {
  post: PostNode;
  comments: CommentNode[];
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  onLoadMore: () => void;
  onPostGone: () => void;
}) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const profilePath = useProfilePath();
  const typeParam = postTypeFromEnum(post.type);
  const typeLabel = POST_TYPE_LABEL[post.type] as string | undefined;

  const [deletePost] = useMutation(PostDelete);
  const remove = useAction(
    async () => {
      await deletePost({ variables: { id: post.id }, update: (cache) => removePostFromLists(cache, post.id) });
      return true as const;
    },
    {
      success: MSG.deleted,
      onError: (e) => {
        if (e.code === 'POST_DELETED') onPostGone();
        return false;
      },
    },
  );

  const onDelete = async () => {
    const ok = await confirm({
      title: '이 글을 삭제할까요?',
      body: (
        <>
          <p>삭제한 글은 되돌릴 수 없어요.</p>
          {/* E-28 · ACC-BD03-04 — 확정 판정은 다시 계산하지 않는다 */}
          {post.inFinalizedWeek ? <p>이미 끝난 주의 인증 결과는 바뀌지 않아요.</p> : null}
        </>
      ),
      confirmLabel: '삭제',
      tone: 'danger',
    });
    if (!ok) return;
    if (await remove.run()) void navigate(paths.posts({ type: typeParam }), { replace: true });
  };

  const author = post.author;
  const hasMeta = post.tags.length > 0 || !!post.publicTeam;

  return (
    <article className={s.article}>
      {typeLabel ? (
        <Link to={paths.posts({ type: typeParam })} className={s.typeLink}>
          <CategoryChip>{typeLabel}</CategoryChip>
        </Link>
      ) : null}
      <div className={s.titleRow}>
        <h1 className={s.title}>{post.title}</h1>
        {post.isRecord ? null : <NotRecordBadge />}
      </div>

      <div className={s.byline}>
        <Avatar name={author.nickname} imageUrl={author.profileImageUrl} size={40} />
        <Link to={profilePath(author.id)} className={s.author}>
          {author.nickname}
        </Link>
        <span className={s.date}>
          {formatDateTime(post.createdAt)}
          {post.updatedAt ? ' (수정됨)' : null}
        </span>
        {post.viewerCanEdit || post.viewerCanDelete ? (
          <span className={s.actions}>
            {post.viewerCanEdit ? (
              <LinkButton to={paths.postEdit(post.id)} variant="outline" size="sm">
                수정
              </LinkButton>
            ) : null}
            {post.viewerCanDelete ? (
              <Button variant="danger" size="sm" loading={remove.pending} onClick={() => void onDelete()}>
                삭제
              </Button>
            ) : null}
          </span>
        ) : null}
      </div>

      {hasMeta ? (
        <div className={s.meta}>
          {post.tags.map((tag) => (
            <Tag key={tag} label={tag} to={paths.posts({ type: typeParam, tag })} />
          ))}
          <TeamTag label={post.publicTeam} />
        </div>
      ) : null}

      <div className={s.sections}>
        {post.sections.map((section) => {
          const label = SECTION_LABEL[section.key] as string | undefined;
          if (!label) return null; // 모르는 항목은 숨긴다(요구사항 6-3 ⑤)
          return (
            <section key={section.key} className={s.section}>
              <h2 className={s.sectionTitle}>{label}</h2>
              {isFilled(section.body) ? (
                <p className={s.body}>{section.body}</p>
              ) : (
                <p className={s.unwritten}>작성되지 않음</p>
              )}
            </section>
          );
        })}
      </div>

      {post.commitUrls.map((url) => (
        <CommitCard key={url} url={url} />
      ))}

      <Comments
        postId={post.id}
        count={post.commentCount}
        comments={comments}
        hasMore={hasMore}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
        onLoadMore={onLoadMore}
        onPostGone={onPostGone}
      />
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <VisuallyHidden>불러오는 중이에요.</VisuallyHidden>
      <div aria-hidden="true" className={s.skeleton}>
        <Skeleton width={84} height={24} />
        <Skeleton width="70%" height={34} />
        <Skeleton width={180} height={16} />
        <Skeleton width="100%" height={90} />
        <Skeleton width="100%" height={90} />
      </div>
    </div>
  );
}
