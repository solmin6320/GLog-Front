import type { ReactNode } from 'react';
import styles from './SectionHeader.module.css';

export function SectionHeader({ title, right, as: H = 'h2', id }: { title: ReactNode; right?: ReactNode; as?: 'h2' | 'h3'; id?: string }) {
  return (
    <div className={styles.sh}>
      <H className={styles.title} id={id}>
        {title}
      </H>
      {right ? <div className={styles.right}>{right}</div> : null}
    </div>
  );
}
