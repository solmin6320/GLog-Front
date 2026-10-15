import { Button } from '../Button';
import styles from './LoadMore.module.css';

/**
 * 목록 끝 (E-57). 오류 → "불러오지 못했어요." + [다시 시도] · 더 있음 → [더 보기] · 끝 → endText ?? '여기까지예요.'
 * endText가 null이면 끝에서 아무것도 그리지 않는다.
 */
export function LoadMore({
  hasMore,
  loading,
  error,
  onLoadMore,
  endText,
}: {
  hasMore: boolean;
  loading: boolean;
  error?: boolean;
  onLoadMore: () => void;
  endText?: string | null;
}) {
  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error} role="alert">
          불러오지 못했어요.
        </p>
        <Button variant="outline" size="sm" icon="refresh" loading={loading} onClick={onLoadMore}>
          다시 시도
        </Button>
      </div>
    );
  }
  if (hasMore) {
    return (
      <div className={styles.wrap}>
        <Button variant="outline" loading={loading} onClick={onLoadMore}>
          더 보기
        </Button>
      </div>
    );
  }
  if (endText === null) return <></>;
  return <p className={styles.end}>{endText ?? '여기까지예요.'}</p>;
}
