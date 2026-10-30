import { InfoBox, Skeleton } from '@/shared/ui';
import { changesWarnings, PENALTY_CHANGE_LABEL, penaltyChangeOf, warningChangeText, type PenaltyChange } from '../impact';
import { COPY, type RetroPreview } from './model';
import s from './Exemptions.module.css';

const penaltyClass = (c: PenaltyChange) => (c === 'ENTER' ? s.enter : c === 'RELEASE' ? s.release : undefined);

/**
 * 영향 미리보기형 (공통 요소) — 면제 기간 등록 · 개인 면제 승인. 판정이 바뀌는 회원 수와,
 * 그중 경고 수나 벌칙 대상이 바뀌는 회원만 한 줄씩 보여 준다. 계산만 하고 아무것도 바꾸지 않는다.
 */
export function RetroImpact({ p, single = false }: { p: RetroPreview | undefined; single?: boolean }) {
  if (!p) {
    return (
      <section aria-label="재계산 미리보기" aria-busy className={s.previewTable}>
        <Skeleton height={16} />
      </section>
    );
  }
  if (!p.retroactive || p.items.length === 0) {
    return (
      <section aria-label="재계산 미리보기">
        <p className={s.muted}>{COPY.notJudged}</p>
      </section>
    );
  }
  // 한 명(개인 승인)이면 경고가 그대로여도 그 사람 줄을 보여 준다
  const changed = single ? p.items : p.items.filter((it) => changesWarnings(it.impact));
  const frozen = p.items.some((it) => it.impact.recordOnly);
  return (
    <section aria-label="재계산 미리보기">
      <p className={s.lead}>{single ? COPY.approveRetroLead : COPY.retroLead}</p>
      {single ? null : <p className={s.affected}>{COPY.affected(p.items.length)}</p>}
      {changed.length === 0 ? (
        <p className={s.muted}>{COPY.noChange}</p>
      ) : (
        <>
          {single ? null : <p className={s.listCaption}>{COPY.changedCaption(changed.length)}</p>}
          <dl className={s.previewTable}>
            {changed.map(({ member, impact }) => {
              const change = penaltyChangeOf(impact);
              return (
                <div key={member.id} className={s.previewRow}>
                  <dt>{member.nickname}</dt>
                  <dd>
                    경고 {warningChangeText(impact)}
                    {change !== 'NONE' ? <span className={penaltyClass(change)}> · 벌칙 대상 {PENALTY_CHANGE_LABEL[change]}</span> : null}
                    {single ? ` · 다시 계산되는 주 ${COPY.affectedWeeks(impact.affectedWeeks)}` : null}
                  </dd>
                </div>
              );
            })}
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
