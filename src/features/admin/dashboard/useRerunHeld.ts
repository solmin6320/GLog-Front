import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useAction } from '@/shared/api';
import { useConfirm } from '@/shared/ui';
import { AdminDashboardRetryAllHolds, AdminDashboardRetryHold, dashboardRefetch } from './api';
import { rerunToast } from './model';

/**
 * 보류 재시도 (AD-01 ⑦ [재시도] · ⑨ [전체 재시도], E-35). 확정 건은 서버가 건너뛴다.
 * 행 재시도는 바로, 전체 재시도는 확인 다이얼로그를 거친다. 끝나면 목록 · 요약 · 메뉴 배지를 다시 부른다.
 */
export function useRerunHeld() {
  const [retryOneMutation] = useMutation(AdminDashboardRetryHold);
  const [retryAllMutation] = useMutation(AdminDashboardRetryAllHolds);
  const confirm = useConfirm();
  /** 진행 중인 대상: 행 key('memberId:weekStart') 또는 'all' */
  const [running, setRunning] = useState<string | null>(null);
  const opts = { refetchQueries: dashboardRefetch(), awaitRefetchQueries: true };
  const one = useAction((memberId: string, weekStart: string) => retryOneMutation({ variables: { memberId, weekStart }, ...opts }), {
    success: (r) => rerunToast(r.data?.retryJudgmentHold.resolved ? 1 : 0, 1),
  });
  const all = useAction(() => retryAllMutation(opts), {
    success: (r) => rerunToast(r.data?.retryAllJudgmentHolds.resolved ?? 0, r.data?.retryAllJudgmentHolds.attempted ?? 0),
  });

  const runFor = async (key: string, run: () => Promise<unknown>) => {
    setRunning(key);
    try {
      await run();
    } finally {
      setRunning(null);
    }
  };

  return {
    running,
    retryOne: (memberId: string, weekStart: string) => runFor(holdKey(memberId, weekStart), () => one.run(memberId, weekStart)),
    retryAll: async (heldCount: number) => {
      const ok = await confirm({
        title: `보류 ${heldCount}명을 다시 판정할까요?`,
        body: '보류 건만 다시 판정해요. 이미 확정된 판정은 바뀌지 않아요.',
        confirmLabel: '전체 재시도',
      });
      if (ok) await runFor('all', () => all.run());
    },
  };
}

/** 보류 한 건의 key — 보류 목록에는 판정 id가 없어 회원 · 주로 구분한다 */
export const holdKey = (memberId: string, weekStart: string) => `${memberId}:${weekStart}`;
