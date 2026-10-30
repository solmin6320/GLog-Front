import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './TextLink.module.css';

export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={className ? `${styles.lnk} ${className}` : styles.lnk}>
      {children}
    </Link>
  );
}
