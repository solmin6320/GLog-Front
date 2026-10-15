import { Link } from 'react-router';
import { formatWeekRange } from '@/shared/lib/format';
import { paths } from '@/shared/lib/paths';
import { Button, InfoBox } from '@/shared/ui';
import { COPY, HELD_NAMES_MAX, type HeldRow } from './model';
import s from './Dashboard.module.css';

/**
 * ⑨ 보류 안내 + [전체 재시도] (ACC-FIX-12 · 13 · 14). 주차와 무관한 미해결 보류 전부를 보여 준다.
 * 보류가 0명이면 아무것도 그리지 않는다(빈 상태 문구도 없다). 아이디가 바뀐 건은 재시도로 풀리지 않아 문구를 나눈다(E-08).
 * 사람마다 그 주의 '보류만' 목록으로 가는 링크를 단다 — 행 [재시도]는 판정 결과 표에 있다.
 */
export function HeldNotice({
  held,
  running,
  onRetryAll,
}: {
  held: HeldRow[];
  running: boolean;
  onRetryAll: (retryableCount: number) => void;
}) {
  if (held.length === 0) return null;
  const retryable = held.filter((h) => h.canRetry).length;
  const shown = held.slice(0, HELD_NAMES_MAX);
  return (
    <div className={s.held}>
      <InfoBox
        tone="warn"
        icon="clock"
        action={
          retryable > 0 ? (
            <Button variant="outline" size="sm" icon="refresh" loading={running} onClick={() => onRetryAll(retryable)}>
              전체 재시도
            </Button>
          ) : null
        }
      >
        <p>
          <b>보류 {held.length}명</b> · {retryable > 0 ? COPY.heldApi : COPY.heldIdentity}
        </p>
        <ul className={s.heldList} aria-label="보류 회원">
          {shown.map((h) => (
            <li key={h.judgment.id} className={s.heldItem}>
              <Link to={paths.admin({ week: h.judgment.weekStart, result: 'hold' })}>{h.member.nickname}</Link>
              <span className={s.heldWeek}>{formatWeekRange(h.judgment.weekStart)}</span>
              <span>{h.canRetry ? 'GitHub 응답 실패' : COPY.heldIdentity}</span>
            </li>
          ))}
          {held.length > shown.length ? <li className={s.heldItem}>외 {held.length - shown.length}명</li> : null}
        </ul>
      </InfoBox>
    </div>
  );
}
