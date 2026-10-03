import { useEffect, useId, useRef, useState } from 'react';
import { skipToken, useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { toBadge } from '@/domain/badges';
import { MSG } from '@/domain/messages';
import type { CorrectableJudgmentStatus, CorrectJudgmentInput } from '@/gql/graphql';
import { normalizeError, useAction } from '@/shared/api';
import { formatWeekRange } from '@/shared/lib/format';
import { Avatar, Button, Card, CardSkeleton, Hint, IconButton, InfoBox, RadioCard, Skeleton, TextArea, useConfirm } from '@/shared/ui';
import { AdminDashboardCorrectionPreviewQuery, AdminDashboardCorrectJudgment, dashboardRefetch } from './api';
import {
  COPY,
  CORRECT_TO_LABEL,
  CORRECTABLE,
  CORRECTION_REASON_MAX,
  PENALTY_CHANGE_LABEL,
  penaltyChangeText,
  warningChangeText,
  type CorrectionPreview,
  type JudgmentRow,
} from './model';
import s from './Dashboard.module.css';

/** 패널이 그릴 대상: 목록에서 찾는 중 · 못 찾음 · 보류(정정 불가) · 정정 가능 행 */
export type PanelTarget = { kind: 'loading' } | { kind: 'missing' } | { kind: 'held' } | { kind: 'row'; row: JudgmentRow };

/**
 * ⑩ 판정 정정 패널 (W-15 · ACC-FIX-03 ~ 11 · 16). `?fix=<judgmentId>`가 있으면 열린다.
 * 결과를 고르면 미리보기 **쿼리**만 나간다(아무것도 바뀌지 않음). [정정하고 재계산] → 영향 미리보기형 확인 → 정정 뮤테이션(expectedBasis).
 * 패널은 fix마다 key로 새로 만든다(선택 · 사유 초기화).
 */
export function CorrectionPanel({ target, onClose, onCorrected }: { target: PanelTarget; onClose: () => void; onCorrected: () => void }) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  // 열리면 제목으로 포커스 (좁은 화면에서는 [정정] 버튼이 있던 목록이 사라진다)
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <Card as="aside" className={s.panel} aria-labelledby={titleId}>
      <div className={s.panelHead}>
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className={s.panelTitle}>
          판정 정정
        </h2>
        <IconButton className={s.panelClose} label="정정 닫기" icon="x" onClick={onClose} />
      </div>
      {target.kind === 'loading' ? (
        <div className={s.panelBody}>
          <CardSkeleton height={220} />
        </div>
      ) : target.kind === 'row' && target.row.canCorrect ? (
        <CorrectionForm row={target.row} onClose={onClose} onCorrected={onCorrected} />
      ) : (
        <div className={`${s.notes} ${s.panelBody}`}>
          <InfoBox tone="mute" icon="info">
            {target.kind === 'missing' ? '정정할 판정을 찾지 못했어요. 주차와 필터를 확인해 주세요.' : COPY.notCorrectable}
          </InfoBox>
          <div className={s.actions}>
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

type Choice = 'CURRENT' | CorrectableJudgmentStatus;

function CorrectionForm({ row, onClose, onCorrected }: { row: JudgmentRow; onClose: () => void; onCorrected: () => void }) {
  const client = useApolloClient();
  const confirm = useConfirm();
  const radioName = useId();
  const [choice, setChoice] = useState<Choice>('CURRENT');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const j = row.judgment;
  const newStatus = choice === 'CURRENT' ? null : choice;
  // 미리보기는 늘 새로 받는다(basis가 최신이어야 한다). 고를 때마다 마지막 선택의 결과만 보인다(ACC-FIX-05)
  const preview = useQuery(
    AdminDashboardCorrectionPreviewQuery,
    newStatus ? { variables: { judgmentId: j.id, newStatus }, fetchPolicy: 'network-only' } : skipToken,
  );
  const p: CorrectionPreview | undefined = preview.loading ? undefined : preview.data?.judgmentCorrectionPreview;

  const [correct] = useMutation(AdminDashboardCorrectJudgment);
  const action = useAction(
    (input: CorrectJudgmentInput) =>
      correct({ variables: { input }, refetchQueries: dashboardRefetch(), awaitRefetchQueries: true }),
    {
      success: COPY.corrected,
      errorOverrides: { JUDGMENT_NOT_CORRECTABLE: COPY.notCorrectableNow },
      onError: (e) => {
        if (e.code === 'PREVIEW_STALE') {
          // 다른 변경이 먼저 반영됐다 → 최신 미리보기를 다시 받고 알린다 (ACC-FIX-11)
          setStale(true);
          preview.refetch().catch(() => undefined);
          return true;
        }
        if (e.code === 'VALIDATION_FAILED' && e.field === 'reason') {
          setReasonError(MSG.required('사유'));
          return true;
        }
        if (e.code === 'JUDGMENT_NOT_CORRECTABLE' || e.code === 'NOT_FOUND') {
          // 그새 보류로 바뀌었거나 없어졌다 → 목록을 다시 불러 패널이 바뀐 상태를 그리게 한다
          client.refetchQueries({ include: dashboardRefetch() }).catch(() => undefined);
        }
        return false;
      },
    },
  );

  const currentLabel =
    toBadge({ kind: 'judgment', status: j.status, skipReason: j.skipReason, context: 'admin' })?.label ?? '지금 결과';
  const meta = [
    formatWeekRange(j.weekStart),
    j.verifiedDays !== null && j.recordCount !== null ? `인증일 ${j.verifiedDays}일, 기록글 ${j.recordCount}개` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const pick = (v: string) => {
    setChoice(v as Choice);
    setStale(false);
  };

  const canSubmit = !!newStatus && !!p && reason.trim().length > 0 && !action.pending;

  const submit = async () => {
    if (!newStatus || !p || !reason.trim()) return;
    const ok = await confirm({
      title: '판정을 정정할까요?',
      body: <ConfirmBody p={p} />,
      confirmLabel: '정정하기',
    });
    if (!ok) return;
    setStale(false);
    const r = await action.run({ judgmentId: j.id, newStatus, reason: reason.trim(), expectedBasis: p.basis ?? null });
    if (r) onCorrected();
  };

  return (
    <>
      <div className={s.target}>
        <Avatar name={row.member.nickname} imageUrl={row.member.profileImageUrl} size={40} />
        <div>
          <div className={s.targetName}>{row.member.nickname}</div>
          <div className={s.targetMeta}>{meta}</div>
        </div>
      </div>

      <fieldset className={s.fieldset}>
        <legend className={s.legend}>결과</legend>
        <RadioCard name={radioName} value="CURRENT" checked={choice === 'CURRENT'} onChange={pick} title={currentLabel} description="지금 결과" />
        {CORRECTABLE.filter((st) => st !== j.status).map((st) => (
          <RadioCard key={st} name={radioName} value={st} checked={choice === st} onChange={pick} title={CORRECT_TO_LABEL[st]} />
        ))}
      </fieldset>

      <TextArea
        label="사유"
        required
        rows={3}
        maxLength={CORRECTION_REASON_MAX}
        counter
        placeholder="정정하는 이유를 적어 주세요."
        value={reason}
        error={reasonError}
        onChange={(e) => {
          setReason(e.target.value);
          if (reasonError) setReasonError(null);
        }}
      />

      <section aria-label="재계산 미리보기" aria-live="polite">
        <h3 className={s.previewTitle}>재계산 미리보기</h3>
        {!newStatus ? (
          <p className={s.choose}>바꿀 결과를 고르면 미리 계산해서 보여 줘요.</p>
        ) : preview.error && !preview.loading ? (
          <InfoBox
            tone="red"
            icon="alert"
            action={
              <Button variant="outline" size="sm" onClick={() => preview.refetch().catch(() => undefined)}>
                다시 시도
              </Button>
            }
          >
            {normalizeError(preview.error).code === 'JUDGMENT_NOT_CORRECTABLE' ? COPY.notCorrectableNow : '미리보기를 불러오지 못했어요.'}
          </InfoBox>
        ) : !p ? (
          <div className={s.previewTable} role="status" aria-busy="true">
            {['경고', '벌칙 대상', '다시 계산되는 주차'].map((k) => (
              <div key={k} className={s.previewRow}>
                <span>{k}</span>
                <Skeleton width={56} height={16} />
              </div>
            ))}
          </div>
        ) : (
          <PreviewDetails p={p} />
        )}
        {stale ? (
          <div className={s.notes}>
            <InfoBox tone="warn" icon="alert" role="alert">
              {MSG.previewStale}
            </InfoBox>
          </div>
        ) : null}
      </section>

      <Hint>{COPY.previewHint}</Hint>
      <div className={s.actions}>
        <Button variant="text" onClick={onClose}>
          취소
        </Button>
        <Button onClick={submit} disabled={!canSubmit} loading={action.pending}>
          정정하고 재계산
        </Button>
      </div>
    </>
  );
}

/** 미리보기 표 (W-15): 경고 3회 → 2회 · 벌칙 대상 해제 · 다시 계산되는 주차 1주 + E-50 · E-58 안내 */
function PreviewDetails({ p }: { p: CorrectionPreview }) {
  const change = penaltyChangeText(p.penaltyChange);
  return (
    <>
      <dl className={s.previewTable}>
        <div className={s.previewRow}>
          <dt>경고</dt>
          <dd>
            {p.warningCountBefore}회 → {p.warningCountAfter}회
          </dd>
        </div>
        <div className={s.previewRow}>
          <dt>벌칙 대상</dt>
          <dd className={p.penaltyChange === 'RELEASE' ? s.release : p.penaltyChange === 'ENTER' ? s.enter : undefined}>
            {PENALTY_CHANGE_LABEL[p.penaltyChange]}
          </dd>
        </div>
        <div className={s.previewRow}>
          <dt>다시 계산되는 주차</dt>
          <dd>{p.affectedWeekCount}주</dd>
        </div>
      </dl>
      {change || p.frozenByFulfillment ? (
        <div className={s.notes}>
          {p.frozenByFulfillment ? (
            <InfoBox tone="warn" icon="lock">
              {COPY.frozen}
            </InfoBox>
          ) : null}
          {change ? <p className={s.choose}>{change}</p> : null}
        </div>
      ) : null}
    </>
  );
}

/** 영향 미리보기형 확인 (공통 요소 · ACC-FIX-08): 바뀌는 수치를 항목별로 */
function ConfirmBody({ p }: { p: CorrectionPreview }) {
  const change = penaltyChangeText(p.penaltyChange);
  return (
    <ul className={s.confirmList}>
      <li>{warningChangeText(p.warningCountBefore, p.warningCountAfter)}</li>
      {change ? <li>{change}</li> : null}
      <li>다시 계산되는 주차는 {p.affectedWeekCount}주예요.</li>
      {p.frozenByFulfillment ? <li>{COPY.frozen}</li> : null}
    </ul>
  );
}
