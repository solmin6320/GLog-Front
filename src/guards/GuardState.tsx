import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { FullState, PageContainer, type FullStateKind } from '@/shared/ui';

const TITLE: Partial<Record<FullStateKind, string>> = { notFound: '페이지를 찾을 수 없음', forbidden: '권한 없음' };

/** 가드가 본문을 대체할 때 (403 · 404 · 오류). URL은 그대로 두고 본문만 바꾼다 (요구사항 4-2). */
export function GuardState({ kind, onRetry }: { kind: FullStateKind; onRetry?: () => void }) {
  // 이전 화면 제목이 남지 않게 본문을 대체할 때 제목도 바꾼다
  useDocumentTitle(TITLE[kind] ?? null);
  return (
    <PageContainer>
      <FullState kind={kind} onRetry={onRetry} />
    </PageContainer>
  );
}
