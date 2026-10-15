import { isRouteErrorResponse, useRouteError } from 'react-router';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { normalizeError } from '@/shared/api/errors';
import { paths } from '@/shared/lib/paths';
import { Button, FullState, LinkButton, PageContainer } from '@/shared/ui';
import NotFoundPage, { NotFoundContent } from './NotFoundPage';
import s from './ErrorPage.module.css';

type Props = {
  /** AppLayout 본문 안(헤더 유지)이면 true → 본문 폭 컨테이너로 감싼다. 전역(BareLayout 안)이면 false */
  inLayout?: boolean;
};

function errorKind(error: unknown): 'network' | 'server' {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'network';
  return normalizeError(error).category === 'network' ? 'network' : 'server';
}

/**
 * CM-02 라우트 오류 화면 (errorElement). 기술 정보(상태 코드 · 스택 · 오류 원문)는 보여주지 않는다.
 * 서버 오류 · 네트워크: [다시 시도] + [홈으로]. 화면 코드 조각을 못 받은 경우(배포 직후 등)도 다시 불러오면 풀린다.
 */
export default function ErrorPage({ inLayout = false }: Props) {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return inLayout ? <NotFoundPage /> : <NotFoundContent />;
  }

  const state = <RouteErrorState kind={errorKind(error)} />;
  return inLayout ? <PageContainer>{state}</PageContainer> : state;
}

function RouteErrorState({ kind }: { kind: 'network' | 'server' }) {
  useDocumentTitle(kind === 'network' ? '연결 확인 필요' : '잠시 문제가 생겼어요');
  return (
    <FullState
      kind={kind}
      action={
        <div className={s.actions}>
          <Button variant="primary" icon="refresh" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
          <LinkButton to={paths.home()} variant="outline">
            홈으로
          </LinkButton>
        </div>
      }
    />
  );
}
