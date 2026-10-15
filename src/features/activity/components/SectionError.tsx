import { Button, InfoBox } from '@/shared/ui';

/** 영역 하나만 실패했을 때 — 화면 전체를 바꾸지 않고 그 자리에 [다시 시도] (승격 후보: home · profile에도 같은 것이 있다) */
export function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <InfoBox
      tone="mute"
      icon="alert"
      role="alert"
      action={
        <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
          다시 시도
        </Button>
      }
    >
      {message}
    </InfoBox>
  );
}
