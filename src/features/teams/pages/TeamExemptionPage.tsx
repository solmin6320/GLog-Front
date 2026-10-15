import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import type { TeamExemptionQueryQuery } from '@/gql/graphql';
import { useTeamScope } from '@/guards';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useClock, useViewer } from '@/session';
import { useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { addDays } from '@/shared/lib/kst';
import { LIMITS, validateReason } from '@/shared/lib/validators';
import {
  Button,
  Card,
  EmptyState,
  Hint,
  PageContainer,
  PageSkeleton,
  PageTitle,
  Pill,
  QueryBoundary,
  RowItem,
  RowList,
  SectionHeader,
  Select,
  TextArea,
} from '@/shared/ui';
import { TeamExemptionQuery, TeamRequestExemptionMutation } from '../api';
import { requestStatusBadge, TEAM_COPY } from '../lib';
import s from './TeamPages.module.css';

type ExemptionTeam = NonNullable<TeamExemptionQueryQuery['team']>;
type ExemptionRequest = ExemptionTeam['exemptionRequests'][number];

const MEMBER_SELECT_ID = 'exemption-member';
const validateExemptionReason = validateReason('사유', LIMITS.exemptionReason);

type Errors = { member?: string | null; week?: string | null; reason?: string | null };

/** ①~④ 요청 폼 */
function RequestForm({ team }: { team: ExemptionTeam }) {
  const { team: scopeTeam } = useTeamScope();
  const viewer = useViewer();
  const clock = useClock();
  const thisWeek = clock.currentWeekStart;
  const nextWeek = addDays(thisWeek, 7);

  const [memberId, setMemberId] = useState('');
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  // ① 이 팀 팀원 + 본인 (팀장도 팀원 목록에 있다)
  const memberOptions = [
    { value: '', label: '대상을 골라 주세요' },
    ...team.members.map((x) => ({
      value: x.member.id,
      label: x.member.id === viewer.memberId ? `${x.member.nickname} (나)` : x.member.nickname,
    })),
  ];
  // ② 주 단위 · 이번 주와 다음 주 (서버 clock 기준)
  const weekOptions = [
    { value: thisWeek, label: `${formatWeekRange(thisWeek)} (이번 주)` },
    { value: nextWeek, label: `${formatWeekRange(nextWeek)} (다음 주)` },
  ];

  const [requestExemption] = useMutation(TeamRequestExemptionMutation);
  const request = useAction(
    (input: { memberId: string; weekStart: string; reason: string }) =>
      requestExemption({
        variables: { input: { teamId: scopeTeam.id, ...input } },
        refetchQueries: ['TeamExemptionQuery'],
        awaitRefetchQueries: true,
      }),
    {
      // E-44: 전체 면제 기간과 겹치면 안내 문구로 알린다 (요청 보관 여부는 서버 결과대로)
      success: (r) => (r.data?.requestPersonalExemption.overlapsExemptionPeriod ? TEAM_COPY.overlapsExemptionPeriod : TEAM_COPY.requested),
      onError: (e) => {
        if (e.code === 'EXEMPTION_DUPLICATE') {
          setErrors({ week: '이미 요청한 주간이에요.' });
          return true;
        }
        if (e.code === 'VALIDATION_FAILED') {
          if (e.field === 'memberId') setErrors({ member: '대상을 다시 골라 주세요.' });
          else if (e.field === 'weekStart') setErrors({ week: '주간을 다시 골라 주세요.' });
          else setErrors({ reason: validateExemptionReason(reason) ?? '사유를 다시 확인해 주세요.' });
          return true;
        }
        return false;
      },
    },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (request.pending) return;
    const next: Errors = {
      member: memberId ? null : '대상을 골라 주세요.',
      reason: validateExemptionReason(reason),
    };
    setErrors(next);
    if (next.member) {
      document.getElementById(MEMBER_SELECT_ID)?.focus();
      return;
    }
    if (next.reason) return;
    const res = await request.run({ memberId, weekStart, reason: reason.trim() });
    if (res !== undefined) {
      setMemberId('');
      setReason('');
    }
  };

  return (
    <Card>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <Select
          id={MEMBER_SELECT_ID}
          label="대상"
          required
          options={memberOptions}
          value={memberId}
          error={errors.member}
          onChange={(e) => {
            setMemberId(e.target.value);
            setErrors((x) => ({ ...x, member: null }));
          }}
        />
        <Select
          label="주간"
          required
          options={weekOptions}
          value={weekStart}
          error={errors.week}
          onChange={(e) => {
            setWeekStart(e.target.value);
            setErrors((x) => ({ ...x, week: null }));
          }}
        />
        <TextArea
          label="사유"
          required
          value={reason}
          rows={4}
          maxLength={LIMITS.exemptionReason}
          counter
          hint="관리자가 판단할 근거를 적어 주세요."
          error={errors.reason}
          onChange={(e) => {
            setReason(e.target.value);
            setErrors((x) => ({ ...x, reason: null }));
          }}
        />
        <div className={s.formActions}>
          <Button type="submit" loading={request.pending}>
            면제 요청하기
          </Button>
        </div>
      </form>
      <Hint>승인되면 그 회원은 그 주 판정에서 빠져요.</Hint>
    </Card>
  );
}

/** ⑤ 요청 한 줄: "{대상} · {주차} · {상태}" — 거절이면 "거절됨 · 사유: …" */
function RequestRow({ request }: { request: ExemptionRequest }) {
  const badge = requestStatusBadge(request.status);
  const dot = (
    <span className={s.dot} aria-hidden="true">
      ·
    </span>
  );
  return (
    <RowItem alignTop>
      <div className={s.requestBody}>
        <p className={s.requestLine}>
          <b>{request.member.nickname}</b>
          {dot}
          <span>{formatWeekRange(request.weekStart)}</span>
          {badge ? (
            <>
              {dot}
              <Pill tone={badge.tone} icon={badge.icon}>
                {badge.label}
              </Pill>
            </>
          ) : null}
          {/* E-48 거절 사유 (관리자 입력) */}
          {request.rejectReason ? (
            <>
              {dot}
              <span>사유: {request.rejectReason}</span>
            </>
          ) : null}
        </p>
        {request.overlapsExemptionPeriod ? <p className={s.requestNote}>{TEAM_COPY.overlapsExemptionPeriod}</p> : null}
      </div>
    </RowItem>
  );
}

/** TM-08 개인 면제 요청 (화면설계서 5-1-17). 팀장만 (RequireTeamLeader) */
export default function TeamExemptionPage() {
  const { team } = useTeamScope();
  useDocumentTitle(`개인 면제 요청 · ${team.name}`);
  const q = useQuery(TeamExemptionQuery, { variables: { id: team.id } });

  return (
    <PageContainer width="md">
      <PageTitle title="개인 면제 요청" sub={team.name} />
      <QueryBoundary
        loading={q.loading}
        error={q.error}
        data={q.data?.team}
        onRetry={() => {
          q.refetch().catch(() => undefined);
        }}
        skeleton={<PageSkeleton />}
      >
        {(t) => (
          <>
            <RequestForm team={t} />
            <section className={s.section} aria-labelledby="exemption-list-heading">
              <SectionHeader id="exemption-list-heading" title="요청 목록" />
              {t.exemptionRequests.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="요청한 면제가 없어요."
                  action={
                    <Button variant="outline" onClick={() => document.getElementById(MEMBER_SELECT_ID)?.focus()}>
                      면제 요청하기
                    </Button>
                  }
                />
              ) : (
                <RowList ariaLabel="요청 목록">
                  {t.exemptionRequests.map((r) => (
                    <RequestRow key={r.id} request={r} />
                  ))}
                </RowList>
              )}
            </section>
          </>
        )}
      </QueryBoundary>
    </PageContainer>
  );
}
