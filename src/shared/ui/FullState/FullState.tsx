import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/shared/lib/paths';
import { Button, LinkButton } from '../Button';
import { Icon, type IconName } from '../Icon';
import styles from './FullState.module.css';

export type FullStateKind = 'forbidden' | 'notFound' | 'server' | 'network' | 'deleted';

const COPY: Record<FullStateKind, { title: string; icon: IconName }> = {
  forbidden: { title: '이 페이지에 들어올 권한이 없어요.', icon: 'lock' },
  notFound: { title: '찾는 내용이 없어요. 삭제됐을 수 있어요.', icon: 'search' },
  server: { title: '잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요.', icon: 'alert' },
  network: { title: '인터넷 연결을 확인해 주세요.', icon: 'info' },
  deleted: { title: '삭제된 글이에요.', icon: 'trash' },
};

/**
 * 권한 없음 · 없음 · 서버 오류 · 연결 끊김 · 삭제된 글 — 본문 전체를 바꾸는 상태 화면.
 * 기본 버튼: forbidden [홈으로] · notFound [뒤로](히스토리 없으면 홈) · server/network [다시 시도] · deleted [목록으로].
 * action을 주면 기본 버튼 대신 그린다. onRetry가 없으면 [다시 시도]는 페이지를 새로 고친다.
 */
export function FullState({
  kind,
  onRetry,
  title,
  body,
  action,
}: {
  kind: FullStateKind;
  onRetry?: () => void;
  title?: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  const copy = COPY[kind];

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) void navigate(-1);
    else void navigate(paths.home(), { replace: true });
  };
  const retry = onRetry ?? (() => window.location.reload());

  const defaultAction: Record<FullStateKind, ReactNode> = {
    forbidden: (
      <LinkButton to={paths.home()} variant="outline">
        홈으로
      </LinkButton>
    ),
    notFound: (
      <Button variant="outline" icon="chevL" onClick={goBack}>
        뒤로
      </Button>
    ),
    server: (
      <Button variant="outline" icon="refresh" onClick={retry}>
        다시 시도
      </Button>
    ),
    network: (
      <Button variant="outline" icon="refresh" onClick={retry}>
        다시 시도
      </Button>
    ),
    deleted: (
      <LinkButton to={paths.posts()} variant="outline">
        목록으로
      </LinkButton>
    ),
  };

  return (
    <section className={styles.full} data-kind={kind}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={copy.icon} size={24} />
      </span>
      <h1 className={styles.title}>{title ?? copy.title}</h1>
      {body ? <div className={styles.body}>{body}</div> : null}
      <div className={styles.action}>{action ?? defaultAction[kind]}</div>
    </section>
  );
}
