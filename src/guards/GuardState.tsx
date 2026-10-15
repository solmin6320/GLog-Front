import { FullState, PageContainer, type FullStateKind } from '@/shared/ui';

/** 가드가 본문을 대체할 때 (403 · 404 · 오류). URL은 그대로 두고 본문만 바꾼다 (요구사항 4-2). */
export function GuardState({ kind, onRetry }: { kind: FullStateKind; onRetry?: () => void }) {
  return (
    <PageContainer>
      <FullState kind={kind} onRetry={onRetry} />
    </PageContainer>
  );
}
