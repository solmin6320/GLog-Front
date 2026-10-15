import { useId, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate, useSearchParams } from 'react-router';
import type { AdminMemberFilter, AdminMembersQueryQuery, MemberStatus } from '@/gql/graphql';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { DEFAULT_PAGE_SIZE, useAction, usePagedList } from '@/shared/api';
import { formatDateTime } from '@/shared/lib/format';
import { paths, parseAdminMembersSearch, SEARCH_MAX, type AdminMemberStatusParam } from '@/shared/lib/paths';
import {
  Avatar,
  Button,
  DataTable,
  EmptyState,
  Icon,
  LoadMore,
  QueryBoundary,
  SearchInput,
  Select,
  StatusBadge,
  TableSkeleton,
  VisuallyHidden,
  useConfirm,
  type Column,
} from '@/shared/ui';
import {
  ADMIN_COUNTS_QUERY,
  AdminMembersApprove,
  AdminMembersQuery,
  AdminMembersReject,
  AdminMembersRevert,
  AdminMembersSummaryQuery,
} from './api';
import { applyMemberStatus } from './cache';
import s from './Members.module.css';

type Row = AdminMembersQueryQuery['adminMembers']['nodes'][number];

const FILTER: Record<AdminMemberStatusParam, AdminMemberFilter> = { pending: 'PENDING', rejected: 'REJECTED', all: 'ALL' };

const STATUS_OPTIONS: { value: AdminMemberStatusParam; label: string }[] = [
  { value: 'pending', label: '승인 대기' },
  { value: 'rejected', label: '거절' },
  { value: 'all', label: '전체' },
];

const EMPTY: Record<AdminMemberStatusParam, string> = {
  pending: '승인 대기 중인 회원이 없어요.',
  rejected: '거절한 회원이 없어요.',
  all: '승인 대기 · 거절 회원이 없어요.',
};

const isStatusParam = (v: string): v is AdminMemberStatusParam => STATUS_OPTIONS.some((o) => o.value === v);

/**
 * AD-01 ②-2 가입 승인 (`/admin/members?status=&q=`). 필터 상태는 URL 하나뿐이다.
 * ⑤ 검색 · 상태 필터 · 전체 건수 / ⑥ 목록(회원 · 신청 · 상태) / ⑦ [승인] 즉시 / ⑧ [거절] 확인 뒤 · [승인 대기로] 즉시.
 * 승인 판단에 필요한 것만 보여 준다 — 팀 소속 · 활동 이력은 넣지 않는다.
 */
export function MembersTab() {
  useDocumentTitle('가입 승인');
  const titleId = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status, q } = parseAdminMembersSearch(searchParams);
  const go = (next: { status: AdminMemberStatusParam; q?: string }) => navigate(paths.adminMembers(next));

  const list = usePagedList(AdminMembersQuery, {
    variables: { filter: FILTER[status], search: q ?? null },
    select: (d) => d.adminMembers,
  });
  const pending = useQuery(AdminMembersSummaryQuery).data?.adminDashboardSummary.pendingMemberCount;

  const columns: Column<Row>[] = [
    { key: 'member', header: '회원', render: (r) => <MemberCell row={r} /> },
    { key: 'applied', header: '신청', render: (r) => <span className={s.applied}>{formatDateTime(r.appliedAt)}</span> },
    { key: 'status', header: '상태', render: (r) => <StatusBadge kind="memberStatus" status={r.status} /> },
    { key: 'actions', header: '처리', align: 'right', render: (r) => <MemberActions row={r} /> },
  ];

  return (
    <section aria-labelledby={titleId}>
      <div className={s.head}>
        <h2 id={titleId} className={s.title}>
          가입 승인
        </h2>
        {pending != null ? <span className={s.meta}>승인 대기 {pending}명</span> : null}
      </div>

      <div className={s.toolbar}>
        <div className={s.search}>
          <MemberSearch q={q} onSearch={(next) => go({ status, q: next })} />
        </div>
        <div className={s.filter}>
          <Select
            aria-label="상태"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              if (isStatusParam(e.target.value)) go({ status: e.target.value, q });
            }}
          />
        </div>
        {list.totalCount != null ? <span className={s.count}>{list.totalCount}명</span> : null}
      </div>

      <QueryBoundary
        loading={list.loading}
        error={list.error}
        data={list.data}
        skeleton={<TableSkeleton rows={3} cols={4} />}
        onRetry={list.refetch}
      >
        {() =>
          list.nodes.length === 0 ? (
            q ? (
              <EmptyState
                icon="search"
                title="검색 결과가 없어요. 다른 말로 찾아보세요."
                action={
                  <Button variant="outline" size="sm" onClick={() => go({ status })}>
                    검색 지우기
                  </Button>
                }
              />
            ) : (
              <EmptyState icon="users" title={EMPTY[status]} />
            )
          ) : (
            <>
              <div className={s.table}>
                <DataTable columns={columns} rows={list.nodes} rowKey={(r) => r.member.id} caption="가입 신청 회원" />
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
function MemberSearch({ q, onSearch }: { q: string | undefined; onSearch: (q: string | undefined) => void }) {
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
      placeholder="닉네임 또는 GitHub 아이디"
      maxLength={SEARCH_MAX}
      ariaLabel="회원 검색"
    />
  );
}

/** ⑥ "{닉네임} @{githubLogin}" — 아이디는 새 탭으로 GitHub 프로필 */
function MemberCell({ row }: { row: Row }) {
  const { member } = row;
  return (
    <span className={s.member}>
      <Avatar name={member.nickname} imageUrl={member.profileImageUrl} size={28} />
      <span className={s.nick}>{member.nickname}</span>
      <a className={s.gh} href={`https://github.com/${encodeURIComponent(member.githubLogin)}`} target="_blank" rel="noopener noreferrer">
        @{member.githubLogin}
        <Icon name="ext" size={12} />
        <VisuallyHidden>(새 탭에서 열림)</VisuallyHidden>
      </a>
    </span>
  );
}

/** ⑦⑧ 행 처리 버튼. 결과는 낙관적으로 목록에 반영하고(cache.ts) 탭 배지를 다시 부른다 */
function MemberActions({ row }: { row: Row }) {
  const confirm = useConfirm();
  const [approveMutation] = useMutation(AdminMembersApprove);
  const [rejectMutation] = useMutation(AdminMembersReject);
  const [revertMutation] = useMutation(AdminMembersRevert);
  const { member } = row;
  const memberId = member.id;
  const optimistic = (status: MemberStatus) => ({
    __typename: 'AdminMemberRow' as const,
    member: { ...member, __typename: 'Member' as const },
    status,
    appliedAt: row.appliedAt,
  });

  const approve = useAction(
    () =>
      approveMutation({
        variables: { memberId },
        optimisticResponse: { approveMember: optimistic('ACTIVE') },
        update: (cache, { data }) => {
          if (data) applyMemberStatus(cache, data.approveMember.member.id, data.approveMember.status);
        },
        refetchQueries: [ADMIN_COUNTS_QUERY],
      }),
    { success: '승인했어요.' },
  );
  const reject = useAction(
    () =>
      rejectMutation({
        variables: { memberId },
        optimisticResponse: { rejectMember: optimistic('REJECTED') },
        update: (cache, { data }) => {
          if (data) applyMemberStatus(cache, data.rejectMember.member.id, data.rejectMember.status);
        },
        refetchQueries: [ADMIN_COUNTS_QUERY],
      }),
    { success: '거절했어요.' },
  );
  const revert = useAction(
    () =>
      revertMutation({
        variables: { memberId },
        optimisticResponse: { revertMemberToPending: optimistic('PENDING') },
        update: (cache, { data }) => {
          if (data) applyMemberStatus(cache, data.revertMemberToPending.member.id, data.revertMemberToPending.status);
        },
        refetchQueries: [ADMIN_COUNTS_QUERY],
      }),
    { success: '승인 대기로 되돌렸어요.' },
  );

  const busy = approve.pending || reject.pending || revert.pending;

  if (row.status === 'PENDING') {
    return (
      <span className={s.actions}>
        <Button size="xs" loading={approve.pending} disabled={busy} aria-label={`${member.nickname} 승인`} onClick={() => void approve.run()}>
          승인
        </Button>
        <Button
          size="xs"
          variant="outline"
          loading={reject.pending}
          disabled={busy}
          aria-label={`${member.nickname} 거절`}
          onClick={async () => {
            // 거절은 되돌릴 수 있어서 기본 tone (C-25 잠정안)
            const ok = await confirm({
              title: `${member.nickname} 님의 가입을 거절할까요?`,
              body: '거절해도 상태 필터의 "거절"에서 승인 대기로 되돌릴 수 있어요.',
              confirmLabel: '거절',
            });
            if (ok) await reject.run();
          }}
        >
          거절
        </Button>
      </span>
    );
  }
  if (row.status === 'REJECTED') {
    return (
      <span className={s.actions}>
        <Button size="xs" variant="outline" loading={revert.pending} aria-label={`${member.nickname} 승인 대기로`} onClick={() => void revert.run()}>
          승인 대기로
        </Button>
      </span>
    );
  }
  return null;
}
