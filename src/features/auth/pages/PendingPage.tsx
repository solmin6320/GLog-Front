import { useState } from 'react';
import { useNavigate } from 'react-router';
import { messageFor } from '@/domain/messages';
import { useDocumentTitle } from '@/layouts/useDocumentTitle';
import { useSession } from '@/session';
import { normalizeError } from '@/shared/api/errors';
import { paths } from '@/shared/lib/paths';
import { Button, Icon, useToast } from '@/shared/ui';
import s from './AuthPages.module.css';

/**
 * AU-03 승인 대기 (화면설계서 5-1-2) + 가입 거절 상태(E-02, M-20).
 * 폴링하지 않는다 — [승인됐는지 확인]으로만 본인 상태를 다시 조회한다.
 */
export default function PendingPage() {
  const session = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [checking, setChecking] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const rejected = session.status === 'REJECTED';
  const githubLogin = session.viewer?.githubLogin;

  useDocumentTitle(rejected ? '가입 거절' : '승인 대기');

  const check = async () => {
    setChecking(true);
    try {
      const next = await session.refresh();
      if (next === 'ACTIVE') {
        navigate(paths.home(), { replace: true });
        return;
      }
      // 거절이면 세션 상태가 바뀌어 이 화면이 거절 안내로 바뀐다
      if (next === 'PENDING') toast.info('아직 승인되지 않았어요.');
    } catch (err) {
      toast.error(messageFor(normalizeError(err)));
    } finally {
      setChecking(false);
    }
  };

  const signOut = async () => {
    setLeaving(true);
    await session.signOut();
    navigate(paths.login(), { replace: true });
  };

  const account = githubLogin ? <p className={s.account}>@{githubLogin} 으로 신청했어요</p> : null;

  if (rejected) {
    return (
      <div className={s.center}>
        <span className={`${s.illust} ${s.illustBad}`} aria-hidden="true">
          <Icon name="alert" size={30} />
        </span>
        <h1 className={s.title}>가입이 승인되지 않았어요</h1>
        <p className={s.sub}>동아리 운영진에게 문의해 주세요.</p>
        {account}
        <div className={s.actions}>
          <Button variant="outline" size="lg" onClick={signOut} disabled={leaving}>
            로그아웃
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.center}>
      <span className={s.illust} aria-hidden="true">
        <Icon name="clock" size={30} />
      </span>
      <h1 className={s.title}>가입 승인을 기다리는 중이에요</h1>
      <p className={s.sub}>운영진이 승인하면 바로 이용할 수 있어요</p>
      {account}
      <div className={s.stack}>
        <Button variant="primary" size="lg" fullWidth onClick={check} disabled={checking || leaving}>
          {checking ? '확인 중...' : '승인됐는지 확인'}
        </Button>
        <Button variant="text" onClick={signOut} disabled={leaving}>
          로그아웃
        </Button>
      </div>
    </div>
  );
}
