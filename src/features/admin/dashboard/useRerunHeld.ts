import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useAction } from '@/shared/api';
import { useConfirm } from '@/shared/ui';
import { AdminDashboardRerunHeld, dashboardRefetch } from './api';
import { rerunToast } from './model';

/**
 * 보류 재시도 (AD-01 ⑦ [재시도] · ⑨ [전체 재시도], E-35). 확정 건은 서버가 건너뛴다.
 * 행 재시도는 바로, 전체 재시도는 확인 다이얼로그를 거친다. 끝나면 목록 · 요약 · 메뉴 배지를 다시 부른다.
 */
export function useRerunHeld() {
  const [rerun] = useMutation(AdminDashboardRerunHeld);
  const confirm = useConfirm();
  /** 진행 중인 대상: 판정 id 또는 'all' */
  const [running, setRunning] = useState<string | null>(null);
  const action = useAction(
    (judgmentIds: string[] | null) =>
      rerun({ variables: { judgmentIds }, refetchQueries: dashboardRefetch(), awaitRefetchQueries: true }),
    { success: (r) => rerunToast(r.data?.rerunHeldJudgments.processedCount ?? 0) },
  );

  const runFor = async (key: string, ids: string[] | null) => {
    setRunning(key);
    try {
      await action.run(ids);
    } finally {
      setRunning(null);
    }
  };

  return {
    running,
    retryOne: (judgmentId: string) => runFor(judgmentId, [judgmentId]),
    retryAll: async (heldCount: number) => {
      const ok = await confirm({
        title: `보류 ${heldCount}명을 다시 판정할까요?`,
        body: '보류 건만 다시 판정해요. 이미 확정된 판정은 바뀌지 않아요.',
        confirmLabel: '전체 재시도',
      });
      if (ok) await runFor('all', null);
    },
  };
}
