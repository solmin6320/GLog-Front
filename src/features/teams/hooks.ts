import { useCallback } from 'react';
import type { ApolloCache, Reference } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { MSG } from '@/domain/messages';
import { useToast } from '@/shared/ui';
import { TEAM_COPY } from './lib';

/** 클립보드 복사 + 토스트 "복사했어요." (TM-02 ⑤ · TM-06 ①) */
export function useCopyText(): (text: string) => Promise<void> {
  const toast = useToast();
  return useCallback(
    async (text: string) => {
      try {
        if (!navigator.clipboard) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(text);
        toast.success(MSG.copied);
      } catch {
        toast.error(TEAM_COPY.copyFailed);
      }
    },
    [toast],
  );
}

/** 내 팀 목록(myTeams)에서 그 팀을 뺀다 — 나가기 · 삭제 직후 TM-01이 옛 카드를 잠깐 그리지 않게 */
export function removeFromMyTeams(cache: ApolloCache, teamId: string): void {
  cache.modify({
    fields: {
      myTeams(existing: readonly Reference[] | undefined, { readField }) {
        return (existing ?? []).filter((ref) => readField('id', ref) !== teamId);
      },
    },
  });
}

/**
 * 나가기 · 삭제로 볼 수 없게 된 팀을 캐시에서 지운다. **화면을 떠난 뒤에** 부른다 —
 * 그 팀 화면(TeamScope)이 살아 있을 때 지우면 다시 불러 403이 잠깐 보인다. 뒤로 가기로 돌아오면 서버가 다시 판단한다.
 */
export function useForgetTeam(): (teamId: string) => void {
  const client = useApolloClient();
  return useCallback(
    (teamId: string) => {
      client.cache.evict({ id: client.cache.identify({ __typename: 'Team', id: teamId }) });
      client.cache.gc();
    },
    [client],
  );
}
