import { useState } from 'react';
import { cx } from '../cx';
import styles from './Avatar.module.css';

/** 이름 해시 → --av-1..6 */
function avatarColorIndex(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return (h % 6) + 1;
}

/**
 * 프로필 사진. 이미지가 없거나 못 불러오면 이름 첫 글자 + 이름 해시 색.
 * 장식으로 취급한다(aria-hidden) — 이름은 옆에 글자로 함께 쓴다.
 */
export function Avatar({ name, imageUrl, size = 32 }: { name: string; imageUrl?: string | null; size?: 28 | 32 | 40 | 88 }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!imageUrl && failedUrl !== imageUrl;
  const initial = Array.from(name.trim())[0] ?? '?';
  return (
    <span
      className={cx(styles.av, styles[`s${size}`])}
      style={showImage ? undefined : { background: `var(--av-${avatarColorIndex(name)})` }}
      aria-hidden="true"
    >
      {showImage ? (
        <img className={styles.img} src={imageUrl} alt="" onError={() => setFailedUrl(imageUrl)} />
      ) : (
        initial
      )}
    </span>
  );
}
