import { useId, useState, type FormEvent } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { validateRequiredText } from '@/shared/lib/validators';
import { Button, InfoBox, Modal, TextArea } from '@/shared/ui';
import { AdminExemptionsApprovalPreviewQuery, AdminExemptionsApprove, AdminExemptionsReject } from './api';
import { RetroImpact } from './ImpactSummary';
import { COPY, REJECT_REASON_MAX, exemptionsRefetch, requestLine, type RequestRow } from './model';
import s from './Exemptions.module.css';

const validateRejectReason = validateRequiredText('거절 사유', REJECT_REASON_MAX);

/** 처리 중 사라진 요청이면 목록을 다시 받고 닫는다 */
function useGoneHandler(onClose: () => void) {
  const client = useApolloClient();
  return () => {
    client.refetchQueries({ include: exemptionsRefetch() }).catch(() => undefined);
    onClose();
  };
}

/**
 * ⑦ [승인] — 지난 주의 요청(소급일 수 있음, ACC-ADM-09 · E-45). 미리보기 쿼리 → 영향 미리보기형 확인 →
 * approvePersonalExemption. 이번 주 이후의 요청은 이 다이얼로그 없이 바로 승인한다.
 */
export function ApproveDialog({ request, onClose }: { request: RequestRow; onClose: () => void }) {
  const gone = useGoneHandler(onClose);
  const preview = useQuery(AdminExemptionsApprovalPreviewQuery, { variables: { id: request.id }, fetchPolicy: 'network-only' });
  const p = !preview.loading && !preview.error ? preview.data?.previewPersonalExemptionApproval : undefined;

  const [approve] = useMutation(AdminExemptionsApprove);
  const action = useAction(
    () => approve({ variables: { id: request.id }, refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.approved,
      errorOverrides: { NOT_FOUND: COPY.gone, ALREADY_HANDLED: COPY.gone },
      onError: (e) => {
        if (e.code === 'NOT_FOUND' || e.code === 'ALREADY_HANDLED') gone();
        return false;
      },
    },
  );

  const submit = async () => {
    if (p === undefined || action.pending) return;
    if (await action.run()) onClose();
  };

  return (
    <Modal
      open
      size="sm"
      title="면제를 승인할까요?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => void submit()} disabled={p === undefined} loading={action.pending}>
            승인하기
          </Button>
        </>
      }
    >
      <p className={s.lead}>
        {requestLine(request)} · {formatWeekRange(request.weekStart)}
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
      ) : (
        <RetroImpact p={p} single />
      )}
    </Modal>
  );
}

/**
 * ⑦ [거절] — 사유 필수 (ACC-ADM-08 · E-48). 사유는 요청한 팀장의 TM-08 ⑤에 "거절됨 · 사유: …"로 그대로 보인다.
 */
export function RejectDialog({ request, onClose }: { request: RequestRow; onClose: () => void }) {
  const gone = useGoneHandler(onClose);
  const formId = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [reject] = useMutation(AdminExemptionsReject);
  const action = useAction(
    (text: string) =>
      reject({ variables: { id: request.id, reason: text }, refetchQueries: exemptionsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.rejected,
      errorOverrides: { NOT_FOUND: COPY.gone, ALREADY_HANDLED: COPY.gone },
      onError: (e) => {
        if (e.code === 'NOT_FOUND' || e.code === 'ALREADY_HANDLED') gone();
        return false;
      },
    },
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (action.pending) return;
    const invalid = validateRejectReason(reason);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (await action.run(reason.trim())) onClose();
  };

  return (
    <Modal
      open
      size="sm"
      title="면제 요청을 거절할까요?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={action.pending}>
            거절
          </Button>
        </>
      }
    >
      <p className={s.lead}>
        {requestLine(request)} · {formatWeekRange(request.weekStart)}
      </p>
      <form id={formId} className={s.form} onSubmit={(e) => void submit(e)} noValidate>
        <TextArea
          label="거절 사유"
          required
          rows={3}
          maxLength={REJECT_REASON_MAX}
          counter
          autoFocus
          hint="요청한 팀장에게 이 사유가 그대로 보여요."
          value={reason}
          error={error}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
        />
      </form>
    </Modal>
  );
}
