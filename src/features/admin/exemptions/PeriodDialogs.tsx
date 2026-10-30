import { useId, useState, type FormEvent } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { useClock } from '@/session';
import { useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { validateRequiredText } from '@/shared/lib/validators';
import { Button, Modal, Select, TextArea } from '@/shared/ui';
import {
  AdminExemptionsCreatePeriod,
  AdminExemptionsDeletePeriod,
  AdminExemptionsPeriodPreviewQuery,
  AdminExemptionsUpdatePeriod,
} from './api';
import { RetroImpact } from './ImpactSummary';
import { COPY, PERIOD_REASON_MAX, exemptionsRefetch, weekOptions, type PeriodRow, type RetroPreview } from './model';
import s from './Exemptions.module.css';

const validateReason = validateRequiredText('사유', PERIOD_REASON_MAX);

type Errors = { week?: string | null; reason?: string | null };

/**
 * ⑥ 면제 기간 등록 · 수정 (ACC-ADM-04 · 05).
 * 새 주를 고르면 먼저 미리보기 쿼리로 소급 여부를 확인한다. 판정이 끝난 주면 영향 미리보기 단계를 거치고,
 * 거기서 [이전]·닫기를 하면 뮤테이션은 한 건도 나가지 않는다. 같은 주 중복은 반영할 때 EXEMPTION_PERIOD_DUPLICATE로 온다.
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
  const [preview, setPreview] = useState<RetroPreview | null>(null);

  const check = useAction(async () => {
    const r = await client.query({ query: AdminExemptionsPeriodPreviewQuery, variables: { weekStart }, fetchPolicy: 'network-only' });
    return r.data?.previewExemptionPeriod;
  });

  const [create] = useMutation(AdminExemptionsCreatePeriod);
  const [update] = useMutation(AdminExemptionsUpdatePeriod);
  const commit = useAction(
    async () => {
      const input = { weekStart, reason: reason.trim() };
      const opts = { refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true };
      if (period) await update({ variables: { id: period.id, input }, ...opts });
      else await create({ variables: { input }, ...opts });
      return true;
    },
    {
      success: editing ? COPY.updated : COPY.created,
      errorOverrides: { NOT_FOUND: COPY.gone },
      onError: (e) => {
        if (e.code === 'EXEMPTION_PERIOD_DUPLICATE') {
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
    // 주를 그대로 두고 사유만 고치면 재계산이 없다
    if (weekStart !== period?.weekStart) {
      const p = await check.run();
      if (!p) return;
      if (p.retroactive) {
        setPreview(p);
        return;
      }
    }
    if (await commit.run()) onClose();
  };

  const confirmPreview = async () => {
    if (!preview || commit.pending) return;
    if (await commit.run()) onClose();
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
          <RetroImpact p={preview} />
          {editing ? <p className={s.muted}>{COPY.keepsJudged}</p> : null}
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
 * ⑤ [삭제] (ACC-ADM-06). 단순 확인형 — 백엔드는 지워도 이미 면제로 바뀐 판정을 되돌리지 않아 재계산 미리보기가 없다.
 */
export function DeletePeriodDialog({ period, onClose }: { period: PeriodRow; onClose: () => void }) {
  const client = useApolloClient();
  const clock = useClock();
  const [remove] = useMutation(AdminExemptionsDeletePeriod);
  const action = useAction(
    () => remove({ variables: { id: period.id }, refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.deleted,
      errorOverrides: { NOT_FOUND: COPY.gone },
      onError: (e) => {
        if (e.code === 'NOT_FOUND') {
          client.refetchQueries({ include: exemptionsRefetch() }).catch(() => undefined);
          onClose();
        }
        return false;
      },
    },
  );

  const submit = async () => {
    if (action.pending) return;
    if (await action.run()) onClose();
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
          <Button variant="danger" onClick={() => void submit()} loading={action.pending}>
            삭제
          </Button>
        </>
      }
    >
      <p className={s.lead}>
        {formatWeekRange(period.weekStart)} · {period.reason}
      </p>
      <p className={s.muted}>
        {period.weekStart < clock.currentWeekStart ? COPY.keepsJudged : '삭제하면 이 주도 평소처럼 판정해요.'}
      </p>
    </Modal>
  );
}
