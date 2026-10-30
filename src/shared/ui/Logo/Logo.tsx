import { Link } from 'react-router';
import styles from './Logo.module.css';

/** 2×2 잔디 마크 + '잔디로그'. to가 있으면 링크 */
export function Logo({ to }: { to?: string }) {
  const inner = (
    <>
      <span className={styles.mark} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      잔디로그
    </>
  );
  return to ? (
    <Link to={to} className={styles.logo}>
      {inner}
    </Link>
  ) : (
    <span className={styles.logo}>{inner}</span>
  );
}
