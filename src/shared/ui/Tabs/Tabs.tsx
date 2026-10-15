import { NavLink } from 'react-router';
import { cx } from '../cx';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './Tabs.module.css';

/** 경로 기반 가로 탭(.atabs). 현재 탭은 NavLink가 aria-current="page"를 붙인다. count > 0이면 빨간 원 배지. */
export function Tabs({ items, ariaLabel }: { items: { to: string; label: string; count?: number | null; end?: boolean }[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className={styles.nav}>
      <ul className={styles.list}>
        {items.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} end={it.end} className={({ isActive }) => cx(styles.tab, isActive && styles.active)}>
              {it.label}
              {it.count != null && it.count > 0 ? (
                <>
                  <span className={styles.count} aria-hidden="true">
                    {it.count}
                  </span>
                  <VisuallyHidden>{` ${it.count}건`}</VisuallyHidden>
                </>
              ) : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
