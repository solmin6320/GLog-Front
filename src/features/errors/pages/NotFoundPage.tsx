import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { paths } from '@/shared/lib/paths';
import { FullState, LinkButton, PageContainer } from '@/shared/ui';

/**
 * CM-02 404 — 경로 없음. "찾는 페이지가 없어요." + [홈으로] (E-53, M-12).
 * 화면 안 리소스 없음(E-53 "찾는 내용이 없어요…" + [뒤로])은 FullState kind="notFound" 기본값이 맡는다.
 */
export function NotFoundContent() {
  useDocumentTitle('페이지를 찾을 수 없음');
  return (
    <FullState
      kind="notFound"
      title="찾는 페이지가 없어요."
      action={
        <LinkButton to={paths.home()} variant="primary">
          홈으로
        </LinkButton>
      }
    />
  );
}

export default function NotFoundPage() {
  return (
    <PageContainer>
      <NotFoundContent />
    </PageContainer>
  );
}
