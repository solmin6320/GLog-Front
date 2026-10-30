import { Link } from 'react-router';
import { cx } from '../cx';
import { Icon } from '../Icon';
import styles from './Tag.module.css';

/** 해시태그 칩. '#'은 컴포넌트가 붙인다(라벨 앞의 '#'은 떼어 낸다). */
export function Tag({ label, to, onRemove, active }: { label: string; to?: string; onRemove?: () => void; active?: boolean }) {
  const text = `#${label.replace(/^#+/, '')}`;
  const cls = cx(styles.tag, active && styles.active, onRemove && styles.removable);
  if (onRemove) {
    return (
      <span className={cls}>
        {text}
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`${text} 태그 지우기`}>
          <Icon name="x" size={12} />
        </button>
      </span>
    );
  }
  if (to) {
    return (
      <Link to={to} className={cls} aria-current={active ? 'true' : undefined}>
        {text}
      </Link>
    );
  }
  return <span className={cls}>{text}</span>;
}
