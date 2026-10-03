import { Icon, VisuallyHidden } from '@/shared/ui';
import { commitLabel } from '../postText';
import s from './CommitCard.module.css';

const isGithubUrl = (url: string) => /^https:\/\/github\.com\//.test(url);

/** BD-03 ⑧ 관련 커밋 — 'owner/repo · 7자리 sha' + 새 탭 링크 (W-12) */
export function CommitCard({ url }: { url: string }) {
  const label = commitLabel(url);
  const content = (
    <>
      <span className={s.icon}>
        <Icon name="github" size={20} />
      </span>
      <span className={s.text}>
        <span className={s.caption}>관련 커밋</span>
        <b className={s.label}>{label}</b>
      </span>
    </>
  );
  // 서버가 형식을 검사하지만, GitHub 주소가 아니면 링크로 만들지 않는다
  if (!isGithubUrl(url)) return <div className={s.card}>{content}</div>;
  return (
    <a className={s.card} href={url} target="_blank" rel="noopener noreferrer">
      {content}
      <span className={s.ext}>
        <Icon name="ext" size={15} />
      </span>
      <VisuallyHidden>(새 탭에서 열려요)</VisuallyHidden>
    </a>
  );
}
