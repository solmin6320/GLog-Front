import { Button, Modal } from '@/shared/ui';
import s from './GrassRulesModal.module.css';

/**
 * AU-01 ⑤ 잔디 인정 규칙 — 정적 문구 (M-21 · C-20).
 * 비로그인은 공지를 조회할 수 없어 기능명세서 4장 고정 공지 6줄을 그대로 내장한다. 공지를 고쳐도 여기는 바뀌지 않는다.
 */
const RULES: { title: string; body: string }[] = [
  { title: '기본 브랜치', body: '기본 브랜치(main)에 들어간 커밋만 잔디에 표시돼요.' },
  { title: '브랜치 작업', body: '다른 브랜치의 커밋은 머지되기 전까지 표시되지 않아요.' },
  { title: '스쿼시 머지', body: '여러 날의 작업이 머지한 하루로 합쳐져요.' },
  { title: '포크 레포', body: '포크한 레포의 커밋은 표시되지 않아요.' },
  { title: '비공개 레포', body: 'GitHub 설정에서 비공개 기여 표시를 켜야 반영돼요.' },
  { title: 'PR · 이슈', body: 'PR과 이슈 작성도 잔디 1칸으로 인정돼요.' },
];

export function GrassRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="잔디 인정 규칙"
      size="md"
      footer={
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <p className={s.lead}>GitHub 잔디가 이렇게 쌓여야 인증일로 인정돼요.</p>
      <dl className={s.list}>
        {RULES.map((r) => (
          <div key={r.title} className={s.row}>
            <dt>{r.title}</dt>
            <dd>{r.body}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
