import { useId, useState, type FormEvent } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { MSG } from '@/domain/messages';
import { useClock } from '@/session';
import { useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { validateRequiredText } from '@/shared/lib/validators';
import { Button, InfoBox, Modal, Select, Skeleton, TextArea } from '@/shared/ui';
import {
  AdminExemptionsCreatePeriod,
  AdminExemptionsDeletePeriod,
  AdminExemptionsPeriodPreviewQuery,
  AdminExemptionsUpdatePeriod,
} from './api';
import { PeriodImpact } from './ImpactSummary';
import { COPY, PERIOD_REASON_MAX, exemptionsRefetch, weekOptions, type PeriodPreview, type PeriodRow } from './model';
import s from './Exemptions.module.css';

const validateReason = validateRequiredText('사유', PERIOD_REASON_MAX);

type Errors = { week?: string | null; reason?: string | null };

/**
 * ⑥ 면제 기간 등록 · 수정 (ACC-ADM-04 · 05).
 * [등록]을 누르면 먼저 미리보기 쿼리로 중복 주 · 소급 여부를 확인한다. 판정이 끝난 주면 영향 미리보기 단계를 거치고,
 * 거기서 [취소]하면 뮤테이션은 한 건도 나가지 않는다. 반영 때는 미리보기의 basis를 expectedBasis로 싣는다.
 */
export function PeriodDialog({ period, onClose }: { period?: PeriodRow; onClose: () => void }) {
  const client = useApolloClient();
  const clock = useClock();
  const formId = useId();
  const editing = period !== undefined;

  const [weekStart, setWeekStart] = useState(period?.weekStart ?? clock.currentWeekStart);
  const [reason, setReason] = useState(period?.reason ?? '');
  const [errors, setErrors] = useState<Errors>({});
  /** null이면 입력 단계, 값이 있으면 미리보기 단계 */
  const [preview, setPreview] = useState<PeriodPreview | null>(null);
  const [stale, setStale] = useState(false);

  const check = useAction(
    async () => {
      const r = await client.query({
        query: AdminExemptionsPeriodPreviewQuery,
        variables: { weekStart, periodId: period?.id ?? null },
        fetchPolicy: 'network-only',
      });
      return r.data?.exemptionPeriodPreview;
    },
    {
      onError: (e) => {
        if (e.code !== 'EXEMPTION_DUPLICATE') return false;
        setPreview(null);
        setErrors({ week: COPY.duplicate });
        return true;
      },
    },
  );

  const [create] = useMutation(AdminExemptionsCreatePeriod);
  const [update] = useMutation(AdminExemptionsUpdatePeriod);
  const commit = useAction(
    async (expectedBasis: string | null) => {
      const input = { weekStart, reason: reason.trim(), expectedBasis };
      const opts = { refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true };
      if (period) await update({ variables: { id: period.id, input }, ...opts });
      else await create({ variables: { input }, ...opts });
      return true;
    },
    {
      success: editing ? COPY.updated : COPY.created,
      errorOverrides: { NOT_FOUND: COPY.gone },
      onError: (e) => {
        if (e.code === 'PREVIEW_STALE') {
          // 그새 다른 변경이 반영됐다 → 미리보기를 다시 받아 보여 준다 (설계서 3-6)
          setStale(true);
          void check.run().then((p) => p && setPreview(p));
          return true;
        }
        if (e.code === 'EXEMPTION_DUPLICATE') {
          setPreview(null);
          setErrors({ week: COPY.duplicate });
          return true;
        }
        if (e.code === 'NOT_FOUND') {
          client.refetchQueries({ include: exemptionsRefetch() }).catch(() => undefined);
          onClose();
        }
        return false;
      },
    },
  );

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (check.pending || commit.pending) return;
    const reasonError = validateReason(reason);
    if (reasonError) {
      setErrors({ reason: reasonError });
      return;
    }
    const p = await check.run();
    if (!p) return;
    if (p.isRetroactive) {
      setStale(false);
      setPreview(p);
      return;
    }
    if (await commit.run(p.basis)) onClose();
  };

  const confirmPreview = async () => {
    if (!preview || commit.pending) return;
    setStale(false);
    if (await commit.run(preview.basis)) onClose();
  };

  const verb = editing ? '저장' : '등록';

  return (
    <Modal
      open
      size="sm"
      title={editing ? '면제 기간 수정' : COPY.register}
      onClose={onClose}
      footer={
        preview ? (
          <>
            <Button variant="outline" disabled={commit.pending} onClick={() => setPreview(null)}>
              이전
            </Button>
            <Button onClick={() => void confirmPreview()} loading={commit.pending}>
              {verb}하기
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" form={formId} loading={check.pending || commit.pending}>
              {verb}
            </Button>
          </>
        )
      }
    >
      {preview ? (
        <>
          <p className={s.lead}>
            {formatWeekRange(weekStart)} · {reason.trim()}
          </p>
          <PeriodImpact p={check.pending ? undefined : preview} />
          {stale ? (
            <div className={s.notes}>
              <InfoBox tone="warn" icon="alert" role="alert">
                {MSG.previewStale}
              </InfoBox>
            </div>
          ) : null}
        </>
      ) : (
        <form id={formId} className={s.form} onSubmit={(e) => void submitForm(e)} noValidate>
          <Select
            label="주간"
            required
            hint="월요일 ~ 일요일 한 주 단위로 고를 수 있어요."
            options={weekOptions(clock.currentWeekStart, period?.weekStart)}
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
            rows={3}
            maxLength={PERIOD_REASON_MAX}
            counter
            value={reason}
            error={errors.reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((x) => ({ ...x, reason: null }));
            }}
          />
          <p className={s.muted}>모든 회원에게 적용돼요. 면제 주간은 판정하지 않고, 연속 통과 횟수도 끊기거나 늘지 않아요.</p>
        </form>
      )}
    </Modal>
  );
}

/**
 * ⑤ [삭제] (ACC-ADM-06). 판정이 끝난 주면 영향 미리보기형, 아니면 단순 확인형으로 같은 다이얼로그를 쓴다.
 * 어느 쪽인지는 미리보기의 isRetroactive가 정한다.
 */
export function DeletePeriodDialog({ period, onClose }: { period: PeriodRow; onClose: () => void }) {
  const client = useApolloClient();
  const preview = useQuery(AdminExemptionsPeriodPreviewQuery, {
    variables: { weekStart: period.weekStart, periodId: period.id, removing: true },
    fetchPolicy: 'network-only',
  });
  const p = preview.loading ? undefined : preview.data?.exemptionPeriodPreview;
  const [stale, setStale] = useState(false);

  const [remove] = useMutation(AdminExemptionsDeletePeriod);
  const action = useAction(
    (expectedBasis: string | null) =>
      remove({ variables: { id: period.id, expectedBasis }, refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.deleted,
      errorOverrides: { NOT_FOUND: COPY.gone },
      onError: (e) => {
        if (e.code === 'PREVIEW_STALE') {
          setStale(true);
          preview.refetch().catch(() => undefined);
          return true;
        }
        if (e.code === 'NOT_FOUND') {
          client.refetchQueries({ include: exemptionsRefetch() }).catch(() => undefined);
          onClose();
        }
        return false;
      },
    },
  );

  const submit = async () => {
    if (!p || action.pending) return;
    setStale(false);
    if (await action.run(p.basis)) onClose();
  };

  return (
    <Modal
      open
      size="sm"
      title="면제 기간을 삭제할까요?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button variant="danger" onClick={() => void submit()} disabled={!p} loading={action.pending}>
            삭제
          </Button>
        </>
      }
    >
      <p className={s.lead}>
        {formatWeekRange(period.weekStart)} · {period.reason}
      </p>
      {preview.error && !preview.loading ? (
        <InfoBox
          tone="red"
          icon="alert"
          action={
            <Button variant="outline" size="sm" onClick={() => preview.refetch().catch(() => undefined)}>
              다시 시도
            </Button>
          }
        >
          {COPY.previewFailed}
        </InfoBox>
      ) : !p ? (
        <Skeleton height={16} />
      ) : p.isRetroactive ? (
        <PeriodImpact p={p} />
      ) : (
        <p className={s.muted}>삭제하면 이 주도 평소처럼 판정해요.</p>
      )}
      {stale ? (
        <div className={s.notes}>
          <InfoBox tone="warn" icon="alert" role="alert">
            {MSG.previewStale}
          </InfoBox>
        </div>
      ) : null}
    </Modal>
  );
}
