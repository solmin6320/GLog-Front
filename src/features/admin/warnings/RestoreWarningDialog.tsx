import { useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { MSG } from '@/domain/messages';
import { useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { Button, InfoBox, Modal, Skeleton } from '@/shared/ui';
import { AdminWarningsRestorePreviewQuery, AdminWarningsRestoreWarning, warningsRefetch } from './api';
import { COPY, PENALTY_CHANGE_LABEL, type DeletedWarningRow, type RestorePreview } from './model';
import { TeamNames } from './TeamNames';
import s from './Warnings.module.css';

/**
 * ②-1 ⑧ [복구] → 복구 미리보기(쿼리) → 영향 미리보기형 확인 → restoreWarning(expectedBasis) (ACC-PEN-06 ~ 09).
 * 확정 전에는 뮤테이션이 나가지 않는다. 그새 다른 변경이 반영되면(PREVIEW_STALE) 미리보기를 다시 받아 알린다.
 */
export function RestoreWarningDialog({ warning, onClose }: { warning: DeletedWarningRow; onClose: () => void }) {
  const client = useApolloClient();
  const preview = useQuery(AdminWarningsRestorePreviewQuery, { variables: { warningId: warning.id }, fetchPolicy: 'network-only' });
  const p = preview.loading ? undefined : preview.data?.restoreWarningPreview;
  const [stale, setStale] = useState(false);

  const [restore] = useMutation(AdminWarningsRestoreWarning);
  const action = useAction(
    (expectedBasis: string | null) =>
      restore({ variables: { warningId: warning.id, expectedBasis }, refetchQueries: warningsRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.restored,
      errorOverrides: { NOT_FOUND: COPY.restoreGone },
      onError: (e) => {
        if (e.code === 'PREVIEW_STALE') {
          setStale(true);
          preview.refetch().catch(() => undefined);
          return true;
        }
        if (e.code === 'NOT_FOUND') {
          client.refetchQueries({ include: warningsRefetch() }).catch(() => undefined);
          onClose();
        }
        return false;
      },
    },
  );

  const submit = async () => {
    if (!p) return;
    setStale(false);
    const r = await action.run(p.basis ?? null);
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

/** 바뀌는 수치를 항목별로 (공통 요소 '영향 미리보기형') + E-42 · E-43 · E-59 안내 */
function RestorePreviewDetails({ p, warning }: { p: RestorePreview | undefined; warning: DeletedWarningRow }) {
  return (
    <section aria-label="복구 미리보기" aria-busy={p ? undefined : true}>
      <dl className={s.previewTable}>
        <div className={s.previewRow}>
          <dt>경고</dt>
          <dd>{p ? `${p.warningCountBefore}회 → ${p.warningCountAfter}회` : <Skeleton width={64} height={16} />}</dd>
        </div>
        <div className={s.previewRow}>
          <dt>벌칙 대상</dt>
          <dd className={p?.penaltyChange === 'ENTER' ? s.enter : p?.penaltyChange === 'RELEASE' ? s.release : undefined}>
            {p ? PENALTY_CHANGE_LABEL[p.penaltyChange] : <Skeleton width={48} height={16} />}
          </dd>
        </div>
        <div className={s.previewRow}>
          <dt>복구 후 카테고리</dt>
          <dd>
            <TeamNames teams={warning.restoreCategories} emptyText={COPY.deletedTeam} />
          </dd>
        </div>
      </dl>
      {p && (p.penaltyChange === 'ENTER' || p.restoresWithoutCategory || p.frozenByFulfillment) ? (
        <div className={s.notes}>
          {p.frozenByFulfillment ? (
            <InfoBox tone="warn" icon="lock">
              {COPY.frozen}
            </InfoBox>
          ) : null}
          {p.penaltyChange === 'ENTER' ? (
            <InfoBox tone="red" icon="alert">
              {COPY.reenter}
            </InfoBox>
          ) : null}
          {p.restoresWithoutCategory ? (
            <InfoBox tone="mute" icon="info">
              {COPY.noCategory}
            </InfoBox>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
