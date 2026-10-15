import type { PenaltyChange } from '@/gql/graphql';
import { InfoBox, Skeleton } from '@/shared/ui';
import { PENALTY_CHANGE_LABEL } from '../warnings/model';
import { COPY, type ApprovalPreview, type PeriodPreview } from './model';
import s from './Exemptions.module.css';

const penaltyClass = (c: PenaltyChange) => (c === 'ENTER' ? s.enter : c === 'RELEASE' ? s.release : undefined);

/**
 * 영향 미리보기형 (공통 요소) — 면제 기간 등록 · 수정 · 삭제. 판정이 바뀌는 회원 수와,
 * 그중 경고 수나 벌칙 대상이 바뀌는 회원만 한 줄씩 보여 준다. 계산만 하고 아무것도 바꾸지 않는다.
 */
export function PeriodImpact({ p }: { p: PeriodPreview | undefined }) {
  if (!p) {
    return (
      <section aria-label="재계산 미리보기" aria-busy className={s.previewTable}>
        <Skeleton height={16} />
      </section>
    );
  }
  const frozen = p.changes.some((c) => c.frozenByFulfillment);
  return (
    <section aria-label="재계산 미리보기">
      <p className={s.lead}>{COPY.retroLead}</p>
      <p className={s.affected}>{COPY.affected(p.affectedMemberCount)}</p>
      {p.changes.length === 0 ? (
        <p className={s.muted}>{COPY.noChange}</p>
      ) : (
        <>
          <p className={s.listCaption}>{COPY.changedCaption(p.changes.length)}</p>
          <dl className={s.previewTable}>
            {p.changes.map((c) => (
              <div key={c.member.id} className={s.previewRow}>
                <dt>{c.member.nickname}</dt>
                <dd>
                  경고 {c.warningCountBefore}회 → {c.warningCountAfter}회
                  {c.penaltyChange !== 'NONE' ? (
                    <span className={penaltyClass(c.penaltyChange)}> · 벌칙 대상 {PENALTY_CHANGE_LABEL[c.penaltyChange]}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {frozen ? (
        <div className={s.notes}>
          <InfoBox tone="warn" icon="lock">
            {COPY.frozen}
          </InfoBox>
        </div>
      ) : null}
    </section>
  );
}

/** 영향 미리보기형 — 개인 면제 소급 승인 한 명 (E-45) */
export function ApprovalImpact({ p }: { p: ApprovalPreview | undefined }) {
  return (
    <section aria-label="재계산 미리보기" aria-busy={p ? undefined : true}>
      <dl className={s.previewTable}>
        <div className={s.previewRow}>
          <dt>경고</dt>
          <dd>{p ? `${p.warningCountBefore}회 → ${p.warningCountAfter}회` : <Skeleton width={64} height={16} />}</dd>
        </div>
        <div className={s.previewRow}>
          <dt>벌칙 대상</dt>
          <dd className={p ? penaltyClass(p.penaltyChange) : undefined}>
            {p ? PENALTY_CHANGE_LABEL[p.penaltyChange] : <Skeleton width={48} height={16} />}
          </dd>
        </div>
        <div className={s.previewRow}>
          <dt>다시 계산되는 주</dt>
          <dd>{p ? `${p.affectedWeekCount}개 주` : <Skeleton width={48} height={16} />}</dd>
        </div>
      </dl>
      {p?.frozenByFulfillment ? (
        <div className={s.notes}>
          <InfoBox tone="warn" icon="lock">
            {COPY.frozen}
          </InfoBox>
        </div>
      ) : null}
    </section>
  );
}
