import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { PromoteAdminButton } from '@/features/admin/members/PromoteAdminButton';
import type { ProfileHistoryQueryQuery, ProfileQueryQuery } from '@/gql/graphql';
import { useClock } from '@/session';
import type { PagedList } from '@/shared/api';
import { asOfLabel, formatWeekRange } from '@/shared/lib/format';
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
import { grassLevels } from '../grass';
import s from '../profile.module.css';

type Member = ProfileQueryQuery['profile'];
type HistoryNode = ProfileHistoryQueryQuery['profile']['judgmentHistory']['items'][number];

/** ⑩ 한 쪽 크기 — 백엔드는 커서 기반 20개(E-57). 이번 주 진행 중 행은 세지 않는다 */
export const HISTORY_PAGE = 20;

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

/** ①~⑤ 사진 · 닉네임 · GitHub · [프로필 수정](본인) · [관리자 메뉴](본인 + 관리자) · [관리자로 지정](남 + 관리자) */
export function ProfileHeader({ member, isOwn, isAdmin }: { member: Member; isOwn: boolean; isAdmin: boolean }) {
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
          </div>
        ) : isAdmin ? (
          <div className={s.actions}>
            <PromoteAdminButton memberId={member.id} nickname={member.nickname} />
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

/** ⑦ GitHub 잔디 1년 + 갱신 기준(M-15). 캐시가 없으면 E-32 빈 상태 + [다시 시도] */
export function GrassSection({ member, onRetry }: { member: Member; onRetry: () => void }) {
  const clock = useClock();
  const grass = member.grass;
  const asOf = grass ? asOfLabel(grass.fetchedAt, clock.now) : null;
  const days = useMemo(() => (grass ? grassLevels(grass.days) : []), [grass]);
  const body: ReactNode = grass ? (
    <Card padding={18}>
      <GrassHeatmap days={days} />
    </Card>
  ) : (
    <Card>
      <EmptyState
        title={PROFILE_COPY.grassFailed}
        action={
          <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
            다시 시도
          </Button>
        }
      />
    </Card>
  );
  return (
    <section className={s.section} aria-labelledby="profile-grass-title">
      <SectionHeader id="profile-grass-title" title="GitHub 잔디" right={asOf ?? undefined} />
      {body}
    </section>
  );
}

/** ⑧ 경고 합계(사람 단위) + ⑨ 팀별 경고(중복 집계 + 안내문). 비공개 · 삭제된 팀 이름은 서버가 가려서 준다 */
export function WarningSection({ member }: { member: Member }) {
  const w = member.warning;
  const byTeam = member.teamWarnings;
  const count = w.warningCount ?? 0;
  const penalty = !!w.penaltyTarget;
  return (
    <section aria-labelledby="profile-warning-title">
      <SectionHeader id="profile-warning-title" title="경고" />
      {w.onHold ? (
        <p className={s.empty}>{PROFILE_COPY.warningOnHold}</p>
      ) : (
        <>
          <div className={s.warnBig}>
            <BigStat label={<VisuallyHidden>누적 경고</VisuallyHidden>} value={count} unit="/ 3" size="md" />
            {penalty ? <StatusBadge kind="penalty" /> : null}
          </div>
          {penalty ? <p className={s.penaltyText}>{PROFILE_COPY.penalty}</p> : null}
          {count === 0 ? (
            <p className={s.empty}>{PROFILE_COPY.noWarning}</p>
          ) : !byTeam.onHold && byTeam.teams.length > 0 ? (
            <>
              <RowList ariaLabel="팀별 경고">
                {byTeam.teams.map((c, i) => (
                  <RowItem key={`${c.name}-${i}`} right={<span className={s.count}>{`${c.count}회`}</span>}>
                    <span>{c.name}</span>
                  </RowItem>
                ))}
              </RowList>
              <Foot>{PROFILE_COPY.doubleCount}</Foot>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

type HistoryRow = { id: string; weekStart: string; verifiedDays: number | null; recordCount: number | null; result: ReactNode };

const HISTORY_COLUMNS: Column<HistoryRow>[] = [
  { key: 'week', header: '주차', render: (r) => formatWeekRange(r.weekStart) },
  { key: 'days', header: '인증일', render: (r) => (r.verifiedDays == null ? '—' : `${r.verifiedDays}일`) },
  { key: 'records', header: '기록글', render: (r) => (r.recordCount == null ? '—' : `${r.recordCount}개`) },
  { key: 'result', header: '결과', render: (r) => r.result },
];

/** 결과 배지 — 진행 중(이번 주 · 보류 주)은 "진행 중", 미달은 "미달 (경고)" */
function judgmentBadge(j: HistoryNode) {
  if (j.result === 'IN_PROGRESS') return <StatusBadge kind="progress" />;
  return <StatusBadge kind="judgment" status={j.result} context="profile" />;
}

/** ⑩ 주간 판정 이력(첫 줄 '진행 중'은 서버가 붙인다) + ⑪ [더 보기] 20주씩 */
export function HistorySection({ list }: { list: PagedList<ProfileHistoryQueryQuery, HistoryNode> }) {
  let body: ReactNode;
  if (!list.data && list.loading) {
    body = <TableSkeleton rows={5} cols={4} />;
  } else if (!list.data && list.error) {
    body = <SectionError message={PROFILE_COPY.historyFailed} onRetry={list.refetch} />;
  } else if (list.nodes.length === 0) {
    // 팀 미소속 · 첫 주 (EX-PR01-03)
    body = <EmptyState title={PROFILE_COPY.noHistory} />;
  } else {
    const rows: HistoryRow[] = list.nodes.map((j) => ({
        id: j.weekStart,
        weekStart: j.weekStart,
        verifiedDays: j.verifiedDays,
        recordCount: j.recordCount,
        result: judgmentBadge(j),
      }));
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
        {list.nodes.some((j, i) => j.result === 'IN_PROGRESS' && i > 0) ? <Foot>{PROFILE_COPY.holdNote}</Foot> : null}
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

/** ⑫ 소속 팀 — 공개 팀만(서버가 비공개를 빼서 준다). 내가 그 팀 소속일 때만 현황판 링크 */
export function TeamsSection({ member, myTeamIds }: { member: Member; myTeamIds: ReadonlySet<string> }) {
  const teams = member.teams;
  return (
    <section className={s.section} aria-labelledby="profile-teams-title">
      <SectionHeader id="profile-teams-title" title="소속 팀" />
      {teams.length > 0 ? (
        <ul className={s.teams}>
          {teams.map((t) => (
            <li key={t.id}>
              {myTeamIds.has(t.id) ? (
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
