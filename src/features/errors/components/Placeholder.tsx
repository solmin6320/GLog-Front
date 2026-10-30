import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { EmptyState, PageTitle, SectionHeader } from '@/shared/ui';

type Props = {
  /** 화면 ID (예: TM-05) */
  id: string;
  /** 화면 이름 — 문서 제목에도 쓴다 */
  title: string;
  /** 다른 레이아웃 제목 아래(관리자 탭)면 h2로 */
  nested?: boolean;
};

/** 아직 만들지 않은 화면의 "준비 중" 자리표시 (요구사항 3-1). 웨이브 2가 화면 파일을 덮어쓴다. */
export function Placeholder({ id, title, nested = false }: Props) {
  useDocumentTitle(title);
  return (
    <>
      {nested ? <SectionHeader title={title} as="h2" /> : <PageTitle title={title} />}
      <EmptyState icon="clock" title="준비 중이에요." body={`${id} 화면은 곧 열려요.`} />
    </>
  );
}
