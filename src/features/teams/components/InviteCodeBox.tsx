import type { ReactNode } from 'react';
import { Button, Hint } from '@/shared/ui';
import { useCopyText } from '../hooks';
import s from './InviteCodeBox.module.css';

/** 초대코드 + [복사] + 안내 한 줄 (TM-02 ⑤ · TM-06 ①). 복사하면 토스트 "복사했어요." */
export function InviteCodeBox({ code, note }: { code: string; note: ReactNode }) {
  const copy = useCopyText();
  return (
    <div>
      <div className={s.row}>
        <span className={s.code} data-testid="invite-code">
          {code}
        </span>
        <Button variant="outline" size="sm" icon="copy" aria-label="초대코드 복사" onClick={() => void copy(code)}>
          복사
        </Button>
      </div>
      <Hint>{note}</Hint>
    </div>
  );
}
