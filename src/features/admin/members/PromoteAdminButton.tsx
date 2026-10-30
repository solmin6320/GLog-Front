import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useAction } from '@/shared/api';
import { Button, useConfirm } from '@/shared/ui';
import { AdminMembersPromote } from './api';

/**
 * 관리자 지정 (2026-10-29 백엔드 promoteMemberToAdmin). 활성 회원 목록 API가 없어 남의 프로필 화면에 둔다.
 * 프로필에 역할이 없어 이미 관리자인 회원에게도 보인다 — 그때는 서버가 CONFLICT로 막는다.
 */
export function PromoteAdminButton({ memberId, nickname }: { memberId: string; nickname: string }) {
  const confirm = useConfirm();
  const [done, setDone] = useState(false);
  const [promote] = useMutation(AdminMembersPromote);
  const run = useAction(
    async () => {
      await promote({ variables: { memberId } });
      return true as const;
    },
    { success: '관리자로 지정했어요.', errorOverrides: { CONFLICT: '이미 관리자이거나 승인된 회원이 아니에요.' } },
  );
  if (done) return null;
  return (
    <Button
      variant="outline"
      size="sm"
      icon="shield"
      loading={run.pending}
      onClick={async () => {
        const ok = await confirm({
          title: `${nickname} 님을 관리자로 지정할까요?`,
          body: '관리자는 화면에서 되돌릴 수 없어요.',
          confirmLabel: '지정',
        });
        if (ok && (await run.run())) setDone(true);
      }}
    >
      관리자로 지정
    </Button>
  );
}
