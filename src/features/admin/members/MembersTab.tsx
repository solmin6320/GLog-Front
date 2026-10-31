import { useId, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate, useSearchParams } from 'react-router';
import type { AdminMemberFilter, AdminMembersQueryQuery, MemberRole, MemberStatus } from '@/gql/graphql';
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
  InfoBox,
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
  AdminMembersPromote,
  AdminMembersQuery,
  AdminMembersReject,
  AdminMembersRevert,
  AdminMembersSuspend,
  AdminMembersUnsuspend,
  AdminMembersSummaryQuery,
} from './api';
import { applyMemberRole, applyMemberStatus } from './cache';
import s from './Members.module.css';

type Row = AdminMembersQueryQuery['adminMembers']['nodes'][number];

const FILTER: Record<AdminMemberStatusParam, AdminMemberFilter> = {
  active: 'ACTIVE',
  pending: 'PENDING',
  rejected: 'REJECTED',
  suspended: 'SUSPENDED',
  all: 'ALL',
};

const STATUS_OPTIONS: { value: AdminMemberStatusParam; label: string }[] = [
  { value: 'active', label: '전체 회원' },
  { value: 'pending', label: '승인 대기' },
  { value: 'rejected', label: '거절' },
  { value: 'suspended', label: '정지' },
  { value: 'all', label: '전체' },
];

const EMPTY: Record<AdminMemberStatusParam, string> = {
  active: '아직 가입한 회원이 없어요.',
  pending: '승인 대기 중인 회원이 없어요.',
  rejected: '거절한 회원이 없어요.',
  suspended: '정지한 회원이 없어요.',
  all: '승인 대기 · 거절 회원이 없어요.',
};

/**
 * 배포 서버(GLog-Backend main)가 아는 필터. 전체 회원 명단(ACTIVE)과 정지(SUSPENDED)는 서버에 아직 없어
 * 그 필터로 들어오면 "전체"(승인 대기 + 거절)로 보여 주고 안내를 띄운다. 서버에 생기면 이 목록에 다시 넣는다.
 */
const SERVER_STATUS: AdminMemberStatusParam[] = ['all', 'pending', 'rejected'];
const SERVER_OPTIONS = SERVER_STATUS.map((v) => STATUS_OPTIONS.find((o) => o.value === v)!);

const isStatusParam = (v: string): v is AdminMemberStatusParam => STATUS_OPTIONS.some((o) => o.value === v);

/**
 * AD-01 ②-2 회원 · 관리자 권한 (`/admin/members?status=&q=`). 필터 상태는 URL 하나뿐이다.
 * 가입은 승인 없이 바로 활성이다. 이 탭에서 하는 일은 관리자 승격과 이용 정지 —
 * 일반 회원 행의 [관리자로 승격] · [정지]는 확인 뒤에만 실행한다(현재 관리자만). 정지는 필터 "정지"에서 [정지 해제]로 풀 수 있고, 승격은 되돌리는 화면이 없다.
 * 이전에 쌓인 승인 대기 · 거절 계정은 필터에서 골라 [승인] · [거절] · [승인 대기로]로 정리한다.
 */
export function MembersTab() {
  useDocumentTitle('회원 · 관리자 권한');
  const titleId = useId();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { status: asked, q } = parseAdminMembersSearch(searchParams);
  const status = SERVER_STATUS.includes(asked) ? asked : 'all';
  const go = (next: { status: AdminMemberStatusParam; q?: string }) => navigate(paths.adminMembers(next));

  const list = usePagedList(AdminMembersQuery, {
    variables: { filter: FILTER[status], search: q ?? null },
    select: (d) => d.adminMembers,
  });
  const pending = useQuery(AdminMembersSummaryQuery).data?.adminDashboardSummary.pendingMemberCount;

  const columns: Column<Row>[] = [
    { key: 'member', header: '회원', render: (r) => <MemberCell row={r} /> },
    { key: 'applied', header: '가입', render: (r) => <span className={s.applied}>{formatDateTime(r.appliedAt)}</span> },
    {
      key: 'status',
      header: '권한',
      render: (r) =>
        r.status === 'ACTIVE' ? (
          r.role === 'ADMIN' ? <span className={s.adminTag}>관리자</span> : <span className={s.memberTag}>일반 회원</span>
        ) : (
          <StatusBadge kind="memberStatus" status={r.status} />
        ),
    },
    { key: 'actions', header: '처리', align: 'right', render: (r) => <MemberActions row={r} /> },
  ];

  return (
    <section aria-labelledby={titleId}>
      <div className={s.head}>
        <h2 id={titleId} className={s.title}>
          회원 · 관리자 권한
        </h2>
        {pending ? <span className={s.meta}>정리할 승인 대기 {pending}명</span> : null}
      </div>

      <InfoBox tone="mute" icon="info">
        전체 회원 명단과 이용 정지는 아직 서버에 없어요. 지금은 승인 대기 · 거절 계정만 볼 수 있어요.
      </InfoBox>

      <div className={s.toolbar}>
        <div className={s.search}>
          <MemberSearch q={q} onSearch={(next) => go({ status, q: next })} />
        </div>
        <div className={s.filter}>
          <Select
            aria-label="상태"
            options={SERVER_OPTIONS}
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
                <DataTable columns={columns} rows={list.nodes} rowKey={(r) => r.member.id} caption="회원 목록" />
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
  const [promoteMutation] = useMutation(AdminMembersPromote);
  const [suspendMutation] = useMutation(AdminMembersSuspend);
  const [unsuspendMutation] = useMutation(AdminMembersUnsuspend);
  const { member } = row;
  const memberId = member.id;
  const optimistic = (status: MemberStatus) => ({
    __typename: 'AdminMemberRow' as const,
    member: { ...member, __typename: 'Member' as const },
    status,
    role: row.role,
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

  const promote = useAction(
    () =>
      promoteMutation({
        variables: { memberId },
        optimisticResponse: { promoteToAdmin: { ...optimistic('ACTIVE'), role: 'ADMIN' as MemberRole } },
        update: (cache, { data }) => {
          if (data) applyMemberRole(cache, data.promoteToAdmin.member.id, data.promoteToAdmin.role);
        },
      }),
    { success: '관리자로 승격했어요.' },
  );

  const suspend = useAction(
    () =>
      suspendMutation({
        variables: { memberId },
        optimisticResponse: { suspendMember: optimistic('SUSPENDED') },
        update: (cache, { data }) => {
          if (data) applyMemberStatus(cache, data.suspendMember.member.id, data.suspendMember.status);
        },
      }),
    { success: '이용을 정지했어요.' },
  );
  const unsuspend = useAction(
    () =>
      unsuspendMutation({
        variables: { memberId },
        optimisticResponse: { unsuspendMember: optimistic('ACTIVE') },
        update: (cache, { data }) => {
          if (data) applyMemberStatus(cache, data.unsuspendMember.member.id, data.unsuspendMember.status);
        },
      }),
    { success: '정지를 풀었어요.' },
  );

  const busy = approve.pending || reject.pending || revert.pending || promote.pending || suspend.pending || unsuspend.pending;

  if (row.status === 'SUSPENDED') {
    return (
      <span className={s.actions}>
        <Button
          size="xs"
          variant="outline"
          loading={unsuspend.pending}
          disabled={busy}
          aria-label={`${member.nickname} 정지 해제`}
          onClick={() => void unsuspend.run()}
        >
          정지 해제
        </Button>
      </span>
    );
  }

  if (row.status === 'ACTIVE') {
    if (row.role === 'ADMIN') return null;
    return (
      <span className={s.actions}>
        <Button
          size="xs"
          variant="outline"
          loading={promote.pending}
          disabled={busy}
          aria-label={`${member.nickname} 관리자로 승격`}
          onClick={async () => {
            // 관리자 권한은 가입자 정보 · 경고 · 벌칙을 다루므로 한 번 더 확인한다. 이 화면에서는 되돌릴 수 없다
            const ok = await confirm({
              title: `${member.nickname} 님을 관리자로 승격할까요?`,
              body: '관리자는 회원 · 경고 · 벌칙 · 공지를 관리할 수 있어요. 승격은 이 화면에서 되돌릴 수 없어요.',
              confirmLabel: '관리자로 승격',
            });
            if (ok) await promote.run();
          }}
        >
          관리자로 승격
        </Button>
        <Button
          size="xs"
          variant="danger"
          loading={suspend.pending}
          disabled={busy}
          aria-label={`${member.nickname} 이용 정지`}
          onClick={async () => {
            // 정지하면 로그인과 이미 받은 로그인 상태가 모두 막힌다. 해제는 필터 "정지"에서 할 수 있다
            const ok = await confirm({
              title: `${member.nickname} 님의 이용을 정지할까요?`,
              body: '정지하면 로그인할 수 없고, 이미 로그인한 상태도 바로 끊겨요. 정지 필터에서 언제든 풀 수 있어요.',
              confirmLabel: '이용 정지',
              tone: 'danger',
            });
            if (ok) await suspend.run();
          }}
        >
          정지
        </Button>
      </span>
    );
  }

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
