import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { Button, InfoBox, Modal, Skeleton } from '@/shared/ui';
import { AdminWarningsRestorePreviewQuery, AdminWarningsRestoreWarning, warningsRefetch } from './api';
import { PENALTY_CHANGE_LABEL, penaltyChangeOf, warningChangeText } from '../impact';
import { COPY, type DeletedWarningRow, type RestorePreview } from './model';
import { TeamNames } from './TeamNames';
import s from './Warnings.module.css';

/**
 * ②-1 ⑧ [복구] → 복구 미리보기(쿼리) → 영향 미리보기형 확인 → restoreWarning (ACC-PEN-06 ~ 09).
 * 확정 전에는 뮤테이션이 나가지 않는다. 그새 이미 복구됐으면 ALREADY_HANDLED — 목록을 다시 받고 닫는다.
 */
export function RestoreWarningDialog({ warning, onClose }: { warning: DeletedWarningRow; onClose: () => void }) {
  const client = useApolloClient();
  const preview = useQuery(AdminWarningsRestorePreviewQuery, { variables: { warningId: warning.warningId }, fetchPolicy: 'network-only' });
  const p = preview.loading ? undefined : preview.data?.previewWarningRestore;

  const [restore] = useMutation(AdminWarningsRestoreWarning);
  const action = useAction(
    () => restore({ variables: { warningId: warning.warningId }, refetchQueries: warningsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.restored,
      errorOverrides: { NOT_FOUND: COPY.restoreGone, ALREADY_HANDLED: COPY.restoreGone },
      onError: (e) => {
        if (e.code === 'NOT_FOUND' || e.code === 'ALREADY_HANDLED') {
          client.refetchQueries({ include: warningsRefetch() }).catch(() => undefined);
          onClose();
        }
        return false;
      },
    },
  );

  const submit = async () => {
    if (!p) return;
    const r = await action.run();
    if (r) onClose();
  };

  return (
    <Modal
      open
      size="sm"
      title="경고를 복구할까요?"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => void submit()} disabled={!p} loading={action.pending}>
            복구하기
          </Button>
        </>
      }
    >
      <p className={s.lead}>
        {warning.member.nickname} · {formatWeekRange(warning.weekStart)} 경고
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
          미리보기를 불러오지 못했어요.
        </InfoBox>
      ) : (
        <RestorePreviewDetails p={p} warning={warning} />
      )}
    </Modal>
  );
}

/** 바뀌는 수치를 항목별로 (공통 요소 '영향 미리보기형') + E-42 · E-43 · E-59 안내 */
function RestorePreviewDetails({ p, warning }: { p: RestorePreview | undefined; warning: DeletedWarningRow }) {
  const change = p ? penaltyChangeOf(p.impact) : 'NONE';
  return (
    <section aria-label="복구 미리보기" aria-busy={p ? undefined : true}>
      <dl className={s.previewTable}>
        <div className={s.previewRow}>
          <dt>경고</dt>
          <dd>{p ? warningChangeText(p.impact) : <Skeleton width={64} height={16} />}</dd>
        </div>
        <div className={s.previewRow}>
          <dt>벌칙 대상</dt>
          <dd className={change === 'ENTER' ? s.enter : change === 'RELEASE' ? s.release : undefined}>
            {p ? PENALTY_CHANGE_LABEL[change] : <Skeleton width={48} height={16} />}
          </dd>
        </div>
        <div className={s.previewRow}>
          <dt>복구 후 카테고리</dt>
          <dd>
            <TeamNames teams={p?.restoreTeams ?? warning.restoreTeams} emptyText={COPY.deletedTeam} />
          </dd>
        </div>
      </dl>
      {p && (change === 'ENTER' || p.teamDeleted || p.impact.recordOnly) ? (
        <div className={s.notes}>
          {p.impact.recordOnly ? (
            <InfoBox tone="warn" icon="lock">
              {COPY.frozen}
            </InfoBox>
          ) : null}
          {change === 'ENTER' ? (
            <InfoBox tone="red" icon="alert">
              {COPY.reenter}
            </InfoBox>
          ) : null}
          {p.teamDeleted ? (
            <InfoBox tone="mute" icon="info">
              {COPY.noCategory}
            </InfoBox>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
