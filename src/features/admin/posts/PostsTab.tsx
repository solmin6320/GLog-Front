import { useId, useState } from 'react';
import type { ApolloCache } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { MSG } from '@/domain/messages';
import type { AdminPostFilter, AdminPostsQueryQuery } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { DEFAULT_PAGE_SIZE, toPaged, useAction, usePagedList } from '@/shared/api';
import { formatDateTime } from '@/shared/lib/format';
import { paths, parseAdminPostsSearch, SEARCH_MAX, type AdminPostKindParam } from '@/shared/lib/paths';
import {
  Button,
  CategoryChip,
  DataTable,
  EmptyState,
  LoadMore,
  QueryBoundary,
  SearchInput,
  Select,
  TableSkeleton,
  useConfirm,
  type Column,
} from '@/shared/ui';
import { AdminPostsDeleteComment, AdminPostsDeletePost, AdminPostsQuery } from './api';
import s from './Posts.module.css';

type Row = AdminPostsQueryQuery['adminPosts']['items'][number];

const FILTER: Record<AdminPostKindParam, AdminPostFilter> = { all: 'ALL', post: 'POSTS', comment: 'COMMENTS' };

const KIND_OPTIONS: { value: AdminPostKindParam; label: string }[] = [
  { value: 'all', label: '글 + 댓글' },
  { value: 'post', label: '글만' },
  { value: 'comment', label: '댓글만' },
];

const isKindParam = (v: string): v is AdminPostKindParam => KIND_OPTIONS.some((o) => o.value === v);

const KIND_LABEL: Record<string, string> = { POST: '글', COMMENT: '댓글' };

/**
 * AD-01 ②-5 게시물 관리 (`/admin/posts?kind=&q=`). 필터 상태는 URL 하나뿐이다.
 * ⑤ 검색(제목 · 내용 · 작성자) + 종류 필터 / ⑥ 최신순 `[종류] 제목 · 작성자 · 날짜`, 제목 → BD-03 / ⑦ [삭제] 확인 뒤.
 * 팀 열을 두지 않는다 — 비공개 팀 이름이 새는 경로를 만들지 않는다(②-5 비고).
 */
export function PostsTab() {
  useDocumentTitle('게시물 관리');
  const titleId = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { kind, q } = parseAdminPostsSearch(searchParams);
  const go = (next: { kind: AdminPostKindParam; q?: string }) => navigate(paths.adminPosts(next));

  const list = usePagedList(AdminPostsQuery, {
    variables: { filter: FILTER[kind], keyword: q ?? null },
    select: (d) => toPaged(d.adminPosts),
  });

  const columns: Column<Row>[] = [
    { key: 'kind', header: '종류', render: (r) => <CategoryChip>{KIND_LABEL[r.kind] ?? r.kind}</CategoryChip> },
    {
      key: 'title',
      header: '제목',
      // 댓글은 댓글 앞부분을 보이고, 글 제목은 툴팁으로
      render: (r) => (
        <Link to={paths.post(r.postId)} className={s.titleLink} title={r.title}>
          {r.content ?? r.title}
        </Link>
      ),
    },
    { key: 'author', header: '작성자', render: (r) => <span className={s.author}>{r.author.nickname}</span> },
    { key: 'date', header: '날짜', render: (r) => <span className={s.date}>{formatDateTime(r.createdAt)}</span> },
    { key: 'actions', header: '처리', align: 'right', render: (r) => <DeleteContent row={r} /> },
  ];

  return (
    <section aria-labelledby={titleId}>
      <div className={s.head}>
        <h2 id={titleId} className={s.title}>
          게시물 관리
        </h2>
      </div>

      <div className={s.toolbar}>
        <div className={s.search}>
          <ContentSearch q={q} onSearch={(next) => go({ kind, q: next })} />
        </div>
        <div className={s.filter}>
          <Select
            aria-label="종류"
            options={KIND_OPTIONS}
            value={kind}
            onChange={(e) => {
              if (isKindParam(e.target.value)) go({ kind: e.target.value, q });
            }}
          />
        </div>
      </div>

      <QueryBoundary
        loading={list.loading}
        error={list.error}
        data={list.data}
        skeleton={<TableSkeleton rows={5} cols={5} />}
        onRetry={list.refetch}
      >
        {() =>
          list.nodes.length === 0 ? (
            q ? (
              <EmptyState
                icon="search"
                title="검색 결과가 없어요. 다른 말로 찾아보세요."
                action={
                  <Button variant="outline" size="sm" onClick={() => go({ kind })}>
                    검색 지우기
                  </Button>
                }
              />
            ) : (
              <EmptyState icon="file" title="관리할 게시물이 없어요." />
            )
          ) : (
            <>
              <div className={s.table}>
                <DataTable columns={columns} rows={list.nodes} rowKey={(r) => `${r.kind}:${r.id}`} caption="글과 댓글" />
              </div>
              <LoadMore
                hasMore={list.hasMore}
                loading={list.loadingMore}
                error={list.loadMoreError}
                onLoadMore={list.loadMore}
                endText={list.nodes.length > DEFAULT_PAGE_SIZE ? undefined : null}
              />
            </>
          )
        }
      </QueryBoundary>
    </section>
  );
}

/** 검색창 — 입력 중인 값은 여기만 갖고, Enter로 URL(q)에 올린다. 지우면 바로 전체로 돌아간다 */
function ContentSearch({ q, onSearch }: { q: string | undefined; onSearch: (q: string | undefined) => void }) {
  const [draft, setDraft] = useState(q ?? '');
  // 뒤로 가기 등으로 URL의 q가 바뀌면 입력값도 따라간다 (렌더 중 상태 맞추기)
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) {
    setSyncedQ(q);
    setDraft(q ?? '');
  }
  return (
    <SearchInput
      size="sm"
      value={draft}
      onChange={(v) => {
        setDraft(v);
        if (!v.trim() && q) onSearch(undefined);
      }}
      onSubmit={(v) => onSearch(v.trim() || undefined)}
      placeholder="제목 · 내용 · 작성자"
      maxLength={SEARCH_MAX}
      ariaLabel="게시물 검색"
    />
  );
}

/** ⑦ [삭제] → 단순 확인형(danger) → adminDeletePost · adminDeleteComment → 목록 재조회 + "삭제했어요." */
function DeleteContent({ row }: { row: Row }) {
  const confirm = useConfirm();
  const [deletePost] = useMutation(AdminPostsDeletePost);
  const [deleteComment] = useMutation(AdminPostsDeleteComment);
  const isPost = row.kind === 'POST';
  const what = isPost ? '글' : '댓글';

  // 다른 화면(BD-03 · BD-01)이 지운 글 · 댓글을 캐시에서 다시 보여 주지 않게 한다
  const evict = (cache: ApolloCache) => {
    const id = cache.identify({ __typename: isPost ? 'Post' : 'Comment', id: row.id });
    if (id) cache.evict({ id });
    cache.gc();
  };
  const remove = useAction(
    async () => {
      const options = { variables: { id: row.id }, refetchQueries: [AdminPostsQuery], awaitRefetchQueries: true, update: evict };
      if (isPost) await deletePost(options);
      else await deleteComment(options);
    },
    { success: MSG.deleted },
  );

  return (
    <Button
      size="xs"
      variant="danger"
      loading={remove.pending}
      aria-label={`${what} 삭제: ${row.content ?? row.title}`}
      onClick={async () => {
        const ok = await confirm({
          title: `이 ${what}을 삭제할까요?`,
          body: isPost
            ? '삭제하면 되돌릴 수 없어요. 이미 확정된 판정은 바뀌지 않아요.'
            : '삭제하면 되돌릴 수 없어요.',
          confirmLabel: '삭제',
          tone: 'danger',
        });
        if (ok) await remove.run();
      }}
    >
      삭제
    </Button>
  );
}
