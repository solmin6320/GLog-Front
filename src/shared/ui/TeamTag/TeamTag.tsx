import { Icon } from '../Icon';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './TeamTag.module.css';

type TeamLabel = { kind: 'PUBLIC' | 'PRIVATE' | 'DELETED'; name?: string | null } | { name: string };

/** 글의 소속 팀 표시. 공개 팀(또는 이름만 받은 경우)만 그린다 — 비공개 · 삭제 팀은 숨긴다. */
export function TeamTag({ label }: { label: TeamLabel | null | undefined }) {
  if (!label) return null;
  if ('kind' in label && label.kind !== 'PUBLIC') return null;
  const name = label.name;
  if (!name) return null;
  return (
    <span className={styles.teamTag}>
      <Icon name="users" size={13} />
      <VisuallyHidden>소속 팀 </VisuallyHidden>
      <span className={styles.name}>{name}</span>
    </span>
  );
}
