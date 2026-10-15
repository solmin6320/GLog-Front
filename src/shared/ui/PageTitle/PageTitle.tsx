import type { ReactNode } from 'react';
import styles from './PageTitle.module.css';

/** h1 제목 + 보조 문구. meta는 제목 바로 옆(예: '공개' 배지), actions는 오른쪽(좁으면 아래로 줄바꿈). */
export function PageTitle({ title, sub, actions, meta }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; meta?: ReactNode }) {
  return (
    <div className={styles.head}>
      <div className={styles.main}>
        <div className={styles.row}>
          <h1 className={styles.pt}>{title}</h1>
          {meta}
        </div>
        {sub ? <p className={styles.sub}>{sub}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
