import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { ProfileHistoryQueryQuery, ProfileQueryQuery } from '@/gql/graphql';
import { useClock, useSession } from '@/session';
import type { PagedList } from '@/shared/api';
import { asOfLabel, formatStamp, formatWeekRange } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import {
  Avatar,
  BigStat,
  Button,
  Card,
  CardSkeleton,
  CategoryChip,
  DataTable,
  EmptyState,
  Foot,
  GrassHeatmap,
  Icon,
  InfoBox,
  LinkButton,
  LoadMore,
  RowItem,
  RowList,
  SectionHeader,
  Skeleton,
  StatusBadge,
  TableSkeleton,
  VisuallyHidden,
  type Column,
} from '@/shared/ui';
import { PROFILE_COPY } from '../copy';
import s from '../profile.module.css';

type Member = NonNullable<ProfileQueryQuery['member']>;
type TeamLabel = Member['warningState']['byCategory'][number]['label'];
type HistoryNode = NonNullable<ProfileHistoryQueryQuery['member']>['judgmentHistory']['nodes'][number];

/** ⑩ 한 번에 8주 (화면설계서 PR-01 ⑩ 제안) */
export const HISTORY_PAGE = 8;

/** 영역 하나만 실패했을 때 — 그 자리에 [다시 시도] (승격 후보: home · activity에도 같은 것이 있다) */
function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <InfoBox
      tone="mute"
      icon="alert"
      role="alert"
      action={
        <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
          다시 시도
        </Button>
      }
    >
      {message}
    </InfoBox>
  );
}

/** ①~⑤ 사진 · 닉네임 · GitHub · [프로필 수정](본인) · [관리자 메뉴](본인 + 관리자) */
export function ProfileHeader({ member, isOwn, isAdmin }: { member: Member; isOwn: boolean; isAdmin: boolean }) {
  const { signOut } = useSession();
  return (
    <div className={s.head}>
      <Avatar name={member.nickname} imageUrl={member.profileImageUrl} size={88} />
      <div className={s.headMain}>
        <h1 className={s.name}>{member.nickname}</h1>
        <a
          className={s.github}
          href={`https://github.com/${encodeURIComponent(member.githubLogin)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {`@${member.githubLogin}`}
          <Icon name="ext" size={12} />
          <VisuallyHidden>GitHub 프로필, 새 탭에서 열려요</VisuallyHidden>
        </a>
        {isOwn ? (
          <div className={s.actions}>
            <LinkButton to={paths.profileEdit()} variant="outline" size="sm">
              {PROFILE_COPY.edit}
            </LinkButton>
            {isAdmin ? (
              <LinkButton to={paths.admin()} variant="outline" size="sm" icon="shield">
                {PROFILE_COPY.adminMenu}
              </LinkButton>
            ) : null}
            {/* 로그아웃은 여기 한 곳 — 헤더 · 드로어에서는 뺐다 (되돌릴 수 없는 동작이라 자주 쓰는 메뉴와 떨어뜨린다) */}
            <Button variant="outline" size="sm" icon="logout" onClick={() => void signOut()}>
              로그아웃
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** ⑥ 활동 수 — [게시글 n] 링크는 U-02 확인 전까지 숨긴다(글자만) */
export function ActivityCounts({ member }: { member: Member }) {
  return (
    <dl className={s.counts}>
      <div>
        <dt>게시글</dt>
        <dd>{member.postCount}</dd>
      </div>
      <div>
        <dt>댓글</dt>
        <dd>{member.commentCount}</dd>
      </div>
    </dl>
  );
}

/** ⑦ GitHub 잔디 12개월 + 갱신 기준(M-15). E-32 빈 상태 + [다시 시도] · E-08 배너 · E-39 하단 안내(본인만) */
export function GrassSection({
  member,
  isOwn,
  ruleNoticeId,
  onRetry,
}: {
  member: Member;
  isOwn: boolean;
  ruleNoticeId: string | null;
  onRetry: () => void;
}) {
  const clock = useClock();
  const grass = member.grassCalendar;
  const asOf = asOfLabel(grass.updatedAt, clock.now);
  let body: ReactNode;
  if (grass.status === 'FAILED') {
    body = (
      <Card>
        <EmptyState
          title={PROFILE_COPY.grassFailed}
          body={isOwn ? undefined : '잔디는 매일 아침 다시 불러와요.'}
          action={
            // 남의 프로필에서 다시 눌러도 저장된 값을 다시 읽을 뿐이라 본인에게만 둔다
            isOwn ? (
              <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
                다시 시도
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  } else if (grass.status === 'IDENTITY_MISMATCH') {
    body = (
      <InfoBox tone="warn" icon="alert" role="status">
        {PROFILE_COPY.grassIdentity}
      </InfoBox>
    );
  } else {
    body = (
      <Card padding={18}>
        <p className={s.total}>
          지난 1년 동안 기여 <strong>{grass.totalContributions.toLocaleString('ko-KR')}</strong>회
        </p>
        <GrassHeatmap days={grass.days} />
        {grass.updatedAt ? (
          <p className={s.stamp}>
            <Icon name="clock" size={14} />
            마지막 갱신 {formatStamp(grass.updatedAt)}
          </p>
        ) : null}
      </Card>
    );
  }
  return (
    <section className={s.section} aria-labelledby="profile-grass-title">
      <SectionHeader id="profile-grass-title" title="GitHub 잔디" right={asOf ?? undefined} />
      {body}
      {isOwn && grass.privateContributionSuspected ? (
        <div className={s.note}>
          <InfoBox
            tone="warn"
            icon="info"
            action={
              <LinkButton to={ruleNoticeId ? paths.notice(ruleNoticeId) : paths.notices()} variant="outline" size="sm">
                설정 방법
              </LinkButton>
            }
          >
            {PROFILE_COPY.privateContribution}
          </InfoBox>
        </div>
      ) : null}
    </section>
  );
}

/** ⑨ 팀 표기 — 비공개 팀은 열람자와 무관하게 "비공개 팀"(서버가 이름을 빼서 준다) */
function labelText(label: TeamLabel): string {
  if (label.kind === 'PRIVATE') return PROFILE_COPY.privateTeam;
  if (label.kind === 'DELETED') return PROFILE_COPY.deletedTeam;
  return label.name ?? PROFILE_COPY.deletedTeam;
}

/** ⑧ 경고 합계(사람 단위) + ⑨ 팀별 경고(중복 집계 + 안내문) */
export function WarningSection({ member }: { member: Member }) {
  const ws = member.warningState;
  return (
    <section aria-labelledby="profile-warning-title">
      <SectionHeader id="profile-warning-title" title="경고" />
      {ws.isOnHold ? (
        <>
          <StatusBadge kind="judgment" status="HOLD" context="profile" />
          <p className={s.empty}>{PROFILE_COPY.onHold}</p>
        </>
      ) : (
        <WarningNumbers ws={ws} />
      )}
    </section>
  );
}

function WarningNumbers({ ws }: { ws: Member['warningState'] }) {
  return (
    <>
      <div className={s.warnBig}>
        <BigStat label={<VisuallyHidden>누적 경고</VisuallyHidden>} value={ws.activeCount} unit="/ 3" size="md" />
        {ws.isPenaltyTarget ? <StatusBadge kind="penalty" /> : null}
      </div>
      {ws.isPenaltyTarget ? <p className={s.penaltyText}>{PROFILE_COPY.penalty}</p> : null}
      {ws.activeCount === 0 ? (
        <p className={s.empty}>{PROFILE_COPY.noWarning}</p>
      ) : ws.byCategory.length > 0 ? (
        <>
          <RowList ariaLabel="팀별 경고">
            {ws.byCategory.map((c, i) => (
              <RowItem key={`${c.label.kind}-${c.label.name ?? ''}-${i}`} right={<span className={s.count}>{`${c.count}회`}</span>}>
                <span>{labelText(c.label)}</span>
              </RowItem>
            ))}
          </RowList>
          <Foot>{PROFILE_COPY.doubleCount}</Foot>
        </>
      ) : null}
    </>
  );
}

type HistoryRow = { id: string; weekStart: string; verifiedDays: number | null; recordCount: number | null; result: ReactNode };

const HISTORY_COLUMNS: Column<HistoryRow>[] = [
  { key: 'week', header: '주차', render: (r) => formatWeekRange(r.weekStart) },
  { key: 'days', header: '인증일', render: (r) => (r.verifiedDays == null ? '—' : `${r.verifiedDays}일`) },
  { key: 'records', header: '기록글', render: (r) => (r.recordCount == null ? '—' : `${r.recordCount}개`) },
  { key: 'result', header: '결과', render: (r) => r.result },
];

/** 결과 배지 — 미달은 그 주 경고가 지금 살아 있으면 "미달 (경고)"(서버 hasActiveWarning), 보류는 "확인 중"(M-05) */
function judgmentBadge(j: HistoryNode) {
  const context = j.status === 'FAIL' && !j.hasActiveWarning ? 'member' : 'profile';
  return <StatusBadge kind="judgment" status={j.status} skipReason={j.skipReason} context={context} />;
}

/** ⑩ 주간 판정 이력(첫 줄 '진행 중') + ⑪ [더 보기] 8주씩 */
export function HistorySection({ list }: { list: PagedList<ProfileHistoryQueryQuery, HistoryNode> }) {
  let body: ReactNode;
  if (!list.data && list.loading) {
    body = <TableSkeleton rows={5} cols={4} />;
  } else if (!list.data && list.error) {
    body = <SectionError message={PROFILE_COPY.historyFailed} onRetry={list.refetch} />;
  } else if (list.nodes.length === 0) {
    // 팀 미소속 · 첫 주 (EX-PR01-03)
    // 경고 · 소속 팀의 빈 상태와 같은 모양(왼쪽 정렬, 위 구분선)으로 맞춘다
    body = <p className={`${s.empty} ${s.emptyAligned}`}>{PROFILE_COPY.noHistory}</p>;
  } else {
    const current = list.data?.member?.currentWeek ?? null;
    const rows: HistoryRow[] = [
      ...(current
        ? [
            {
              id: 'current',
              weekStart: current.weekStart,
              verifiedDays: current.verifiedDays,
              recordCount: current.recordCount,
              result: <StatusBadge kind="progress" />,
            },
          ]
        : []),
      ...list.nodes.map((j) => ({
        id: j.id,
        weekStart: j.weekStart,
        verifiedDays: j.verifiedDays,
        recordCount: j.recordCount,
        result: judgmentBadge(j),
      })),
    ];
    body = (
      <>
        <DataTable caption="주간 판정 이력" columns={HISTORY_COLUMNS} rows={rows} rowKey={(r) => r.id} />
        <LoadMore
          hasMore={list.hasMore}
          loading={list.loadingMore}
          error={list.loadMoreError}
          onLoadMore={list.loadMore}
          // 한 쪽뿐이면 끝 문구를 따로 달지 않는다
          endText={list.nodes.length > HISTORY_PAGE ? undefined : null}
        />
        {list.nodes.some((j) => j.status === 'HOLD') ? <Foot>{PROFILE_COPY.holdNote}</Foot> : null}
      </>
    );
  }
  return (
    <section aria-labelledby="profile-history-title">
      <SectionHeader id="profile-history-title" title="주간 판정 이력" />
      {body}
    </section>
  );
}

/** ⑫ 소속 팀 — 공개 팀만(서버가 비공개를 빼서 준다). 본인이 그 팀 소속일 때만 현황판 링크 */
export function TeamsSection({ member }: { member: Member }) {
  const teams = member.publicTeams;
  return (
    <section className={s.section} aria-labelledby="profile-teams-title">
      <SectionHeader id="profile-teams-title" title="소속 팀" />
      {teams.length > 0 ? (
        <ul className={s.teams}>
          {teams.map((t) => (
            <li key={t.id}>
              {t.viewerRole ? (
                <Link to={paths.team(t.id)} className={s.teamLink}>
                  <CategoryChip icon="users">{t.name}</CategoryChip>
                </Link>
              ) : (
                <CategoryChip icon="users">{t.name}</CategoryChip>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.empty}>{PROFILE_COPY.noPublicTeams}</p>
      )}
    </section>
  );
}

/** 첫 로딩 — ⑦⑧⑩ 스켈레톤(E-54) */
export function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <VisuallyHidden>불러오는 중이에요.</VisuallyHidden>
      <div className={s.head} aria-hidden="true">
        <Skeleton width={88} height={88} radius={44} />
        <div className={s.headMain}>
          <Skeleton width={160} height={28} />
          <div style={{ marginTop: 10 }}>
            <Skeleton width={120} height={14} />
          </div>
        </div>
      </div>
      <div className={s.section} aria-hidden="true">
        <CardSkeleton height={150} />
      </div>
      <div className={s.grid} aria-hidden="true">
        <CardSkeleton height={180} />
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  );
}
