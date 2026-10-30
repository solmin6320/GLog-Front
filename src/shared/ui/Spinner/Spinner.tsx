import styles from './Spinner.module.css';

/** 스피너 + 문구. AU-02(로그인 처리 중) 전용 — 다른 화면은 스켈레톤을 쓴다. */
export function Spinner({ label }: { label: string }) {
  return (
    <div className={styles.wrap} role="status">
      <span className={styles.ring} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
